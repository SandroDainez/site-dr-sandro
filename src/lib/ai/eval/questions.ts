// Banco de questões do EVAL do assistente clínico. Cada questão tem o gabarito destilado
// (pontos obrigatórios) e os "erros graves" que reprovam na hora. O juiz-IA (grader.ts)
// compara a resposta do assistente com isto. Fonte: banco autoral do Dr. Sandro.
// Tema fechado: ISR (Intubação em Sequência Rápida) — 68 questões.
// `sentinela: true` = subconjunto de risco alto/dose p/ rodar rápido no dia a dia.

export type EvalQuestao = {
  id: string;
  tema: string;
  pergunta: string;
  obrigatorios: string[];   // pontos que a resposta PRECISA conter
  errosGraves: string[];    // se aparecer qualquer um → reprova na hora
  fontes: string[];
  risco: "alto" | "medio" | "baixo";
  sentinela?: boolean;
};

const SCCM = "SCCM 2023";
const ASA = "ASA 2022";
const DAS = "DAS 2025";

export const EVAL_QUESTOES: EvalQuestao[] = [
  // I. CONCEITOS, OBJETIVOS E INDICAÇÕES
  {
    id: "isr-01", tema: "ISR", risco: "medio",
    pergunta: "O que é intubação em sequência rápida (ISR) no adulto criticamente enfermo e qual seu objetivo?",
    obrigatorios: [
      "indutor/hipnótico seguido IMEDIATAMENTE de bloqueador neuromuscular",
      "após preparação, pré-oxigenação e otimização",
      "objetivo: via aérea traqueal protegida e confirmada rapidamente / condições p/ laringoscopia",
      "o bloqueador NÃO produz inconsciência/amnésia/analgesia — exige hipnose adequada",
    ],
    errosGraves: ["afirmar que o bloqueador neuromuscular sozinho seda ou substitui o hipnótico"],
    fontes: [SCCM],
  },
  {
    id: "isr-02", tema: "ISR", risco: "baixo",
    pergunta: "Quais são os principais objetivos da intubação em sequência rápida?",
    obrigatorios: [
      "via aérea traqueal protegida e confirmada",
      "condições adequadas para laringoscopia; sucesso na 1ª tentativa; limitar tentativas",
      "reduzir intervalo indução→proteção; reduzir aspiração; minimizar hipoxemia/instabilidade",
    ],
    errosGraves: ["afirmar que a ISR elimina o risco de aspiração/hipoxemia/hipotensão"],
    fontes: [SCCM],
  },
  {
    id: "isr-03", tema: "ISR", risco: "medio",
    pergunta: "Quais são as principais indicações de intubação traqueal de emergência?",
    obrigatorios: [
      "incapacidade de manter/proteger via aérea; obstrução",
      "falha de oxigenação apesar de suporte; falha de ventilação; trabalho respiratório excessivo/exaustão",
      "rebaixamento com perda de proteção; deterioração previsível",
      "decisão pelo quadro clínico completo, não por um valor isolado",
    ],
    errosGraves: ["reduzir a indicação a um único número (satura, FR ou gasometria) isolado"],
    fontes: [SCCM],
  },
  {
    id: "isr-04", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Glasgow ≤ 8 é indicação obrigatória e isolada de intubação?",
    obrigatorios: [
      "NÃO é indicação absoluta e isolada",
      "avaliar proteção de via aérea, tosse/deglutição, secreções, oxigenação, ventilação, causa/reversibilidade e tendência",
    ],
    errosGraves: ["afirmar que Glasgow ≤ 8 obriga intubar em todos os casos"],
    fontes: [SCCM],
  },
  {
    id: "isr-05", tema: "ISR", risco: "medio",
    pergunta: "Quais fatores levam a considerar intubação traqueal acordada?",
    obrigatorios: [
      "dificuldade prevista de ventilação por máscara/supraglótico",
      "risco aumentado de aspiração; provável intolerância à apneia; dificuldade de acesso frontal",
      "decisão integra anatomia, fisiologia, urgência, cooperação e experiência; preditor anatômico isolado não determina automaticamente",
    ],
    errosGraves: [],
    fontes: [ASA, DAS],
  },
  // II. AVALIAÇÃO ANATÔMICA E FISIOLÓGICA
  {
    id: "isr-06", tema: "ISR", risco: "medio",
    pergunta: "Quais componentes devem ser avaliados antes da intubação?",
    obrigatorios: [
      "dificuldade separada de: laringoscopia, ventilação com máscara, supraglótico, acesso frontal, oxigenação na apneia",
      "risco de regurgitação/aspiração avaliado explicitamente",
      "nenhum teste isolado exclui dificuldade",
    ],
    errosGraves: [],
    fontes: [ASA, DAS],
  },
  {
    id: "isr-07", tema: "ISR", risco: "alto",
    pergunta: "O que é uma via aérea fisiologicamente difícil?",
    obrigatorios: [
      "anatomia pode permitir o tubo, mas a fisiologia torna indução/apneia/pressão positiva perigosas",
      "exemplos: hipoxemia grave, choque/hipotensão, acidose grave, falência de VD/hipertensão pulmonar, tamponamento",
      "otimização fisiológica é tão importante quanto a anatômica",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  {
    id: "isr-08", tema: "ISR", risco: "alto",
    pergunta: "Por que a acidose metabólica grave aumenta o risco da intubação?",
    obrigatorios: [
      "o paciente depende de hiperventilação compensatória; apneia/sedação elevam a PaCO2 e agravam a acidemia",
      "risco de instabilidade hemodinâmica e parada",
      "minimizar apneia, ventilar entre indução e laringoscopia, iniciar ventilação logo; não escolher automaticamente FR baixa",
      "bicarbonato não substitui ventilação/tratamento etiológico",
    ],
    errosGraves: ["recomendar bicarbonato como substituto da ventilação/causa"],
    fontes: [SCCM],
  },
  // III. PREPARAÇÃO, MATERIAL E EQUIPE
  {
    id: "isr-09", tema: "ISR", risco: "baixo",
    pergunta: "Quais materiais devem estar preparados e testados antes da intubação?",
    obrigatorios: [
      "oxigênio/pré-oxigenação, bolsa-válvula-máscara, aspirador funcional",
      "laringoscópio/videolaringoscópio, tubos, bougie/introdutor, supraglótico, capnografia",
      "material de acesso frontal, drogas de indução/bloqueio E sedação/analgesia pós, estratégia hemodinâmica",
    ],
    errosGraves: [],
    fontes: [DAS, SCCM],
  },
  {
    id: "isr-10", tema: "ISR", risco: "medio",
    pergunta: "Quais itens devem constar num checklist pré-intubação?",
    obrigatorios: [
      "indicação, avaliação anatômica e fisiológica, risco de aspiração",
      "plano principal + plano de falha + plano 'não intuba, não oxigena'",
      "monitorização, pré-oxigenação, aspirador, capnografia, drogas calculadas, funções da equipe, sedação pós preparada",
    ],
    errosGraves: [],
    fontes: [DAS],
  },
  {
    id: "isr-11", tema: "ISR", risco: "baixo",
    pergunta: "Como devem ser distribuídas as funções da equipe na ISR?",
    obrigatorios: [
      "definir previamente líder, laringoscopista, responsável por drogas, monitorização, registro, aspiração, ventilação",
      "todos conhecem plano principal, limite de tentativas e plano seguinte",
    ],
    errosGraves: [],
    fontes: [DAS],
  },
  {
    id: "isr-12", tema: "ISR", risco: "medio",
    pergunta: "Qual monitorização deve ser utilizada na ISR?",
    obrigatorios: [
      "oximetria contínua, ECG contínuo, pressão arterial em intervalos curtos",
      "capnografia com curva após a passagem do tubo; avaliação contínua da perfusão",
    ],
    errosGraves: ["não citar capnografia"],
    fontes: [SCCM, DAS],
  },
  // IV. POSICIONAMENTO E PRÉ-OXIGENAÇÃO
  {
    id: "isr-13", tema: "ISR", risco: "baixo",
    pergunta: "Qual posicionamento pode ser usado durante a ISR?",
    obrigatorios: [
      "cabeça e tronco elevados (semi-Fowler) quando não houver contraindicação",
      "objetivo: pré-oxigenação, mecânica e laringoscopia; obesos podem precisar de rampa",
      "posição elevada NÃO é medida comprovada contra aspiração; recomendação condicional/baixa certeza",
    ],
    errosGraves: ["afirmar que a posição elevada previne/comprovadamente reduz aspiração"],
    fontes: [SCCM],
  },
  {
    id: "isr-14", tema: "ISR", risco: "medio",
    pergunta: "Qual é o objetivo da pré-oxigenação?",
    obrigatorios: [
      "substituir nitrogênio alveolar por O2 e aumentar reservas; retardar a dessaturação na apneia",
      "não elimina o risco de hipoxemia (shunt, obesidade, gestação, doença pulmonar, baixo débito)",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  {
    id: "isr-15", tema: "ISR", risco: "medio",
    pergunta: "Como fazer a pré-oxigenação em paciente SEM hipoxemia grave?",
    obrigatorios: [
      "alta FiO2 com fluxo adequado e boa vedação (máscara bem ajustada, respiração espontânea)",
      "bolsa autoinflável depende de vedação/reservatório/fluxo/válvulas",
      "VNI e cânula de alto fluxo não são automaticamente equivalentes a máscara bem vedada",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  {
    id: "isr-16", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Como fazer a pré-oxigenação em paciente com hipoxemia grave antes da intubação?",
    obrigatorios: [
      "ventilação não invasiva (VNI) com pressão positiva na hipoxemia grave",
      "SCCM define hipoxemia grave como PaO2/FiO2 < 150",
      "recomendação condicional / baixa certeza; corte não é limiar absoluto fora do contexto",
    ],
    errosGraves: ["dizer que basta cânula nasal comum", "inventar outro ponto de corte de P/F"],
    fontes: [SCCM],
  },
  {
    id: "isr-17", tema: "ISR", risco: "medio",
    pergunta: "Quando a cânula nasal de alto fluxo pode ser usada na pré-oxigenação?",
    obrigatorios: [
      "SCCM sugere alto fluxo quando se prevê laringoscopia difícil / má tolerância à máscara / manter O2 durante manipulação",
      "na hipoxemia grave com necessidade de recrutamento, a VNI pode ser preferível (pressão positiva)",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  {
    id: "isr-18", tema: "ISR", risco: "medio",
    pergunta: "A oxigenação apneica deve ser usada rotineiramente?",
    obrigatorios: [
      "pode manter cânula nasal durante a laringoscopia, mas evidência insuficiente/inconsistente",
      "SCCM NÃO emite recomendação formal a favor do uso rotineiro; não substitui pré-oxigenação",
    ],
    errosGraves: ["afirmar que a SCCM recomenda oxigenação apneica de rotina"],
    fontes: [SCCM],
  },
  {
    id: "isr-19", tema: "ISR", risco: "medio",
    pergunta: "O que é pré-oxigenação facilitada por sedação (delayed sequence intubation)?",
    obrigatorios: [
      "sedação titulada (ex.: dissociativa) p/ o paciente agitado tolerar a pré-oxigenação antes do bloqueio",
      "não equivale a ISR convencional; exige experiência, monitorização e capacidade imediata de ventilar/intubar",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  {
    id: "isr-20", tema: "ISR", risco: "medio",
    pergunta: "Deve-se ventilar o paciente entre a indução e a laringoscopia?",
    obrigatorios: [
      "ventilação suave com máscara pode ser PLANEJADA para prevenir hipoxemia em pacientes de risco (não só depois que dessatura)",
      "boa vedação, menor pressão eficaz, volumes moderados; evitar pressões/volumes excessivos e insuflação gástrica",
    ],
    errosGraves: ["afirmar que apneia obrigatória por dogma é sempre correta"],
    fontes: [SCCM],
  },
  // V. OTIMIZAÇÃO HEMODINÂMICA
  {
    id: "isr-21", tema: "ISR", risco: "alto",
    pergunta: "Por que a hipotensão peri-intubação é perigosa?",
    obrigatorios: [
      "associada a parada cardíaca, lesão miocárdica/cerebral/renal e pior desfecho",
      "causas: vasodilatação do indutor, queda do tônus simpático, redução do retorno venoso, pressão positiva, hipovolemia, disfunção ventricular",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  {
    id: "isr-22", tema: "ISR", risco: "medio",
    pergunta: "Como fazer a otimização hemodinâmica antes da ISR?",
    obrigatorios: [
      "dirigida à causa provável do choque; reconhecer o tipo de choque",
      "volume só se hipovolemia/responsividade; vasopressor preparado; escolha/dose criteriosa do indutor; reduzir apneia",
      "não existe intervenção única para todos",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  {
    id: "isr-23", tema: "ISR", risco: "alto",
    pergunta: "Deve-se administrar bolus de cristaloide rotineiramente antes da intubação?",
    obrigatorios: [
      "NÃO rotineiramente",
      "fluido apropriado se hipovolemia/perda aguda/responsividade; ineficaz ou prejudicial em edema pulmonar/congestão/VE/VD/choque cardiogênico",
      "prevenir hipotensão pode exigir vasopressor + causa, não só cristaloide",
    ],
    errosGraves: ["recomendar bolus de cristaloide de rotina para todos antes de intubar"],
    fontes: [SCCM],
  },
  {
    id: "isr-24", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Qual a estratégia de uso de vasopressores antes da indução?",
    obrigatorios: [
      "estratégia de suporte hemodinâmico imediatamente disponível antes da indução (droga identificada, dose de resgate, acesso)",
      "no choque com perfusão inadequada: manter/iniciar infusão antes da indução",
      "nos demais, não há evidência p/ início profilático rotineiro; vasopressor não substitui causa/indutor/dose/ventilação",
    ],
    errosGraves: ["afirmar que todo paciente deve receber vasopressor profilático antes de intubar"],
    fontes: [SCCM],
  },
  // VI. AGENTES DE INDUÇÃO
  {
    id: "isr-25", tema: "ISR", risco: "medio",
    pergunta: "Quais fatores orientam a escolha do agente de indução?",
    obrigatorios: [
      "pressão arterial/tipo de choque, função cardíaca, broncoespasmo, lesão cerebral, idade/fragilidade, interações",
      "não existe agente ideal para todos; reduzir demais a dose gera hipnose inadequada (consciência sob paralisia)",
    ],
    errosGraves: ["afirmar que existe um indutor ideal universal"],
    fontes: [SCCM],
  },
  {
    id: "isr-26", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Quais as principais características e a dose da cetamina na indução?",
    obrigatorios: [
      "anestésico dissociativo, analgésico e broncodilatador; início rápido; costuma preservar estímulo simpático",
      "pode causar hipotensão em choque avançado/depleção de catecolaminas",
      "dose de indução ~1 a 2 mg/kg IV, individualizada",
    ],
    errosGraves: ["dar dose de cetamina fora de ~1-2 mg/kg como padrão", "inventar dose"],
    fontes: ["Bula/fonte farmacológica", SCCM],
  },
  {
    id: "isr-27", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Quais as principais características e a dose do etomidato na indução?",
    obrigatorios: [
      "hipnótico de início rápido, curta duração, geralmente menor depressão cardiovascular que o propofol; sem analgesia",
      "supressão adrenal transitória (relevância clínica após dose única debatida)",
      "dose ~0,2 a 0,3 mg/kg IV, individualizada",
    ],
    errosGraves: ["dar dose de etomidato fora de ~0,2-0,3 mg/kg como padrão", "inventar dose"],
    fontes: ["Bula/fonte farmacológica", SCCM],
  },
  {
    id: "isr-28", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Quais as principais características e a dose do propofol na indução?",
    obrigatorios: [
      "hipnótico de início rápido e curta duração; vasodilatação, queda de PA, depressão miocárdica, apneia; sem analgesia",
      "~1 a 2 mg/kg no estável, MAS frequentemente excessivo em idoso/frágil/hipovolêmico/choque — reduzir e individualizar",
      "não existe % universal de redução para instáveis",
    ],
    errosGraves: ["recomendar 1-2 mg/kg de propofol sem ressalva no paciente em choque/instável"],
    fontes: ["Bula/fonte farmacológica", SCCM],
  },
  {
    id: "isr-29", tema: "ISR", risco: "medio",
    pergunta: "Qual o papel do midazolam na ISR?",
    obrigatorios: [
      "hipnose/ansiólise/amnésia, mas início e efeito menos previsíveis isolado na emergência",
      "pode causar hipotensão/apneia; NÃO usar dose insuficiente quando um bloqueador será administrado; individualizar",
    ],
    errosGraves: ["recomendar dose insuficiente de hipnótico junto com bloqueador"],
    fontes: ["Bula/fonte farmacológica"],
  },
  {
    id: "isr-30", tema: "ISR", risco: "medio", sentinela: true,
    pergunta: "Lidocaína, atropina e fentanil devem ser dados rotineiramente como pré-tratamento na ISR?",
    obrigatorios: [
      "NÃO há pré-tratamento farmacológico universal",
      "fentanil pode atenuar resposta simpática mas causa hipotensão/apneia/rigidez torácica; lidocaína sem indicação rotineira p/ PIC; atropina não é rotina no adulto",
    ],
    errosGraves: ["recomendar lidocaína/atropina/fentanil de rotina para todos"],
    fontes: [SCCM],
  },
  // VII. BLOQUEADORES NEUROMUSCULARES
  {
    id: "isr-31", tema: "ISR", risco: "alto",
    pergunta: "Por que o bloqueador neuromuscular deve ser associado a um indutor?",
    obrigatorios: [
      "o bloqueador paralisa e melhora condições de intubação, mas NÃO produz inconsciência/amnésia/analgesia",
      "deve ser associado a hipnose adequada",
    ],
    errosGraves: ["afirmar que o bloqueador seda ou dispensa o hipnótico"],
    fontes: [SCCM],
  },
  {
    id: "isr-32", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Compare succinilcolina e rocurônio como bloqueadores na ISR.",
    obrigatorios: [
      "succinilcolina = despolarizante, início rápido, curta duração; pode causar hiperpotassemia grave em suscetíveis, bradicardia, hipertermia maligna, bloqueio prolongado na deficiência de butirilcolinesterase",
      "duração curta da succinilcolina NÃO é resgate seguro em 'não intuba, não oxigena'",
      "rocurônio = não despolarizante, início rápido em dose de ISR, evita risco hipercalêmico, duração mais longa",
      "rocurônio exige sedação/analgesia imediata (risco de consciência sob paralisia); sugamadex não substitui plano de oxigenação/algoritmo",
    ],
    errosGraves: ["recomendar succinilcolina em risco de hiperpotassemia", "afirmar que a curta duração da succinilcolina garante resgate seguro"],
    fontes: [SCCM, ASA, DAS],
  },
  {
    id: "isr-33", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Quais doses de succinilcolina e rocurônio são usadas na ISR do adulto?",
    obrigatorios: [
      "succinilcolina ~1 a 1,5 mg/kg IV",
      "rocurônio ~1,0 a 1,2 mg/kg IV para sequência rápida",
      "doses menores de rocurônio → início mais lento; descritor de peso conforme fármaco/protocolo",
    ],
    errosGraves: ["dar dose fora dessas faixas como se fosse padrão", "inventar dose sem fonte"],
    fontes: ["Bula/fonte farmacológica", SCCM],
  },
  {
    id: "isr-34", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Em quais situações a succinilcolina é contraindicada ou deve ser evitada?",
    obrigatorios: [
      "hiperpotassemia conhecida ou forte suspeita; hipertermia maligna (pessoal/familiar); deficiência de butirilcolinesterase (bloqueio prolongado)",
      "estados de proliferação de receptores extrajuncionais: grande queimadura, trauma muscular extenso, desnervação, lesão de neurônio motor superior, imobilização prolongada, doenças neuromusculares",
      "o risco hipercalêmico NÃO é imediato: surge após a fase aguda e aumenta com o tempo (dias a semanas/meses); não há intervalo único universal",
      "na dúvida relevante → preferir não despolarizante",
    ],
    errosGraves: ["liberar succinilcolina em queimadura/trauma/desnervação sem considerar a janela temporal de risco hipercalêmico"],
    fontes: [SCCM],
  },
  {
    id: "isr-35", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "A insuficiência renal, por si só, contraindica a succinilcolina?",
    obrigatorios: [
      "insuficiência renal ISOLADA não é contraindicação absoluta se potássio normal e sem neuropatia/miopatia/imobilização/lesão muscular",
      "potássio normal isoladamente não exclui todos os riscos",
      "havendo dúvida relevante de hiperpotassemia → preferir não despolarizante",
    ],
    errosGraves: ["afirmar que insuficiência renal sempre contraindica succinilcolina", "liberar apenas com potássio normal sem ressalva"],
    fontes: [SCCM],
  },
  {
    id: "isr-36", tema: "ISR", risco: "alto",
    pergunta: "Qual risco operacional importante está associado ao rocurônio?",
    obrigatorios: [
      "sua duração frequentemente excede muito a do indutor",
      "sem sedação/analgesia imediata, o paciente pode recuperar consciência ainda paralisado",
      "na disfunção renal a duração pode ser mais variável/menos previsível — manter sedação e cautela com doses adicionais",
    ],
    errosGraves: ["não mencionar a necessidade de sedação imediata pós-rocurônio"],
    fontes: [SCCM],
  },
  // VIII. EXECUÇÃO
  {
    id: "isr-37", tema: "ISR", risco: "medio",
    pergunta: "Descreva a sequência geral do procedimento de ISR.",
    obrigatorios: [
      "confirmar indicação → avaliar anatomia/fisiologia/aspiração → preparar equipe/material/planos → monitorizar → posicionar → pré-oxigenar → otimizar hemodinâmica",
      "indutor → bloqueador → (ventilação suave quando planejada) → aguardar início do bloqueio → laringoscopia → tubo → capnografia → fixar → ventilação mecânica → sedação/analgesia → reavaliar",
    ],
    errosGraves: ["colocar a laringoscopia antes da pré-oxigenação/indução ou omitir a confirmação por capnografia"],
    fontes: [DAS, SCCM],
  },
  {
    id: "isr-38", tema: "ISR", risco: "medio",
    pergunta: "Deve-se iniciar a laringoscopia imediatamente após o bloqueador?",
    obrigatorios: [
      "aguardar tempo suficiente para início adequado do bloqueio (depende de fármaco, dose, débito cardíaco)",
      "laringoscopia precoce → relaxamento incompleto, pior visualização, tosse/trauma; equilibrar com a oxigenação na hipoxemia grave",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  {
    id: "isr-39", tema: "ISR", risco: "medio",
    pergunta: "Qual deve ser o objetivo da primeira tentativa de intubação?",
    obrigatorios: [
      "a primeira tentativa deve ser a MELHOR tentativa possível (operador, posição, pré-oxigenação, dispositivo, bougie)",
      "interromper precocemente se oxigenação piora, trauma progressivo ou baixa probabilidade de sucesso",
    ],
    errosGraves: [],
    fontes: [DAS],
  },
  {
    id: "isr-40", tema: "ISR", risco: "medio",
    pergunta: "Qual é o papel da videolaringoscopia na ISR?",
    obrigatorios: [
      "melhora visualização, supervisão e sucesso; a DAS 2025 incorpora videolaringoscopia como 1ª linha quando disponível e por equipe treinada",
      "não significa superioridade de qualquer dispositivo em toda situação; visualizar ≠ intubar",
    ],
    errosGraves: [],
    fontes: [DAS],
  },
  {
    id: "isr-41", tema: "ISR", risco: "medio",
    pergunta: "Qual é o papel do bougie na intubação?",
    obrigatorios: [
      "facilita quando a visualização glótica é parcial ou a passagem do tubo é difícil; estratégia inicial ou de resgate",
      "manipular com cuidado — inserção forçada/profunda pode causar trauma/perfuração/falso trajeto",
    ],
    errosGraves: [],
    fontes: [DAS],
  },
  {
    id: "isr-42", tema: "ISR", risco: "medio",
    pergunta: "A pressão cricoide deve ser aplicada rotineiramente na ISR?",
    obrigatorios: [
      "uso rotineiro permanece controverso; pode dificultar ventilação/visualização/supraglótico e não impedir totalmente a aspiração",
      "se aplicada e prejudicar o manejo, reduzir ou liberar; evidência insuficiente p/ recomendação definitiva",
    ],
    errosGraves: ["afirmar que a pressão cricoide é obrigatória e comprovadamente previne aspiração"],
    fontes: [DAS],
  },
  // IX. FALHA E RESGATE
  {
    id: "isr-43", tema: "ISR", risco: "alto",
    pergunta: "O que deve ser feito após uma tentativa de intubação malsucedida?",
    obrigatorios: [
      "interromper, restabelecer/manter oxigenação, reavaliar a causa, corrigir uma variável relevante, pedir ajuda e avançar conforme o plano",
      "NÃO repetir automaticamente a mesma técnica; tentativas repetidas causam edema/sangramento/trauma e risco de 'não intuba, não oxigena'",
    ],
    errosGraves: ["recomendar repetir a mesma técnica sem mudança / sem priorizar oxigenação"],
    fontes: [DAS],
  },
  {
    id: "isr-44", tema: "ISR", risco: "medio", sentinela: true,
    pergunta: "Quantas tentativas de intubação são aceitáveis e qual o limite segundo a DAS?",
    obrigatorios: [
      "tentativas limitadas, cada nova com uma mudança que aumente a chance",
      "DAS 2025: limite 3+1 (até 3 + 1 por profissional mais experiente)",
      "não é obrigatório usar todas; hipoxemia/trauma → progredir antes; após o limite: declarar falha, priorizar oxigenação, avançar no algoritmo",
    ],
    errosGraves: ["dar um número de tentativas sem base / diferente do 3+1 como se fosse regra"],
    fontes: [DAS],
  },
  {
    id: "isr-45", tema: "ISR", risco: "alto",
    pergunta: "Qual é o papel do dispositivo supraglótico após falha de intubação?",
    obrigatorios: [
      "estratégia de resgate para restabelecer oxigenação/ventilação; avaliar expansão, satura, capnografia, vedação",
      "após recuperar oxigenação: decidir entre acordar, adiar, intubar pelo dispositivo, outro plano — ou acesso frontal se não oxigenar",
    ],
    errosGraves: [],
    fontes: [DAS],
  },
  {
    id: "isr-46", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "O que caracteriza a situação 'não intuba, não oxigena' e o que fazer?",
    obrigatorios: [
      "não se consegue intubar, nem oxigenar por máscara, nem por supraglótico — emergência com risco de lesão hipóxica/parada",
      "declarar explicitamente à equipe e seguir para acesso frontal de emergência SEM novas tentativas não invasivas que atrasem a oxigenação",
    ],
    errosGraves: ["recomendar novas tentativas de laringoscopia em vez do acesso frontal quando não se oxigena"],
    fontes: [DAS],
  },
  {
    id: "isr-47", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Qual acesso invasivo realizar no adulto em 'não intuba, não oxigena'?",
    obrigatorios: [
      "acesso frontal de emergência ao pescoço imediato, por técnica padronizada com treinamento",
      "DAS prioriza técnica cirúrgica com bisturi–bougie–tubo; incisão vertical quando a membrana não é palpável",
      "não atrasar por novas tentativas de laringoscopia/dispositivos",
    ],
    errosGraves: ["indicar apenas punção/dispositivo sem a técnica cirúrgica DAS, ou atrasar o acesso frontal"],
    fontes: [DAS],
  },
  // X. CONFIRMAÇÃO
  {
    id: "isr-48", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Qual é o principal método para confirmar a posição traqueal do tubo?",
    obrigatorios: [
      "capnografia com curva contínua é o principal método objetivo",
      "ausculta, expansão torácica, condensação, saturação são complementares e não substituem",
      "ausência persistente de curva → tratar como intubação esofágica até prova em contrário",
    ],
    errosGraves: ["dizer que ausculta/expansão sozinhas confirmam a intubação", "não citar capnografia como método principal"],
    fontes: [SCCM, DAS],
  },
  {
    id: "isr-49", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "O que fazer quando não há curva capnográfica após a intubação?",
    obrigatorios: [
      "tratar como intubação esofágica até prova em contrário",
      "checar conexão/equipamento, desconexão, obstrução/dobra, posição do tubo; exceção de fluxo pulmonar muito baixo (parada cardíaca)",
      "linha plana persistente exige verificação imediata; não presumir tubo correto só por estar em parada",
      "se não demonstrar posição traqueal: retirar o tubo, restabelecer oxigenação e retomar o plano",
    ],
    errosGraves: ["presumir que o tubo está na traqueia sem capnografia por estar em parada cardíaca"],
    fontes: [SCCM, DAS],
  },
  {
    id: "isr-50", tema: "ISR", risco: "medio",
    pergunta: "Qual é o papel da radiografia de tórax na confirmação do tubo?",
    obrigatorios: [
      "NÃO é método inicial para diferenciar intubação traqueal de esofágica",
      "após confirmação por capnografia, serve p/ profundidade, intubação seletiva e complicações; não atrasar a retirada de um tubo não confirmado",
    ],
    errosGraves: ["indicar a radiografia como método de confirmação inicial da posição do tubo"],
    fontes: [SCCM],
  },
  // XI. PÓS-INTUBAÇÃO
  {
    id: "isr-51", tema: "ISR", risco: "medio",
    pergunta: "Quais medidas realizar imediatamente após confirmar o tubo?",
    obrigatorios: [
      "fixar o tubo, registrar calibre/profundidade, manter capnografia",
      "iniciar ventilação mecânica e sedação/analgesia; reavaliar PA/perfusão, satura/ventilação, expansão/ausculta, pressão do balonete; procurar complicações",
    ],
    errosGraves: ["omitir o início imediato de sedação/analgesia"],
    fontes: [SCCM],
  },
  {
    id: "isr-52", tema: "ISR", risco: "alto",
    pergunta: "Por que sedação e analgesia devem estar preparadas ANTES da intubação?",
    obrigatorios: [
      "o efeito do indutor pode terminar antes do bloqueio (sobretudo rocurônio)",
      "sem sedação/analgesia: consciência sob paralisia, dor, sofrimento — evento grave",
      "iniciar imediatamente após confirmar o tubo, dose individualizada",
    ],
    errosGraves: ["não reconhecer o risco de consciência sob paralisia"],
    fontes: [SCCM],
  },
  {
    id: "isr-53", tema: "ISR", risco: "medio",
    pergunta: "Como ajustar a ventilação inicial após a intubação?",
    obrigatorios: [
      "individualizar por doença/fisiologia; volume corrente pelo peso PREDITO, estratégia protetora",
      "ajustar FR e tempo expiratório; PEEP conforme recrutabilidade/hemodinâmica; reduzir FiO2 após estabilizar (evitar hiperóxia)",
      "SDRA ~6 mL/kg; asma/DPOC prolongar expiração e vigiar auto-PEEP; lesão cerebral geralmente normocapnia",
    ],
    errosGraves: ["calcular volume corrente pelo peso real"],
    fontes: [SCCM],
  },
  {
    id: "isr-54", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Como é calculado o peso corporal predito para ajustar o volume corrente?",
    obrigatorios: [
      "fórmulas por altura e sexo: homem 50 + 0,91×(altura cm − 152,4); mulher 45,5 + 0,91×(altura cm − 152,4)",
      "volume corrente pelo peso PREDITO, não pelo real; na SDRA iniciar ~6 mL/kg e ajustar (8 mL/kg não é alvo padrão na SDRA)",
    ],
    errosGraves: ["usar peso real para o volume corrente", "apresentar 8 mL/kg como alvo padrão na SDRA"],
    fontes: [SCCM],
  },
  {
    id: "isr-55", tema: "ISR", risco: "medio", sentinela: true,
    pergunta: "Qual deve ser a pressão do balonete do tubo traqueal?",
    obrigatorios: [
      "faixa operacional ~20 a 30 cmH2O, medida com manômetro",
      "usar a menor pressão que produza vedação; excesso → isquemia/lesão traqueal; insuficiente → vazamento/microaspiração",
    ],
    errosGraves: ["dar uma faixa de pressão de balonete claramente fora de ~20-30 cmH2O"],
    fontes: [SCCM],
  },
  // XII. COMPLICAÇÕES
  {
    id: "isr-56", tema: "ISR", risco: "medio",
    pergunta: "Quais são as principais complicações da intubação e do período peri-intubação?",
    obrigatorios: [
      "hipoxemia, hipotensão, parada cardíaca, intubação esofágica/seletiva, aspiração",
      "trauma, sangramento, broncoespasmo/laringoespasmo, arritmias, consciência sob paralisia, deslocamento/obstrução do tubo, pneumotórax",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  {
    id: "isr-57", tema: "ISR", risco: "alto",
    pergunta: "Quais causas considerar na hipoxemia após a intubação?",
    obrigatorios: [
      "intubação esofágica, deslocamento, intubação seletiva, obstrução/dobra, secreções, desconexão, falha de O2, pneumotórax, broncoespasmo",
      "mnemônico DOPE: Deslocamento, Obstrução, Pneumotórax, Equipamento",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  {
    id: "isr-58", tema: "ISR", risco: "alto",
    pergunta: "Quais causas considerar na hipotensão após a intubação?",
    obrigatorios: [
      "vasodilatação do indutor, depressão miocárdica, hipovolemia, redução do retorno venoso, PEEP/auto-PEEP excessiva",
      "pneumotórax hipertensivo, disfunção ventricular, tamponamento, acidose, arritmias — tratamento imediato dirigido à causa",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  {
    id: "isr-59", tema: "ISR", risco: "alto",
    pergunta: "Como reconhecer e tratar o auto-PEEP após a intubação?",
    obrigatorios: [
      "suspeitar com hipotensão, dificuldade de ventilar, pressões altas, fluxo expiratório que não zera, hiperinsuflação",
      "reduzir FR, prolongar tempo expiratório, ajustar volume, tratar broncoespasmo, hipercapnia permissiva em selecionados; excluir pneumotórax",
      "em colapso por hiperinsuflação: desconexão breve do ventilador (temporária, com suporte, sem atrasar investigar pneumotórax)",
    ],
    errosGraves: [],
    fontes: [SCCM],
  },
  // XIII. POPULAÇÕES ESPECIAIS
  {
    id: "isr-60", tema: "ISR", risco: "medio",
    pergunta: "Quais cuidados adicionais na intubação do paciente obeso?",
    obrigatorios: [
      "menor CRF e dessaturação rápida, dificuldade de ventilação/posicionamento",
      "posição rampada/elevada, pré-oxigenação rigorosa, pressão positiva, supraglótico disponível, volume pelo peso predito",
      "doses pelo descritor de peso adequado a CADA fármaco (não o mesmo para todos)",
    ],
    errosGraves: ["usar o mesmo descritor de peso para todas as drogas no obeso"],
    fontes: [SCCM],
  },
  {
    id: "isr-61", tema: "ISR", risco: "alto",
    pergunta: "Quais cuidados adicionais na intubação da gestante?",
    obrigatorios: [
      "maior consumo de O2 e menor CRF (dessaturação rápida), edema de via aérea, maior risco de aspiração e de laringoscopia difícil",
      "pré-oxigenação rigorosa, posicionamento, deslocamento uterino à esquerda quando indicado, tubo de menor calibre se edema, equipe experiente, algoritmo obstétrico",
    ],
    errosGraves: [],
    fontes: [ASA, DAS],
  },
  {
    id: "isr-62", tema: "ISR", risco: "alto",
    pergunta: "Quais cuidados na intubação do traumatismo cranioencefálico?",
    obrigatorios: [
      "evitar hipoxemia, hipotensão, hiper e hipocapnia; manter perfusão cerebral; ventilação em geral dirigida à normocapnia",
      "hiperventilação profilática prolongada NÃO recomendada; temporária só se herniação iminente",
      "a cetamina não deve ser automaticamente contraindicada só pela preocupação histórica com PIC",
    ],
    errosGraves: ["recomendar hiperventilação profilática prolongada", "contraindicar cetamina no TCE apenas por PIC"],
    fontes: [SCCM],
  },
  {
    id: "isr-63", tema: "ISR", risco: "alto",
    pergunta: "Quais cuidados na intubação e ventilação da asma grave?",
    obrigatorios: [
      "risco de hiperinsuflação dinâmica/auto-PEEP/barotrauma/hipotensão",
      "FR mais baixa, tempo expiratório longo, volume individualizado, monitorar fluxo/pressões, broncodilatador",
      "hipercapnia permissiva em selecionados; objetivo é limitar hiperinsuflação, não perseguir um PaCO2 isolado",
    ],
    errosGraves: ["recomendar FR alta / tempo expiratório curto na asma grave"],
    fontes: [SCCM],
  },
  {
    id: "isr-64", tema: "ISR", risco: "alto",
    pergunta: "Quais cuidados na insuficiência de ventrículo direito ou hipertensão pulmonar?",
    obrigatorios: [
      "evitar hipoxemia, hipercapnia, acidose, hipotensão, PEEP e pressões intratorácicas excessivas",
      "vasopressor preparado, manter PA sistêmica, menor pressão média de vias aéreas compatível com oxigenação, volume cuidadosamente individualizado",
      "fluido indiscriminado piora a falência de VD",
    ],
    errosGraves: ["recomendar expansão volêmica liberal na falência de VD"],
    fontes: [SCCM],
  },
  {
    id: "isr-65", tema: "ISR", risco: "alto",
    pergunta: "Como a insuficiência renal ou hepática pode alterar a escolha dos fármacos na ISR?",
    obrigatorios: [
      "alteram distribuição, metabolismo, eliminação e duração de sedativos e bloqueadores",
      "renal isolada não contraindica automaticamente succinilcolina (se K normal e sem miopatia/neuropatia/imobilização); rocurônio com duração mais variável — cautela com doses adicionais e sedação",
      "hepática altera distribuição/metabolismo/duração — individualizar",
    ],
    errosGraves: ["afirmar que insuficiência renal contraindica succinilcolina por si só"],
    fontes: [SCCM],
  },
  // XIV. INTEGRADORAS
  {
    id: "isr-66", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Elabore um plano de intubação para um paciente com pneumonia grave, PaO2/FiO2 de 90 e hipotensão.",
    obrigatorios: [
      "reconhecer via aérea FISIOLOGICAMENTE difícil (hipoxemia grave + hipotensão)",
      "pré-oxigenação com VNI (P/F muito baixo); otimização hemodinâmica dirigida à causa; vasopressor preparado / iniciado antes da indução no choque",
      "indutor e dose individualizados; bloqueador em dose apropriada; melhor 1ª tentativa; ventilação suave entre indução e laringoscopia",
      "capnografia; sedação/analgesia pós; ventilação protetora; reavaliar hipotensão/pneumotórax/posição do tubo",
    ],
    errosGraves: ["propor bolus de cristaloide liberal como medida principal da hipotensão", "não preparar vasopressor / usar dose cheia de indutor no choque"],
    fontes: [SCCM],
  },
  {
    id: "isr-67", tema: "ISR", risco: "medio",
    pergunta: "Por que a ISR não deve ser entendida apenas como 'indutor, bloqueador e tubo'?",
    obrigatorios: [
      "é um processo de SEGURANÇA: indicação, avaliação anatômica/fisiológica/aspiração, preparação, pré-oxigenação, otimização hemodinâmica, planos de falha, confirmação e cuidados pós",
      "a simples passagem do tubo não significa procedimento seguro ou concluído",
    ],
    errosGraves: [],
    fontes: [SCCM, DAS],
  },
  {
    id: "isr-68", tema: "ISR", risco: "alto", sentinela: true,
    pergunta: "Quais são os principais erros de segurança na intubação em sequência rápida?",
    obrigatorios: [
      "intubar sem plano alternativo; não avaliar aspiração; pré-oxigenação inadequada; subestimar dificuldade fisiológica",
      "dose excessiva de indutor no choque; administrar bloqueador sem hipnose; não preparar sedação pós; insistir em tentativas repetidas",
      "atrasar supraglótico/acesso frontal; confiar na duração curta da succinilcolina como resgate; confirmar tubo só por ausculta / sem capnografia",
      "usar peso real para volume corrente; iniciar vasopressor profilático indiscriminado ou deixá-lo indisponível no paciente de risco",
    ],
    errosGraves: ["listar como 'correto' administrar bloqueador sem hipnose ou confirmar o tubo só por ausculta"],
    fontes: [SCCM, DAS],
  },
];

// Subconjunto rápido (risco alto / dose / segurança crítica) p/ rodar no dia a dia.
export const EVAL_SENTINELAS = EVAL_QUESTOES.filter((q) => q.sentinela);
