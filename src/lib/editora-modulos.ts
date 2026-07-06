import {
  FlaskConical, ClipboardList, Crown, GraduationCap, Layers, ListChecks,
  RefreshCw, GitCompare, Search, type LucideIcon,
} from "lucide-react";

// Registro dos 9 módulos de IA da Editora Médica (ver docs/ARQUITETURA-IA.md).
// Fonte única — o dashboard e as páginas de módulo leem daqui. Escalável: novo
// módulo = nova entrada. Por ora todos são PLACEHOLDER (sem IA implementada).

export type ModuloTipo = "geração" | "retrieval" | "híbrido";

export type EditoraModulo = {
  slug: string;
  nome: string;
  descricao: string;
  tipo: ModuloTipo;
  icon: LucideIcon;
  href?: string;   // rota real quando o módulo já existe (senão, placeholder)
  ativo?: boolean; // true = implementado (piloto), false/undefined = "em breve"
};

export const EDITORA_MODULOS: EditoraModulo[] = [
  { slug: "editor-cientifico",       nome: "Editor Científico",       tipo: "geração",   icon: FlaskConical,   descricao: "Redige texto científico a partir das referências fornecidas.", href: "/admin/editora/editor-cientifico", ativo: true },
  { slug: "arquiteto-protocolos",    nome: "Arquiteto de Protocolos", tipo: "geração",   icon: ClipboardList,  descricao: "Estrutura um protocolo clínico a partir de diretrizes.", href: "/admin/editora/arquiteto-protocolos", ativo: true },
  { slug: "editor-premium",          nome: "Editor Premium",          tipo: "geração",   icon: Crown,          descricao: "Refina e densifica um rascunho com base nas fontes.", href: "/admin/editora/editor-premium", ativo: true },
  { slug: "criador-aulas",           nome: "Criador de Aulas",        tipo: "geração",   icon: GraduationCap,  descricao: "Monta aulas/seções a partir do material de origem.", href: "/admin/editora/criador-aulas", ativo: true },
  { slug: "criador-flashcards",      nome: "Criador de Flashcards",   tipo: "geração",   icon: Layers,         descricao: "Gera flashcards (frente/verso) fundamentados nas fontes." },
  { slug: "criador-questoes",        nome: "Criador de Questões",     tipo: "geração",   icon: ListChecks,     descricao: "Cria questões de múltipla escolha com gabarito e justificativa." },
  { slug: "atualizador-protocolos",  nome: "Atualizador de Protocolos", tipo: "híbrido", icon: RefreshCw,      descricao: "Busca novidades e propõe o delta sobre um protocolo existente." },
  { slug: "comparador-guidelines",   nome: "Comparador de Guidelines", tipo: "retrieval", icon: GitCompare,    descricao: "Compara diretrizes de diferentes fontes (busca externa)." },
  { slug: "pesquisador-cientifico",  nome: "Pesquisador Científico",  tipo: "retrieval", icon: Search,         descricao: "Pesquisa e sintetiza evidências (PubMed, RAG interno)." },
];

export function getModulo(slug: string): EditoraModulo | undefined {
  return EDITORA_MODULOS.find((m) => m.slug === slug);
}
