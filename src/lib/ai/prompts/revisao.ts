import type { Source, SecaoGerada } from "../types";
import { buildRevisaoProtocolosPrompt } from "./revisao-protocolos";
import { buildRevisaoCientificoPrompt } from "./revisao-cientifico";
import { buildRevisaoAulasPrompt } from "./revisao-aulas";
import { buildRevisaoFlashcardsPrompt } from "./revisao-flashcards";
import { buildRevisaoAtualizacaoPrompt } from "./revisao-atualizacao";

// Dispatcher do prompt de REVISÃO (estágio 2) por módulo. O provider é agnóstico de módulo:
// recebe ReviewInput.modulo e este dispatcher escolhe o prompt certo. Novo módulo = 1 case.
// Default = protocolos (preserva o comportamento do piloto).
export function buildRevisaoPrompt(modulo: string, args: { secoes: SecaoGerada[]; sources: Source[] }): string {
  switch (modulo) {
    case "editor-cientifico":
    case "editor-premium": // refinamento produz o mesmo tipo de texto → mesmo revisor científico
      return buildRevisaoCientificoPrompt(args);
    case "criador-aulas":
      return buildRevisaoAulasPrompt(args);
    case "criador-flashcards":
      return buildRevisaoFlashcardsPrompt(args);
    case "atualizador-protocolos":
      return buildRevisaoAtualizacaoPrompt(args);
    case "arquiteto-protocolos":
    default:
      return buildRevisaoProtocolosPrompt(args);
  }
}
