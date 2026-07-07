import {
  FlaskConical, ClipboardList, Crown, GraduationCap, Layers, ListChecks,
  RefreshCw, GitCompare, Search, type LucideIcon,
} from "lucide-react";

// Registro dos 9 módulos de IA da Editora Médica (ver docs/ARQUITETURA-IA.md).
// Fonte única — o dashboard e as páginas de módulo leem daqui. Escalável: novo módulo = nova entrada.

export type ModuloTipo = "geração" | "retrieval" | "híbrido";

// Grupo do módulo no painel (agrupa por FINALIDADE, para o usuário achar o que quer).
export type ModuloGrupo = "textos" | "ensino" | "pesquisa";

// Como o módulo é ALIMENTADO: você cola referências, cola um rascunho, ou ele busca sozinho.
export type ModuloEntrada = "referencias" | "rascunho" | "busca";

export type EditoraModulo = {
  slug: string;
  nome: string;
  descricao: string;      // 1 linha: o que faz
  recebe: string;         // o que VOCÊ dá pra ele (entrada, em 1-3 palavras)
  produz: string;         // o que SAI (o produto)
  tipo: ModuloTipo;
  grupo: ModuloGrupo;
  entrada: ModuloEntrada;
  publicaEm: string;      // rota pública onde o conteúdo publicado aparece
  icon: LucideIcon;
  href?: string;          // rota do editor no admin
  ativo?: boolean;
};

export const GRUPOS: { id: ModuloGrupo; titulo: string; descricao: string }[] = [
  { id: "textos",   titulo: "Protocolos e textos científicos", descricao: "Você cola as referências (diretrizes, artigos) e a IA redige." },
  { id: "ensino",   titulo: "Material de ensino e estudo",     descricao: "Aulas, flashcards e questões a partir das referências que você cola." },
  { id: "pesquisa", titulo: "Pesquisa e evidência",            descricao: "Não precisa colar nada — a IA busca sozinha na biblioteca interna + PubMed." },
];

export const ENTRADA_LABEL: Record<ModuloEntrada, string> = {
  referencias: "Você cola as referências",
  rascunho: "Você cola um rascunho + referências",
  busca: "Busca automática (biblioteca interna + PubMed)",
};

export const EDITORA_MODULOS: EditoraModulo[] = [
  // ── Protocolos e textos científicos ──────────────────────────────────────
  { slug: "arquiteto-protocolos",    nome: "Arquiteto de Protocolos", tipo: "geração",   grupo: "textos",   entrada: "referencias", publicaEm: "/protocolos",             icon: ClipboardList,  recebe: "diretrizes / artigos", produz: "protocolo institucional (33 seções)", descricao: "Monta um protocolo clínico institucional a partir de diretrizes.", href: "/admin/editora/arquiteto-protocolos", ativo: true },
  { slug: "editor-cientifico",       nome: "Editor Científico",       tipo: "geração",   grupo: "textos",   entrada: "referencias", publicaEm: "/biblioteca-cientifica",  icon: FlaskConical,   recebe: "referências", produz: "texto científico (do zero)", descricao: "Redige um texto científico do zero a partir das referências.",     href: "/admin/editora/editor-cientifico",    ativo: true },
  { slug: "editor-premium",          nome: "Editor Premium",          tipo: "geração",   grupo: "textos",   entrada: "rascunho",    publicaEm: "/biblioteca-cientifica",  icon: Crown,          recebe: "seu rascunho + referências", produz: "texto refinado e denso", descricao: "Refina e densifica um rascunho seu, mantendo tudo citado.",         href: "/admin/editora/editor-premium",       ativo: true },
  // ── Material de ensino e estudo ──────────────────────────────────────────
  { slug: "criador-aulas",           nome: "Criador de Aulas",        tipo: "geração",   grupo: "ensino",   entrada: "referencias", publicaEm: "/aulas",                  icon: GraduationCap,  recebe: "referências + público-alvo", produz: "aula em seções/slides", descricao: "Monta uma aula em seções/slides, ajustada ao público-alvo.",        href: "/admin/editora/criador-aulas",        ativo: true },
  { slug: "criador-flashcards",      nome: "Criador de Flashcards",   tipo: "geração",   grupo: "ensino",   entrada: "referencias", publicaEm: "/flashcards",             icon: Layers,         recebe: "referências", produz: "baralho de flashcards (frente/verso)", descricao: "Gera baralhos de flashcards (frente/verso) com respostas citadas.", href: "/admin/editora/criador-flashcards",   ativo: true },
  { slug: "criador-questoes",        nome: "Criador de Questões",     tipo: "geração",   grupo: "ensino",   entrada: "referencias", publicaEm: "/questoes",               icon: ListChecks,     recebe: "referências", produz: "questões de múltipla escolha", descricao: "Cria questões de múltipla escolha; publicadas entram no quiz.",     href: "/admin/editora/criador-questoes",     ativo: true },
  // ── Pesquisa e evidência (busca automática) ──────────────────────────────
  { slug: "pesquisador-cientifico",  nome: "Pesquisador Científico",  tipo: "retrieval", grupo: "pesquisa", entrada: "busca",       publicaEm: "/pesquisas",              icon: Search,         recebe: "uma pergunta", produz: "síntese crítica da evidência", descricao: "Responde uma pergunta com síntese crítica da evidência e fontes.",  href: "/admin/editora/pesquisador-cientifico", ativo: true },
  { slug: "comparador-guidelines",   nome: "Comparador de Guidelines", tipo: "retrieval", grupo: "pesquisa", entrada: "busca",      publicaEm: "/comparativos",           icon: GitCompare,     recebe: "um tema", produz: "comparação entre diretrizes", descricao: "Compara o que diferentes diretrizes dizem sobre um tema.",          href: "/admin/editora/comparador-guidelines", ativo: true },
  { slug: "atualizador-protocolos",  nome: "Atualizador de Protocolos", tipo: "híbrido", grupo: "pesquisa", entrada: "busca",      publicaEm: "/atualizacoes-protocolos", icon: RefreshCw,      recebe: "um protocolo publicado", produz: "relatório de atualização (delta)", descricao: "Vê o que a evidência recente muda num protocolo já publicado.",     href: "/admin/editora/atualizador-protocolos", ativo: true },
];

export function getModulo(slug: string): EditoraModulo | undefined {
  return EDITORA_MODULOS.find((m) => m.slug === slug);
}
