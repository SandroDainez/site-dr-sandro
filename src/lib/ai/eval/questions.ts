// Banco de questões do EVAL do assistente clínico (piloto). Cada questão tem o gabarito
// destilado (pontos obrigatórios) e os "erros graves" que reprovam na hora. O juiz-IA
// (grader.ts) compara a resposta do assistente com isto. Fonte: banco autoral do Dr. Sandro.
// Piloto: subconjunto do banco de ISR (68 q.) — as demais entram no mesmo formato.

export type EvalQuestao = {
  id: string;
  tema: string;
  pergunta: string;
  obrigatorios: string[];   // pontos que a resposta PRECISA conter
  errosGraves: string[];    // se aparecer qualquer um → reprova na hora
  fontes: string[];
  risco: "alto" | "medio" | "baixo";
};

export const EVAL_QUESTOES: EvalQuestao[] = [
  {
    id: "isr-01", tema: "ISR", risco: "medio",
    pergunta: "O que é intubação em sequência rápida (ISR) no adulto e qual seu objetivo principal?",
    obrigatorios: [
      "indutor/hipnótico seguido imediatamente de bloqueador neuromuscular",
      "após preparação e pré-oxigenação",
      "objetivo: via aérea traqueal protegida e confirmada rapidamente / condições p/ laringoscopia",
      "o bloqueador NÃO produz inconsciência/amnésia/analgesia — exige hipnose adequada",
    ],
    errosGraves: ["afirmar que o bloqueador neuromuscular sozinho seda ou substitui o hipnótico"],
    fontes: ["SCCM 2023"],
  },
  {
    id: "isr-04", tema: "ISR", risco: "alto",
    pergunta: "Glasgow ≤ 8 é indicação obrigatória e isolada de intubação?",
    obrigatorios: [
      "NÃO é indicação absoluta e isolada",
      "avaliar proteção de via aérea, tosse/deglutição, secreções, oxigenação, ventilação, causa/reversibilidade e tendência",
    ],
    errosGraves: ["afirmar que Glasgow ≤ 8 obriga intubar em todos os casos"],
    fontes: ["SCCM 2023"],
  },
  {
    id: "isr-16", tema: "ISR", risco: "alto",
    pergunta: "Como fazer a pré-oxigenação em paciente com hipoxemia grave antes da intubação?",
    obrigatorios: [
      "ventilação não invasiva (VNI) com pressão positiva na hipoxemia grave",
      "SCCM define hipoxemia grave como PaO2/FiO2 < 150",
      "recomendação condicional / baixa certeza; corte não é limiar absoluto fora do contexto",
    ],
    errosGraves: ["dizer que basta cânula nasal comum", "inventar outro ponto de corte de P/F"],
    fontes: ["SCCM 2023"],
  },
  {
    id: "isr-32", tema: "ISR", risco: "alto",
    pergunta: "Compare succinilcolina e rocurônio como bloqueadores na ISR. Quando evitar a succinilcolina?",
    obrigatorios: [
      "succinilcolina = despolarizante, início rápido, curta duração",
      "evitar succinilcolina se risco de hiperpotassemia (queimadura pós-fase-aguda, trauma muscular extenso, desnervação, imobilização prolongada, doença neuromuscular)",
      "contraindicações: hipertermia maligna, deficiência de butirilcolinesterase (bloqueio prolongado)",
      "rocurônio = não despolarizante, duração mais longa",
      "rocurônio exige sedação/analgesia imediata (risco de consciência sob paralisia)",
      "duração curta da succinilcolina NÃO é resgate seguro em 'não intuba, não oxigena'",
    ],
    errosGraves: ["recomendar succinilcolina em hiperpotassemia ou alto risco de hiperpotassemia", "afirmar superioridade universal de um sobre o outro sem contexto"],
    fontes: ["SCCM 2023", "ASA 2022", "DAS 2025"],
  },
  {
    id: "isr-33", tema: "ISR", risco: "alto",
    pergunta: "Quais doses de succinilcolina e rocurônio são usadas na ISR do adulto?",
    obrigatorios: [
      "succinilcolina ~1 a 1,5 mg/kg IV",
      "rocurônio ~1,0 a 1,2 mg/kg IV para sequência rápida",
      "doses menores de rocurônio → início mais lento; descritor de peso conforme fármaco/protocolo",
    ],
    errosGraves: ["dar dose fora dessas faixas como se fosse padrão", "inventar dose sem fonte"],
    fontes: ["Bula/fonte farmacológica", "SCCM 2023"],
  },
  {
    id: "isr-35", tema: "ISR", risco: "alto",
    pergunta: "A insuficiência renal, por si só, contraindica a succinilcolina?",
    obrigatorios: [
      "insuficiência renal ISOLADA não é contraindicação absoluta se potássio normal e sem neuropatia/miopatia/imobilização/lesão muscular",
      "potássio normal isoladamente não exclui todos os riscos",
      "havendo dúvida relevante de hiperpotassemia → preferir não despolarizante",
    ],
    errosGraves: ["afirmar que insuficiência renal sempre contraindica succinilcolina", "afirmar que basta o potássio normal para liberar sem ressalva"],
    fontes: ["SCCM 2023"],
  },
  {
    id: "isr-44", tema: "ISR", risco: "medio",
    pergunta: "Quantas tentativas de intubação são aceitáveis e qual o limite segundo a DAS?",
    obrigatorios: [
      "tentativas limitadas, cada nova com uma mudança que aumente a chance",
      "DAS 2025: limite 3+1 (até 3 + 1 por profissional mais experiente)",
      "não é obrigatório usar todas; hipoxemia/trauma → progredir antes",
      "após o limite: declarar falha, priorizar oxigenação, avançar no algoritmo",
    ],
    errosGraves: ["dar um número de tentativas sem base / diferente do 3+1 como se fosse regra"],
    fontes: ["DAS 2025"],
  },
  {
    id: "isr-48", tema: "ISR", risco: "alto",
    pergunta: "Qual é o principal método para confirmar a posição traqueal do tubo?",
    obrigatorios: [
      "capnografia com curva contínua é o principal método objetivo",
      "ausculta, expansão torácica, condensação, saturação são complementares e não substituem",
      "ausência persistente de curva → tratar como intubação esofágica até prova em contrário",
    ],
    errosGraves: ["dizer que ausculta/expansão sozinhas confirmam a intubação", "não citar capnografia como método principal"],
    fontes: ["SCCM 2023", "DAS 2025"],
  },
];
