import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { verificarCronSecret } from "@/lib/agents/utils";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { embedTextos, toVector } from "@/lib/agents/embeddings";
import { getProtocolos, getProcedimentos, getAcervo, getCursos, getAtualizacoes } from "@/lib/content";

export const maxDuration = 300;

type Meta = { fonte_tipo: string; fonte_titulo: string; fonte_url: string; area?: string | null };
type Fonte = { fonteId: string; texto: string; meta: Meta };
type BoletimTopico = {
  titulo?: string;
  descricao?: string;
  relevancia_clinica?: string;
  nivel_evidencia?: string;
  fonte_nome?: string;
  fonte_url?: string;
};

const strip = (s?: string) => (s || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
// Para texto que NÃO é HTML (PDF/livros/boletins): só normaliza espaços.
// NÃO remove "<...>", senão inequações médicas (PA <90, FC >140, pH <7,35) viram
// um "tag" gigante e apagam tudo entre dois sinais — chegou a sumir METADE de um livro.
const stripTexto = (s?: string) => (s || "").replace(/\s+/g, " ").trim();
const hashDe = (s: string) => createHash("sha1").update(s).digest("hex");

// quebra um texto longo em pedaços de ~1400 chars COM SOBREPOSIÇÃO de ~200 chars
// (passo 1200), pra um conceito não se perder na fronteira entre dois trechos.
function pedacos(titulo: string, texto: string): string[] {
  const full = `${titulo}\n${texto}`.trim();
  if (full.length <= 1600) return [full];
  const out: string[] = [];
  for (let i = 0; i < texto.length; i += 1200) out.push(`${titulo}\n${texto.slice(i, i + 1400)}`.trim());
  return out;
}

export async function POST(request: NextRequest) {
  if (!verificarCronSecret(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!serviceConfigured() || !process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Supabase/OpenAI não configurados" }, { status: 503 });

  const supabase = createServiceClient();
  const fontes: Fonte[] = [];
  // html=true → conteúdo do editor (protocolos etc.), remove tags. html=false → texto puro (PDF/livro/boletim).
  const add = (fonteId: string, texto: string, meta: Meta, html = true) => { const t = html ? strip(texto) : stripTexto(texto); if (t) fontes.push({ fonteId, texto: t, meta }); };

  // 1) Conteúdo manual (Vercel Blob)
  const [protos, procs, acervo, cursos, atus] = await Promise.all([
    getProtocolos(), getProcedimentos(), getAcervo(), getCursos(), getAtualizacoes(),
  ]);
  for (const p of protos) if (p.titulo) add(`proto:${p.id}`, `${p.descricao} ${(p as { conteudo?: string }).conteudo || ""}`, { fonte_tipo: "Protocolo", fonte_titulo: p.titulo, fonte_url: "/protocolos", area: p.area });
  for (const p of procs) if (p.titulo) add(`proc:${p.id}`, p.descricao, { fonte_tipo: "Procedimento", fonte_titulo: p.titulo, fonte_url: "/procedimentos", area: p.area });
  for (const a of acervo) if (a.titulo) add(`acervo:${a.id}`, a.descricao, { fonte_tipo: "Material", fonte_titulo: a.titulo, fonte_url: "/acervo", area: a.area });
  for (const c of cursos) if (c.titulo) add(`curso:${c.id}`, `${c.resumo} ${c.descricao}`, { fonte_tipo: "Curso", fonte_titulo: c.titulo, fonte_url: `/cursos/${c.id}`, area: c.area });
  for (const a of atus) if (a.titulo) { const au = a as { conteudo?: string; resumo?: string }; add(`atu:${a.id}`, au.conteudo || au.resumo || "", { fonte_tipo: "Atualização", fonte_titulo: a.titulo, fonte_url: "/atualizacoes", area: a.area }); }

  // 1b) Biblioteca de referência (livros, artigos, PDFs, diretrizes)
  try {
    const { data: refs } = await supabase.from("kb_referencias").select("id,titulo,tipo,autor,fonte_url,arquivo_url,conteudo,area").eq("ativo", true).limit(5000);
    for (const r of refs ?? []) {
      if (!r.titulo) continue;
      add(`ref:${r.id}`, r.conteudo, { fonte_tipo: r.tipo || "Referência", fonte_titulo: r.titulo, fonte_url: r.fonte_url || r.arquivo_url || "/assistente", area: r.area }, false);
    }
  } catch { /* ignora */ }

  // 2) Boletins clínicos da IA (medical_updates)
  try {
    const { data: ups } = await supabase.from("medical_updates").select("id,especialidade,topicos").eq("publicado", true).limit(200);
    for (const u of ups ?? []) {
      const tps: BoletimTopico[] = Array.isArray(u.topicos) ? u.topicos : [];
      tps.forEach((t: BoletimTopico, i: number) => {
        const texto = `${t.descricao || ""} ${t.relevancia_clinica || ""}${t.nivel_evidencia ? ` [Nível: ${t.nivel_evidencia}]` : ""}`;
        if (t.titulo && stripTexto(texto)) add(`bol:${u.id}:${i}`, `${t.titulo}\n${texto}`, { fonte_tipo: "Boletim clínico", fonte_titulo: t.fonte_nome || t.titulo, fonte_url: t.fonte_url || "/atualizacoes-semanais", area: u.especialidade }, false);
      });
    }
  } catch { /* ignora */ }

  // ---- INCREMENTAL + RESUMÍVEL POR TRECHO ----
  // Cada fonte é fatiada de forma DETERMINÍSTICA (mesmo texto → mesma ordem de trechos).
  // Guardamos quantos trechos já existem por fonte e com qual hash. Com isso dá pra:
  //  • pular fontes já 100% indexadas,
  //  • RETOMAR uma fonte indexada pela metade exatamente de onde parou (sem recomeçar),
  //  • apagar só o que ficou velho (hash diferente) — nunca o que está em progresso.
  const hashAtual = (f: Fonte) => hashDe(f.texto + "|" + f.meta.fonte_titulo);
  // Status agregado por fonte via RPC: devolve {fonte_id, hash, n} num único JSONB.
  // CRÍTICO: um SELECT cru de kb_chunks é truncado em 1000 linhas pelo PostgREST,
  // o que fazia a contagem de "retomada" ficar errada e DUPLICAR trechos em escala.
  const { data: statusRaw } = await supabase.rpc("kb_fontes_status");
  const statusRows: { fonte_id: string; hash: string; n: number }[] = Array.isArray(statusRaw) ? statusRaw : [];
  const existHash = new Map<string, string>();
  const existCount = new Map<string, number>();
  for (const r of statusRows) if (r.fonte_id) {
    existHash.set(r.fonte_id, r.hash);
    existCount.set(r.fonte_id, Number(r.n) || 0);
  }
  const idsAtuais = new Set(fontes.map((f) => f.fonteId));

  // pré-fatia tudo (string slicing é barato) p/ saber o total esperado de cada fonte
  const comChunks = fontes.map((f) => ({ f, h: hashAtual(f), cs: pedacos(f.meta.fonte_titulo, f.texto) }));
  // "incompletas" = nova / mudou (hash diferente) OU parcial (tem menos trechos que o esperado)
  const incompletas = comChunks.filter(({ f, h, cs }) => {
    const sh = existHash.get(f.fonteId);
    if (sh !== h) return true;
    return (existCount.get(f.fonteId) ?? 0) < cs.length;
  });
  const sumiram = [...existHash.keys()].filter((id) => !idsAtuais.has(id));

  // apaga só fontes que sumiram (NÃO mexe no que está em progresso)
  for (let i = 0; i < sumiram.length; i += 100) await supabase.from("kb_chunks").delete().in("fonte_id", sumiram.slice(i, i + 100));

  // Orçamento PEQUENO por chamada → cada requisição é curta e segura (sem timeout).
  // O admin chama em loop até "pendentes" zerar; nada se perde no caminho.
  const CHUNK_BUDGET = 400;
  let inseridas = 0, fontesOk = 0, chunksNaChamada = 0, falhas = 0, pendentes = 0;
  let ultimoErro = ""; // mensagem da 1ª falha real (embedding/insert) — devolvida p/ o admin ver o motivo
  for (const { f, h, cs } of incompletas) {
    if (chunksNaChamada >= CHUNK_BUDGET) { pendentes++; continue; } // não coube nesta chamada
    const sh = existHash.get(f.fonteId);
    let feitos = 0;
    if (sh === h) {
      feitos = existCount.get(f.fonteId) ?? 0;                      // retoma de onde parou
    } else if (sh !== undefined) {
      await supabase.from("kb_chunks").delete().eq("fonte_id", f.fonteId); // versão velha → recomeça do zero
    }
    if (feitos >= cs.length) { fontesOk++; continue; }
    const fatia = cs.slice(feitos, feitos + (CHUNK_BUDGET - chunksNaChamada));
    let vetores: number[][];
    // CONTINUE (não break): se ESTA fonte falha no embedding, pulamos SÓ ela — uma fonte
    // problemática NÃO pode bloquear todas as outras (era o que impedia referências novas de
    // indexar quando algo mais velho falhava na frente). Ela fica pendente e é retomada depois.
    try { vetores = await embedTextos(fatia); }
    catch (e) { falhas++; pendentes++; if (!ultimoErro) ultimoErro = `embedding (${f.meta.fonte_titulo}): ${e instanceof Error ? e.message : String(e)}`; continue; }
    const pecas = fatia.map((c, j) => ({ conteudo: c, ...f.meta, area: f.meta.area ?? null, fonte_id: f.fonteId, hash: h, embedding: toVector(vetores[j]) }));
    let okFonte = true;
    for (let i = 0; i < pecas.length; i += 100) {
      const lote = pecas.slice(i, i + 100);
      let { error } = await supabase.from("kb_chunks").insert(lote);
      if (error) ({ error } = await supabase.from("kb_chunks").insert(lote)); // 1 retry
      if (!error) { inseridas += lote.length; chunksNaChamada += lote.length; }
      else { falhas++; okFonte = false; if (!ultimoErro) ultimoErro = `insert (${f.meta.fonte_titulo}): ${error.message ?? String(error)}`; break; }
    }
    if (!okFonte) { pendentes++; continue; }                        // insert falhou → pula SÓ esta fonte
    if (feitos + fatia.length >= cs.length) fontesOk++;            // fonte concluída
    else pendentes++;                                              // ainda falta (continua na próxima chamada)
  }

  const { count: totalNoBanco } = await supabase.from("kb_chunks").select("*", { count: "exact", head: true });
  return NextResponse.json({
    status: "ok",
    trechos: inseridas,           // gravados NESTA chamada
    fontes: fontesOk,             // fontes concluídas nesta chamada
    pendentes,                    // fontes que ainda faltam (chame de novo até zerar)
    falhas,
    erro: ultimoErro || null,     // motivo real da 1ª falha (embedding/insert), p/ o admin ver
    removidas: sumiram.length,
    total: totalNoBanco ?? 0,     // total de trechos no banco
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
