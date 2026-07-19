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
    id: "preoxigenacao-pf150",
    tema: "Pré-oxigenação na hipoxemia grave — corte P/F < 150",
    gatilhos:
      /pr[ée]-?oxigena|hipoxemia grave|pao2\s*\/\s*fio2|pa?o2\/?fio2|rela[çc][ãa]o p\s*\/\s*f|ventila[çc][ãa]o n[ãa]o[- ]invasiva|\bvni\b/i,
    // presente = a resposta traz o corte de P/F < 150 (SCCM) para hipoxemia grave.
    presente: (r) => tem(r, /\b150\b/),
    exigencia:
      "Na pré-oxigenação da hipoxemia grave, a resposta DEVE usar pressão positiva/VNI e trazer o corte de PaO2/FiO2 < 150 (SCCM) como definição de hipoxemia grave, sinalizando ser recomendação condicional/de baixa certeza. NÃO inventar outro ponto de corte de P/F.",
    canonico:
      "**Hipoxemia grave na pré-oxigenação:** use **pressão positiva/VNI**; o corte de **PaO2/FiO2 < 150** (SCCM) define hipoxemia grave — recomendação **condicional, de baixa certeza**. Não use outro ponto de corte.",
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
    id: "bloqueio-exige-hipnose",
    tema: "Bloqueio neuromuscular exige hipnose — risco de consciência sob paralisia",
    gatilhos:
      /rocur[ôo]nio|succinilcolina|bloquead(or|ores) neuromuscular|bloqueio neuromuscular|consci[êe]ncia sob paralisia|sob paralisia|paralisia (muscular|farmacol[óo]gica|neuromuscular)|sedaç[ãa]o e analgesia/i,
    // presente = a resposta sinaliza que o bloqueador não dá consciência/analgesia e exige
    // hipnose/sedação (antes e mantida após), ou cita explicitamente o risco de awareness.
    presente: (r) =>
      tem(
        r,
        /consci[êe]ncia sob paralisia|awareness|paralisia sem (hipnose|sedaç)|n[ãa]o (produz|confere|garante|d[áa]|oferece)[^.]{0,25}(inconsci|hipnose|amn[ée]sia|sedaç|analgesia)|garantir (hipnose|sedaç|inconsci)|hipnose adequada|sedaç[ãa]o[^.]{0,25}(imediat|manter|cont[íi]nua|ap[óo]s a? ?intuba)/i,
      ),
    exigencia:
      "Quando há bloqueador neuromuscular (rocurônio/succinilcolina) na ISR, a resposta DEVE deixar claro que o bloqueador NÃO produz inconsciência/amnésia/analgesia — exige HIPNOSE adequada e SEDAÇÃO/ANALGESIA imediata e mantida após a intubação (sobretudo rocurônio, de ação prolongada), sob risco de CONSCIÊNCIA SOB PARALISIA (awareness).",
    canonico:
      "**Bloqueio neuromuscular exige hipnose:** o bloqueador **não** produz inconsciência, amnésia ou analgesia — garanta **hipnose adequada** antes/junto e **sedação/analgesia imediata e contínua após a intubação** (sobretudo com rocurônio, de ação prolongada), sob risco de **consciência sob paralisia (awareness)**.",
    severidade: "alta",
  },
  {
    id: "confirmacao-capnografia",
    tema: "Confirmação do tubo — capnografia",
    gatilhos:
      /confirmar? (a )?(posi[çc][ãa]o|intuba[çc][ãa]o|posicionamento)|posi[çc][ãa]o (traqueal|do tubo)|confirmar? o tubo|principal m[ée]todo.{0,30}(confirma|tubo|traqueal)/i,
    // presente = a resposta cita a capnografia (método objetivo principal de confirmação).
    presente: (r) => tem(r, /capnograf/i),
    exigencia:
      "Sobre confirmar a posição do tubo, a resposta DEVE citar a CAPNOGRAFIA com curva contínua como método objetivo principal (ausculta/expansão/condensação/saturação são complementares e não substituem); ausência persistente de curva → intubação esofágica até prova em contrário.",
    canonico:
      "**Confirmação do tubo:** a **capnografia com curva contínua** é o método objetivo principal — ausculta, expansão torácica, condensação e saturação são complementares e **não substituem**. Ausência persistente de curva capnográfica → tratar como **intubação esofágica até prova em contrário**.",
    severidade: "alta",
  },
  {
    id: "tentativas-das-3mais1",
    tema: "Via aérea difícil — limite de tentativas (DAS)",
    gatilhos:
      /quantas tentativas|n[úu]mero de tentativas|limite de tentativas|tentativas.{0,25}(aceit|permit|intuba|laringoscop|\bdas\b)/i,
    // presente = a resposta traz a regra 3+1 da DAS (3 + 1 do mais experiente).
    presente: (r) => tem(r, /3\s*\+\s*1|tr[êe]s\s*\+\s*1|3\s*mais\s*(1|uma)|tr[êe]s mais (uma|1)/i),
    exigencia:
      "Sobre o número/limite de tentativas de intubação, a resposta DEVE trazer a regra da DAS 2025: no máximo 3 tentativas + 1 pelo profissional mais experiente (3+1), cada tentativa com uma mudança que aumente a chance. NÃO afirmar outro número (ex.: '3 por operador') como regra.",
    canonico:
      "**Limite de tentativas (DAS 2025):** no máximo **3 tentativas + 1** pelo profissional mais experiente (regra **3+1**). Cada tentativa deve trazer uma MUDANÇA que aumente a chance de sucesso; não é obrigatório esgotar o limite (hipoxemia/trauma → progredir antes). Atingido o limite: declarar falha, priorizar OXIGENAÇÃO e avançar no algoritmo.",
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
  // ————— SCA (Síndromes Coronarianas Agudas) —————
  {
    id: "bre-novo-nao-stemi",
    tema: "SCA — bloqueio de ramo esquerdo novo não é STEMI",
    gatilhos: /bloqueio de ramo|\bbre\b|ritmo estimulado|ritmo de marca-?passo/i,
    // presente = a resposta diz que BRE novo isolado NÃO é STEMI/infarto, ou cita critérios de concordância (Sgarbossa).
    presente: (r) =>
      tem(r, /isolad[oa]/i) && tem(r, /n[ãa]o[^.]{0,60}(stemi|infarto)/i) ||
      tem(r, /sgarbossa|concord[âa]ncia|discord[âa]ncia (proporcional|excessiva)/i),
    exigencia:
      "Quando há bloqueio de ramo (esp. BRE) ou ritmo estimulado, a resposta DEVE afirmar que bloqueio de ramo esquerdo NOVO isolado NÃO é critério de STEMI nem diagnóstico de infarto; avaliar com clínica, ECGs prévios e critérios de concordância/discordância (Sgarbossa/Smith).",
    canonico:
      "**Bloqueio de ramo esquerdo (BRE) novo:** isoladamente **não** é critério de STEMI nem diagnóstico de infarto. Integre clínica, ECGs prévios e critérios de **concordância/discordância (Sgarbossa / Smith-modificado)** — não indique reperfusão apenas pelo BRE novo.",
    severidade: "alta",
  },
  {
    id: "minoca-dapt-nao-automatico",
    tema: "SCA — MINOCA é diagnóstico de trabalho, sem DAPT automático",
    gatilhos: /\bminoca\b|coron[áa]ri\w* não obstrutiv|artérias coronárias não obstrutivas|sem estenose coronariana obstrutiva|coronariografia sem estenose/i,
    // presente = trata MINOCA como diagnóstico de trabalho / investigar mecanismo, ou nega DAPT automático.
    presente: (r) =>
      tem(r, /diagn[óo]stico de trabalho/i) ||
      tem(r, /investiga\w+[^.]{0,25}(mecanismo|etiolog|causa)/i) ||
      tem(r, /(dirigi\w+|direcionad\w+|tratar)[^.]{0,20}mecanismo/i) ||
      tem(r, /n[ãa]o[^.]{0,50}autom[áa]tic/i),
    exigencia:
      "Em MINOCA/coronárias não obstrutivas, a resposta DEVE tratar MINOCA como diagnóstico de TRABALHO (não etiologia definitiva), indicar INVESTIGAR o mecanismo e NÃO prescrever dupla antiagregação (DAPT) automaticamente — dirigir o tratamento ao mecanismo identificado.",
    canonico:
      "**MINOCA:** é um **diagnóstico de trabalho** (IAM com coronárias não obstrutivas), **não** uma etiologia definitiva — **investigue o mecanismo** (ruptura/erosão, SCAD, embolia, vasoespasmo, microvascular; eco, RM precoce, OCT/IVUS seletivo) e **direcione o tratamento a ele**. Não prescreva **dupla antiagregação automaticamente**; registre a incerteza quando o mecanismo for indeterminado.",
    severidade: "alta",
  },
];

// Filtra os invariantes cujo tema apareceu na PERGUNTA (o que o usuário realmente perguntou).
// Só a pergunta — NÃO a resposta: a resposta pode conter frases soltas de outro tema (ex.: RAG
// puxou trecho de via aérea numa pergunta de cardiologia) e disparar uma ressalva fora de contexto.
// A pergunta define o assunto; assim cada invariante fica restrito ao seu domínio.
export function invariantesDisparados(pergunta: string): Invariante[] {
  return INVARIANTES.filter((inv) => inv.gatilhos.test(pergunta));
}

// Dos invariantes disparados, quais a resposta NÃO cumpre (determinístico) — só alta severidade.
export function invariantesFaltando(disparados: Invariante[], resposta: string): Invariante[] {
  return disparados.filter((inv) => inv.severidade === "alta" && !inv.presente(resposta));
}
