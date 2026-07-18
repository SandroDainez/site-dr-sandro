// INVARIANTES DE SEGURANÇA do assistente clínico.
// São ressalvas CONSAGRADAS que MUDAM a conduta e que, quando o tema aparece, a resposta
// NUNCA pode omitir. O prompt já pede isso — mas prompt é probabilístico. O auditor
// (auditor.ts) usa esta lista para GARANTIR de forma DETERMINÍSTICA (checagem por texto,
// sem depender de outra IA) que a ressalva esteja presente — regenerando a resposta e,
// no limite, anexando o texto canônico.
//
// Como crescer: para um novo tema (SCA, sepse, AVC...), adicione um item aqui com seus
// gatilhos, o detector `presente` e o texto canônico. NÃO precisa mexer no pipeline.

export type Invariante = {
  id: string;
  tema: string;
  // O tema apareceu? Casa na PERGUNTA ou na RESPOSTA. Barato — só dispara o auditor quando bate.
  gatilhos: RegExp;
  // A ressalva consagrada ESTÁ presente na resposta? Checagem determinística (texto puro),
  // sem IA. Se o tema disparou e isto der `false` → a ressalva está faltando.
  presente: (resposta: string) => boolean;
  // O que a resposta PRECISA afirmar (instrução usada na regeneração).
  exigencia: string;
  // Texto consagrado a GARANTIR na resposta se ainda faltar (backstop determinístico).
  canonico: string;
  severidade: "alta" | "media";
};

// helpers de normalização p/ os detectores (acento/caixa/espaços não atrapalham)
const tem = (t: string, re: RegExp) => re.test(t);

export const INVARIANTES: Invariante[] = [
  {
    id: "fona-das",
    tema: "Via aérea — 'não intuba, não oxigena' (CICO/FONA)",
    gatilhos:
      /n[ãa]o\s+intuba.{0,15}n[ãa]o\s+oxigena|cannot intubate.{0,15}cannot oxygenate|\bcico\b|acesso frontal|front[- ]of[- ]neck|\bfona\b|cricotire|cricotomia|via a[ée]rea de resgate|via a[ée]rea cir[úu]rgica/i,
    // presente = a resposta nomeia a técnica cirúrgica bisturi–bougie–tubo (scalpel-bougie-tube).
    presente: (r) => tem(r, /bisturi[\s\S]{0,60}(bougie|tubo)|scalpel[\s\S]{0,60}(bougie|tube)/i),
    exigencia:
      "Em 'não intuba, não oxigena', a resposta DEVE indicar ACESSO FRONTAL DE EMERGÊNCIA IMEDIATO ao pescoço pela TÉCNICA CIRÚRGICA da DAS (bisturi–bougie–tubo; incisão vertical na pele quando a membrana cricotireóidea não for palpável), sem novas tentativas não invasivas que atrasem a oxigenação.",
    canonico:
      "**Acesso frontal de emergência (técnica cirúrgica — DAS 2025):** realize IMEDIATAMENTE por **bisturi–bougie–tubo** (incisão vertical na pele quando a membrana cricotireóidea não for palpável). Não retarde com novas tentativas de laringoscopia ou dispositivos supraglóticos — a prioridade é oxigenar.",
    severidade: "alta",
  },
  {
    id: "vt-sdra-peso-predito",
    tema: "Ventilação — volume corrente na SDRA",
    gatilhos:
      /\bsdra\b|\bsara\b|\bards\b|volume corrente|ventila[çc][ãa]o protetora|peso (corporal )?predito/i,
    // presente = a resposta traz o alvo de ~6 mL/kg (peso predito) na SDRA.
    presente: (r) => tem(r, /6\s*m(l|L)\s*\/\s*kg/i),
    exigencia:
      "Quando se fala de volume corrente/ventilação protetora, a resposta DEVE dizer que o volume corrente é calculado pelo PESO PREDITO (não real) e que na SDRA se inicia ~6 mL/kg de peso predito — e que 8 mL/kg NÃO é alvo padrão na SDRA.",
    canonico:
      "**Volume corrente na SDRA:** calcule pelo **peso corporal predito** (nunca peso real) e inicie em **~6 mL/kg de peso predito**, ajustando por platô/driving pressure. **8 mL/kg não é alvo padrão na SDRA.**",
    severidade: "alta",
  },
  {
    id: "propofol-analgesia-instavel",
    tema: "Propofol — sem analgesia e redução no instável",
    gatilhos: /propofol/i,
    // presente = a resposta diz que o propofol NÃO dá analgesia E que se reduz/individualiza no instável.
    presente: (r) =>
      tem(r, /(sem|n[ãa]o (produz|oferece|fornece|tem|possui|confere)?\s*)analgesia|nenhuma analgesia|desprovido de analgesia/i) &&
      tem(r, /reduz\w*|individualiz\w*|menor dose|dose reduzida|titul\w*/i),
    exigencia:
      "Ao falar de propofol na indução, a resposta DEVE afirmar que o propofol NÃO oferece analgesia (associar analgésico) e que a dose deve ser REDUZIDA/individualizada em idoso/frágil/hipovolêmico/choque — não existe percentual universal de redução para instáveis.",
    canonico:
      "**Propofol:** não oferece analgesia (associe analgésico quando indicado) e causa hipotensão/depressão miocárdica dose-dependente. No paciente instável (idoso, frágil, hipovolêmico, choque) **reduza e individualize a dose** — não há percentual universal de redução; titule pelo efeito hemodinâmico.",
    severidade: "alta",
  },
  {
    id: "inducao-choque",
    tema: "Indução no choque",
    gatilhos:
      /induç[ãa]o.{0,25}(choque|hipoten|inst[aá]vel)|(choque|hipoten|inst[aá]vel).{0,25}induç[ãa]o|intuba\w*.{0,20}choque|choque.{0,20}intuba/i,
    // presente = menciona vasopressor pronto/disponível E redução/individualização do indutor.
    presente: (r) =>
      tem(r, /vasopressor|noradrenalina|noreping|epinefrina|amina vasoativa/i) &&
      tem(r, /reduz\w*|individualiz\w*|menor dose|dose reduzida|metade da dose/i),
    exigencia:
      "Ao induzir/intubar no paciente em choque/instável, a resposta DEVE: ter vasopressor PREPARADO/disponível antes da indução (iniciar/manter infusão na perfusão inadequada) E REDUZIR/individualizar a dose do indutor.",
    canonico:
      "**Indução no choque:** tenha **vasopressor preparado e disponível ANTES da indução** (mantenha/inicie a infusão se a perfusão estiver inadequada) e **reduza/individualize a dose do indutor** (o propofol não oferece analgesia e agrava a hipotensão). Evite bolus de cristaloide de rotina só para 'cobrir' a indução.",
    severidade: "alta",
  },
];

// Filtra os invariantes cujo tema apareceu na pergunta ou na resposta (gate barato).
export function invariantesDisparados(pergunta: string, resposta: string): Invariante[] {
  const alvo = `${pergunta}\n${resposta}`;
  return INVARIANTES.filter((inv) => inv.gatilhos.test(alvo));
}

// Dos invariantes disparados, quais a resposta NÃO cumpre (determinístico) — só alta severidade.
export function invariantesFaltando(disparados: Invariante[], resposta: string): Invariante[] {
  return disparados.filter((inv) => inv.severidade === "alta" && !inv.presente(resposta));
}
