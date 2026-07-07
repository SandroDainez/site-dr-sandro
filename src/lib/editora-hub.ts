import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";

// Conteúdo PUBLICADO da Editora Médica que aparece nos hubs de especialidade
// (/especialidade/[area]). Um documento entra no hub de uma área quando está publicado
// (status='published') E tem a área marcada em `areas` (migration 010). Agrupado por
// finalidade para render numa seção "Da Editora Médica".

export type EditoraGrupo = "Protocolos" | "Aulas" | "Textos científicos" | "Estudo";

export type EditoraHubItem = {
  id: string;
  titulo: string;
  href: string;      // rota pública de detalhe (/rota/slug)
  grupo: EditoraGrupo;
  tipoLabel: string; // rótulo curto do tipo (ex.: "Protocolo", "Aula", "Flashcards")
};

// Cada tabela doc → como vira item de hub. `base` é a rota pública; o href final é base/slug.
type Fonte = {
  tabela: string;
  grupo: EditoraGrupo;
  tipoLabel: string;
  base: string;
  // para research_docs, o tipo decide a rota (comparador vs pesquisador)
  extraSelect?: string;
  resolver?: (row: Record<string, unknown>) => { base: string; tipoLabel: string };
};

const FONTES: Fonte[] = [
  // NOTA: `protocols` NÃO entra aqui — os protocolos publicados aparecem na seção "Protocolos"
  // principal do hub (card padrão, via getProtocolosPublicadosData). Evita duplicação.
  { tabela: "protocol_update_docs", grupo: "Protocolos",          tipoLabel: "Atualização de protocolo", base: "/atualizacoes-protocolos" },
  { tabela: "aula_docs",            grupo: "Aulas",               tipoLabel: "Aula",                  base: "/aulas" },
  { tabela: "sci_docs",             grupo: "Textos científicos",  tipoLabel: "Texto científico",      base: "/biblioteca-cientifica" },
  {
    tabela: "research_docs", grupo: "Textos científicos", tipoLabel: "Pesquisa", base: "/pesquisas", extraSelect: "tipo",
    resolver: (row) =>
      row.tipo === "comparador"
        ? { base: "/comparativos", tipoLabel: "Comparação de guidelines" }
        : { base: "/pesquisas", tipoLabel: "Pesquisa científica" },
  },
  { tabela: "flashcard_docs",       grupo: "Estudo",              tipoLabel: "Flashcards",            base: "/flashcards" },
  { tabela: "questao_docs",         grupo: "Estudo",              tipoLabel: "Questões",              base: "/questoes" },
];

export async function getEditoraPorArea(area: string): Promise<EditoraHubItem[]> {
  if (!serviceConfigured()) return [];
  const supabase = createServiceClient();

  const consultas = FONTES.map(async (f) => {
    const cols = ["id", "title", "slug", f.extraSelect].filter(Boolean).join(",");
    const { data, error } = await supabase
      .from(f.tabela)
      .select(cols)
      .eq("status", "published")
      .contains("areas", [area])
      .order("updated_at", { ascending: false });
    if (error || !data) return [] as EditoraHubItem[];
    return (data as unknown as Record<string, unknown>[])
      .filter((row) => row.slug && row.title)
      .map((row): EditoraHubItem => {
        const r = f.resolver?.(row);
        const base = r?.base ?? f.base;
        const tipoLabel = r?.tipoLabel ?? f.tipoLabel;
        return {
          id: String(row.id),
          titulo: String(row.title),
          href: `${base}/${String(row.slug)}`,
          grupo: f.grupo,
          tipoLabel,
        };
      });
  });

  const listas = await Promise.all(consultas);
  return listas.flat();
}

export const EDITORA_GRUPOS_ORDEM: EditoraGrupo[] = ["Protocolos", "Aulas", "Textos científicos", "Estudo"];
