import { NextRequest, NextResponse } from "next/server";
import { verificarCronSecret } from "@/lib/agents/utils";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import { embedTextos, toVector } from "@/lib/agents/embeddings";
import { getProtocolos, getProcedimentos, getAcervo, getCursos, getAtualizacoes } from "@/lib/content";

export const maxDuration = 300;

type Chunk = { conteudo: string; fonte_tipo: string; fonte_titulo: string; fonte_url: string; area?: string | null };

const strip = (s?: string) => (s || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

// quebra textos longos em pedaços de ~1500 chars (mantém o título no começo de cada pedaço)
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

  const chunks: Chunk[] = [];

  // 1) Conteúdo manual (Vercel Blob)
  const [protos, procs, acervo, cursos, atus] = await Promise.all([
    getProtocolos(), getProcedimentos(), getAcervo(), getCursos(), getAtualizacoes(),
  ]);
  for (const p of protos) if (p.titulo) for (const c of pedacos(p.titulo, strip(`${p.descricao} ${(p as any).conteudo || ""}`))) chunks.push({ conteudo: c, fonte_tipo: "Protocolo", fonte_titulo: p.titulo, fonte_url: "/protocolos", area: p.area });
  for (const p of procs) if (p.titulo) for (const c of pedacos(p.titulo, strip(p.descricao))) chunks.push({ conteudo: c, fonte_tipo: "Procedimento", fonte_titulo: p.titulo, fonte_url: "/procedimentos", area: p.area });
  for (const a of acervo) if (a.titulo) for (const c of pedacos(a.titulo, strip(a.descricao))) chunks.push({ conteudo: c, fonte_tipo: "Material", fonte_titulo: a.titulo, fonte_url: "/acervo", area: a.area });
  for (const c of cursos) if (c.titulo) for (const ch of pedacos(c.titulo, strip(`${c.resumo} ${c.descricao}`))) chunks.push({ conteudo: ch, fonte_tipo: "Curso", fonte_titulo: c.titulo, fonte_url: `/cursos/${c.id}`, area: c.area });
  for (const a of atus) if (a.titulo) for (const c of pedacos(a.titulo, strip((a as any).conteudo || (a as any).resumo))) chunks.push({ conteudo: c, fonte_tipo: "Atualização", fonte_titulo: a.titulo, fonte_url: "/atualizacoes", area: a.area });

  const supabase = createServiceClient();

  // 1b) Biblioteca de referência (livros, artigos, PDFs, diretrizes) cadastrada no admin
  try {
    const { data: refs } = await supabase.from("kb_referencias").select("titulo,tipo,autor,fonte_url,arquivo_url,conteudo,area").eq("ativo", true).limit(2000);
    for (const r of refs ?? []) {
      const texto = strip(r.conteudo);
      if (!r.titulo || !texto) continue;
      const titulo = r.autor ? `${r.titulo} — ${r.autor}` : r.titulo;
      for (const c of pedacos(titulo, texto)) {
        chunks.push({ conteudo: c, fonte_tipo: r.tipo || "Referência", fonte_titulo: r.titulo, fonte_url: r.fonte_url || r.arquivo_url || "/assistente", area: r.area });
      }
    }
  } catch { /* ignora */ }

  // 2) Boletins clínicos da IA (medical_updates) — conteúdo mais rico e verificado
  try {
    const { data: ups } = await supabase.from("medical_updates").select("especialidade,topicos").eq("publicado", true).limit(200);
    for (const u of ups ?? []) {
      const tps = Array.isArray(u.topicos) ? u.topicos : [];
      for (const t of tps) {
        const texto = strip(`${t.descricao || ""} ${t.relevancia_clinica || ""}`);
        if (!t.titulo || !texto) continue;
        chunks.push({
          conteudo: `${t.titulo}\n${texto}${t.nivel_evidencia ? `\n[Nível de evidência: ${t.nivel_evidencia}]` : ""}`,
          fonte_tipo: "Boletim clínico",
          fonte_titulo: t.fonte_nome || t.titulo,
          fonte_url: t.fonte_url || "/atualizacoes-semanais",
          area: u.especialidade,
        });
      }
    }
  } catch { /* ignora */ }

  if (chunks.length === 0) return NextResponse.json({ status: "ok", indexados: 0, aviso: "Sem conteúdo para indexar ainda." });

  // 3) Embeddings + reindex completo (conteúdo é pequeno; recriar é simples e consistente)
  const vetores = await embedTextos(chunks.map((c) => c.conteudo));
  await supabase.from("kb_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const linhas = chunks.map((c, i) => ({ ...c, area: c.area ?? null, embedding: toVector(vetores[i]) }));
  let inseridos = 0;
  for (let i = 0; i < linhas.length; i += 100) {
    const { error } = await supabase.from("kb_chunks").insert(linhas.slice(i, i + 100));
    if (!error) inseridos += Math.min(100, linhas.length - i);
  }

  return NextResponse.json({ status: "ok", indexados: inseridos, fontes: chunks.length });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
