import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { verificarCronSecret } from "@/lib/agents/utils";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { embedTextos, toVector } from "@/lib/agents/embeddings";
import { getProtocolos, getProcedimentos, getAcervo, getCursos, getAtualizacoes } from "@/lib/content";

export const maxDuration = 300;

type Meta = { fonte_tipo: string; fonte_titulo: string; fonte_url: string; area?: string | null };
type Fonte = { fonteId: string; texto: string; meta: Meta };

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
  for (const p of protos) if (p.titulo) add(`proto:${p.id}`, `${p.descricao} ${(p as any).conteudo || ""}`, { fonte_tipo: "Protocolo", fonte_titulo: p.titulo, fonte_url: "/protocolos", area: p.area });
  for (const p of procs) if (p.titulo) add(`proc:${p.id}`, p.descricao, { fonte_tipo: "Procedimento", fonte_titulo: p.titulo, fonte_url: "/procedimentos", area: p.area });
  for (const a of acervo) if (a.titulo) add(`acervo:${a.id}`, a.descricao, { fonte_tipo: "Material", fonte_titulo: a.titulo, fonte_url: "/acervo", area: a.area });
  for (const c of cursos) if (c.titulo) add(`curso:${c.id}`, `${c.resumo} ${c.descricao}`, { fonte_tipo: "Curso", fonte_titulo: c.titulo, fonte_url: `/cursos/${c.id}`, area: c.area });
  for (const a of atus) if (a.titulo) add(`atu:${a.id}`, (a as any).conteudo || (a as any).resumo, { fonte_tipo: "Atualização", fonte_titulo: a.titulo, fonte_url: "/atualizacoes", area: a.area });

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
      const tps = Array.isArray(u.topicos) ? u.topicos : [];
      tps.forEach((t: any, i: number) => {
        const texto = `${t.descricao || ""} ${t.relevancia_clinica || ""}${t.nivel_evidencia ? ` [Nível: ${t.nivel_evidencia}]` : ""}`;
        if (t.titulo && stripTexto(texto)) add(`bol:${u.id}:${i}`, `${t.titulo}\n${texto}`, { fonte_tipo: "Boletim clínico", fonte_titulo: t.fonte_nome || t.titulo, fonte_url: t.fonte_url || "/atualizacoes-semanais", area: u.especialidade }, false);
      });
    }
  } catch { /* ignora */ }

  // ---- INCREMENTAL: compara hash do que existe com o que há agora ----
  const hashAtual = (f: Fonte) => hashDe(f.texto + "|" + f.meta.fonte_titulo);
  const { data: existRows } = await supabase.from("kb_chunks").select("fonte_id,hash");
  const existHash = new Map<string, string>();
  for (const r of existRows ?? []) if (r.fonte_id) existHash.set(r.fonte_id, r.hash);
  const idsAtuais = new Set(fontes.map((f) => f.fonteId));

  const mudaram = fontes.filter((f) => existHash.get(f.fonteId) !== hashAtual(f));
  const sumiram = [...existHash.keys()].filter((id) => !idsAtuais.has(id));

  // apaga chunks das fontes que mudaram (p/ regravar) + das que sumiram
  const apagar = [...new Set([...mudaram.map((f) => f.fonteId), ...sumiram])];
  for (let i = 0; i < apagar.length; i += 100) await supabase.from("kb_chunks").delete().in("fonte_id", apagar.slice(i, i + 100));
  // legado: chunks antigos sem fonte_id (da 1ª versão) — limpa uma vez
  if (existRows?.some((r: any) => !r.fonte_id)) await supabase.from("kb_chunks").delete().is("fonte_id", null);

  // Processa UMA FONTE POR VEZ, com ORÇAMENTO de trechos por chamada. Cada fonte é
  // gravada por inteiro (atômica). Se não couber tudo, devolve "pendentes" e o admin
  // chama de novo (resumível) — assim NUNCA estoura o limite de 300s nem perde material.
  const CHUNK_BUDGET = 1200;
  let inseridas = 0, fontesOk = 0, chunksNaChamada = 0, falhas = 0;
  for (const f of mudaram) {
    const cs = pedacos(f.meta.fonte_titulo, f.texto);
    // se já processou algo e a próxima fonte estouraria o orçamento, para (continua na próxima chamada)
    if (chunksNaChamada > 0 && chunksNaChamada + cs.length > CHUNK_BUDGET) break;
    const h = hashAtual(f);
    let vetores: number[][];
    try { vetores = await embedTextos(cs); }
    catch { falhas++; continue; } // falha numa fonte não trava as demais; mantém o que já tinha
    // só agora apaga o antigo e grava o novo (se o embed falhar, não perdemos o que existia)
    await supabase.from("kb_chunks").delete().eq("fonte_id", f.fonteId);
    const pecas = cs.map((c, j) => ({ conteudo: c, ...f.meta, area: f.meta.area ?? null, fonte_id: f.fonteId, hash: h, embedding: toVector(vetores[j]) }));
    for (let i = 0; i < pecas.length; i += 100) {
      const lote = pecas.slice(i, i + 100);
      let { error } = await supabase.from("kb_chunks").insert(lote);
      if (error) ({ error } = await supabase.from("kb_chunks").insert(lote)); // 1 retry
      if (!error) inseridas += lote.length; else falhas++;
    }
    fontesOk++; chunksNaChamada += cs.length;
  }

  const pendentes = mudaram.length - fontesOk;
  const { count: totalNoBanco } = await supabase.from("kb_chunks").select("*", { count: "exact", head: true });
  return NextResponse.json({
    status: "ok",
    trechos: inseridas,           // gravados NESTA chamada
    fontes: fontesOk,             // fontes processadas nesta chamada
    pendentes,                    // fontes que faltam (chame de novo até zerar)
    falhas,
    removidas: sumiram.length,
    total: totalNoBanco ?? 0,     // total de trechos no banco
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
