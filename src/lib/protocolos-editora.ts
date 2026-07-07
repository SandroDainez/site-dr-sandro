import { createPublicClient, serviceConfigured } from "@/lib/supabase/server";
import type { SecaoGerada } from "@/lib/ai/types";

// Leitura PÚBLICA dos protocolos da Editora (tabela protocols + protocol_versions).
// Usa o cliente ANÔNIMO de propósito → a RLS garante que só o publicado apareça
// (protocols.status='published' + protocol_versions.is_published=true). Ver migration 003.

export type ProtocoloPublicoResumo = { id: string; title: string; slug: string; specialty: string; areas: string[] };

export type ProtocoloConteudo = {
  especialidade?: string;
  secoes?: SecaoGerada[];
  textoEditado?: Record<string, string>;
  confidence?: number;
  confidence_method?: string;
};

export type ProtocoloPublico = {
  id: string;
  title: string;
  slug: string;
  specialty: string;
  publicado_em: string | null;
  conteudo: ProtocoloConteudo;
};

export async function getProtocolosPublicados(): Promise<ProtocoloPublicoResumo[]> {
  if (!serviceConfigured()) return [];
  try {
    const supabase = createPublicClient(); // anon → RLS só devolve status='published'
    const { data } = await supabase.from("protocols").select("id,title,slug,specialty,areas").eq("status", "published").order("updated_at", { ascending: false });
    return ((data as { id: string; title: string; slug: string; specialty: string; areas: string[] | null }[]) ?? [])
      .map((p) => ({ id: p.id, title: p.title, slug: p.slug, specialty: p.specialty, areas: p.areas ?? [] }));
  } catch {
    return [];
  }
}

// ── Unificação: protocolo da Editora → mesmo shape dos protocolos "de blob" (ProtocoloData),
// para render com o card PADRÃO (expandir no local, tela cheia, badge de especialidade) e
// aparecer nas mesmas listas (/protocolos, home, hubs). Ver getProtocolosPublicadosData.

import type { ProtocoloData } from "@/lib/content";

const AREAS_VALIDAS = ["emergencias", "ti", "anestesiologia"] as const;
type AreaValida = (typeof AREAS_VALIDAS)[number];
const ehArea = (a: string): a is AreaValida => (AREAS_VALIDAS as readonly string[]).includes(a);
function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// Renderiza as seções do protocolo como HTML simples (h3 + parágrafos) para o card/expansão.
function conteudoParaHtml(c: ProtocoloConteudo): string {
  return (c.secoes ?? [])
    .map((s) => {
      const txt = (c.textoEditado?.[s.secao] ?? s.afirmacoes.map((a) => a.texto).join("\n")).trim();
      if (!txt) return "";
      const paras = txt.split("\n").map((t) => t.trim()).filter(Boolean).map((t) => `<p>${escHtml(t)}</p>`).join("");
      return `<h3>${escHtml(s.secao)}</h3>${paras}`;
    })
    .filter(Boolean)
    .join("");
}

// Lista os protocolos publicados JÁ no formato ProtocoloData (com o conteúdo completo em HTML),
// para render com o card padrão e mesclar com os protocolos "de blob".
export async function getProtocolosPublicadosData(): Promise<ProtocoloData[]> {
  if (!serviceConfigured()) return [];
  try {
    const supabase = createPublicClient(); // anon → RLS só devolve status='published'
    const { data: prots } = await supabase
      .from("protocols").select("id,title,slug,specialty,areas,updated_at").eq("status", "published").order("updated_at", { ascending: false });
    const lista = (prots as { id: string; title: string; slug: string; specialty: string; areas: string[] | null; updated_at: string }[]) ?? [];
    if (lista.length === 0) return [];

    // Versões publicadas dos protocolos, numa query só.
    const { data: vers } = await supabase
      .from("protocol_versions").select("protocol_id,content,created_at").in("protocol_id", lista.map((p) => p.id)).eq("is_published", true);
    const porProto = new Map<string, { content: ProtocoloConteudo; created_at: string }>();
    for (const v of (vers as { protocol_id: string; content: ProtocoloConteudo; created_at: string }[]) ?? []) {
      if (!porProto.has(v.protocol_id)) porProto.set(v.protocol_id, { content: v.content ?? {}, created_at: v.created_at });
    }

    return lista.map((p) => {
      const ver = porProto.get(p.id);
      const conteudo = ver?.content ?? {};
      const areasValidas = (p.areas ?? []).filter(ehArea) as AreaValida[];
      const area: AreaValida = ehArea(p.specialty) ? p.specialty : (areasValidas[0] ?? "ti");
      const objetivo = (conteudo.textoEditado?.["Objetivo"] ?? conteudo.secoes?.find((s) => s.secao === "Objetivo")?.afirmacoes.map((a) => a.texto).join(" ") ?? "").slice(0, 180);
      return {
        id: p.slug,
        titulo: p.title,
        descricao: objetivo,
        conteudo: conteudoParaHtml(conteudo),
        area,
        imageUrl: "",
        imageCaption: "",
        arquivoUrl: "",
        arquivoLabel: "",
        data: (ver?.created_at ?? p.updated_at ?? "").slice(0, 10),
        areas: areasValidas.filter((a) => a !== area),
      } satisfies ProtocoloData;
    });
  } catch {
    return [];
  }
}

export async function getProtocoloPublicado(slug: string): Promise<ProtocoloPublico | null> {
  if (!serviceConfigured()) return null;
  try {
    const supabase = createPublicClient(); // anon → RLS
    const { data: prot } = await supabase
      .from("protocols")
      .select("id,title,slug,specialty,updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!prot) return null;

    // versão publicada (RLS: is_published=true). Deve haver no máximo uma.
    const { data: ver } = await supabase
      .from("protocol_versions")
      .select("content,created_at")
      .eq("protocol_id", prot.id)
      .eq("is_published", true)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      id: prot.id,
      title: prot.title,
      slug: prot.slug,
      specialty: prot.specialty,
      publicado_em: ver?.created_at ?? null,
      conteudo: (ver?.content as ProtocoloConteudo) ?? {},
    };
  } catch {
    return null;
  }
}
