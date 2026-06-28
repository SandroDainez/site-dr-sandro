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
const hashDe = (s: string) => createHash("sha1").update(s).digest("hex");

// quebra um texto longo em pedaços de ~1400 chars (com o título no começo de cada um)
function pedacos(titulo: string, texto: string): string[] {
  const full = `${titulo}\n${texto}`.trim();
  if (full.length <= 1600) return [full];
  const out: string[] = [];
  for (let i = 0; i < texto.length; i += 1400) out.push(`${titulo}\n${texto.slice(i, i + 1400)}`.trim());
  return out;
}

export async function POST(request: NextRequest) {
  if (!verificarCronSecret(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!serviceConfigured() || !process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Supabase/OpenAI não configurados" }, { status: 503 });

  const supabase = createServiceClient();
  const fontes: Fonte[] = [];
  const add = (fonteId: string, texto: string, meta: Meta) => { const t = strip(texto); if (t) fontes.push({ fonteId, texto: t, meta }); };

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
      add(`ref:${r.id}`, r.conteudo, { fonte_tipo: r.tipo || "Referência", fonte_titulo: r.titulo, fonte_url: r.fonte_url || r.arquivo_url || "/assistente", area: r.area });
    }
  } catch { /* ignora */ }

  // 2) Boletins clínicos da IA (medical_updates)
  try {
    const { data: ups } = await supabase.from("medical_updates").select("id,especialidade,topicos").eq("publicado", true).limit(200);
    for (const u of ups ?? []) {
      const tps = Array.isArray(u.topicos) ? u.topicos : [];
      tps.forEach((t: any, i: number) => {
        const texto = `${t.descricao || ""} ${t.relevancia_clinica || ""}${t.nivel_evidencia ? ` [Nível: ${t.nivel_evidencia}]` : ""}`;
        if (t.titulo && strip(texto)) add(`bol:${u.id}:${i}`, `${t.titulo}\n${texto}`, { fonte_tipo: "Boletim clínico", fonte_titulo: t.fonte_nome || t.titulo, fonte_url: t.fonte_url || "/atualizacoes-semanais", area: u.especialidade });
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

  if (mudaram.length === 0) {
    return NextResponse.json({ status: "ok", novas: 0, atualizadas: 0, removidas: sumiram.length, inalteradas: fontes.length, pecas: 0 });
  }

  // monta as peças só das fontes que mudaram
  const pecas: any[] = [];
  for (const f of mudaram) {
    const h = hashAtual(f);
    for (const c of pedacos(f.meta.fonte_titulo, f.texto)) {
      pecas.push({ conteudo: c, ...f.meta, area: f.meta.area ?? null, fonte_id: f.fonteId, hash: h });
    }
  }

  // embeddings + insert (em lotes)
  const vetores = await embedTextos(pecas.map((p) => p.conteudo));
  let inseridas = 0;
  for (let i = 0; i < pecas.length; i += 100) {
    const lote = pecas.slice(i, i + 100).map((p, j) => ({ ...p, embedding: toVector(vetores[i + j]) }));
    const { error } = await supabase.from("kb_chunks").insert(lote);
    if (!error) inseridas += lote.length;
  }

  const novas = mudaram.filter((f) => !existHash.has(f.fonteId)).length;
  return NextResponse.json({
    status: "ok",
    novas, atualizadas: mudaram.length - novas, removidas: sumiram.length,
    inalteradas: fontes.length - mudaram.length, pecas: inseridas,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
