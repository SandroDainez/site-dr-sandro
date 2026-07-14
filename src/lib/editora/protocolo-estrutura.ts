// Estrutura institucional do protocolo (médico) e o AGRUPAMENTO EM BLOCOS para geração
// por partes (2-4 seções por chamada — evita truncamento nas seções finais, sobretudo
// Doses e Referências). Ver docs/ARQUITETURA-IA.md.
//
// v2 (jul/2026): estrutura elevada ao padrão de protocolo institucional completo, após
// benchmark com um protocolo-referência (Hipoglicemia MCP-EC-001). Só entrou o que agrega
// para um documento MÉDICO — sem seções multiprofissionais (enfermagem/farmácia/fisio),
// sem anexos, sem epidemiologia. Novidades: governança documental, fundamentos dedicados
// (fisiopatologia/etiologia/fatores de risco/manifestações), prescrição médica modelo,
// critérios de internação, segurança do paciente (alertas), erros frequentes, indicadores
// de qualidade, resumo executivo e fundamentação científica.

export const PROTOCOLO_SECOES: string[] = [
  // Identidade e governança
  "Título",
  "Controle do documento",
  "Objetivo",
  "Abrangência",
  // Fundamentos
  "Definições",
  "Fisiopatologia",
  "Etiologia",
  "Fatores de risco",
  // Reconhecimento e diagnóstico
  "Manifestações clínicas",
  "Critérios diagnósticos",
  "Classificação e estratificação de gravidade",
  "Diagnóstico diferencial",
  // Abordagem inicial
  "Avaliação inicial (ABCDE)",
  "Exames complementares",
  "Estabilização imediata",
  // Tratamento
  "Tratamento",
  "Doses e medicamentos",
  "Plano inicial de manejo — modelo operacional",
  // Seguimento e decisão de fluxo
  "Monitorização e reavaliação",
  "Critérios de internação",
  "Critérios de UTI",
  "Critérios de alta",
  // Populações e desfechos
  "Situações e populações especiais",
  "Complicações",
  // Segurança e qualidade
  "Segurança do paciente",
  "Erros frequentes e armadilhas clínicas",
  "Indicadores de qualidade",
  // Síntese e apoio à beira-leito
  "Resumo executivo",
  "Fluxograma",
  "Checklist",
  // Base científica
  "Fundamentação científica",
  "Referências",
];

// 14 blocos pequenos (1-4 seções). Com a diretriz de COMPLETUDE (seções exaustivas), o
// DeepSeek satura ~8192 tokens de saída; blocos densos (Tratamento, Doses, Fisiopatologia)
// ficam sozinhos ou pareados com uma seção leve pra caber. Seções curtas/operacionais podem
// ir 3-4 juntas. A geração itera por índice de bloco.
export const PROTOCOLO_BLOCOS: string[][] = [
  ["Título", "Controle do documento", "Objetivo", "Abrangência"],
  ["Definições", "Fisiopatologia"],
  ["Etiologia", "Fatores de risco"],
  ["Manifestações clínicas", "Critérios diagnósticos"],
  ["Classificação e estratificação de gravidade", "Diagnóstico diferencial"],
  ["Avaliação inicial (ABCDE)", "Exames complementares", "Estabilização imediata"],
  ["Tratamento"],
  ["Doses e medicamentos", "Plano inicial de manejo — modelo operacional"],
  ["Monitorização e reavaliação", "Critérios de internação", "Critérios de UTI", "Critérios de alta"],
  ["Situações e populações especiais", "Complicações"],
  ["Segurança do paciente", "Erros frequentes e armadilhas clínicas"],
  ["Indicadores de qualidade"],
  ["Resumo executivo", "Fluxograma", "Checklist"],
  ["Fundamentação científica", "Referências"],
];

// Seções OPERACIONAIS/de síntese: não são afirmações clínicas primárias baseadas em fonte.
// A IA as preenche com tipo "geral" (governança), sintetizando o que JÁ foi gerado e citado
// nas seções clínicas — nunca fabricando fato, dose ou meta. Indicadores de qualidade são
// metas SUGERIDAS/EDITÁVEIS (institucionais), não números de guideline.
export const PROTOCOLO_SECOES_OPERACIONAIS: string[] = [
  "Controle do documento",
  "Plano inicial de manejo — modelo operacional",
  "Indicadores de qualidade",
  "Resumo executivo",
  "Fluxograma",
  "Checklist",
];

// Apelido de EXIBIÇÃO: protocolos já gerados guardam o nome ANTIGO da seção. Aqui mapeamos
// o nome salvo → nome novo, só na hora de mostrar (PDF/web), sem regerar nem tocar no dado.
export const SECAO_ALIAS: Record<string, string> = {
  "Prescrição médica modelo": "Plano inicial de manejo — modelo operacional",
};
export const nomeExibicaoSecao = (secao: string): string => SECAO_ALIAS[secao] ?? secao;

// Escolha de especialidade/tipo do módulo (mais granular que a coluna do banco).
export const ESPECIALIDADES_MODULO = [
  "UTI", "Emergência", "Anestesiologia", "Cardiologia", "Infectologia", "Outro",
] as const;
export type EspecialidadeModulo = (typeof ESPECIALIDADES_MODULO)[number];

// Mapeia a escolha do módulo para o CHECK do banco (protocols.specialty).
// Cardiologia/Infectologia/Outro caem em 'geral' (o banco ainda não tem essas áreas —
// a escolha original fica preservada no conteúdo da versão). Ver nota no Comando 5.
export function mapEspecialidadeDB(e: string): "emergencias" | "ti" | "anestesiologia" | "geral" {
  switch (e) {
    case "UTI": return "ti";
    case "Emergência": return "emergencias";
    case "Anestesiologia": return "anestesiologia";
    default: return "geral";
  }
}

// Tipos de fonte aceitos na ingestão.
export const TIPOS_FONTE = ["guideline", "artigo", "livro", "consenso"] as const;
export type TipoFonte = (typeof TIPOS_FONTE)[number];
