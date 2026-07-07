import { getProtocolos, getProcedimentos, getVideoaulas, getAcervo, getCursos, getPodcasts, getAtualizacoes } from "./content";
import { createPublicClient, supabaseConfigured } from "./supabase/server";

export type ResultadoBusca = { tipo: string; titulo: string; descricao: string; href: string; area?: string | null };

// normaliza: minúsculo, sem acento, sem HTML
const norm = (s?: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/<[^>]+>/g, " ");

function resumo(html?: string): string {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 170);
}

// Busca global no conteúdo do site (blob) + Supabase (boletins + eventos).
// Casa quando TODAS as palavras do termo aparecem no título/descrição/conteúdo.
export async function buscarTudo(q: string): Promise<ResultadoBusca[]> {
  const termo = norm(q).trim();
  if (termo.length < 2) return [];
  const tokens = termo.split(/\s+/).filter(Boolean);
  const casa = (...campos: (string | undefined)[]) => {
    const txt = norm(campos.filter(Boolean).join(" "));
    return tokens.every((t) => txt.includes(t));
  };

  const [protos, procs, vids, acervo, cursos, pods, atus] = await Promise.all([
    getProtocolos(), getProcedimentos(), getVideoaulas(), getAcervo(), getCursos(), getPodcasts(), getAtualizacoes(),
  ]);

  const out: ResultadoBusca[] = [];
  for (const p of protos) if (casa(p.titulo, p.descricao, (p as { conteudo?: string }).conteudo)) out.push({ tipo: "Protocolo", titulo: p.titulo, descricao: resumo(p.descricao), href: "/protocolos", area: p.area });
  for (const p of procs) if (p.titulo && casa(p.titulo, p.descricao)) out.push({ tipo: "Procedimento", titulo: p.titulo, descricao: resumo(p.descricao), href: "/procedimentos", area: p.area });
  for (const c of cursos) if (c.titulo && casa(c.titulo, c.resumo, c.descricao)) out.push({ tipo: "Curso", titulo: c.titulo, descricao: resumo(c.resumo || c.descricao), href: `/cursos/${c.id}`, area: c.area });
  for (const v of vids) if (casa(v.titulo, v.descricao)) out.push({ tipo: "Videoaula", titulo: v.titulo, descricao: resumo(v.descricao), href: "/videoaulas", area: v.area });
  for (const a of acervo) if (a.titulo && casa(a.titulo, a.descricao)) out.push({ tipo: "Outros assuntos", titulo: a.titulo, descricao: resumo(a.descricao), href: "/acervo", area: a.area });
  for (const p of pods) if (casa(p.titulo, p.descricao)) out.push({ tipo: "Podcast", titulo: p.titulo, descricao: resumo(p.descricao), href: "/podcast" });
  for (const a of atus) { const ax = a as { conteudo?: string; resumo?: string }; if (a.titulo && casa(a.titulo, ax.conteudo, ax.resumo)) out.push({ tipo: "Atualização", titulo: a.titulo, descricao: resumo(ax.conteudo || ax.resumo), href: "/atualizacoes", area: a.area }); }

  if (supabaseConfigured()) {
    try {
      const sb = createPublicClient();
      const { data: ups } = await sb.from("medical_updates").select("titulo,resumo,especialidade,topicos").eq("publicado", true).limit(100);
      for (const u of ups ?? []) {
        const topicosTxt = Array.isArray(u.topicos) ? u.topicos.map((t: { titulo?: string; descricao?: string }) => `${t.titulo} ${t.descricao}`).join(" ") : "";
        if (casa(u.titulo, u.resumo, topicosTxt)) out.push({ tipo: "Boletim clínico", titulo: u.titulo, descricao: resumo(u.resumo), href: "/atualizacoes-semanais", area: u.especialidade });
      }
      const { data: evs } = await sb.from("medical_events").select("titulo,descricao,url_oficial,especialidades").eq("ativo", true).limit(300);
      for (const e of evs ?? []) if (casa(e.titulo, e.descricao)) out.push({ tipo: "Evento", titulo: e.titulo, descricao: resumo(e.descricao), href: e.url_oficial });
    } catch { /* ignora */ }
  }

  return out.slice(0, 80);
}
