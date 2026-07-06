// Estrutura fixa do RELATÓRIO DE ATUALIZAÇÃO (delta citado sobre um protocolo publicado).
// Módulo híbrido: retrieval (biblioteca interna + PubMed) → geração 2 estágios. Ver ARQUITETURA-IA.

export {
  ESPECIALIDADES_MODULO,
  mapEspecialidadeDB,
  type EspecialidadeModulo,
} from "./protocolo-estrutura";

export const ATUALIZACAO_SECOES: string[] = [
  "Novidades relevantes",
  "Reforça a conduta atual",
  "Possíveis mudanças",
  "Conflitos e controvérsias",
  "Recomendação de revisão",
];
