import type { EvalQuestao } from "./questions";

// Banco de EVAL do tema SCA (Síndromes Coronarianas Agudas) — Módulo I: conceitos, classificação
// e mecanismos. Gabarito destilado do banco autoral do Dr. Sandro, ancorado na 4ª Definição
// Universal de IAM (2018), ACC/AHA 2025, ESC 2023, MINOCA (AHA 2019) e SCAD (AHA 2018).
// `sentinela: true` = subconjunto de risco alto onde um erro é perigoso (roda rápido no dia a dia).
// Módulo I é diagnóstico/classificação — os "erros graves" são condutas/interpretações perigosas,
// não doses. Novos módulos (conduta, antitrombóticos, reperfusão) entram depois no mesmo formato.

const UDMI = "4ª Definição Universal de IAM (2018)";
const ACC = "ACC/AHA 2025 (SCA)";
const ESC = "ESC 2023 (SCA)";
const MINOCA = "AHA MINOCA 2019";
const SCAD = "AHA SCAD 2018";
// Módulo II (epidemiologia e fatores de risco)
const CCD = "ACC/AHA Doença Coronariana Crônica 2023";
const KDIGO = "KDIGO DRC 2024";
const COCAINA = "AHA Cocaína 2008 / Richards 2016 / Lo 2019";
const ESCPREG = "ESC Gravidez 2025";

export const EVAL_SCA: EvalQuestao[] = [
  {
    id: "sca-01", tema: "SCA", risco: "medio",
    pergunta: "O que é uma síndrome coronariana aguda?",
    obrigatorios: [
      "apresentação clínica de isquemia miocárdica aguda, geralmente por redução súbita do fluxo coronariano",
      "mecanismo mais comum = instabilização de placa (ruptura ou erosão) → trombose intracoronária",
      "espectro tradicional: angina instável, NSTEMI, STEMI",
      "'SCA' descreve a apresentação inicial — não determina isoladamente etiologia, anatomia, artéria culpada nem conduta definitiva",
      "outros mecanismos (SCAD, embolia, vasoespasmo, IAM tipo 2) podem simular SCA e exigem investigação/tratamento próprios",
    ],
    errosGraves: ["afirmar que toda SCA é aterotrombótica ou aplicar a conduta da SCA aterotrombótica a todos os mecanismos indistintamente"],
    fontes: [UDMI, ACC, ESC],
  },
  {
    id: "sca-02", tema: "SCA", risco: "medio", sentinela: true,
    pergunta: "Quais condições clínicas compõem o espectro tradicional das síndromes coronarianas agudas?",
    obrigatorios: [
      "angina instável: isquemia clínica sem nova lesão miocárdica aguda após troponinas seriadas adequadas",
      "NSTEMI: elevação/queda de troponina com ≥1 valor > percentil 99 + evidência de isquemia, sem critério eletrocardiográfico de STEMI",
      "STEMI: isquemia + supradesnível de ST que preenche critério → avaliação imediata para reperfusão",
      "uma única troponina < percentil 99 não diagnostica angina instável nem exclui NSTEMI",
    ],
    errosGraves: [
      "dizer que uma troponina < percentil 99 exclui NSTEMI",
      "chamar qualquer padrão de ECG de 'equivalente de STEMI' indiscriminadamente",
    ],
    fontes: [UDMI, ACC, ESC],
  },
  {
    id: "sca-03", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "Como diferenciar STEMI, NSTEMI e angina instável?",
    obrigatorios: [
      "STEMI = supra de ST com critério → reperfusão imediata; quando ECG+clínica são diagnósticos, NÃO aguardar a troponina",
      "NSTEMI = troponina dinâmica > percentil 99 + evidência de isquemia, sem critério de STEMI",
      "angina instável = isquemia sem nova lesão miocárdica aguda após investigação adequada",
      "bloqueio de ramo esquerdo novo, isolado, NÃO é diagnóstico de STEMI nem de infarto",
      "momento da estratégia invasiva no NSTEMI é definido pelo risco clínico (nem todo NSTEMI exige angiografia < 24 h)",
    ],
    errosGraves: [
      "aguardar o resultado da troponina para reperfundir um STEMI eletrocardiograficamente diagnóstico",
      "tratar bloqueio de ramo esquerdo novo isolado como STEMI/infarto",
    ],
    fontes: [ACC, ESC, UDMI],
  },
  {
    id: "sca-04", tema: "SCA", risco: "medio",
    pergunta: "O que caracteriza o infarto agudo do miocárdio tipo 1?",
    obrigatorios: [
      "evento coronariano aterotrombótico agudo (ruptura ou erosão de placa → trombose)",
      "diagnóstico = elevação/queda de troponina com ≥1 valor > percentil 99 + ≥1 evidência de isquemia miocárdica aguda",
      "trombo coronariano documentado (angiografia/imagem/autópsia) é evidência etiológica, mas não é obrigatório em todos",
    ],
    errosGraves: [
      "exigir trombo documentado para todo IAM tipo 1",
      "dizer que troponina elevada isolada já caracteriza IAM tipo 1",
    ],
    fontes: [UDMI],
  },
  {
    id: "sca-05", tema: "SCA", risco: "medio",
    pergunta: "Como a ruptura e a erosão de placa aterosclerótica diferem?",
    obrigatorios: [
      "ruptura = descontinuidade da capa fibrosa, expondo o núcleo lipídico-necrótico trombogênico",
      "erosão = perda/dano do endotélio com capa fibrosa em geral íntegra; trombo se forma sobre a superfície erodida",
      "ambas podem causar IAM tipo 1",
      "diferenciação em geral exige imagem intracoronária (OCT); sintomas, ECG, troponina e angiografia convencional não distinguem com segurança",
      "identificar erosão não define isoladamente uma estratégia terapêutica única",
    ],
    errosGraves: ["afirmar que a erosão de placa impõe automaticamente uma única conduta (ex.: sempre conservador ou sempre stent)"],
    fontes: [UDMI],
  },
  {
    id: "sca-06", tema: "SCA", risco: "medio",
    pergunta: "Qual é o papel da ativação plaquetária e da geração de trombina na SCA aterotrombótica?",
    obrigatorios: [
      "adesão, ativação e agregação plaquetária (fator de von Willebrand, colágeno, GP IIb/IIIa, fibrinogênio)",
      "mediadores: ADP, tromboxano A₂, serotonina, trombina",
      "fator tecidual ativa a coagulação → trombina converte fibrinogênio em fibrina, amplifica e estabiliza o trombo",
      "fundamenta o uso de antiplaquetários + anticoagulantes na SCA aterotrombótica",
      "não aplicar automaticamente essas terapias a causas não aterotrombóticas de infarto/isquemia",
    ],
    errosGraves: ["aplicar o esquema antitrombótico da SCA aterotrombótica indiscriminadamente a causas não aterotrombóticas"],
    fontes: [UDMI, ACC, ESC],
  },
  {
    id: "sca-07", tema: "SCA", risco: "baixo",
    pergunta: "Quais fatores determinam se a trombose coronariana será completa, incompleta, persistente ou intermitente?",
    obrigatorios: [
      "processo dinâmico: carga/composição do trombo, ativação plaquetária, geração de trombina, equilíbrio coagulação-fibrinólise",
      "vasoconstrição, anatomia/calibre, estenose preexistente, fluxo residual, embolização distal, reperfusão espontânea, colaterais, antitrombótico",
      "o estado anatômico da artéria muda no tempo — não inferir de um único ECG, uma única troponina ou uma manifestação isolada",
    ],
    errosGraves: [],
    fontes: [UDMI, ESC],
  },
  {
    id: "sca-08", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "Por que a classificação STEMI/NSTEMI não determina com segurança o grau anatômico de oclusão coronariana?",
    obrigatorios: [
      "o ECG é método indireto e não visualiza a anatomia coronariana",
      "NSTEMI pode ter oclusão coronariana completa (circunflexa, território mal representado nas 12 derivações, reperfusão espontânea, colaterais, ausência de derivações posteriores/direitas)",
      "supra de ST pode ocorrer sem aterotrombose aguda (pericardite, Takotsubo, miocardite, repolarização precoce, aneurisma, distúrbios metabólicos)",
      "interpretar o ECG junto com clínica, registros seriados, troponina, eco e coronariografia",
    ],
    errosGraves: [
      "afirmar que o diagnóstico de NSTEMI exclui oclusão coronariana total",
      "equiparar todo supradesnível de ST a aterotrombose coronariana aguda",
    ],
    fontes: [UDMI, ACC, ESC],
  },
  {
    id: "sca-09", tema: "SCA", risco: "medio", sentinela: true,
    pergunta: "O que caracteriza o infarto agudo do miocárdio tipo 2?",
    obrigatorios: [
      "lesão miocárdica aguda isquêmica por desequilíbrio oferta/demanda, SEM aterotrombose coronariana aguda como mecanismo definidor",
      "pode coexistir aterosclerose (inclusive obstrutiva), desde que não seja o mecanismo agudo",
      "mecanismos: anemia grave, hipoxemia, hipotensão/choque, bradi/taquiarritmia, HAS grave; ou vasoespasmo/embolia/SCAD",
      "diagnóstico exige troponina dinâmica + evidência de isquemia + mecanismo intenso e temporalmente relacionado",
      "a simples coexistência de anemia/sepse/taquicardia/HAS/choque NÃO basta; sem evidência de isquemia = lesão miocárdica não isquêmica",
    ],
    errosGraves: ["diagnosticar IAM tipo 2 apenas pela coexistência de anemia/sepse/taquicardia/choque, sem evidência de isquemia"],
    fontes: [UDMI],
  },
  {
    id: "sca-10", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "Como diferenciar IAM tipo 2 de lesão miocárdica aguda não isquêmica?",
    obrigatorios: [
      "ambas têm troponina dinâmica com ≥1 valor > percentil 99",
      "a diferença central é a presença de evidência de isquemia miocárdica aguda + mecanismo causal compatível",
      "IAM tipo 2 exige isquemia + mecanismo de desequilíbrio + relação temporal + ausência de aterotrombose como causa principal",
      "lesão não isquêmica (miocardite, IC aguda, sepse, TEP, Takotsubo, trauma) = troponina sem evidência de isquemia",
      "ausência de alteração no ECG/eco não exclui isquemia; função renal altera a interpretação, mas não explica o padrão dinâmico",
    ],
    errosGraves: [
      "classificar como IAM tipo 2 sem qualquer evidência de isquemia",
      "tratar troponina elevada na sepse automaticamente como infarto",
    ],
    fontes: [UDMI],
  },
  {
    id: "sca-11", tema: "SCA", risco: "medio",
    pergunta: "Quais tipos e subtipos de infarto são definidos pela Quarta Definição Universal de Infarto do Miocárdio?",
    obrigatorios: [
      "tipo 1 (aterotrombose); tipo 2 (desequilíbrio oferta/demanda); tipo 3 (morte com isquemia antes de a troponina ficar disponível)",
      "tipo 4a (relacionado à ICP: > 5× percentil 99 + evidência adicional); 4b (trombose de stent); 4c (reestenose)",
      "tipo 5 (relacionado à CRM: > 10× percentil 99 + evidência adicional)",
      "elevação de troponina pós-procedimento não é automaticamente infarto — sem os critérios adicionais é lesão relacionada ao procedimento",
    ],
    errosGraves: ["classificar qualquer elevação de troponina após ICP/CRM como infarto sem os critérios adicionais (múltiplo do percentil 99 + evidência de nova isquemia/complicação)"],
    fontes: [UDMI],
  },
  {
    id: "sca-12", tema: "SCA", risco: "medio", sentinela: true,
    pergunta: "Como diferenciar lesão miocárdica aguda de lesão miocárdica crônica?",
    obrigatorios: [
      "lesão miocárdica = troponina > percentil 99 do ensaio utilizado",
      "aguda = padrão dinâmico (elevação e/ou queda) que excede a variação analítica e biológica",
      "crônica = troponina persistentemente elevada, mas relativamente estável (DRC, IC crônica, HVE, cardiomiopatia, doença estrutural)",
      "valores estáveis favorecem crônica, mas não excluem aguda (intervalo inadequado, fase de platô, sem valores prévios)",
      "não existe delta universal; não transferir cortes/deltas entre ensaios; não criar corte por sexo sem validação para o ensaio",
    ],
    errosGraves: [
      "aplicar um delta/corte de troponina universal a qualquer ensaio",
      "excluir lesão aguda só porque a troponina está 'estável', sem considerar intervalo/fase de platô",
    ],
    fontes: [UDMI],
  },
  {
    id: "sca-13", tema: "SCA", risco: "medio",
    pergunta: "Como diferenciar isquemia miocárdica, lesão miocárdica e infarto do miocárdio?",
    obrigatorios: [
      "isquemia = oferta de O₂ insuficiente para a demanda; pode ser reversível e não elevar a troponina",
      "lesão miocárdica = troponina > percentil 99 (demonstra dano, não a causa)",
      "infarto = lesão miocárdica AGUDA de causa ISQUÊMICA (troponina dinâmica + evidência de isquemia)",
      "nem toda isquemia gera lesão detectável; nem toda lesão é isquêmica; todo infarto é lesão aguda isquêmica",
    ],
    errosGraves: ["equiparar lesão miocárdica (troponina elevada) a infarto"],
    fontes: [UDMI],
  },
  {
    id: "sca-14", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "A elevação isolada da troponina cardíaca é suficiente para diagnosticar infarto agudo do miocárdio?",
    obrigatorios: [
      "NÃO — troponina > percentil 99 demonstra lesão, mas não determina etiologia, isquemia nem infarto",
      "infarto exige lesão aguda + ≥1 evidência de isquemia miocárdica aguda",
      "troponina pode subir em IC, miocardite, TEP, sepse, DRC, trauma cardíaco, Takotsubo, arritmias",
      "a magnitude da troponina não diferencia isoladamente IAM tipo 1, tipo 2, miocardite ou Takotsubo",
      "discordância persistente com o quadro → considerar interferência (anticorpos heterófilos, macrotroponina) com o laboratório",
    ],
    errosGraves: ["diagnosticar infarto apenas com troponina elevada, sem evidência de isquemia"],
    fontes: [UDMI],
  },
  {
    id: "sca-15", tema: "SCA", risco: "medio",
    pergunta: "Quais achados, associados à lesão miocárdica aguda, sustentam o diagnóstico de infarto do miocárdio?",
    obrigatorios: [
      "exige lesão aguda + ≥1 evidência de isquemia",
      "sintomas isquêmicos compatíveis; novas alterações isquêmicas no ECG (supra/infra de ST, alterações de T)",
      "ondas Q patológicas novas; nova perda de miocárdio viável ou nova alteração segmentar em padrão isquêmico",
      "trombo coronariano (angiografia/imagem/autópsia) = evidência etiológica de IAM tipo 1",
      "sintomas inespecíficos (sudorese/náusea/síncope) e alterações inespecíficas de T não bastam isoladamente",
    ],
    errosGraves: ["usar alterações inespecíficas de onda T isoladas como prova de isquemia aguda"],
    fontes: [UDMI],
  },
  {
    id: "sca-16", tema: "SCA", risco: "medio", sentinela: true,
    pergunta: "Qual é o papel das variações seriadas da troponina no diagnóstico de lesão miocárdica aguda?",
    obrigatorios: [
      "padrão dinâmico (elevação/queda) além da variação analítica/biológica sustenta lesão aguda",
      "valores estáveis favorecem crônica, mas não excluem aguda (coleta precoce, fase de platô, sem valores prévios)",
      "algoritmos 0/1 h ou 0/2 h só com hs-troponina validada para o ensaio, população apropriada e integração de clínica/ECG",
      "uma troponina inicial < percentil 99 NÃO exclui IAM precoce; padrão dinâmico demonstra lesão, mas não prova isquemia",
      "não existe delta universal; não transferir corte/delta entre ensaios",
    ],
    errosGraves: [
      "excluir IAM com uma única troponina inicial < percentil 99",
      "transferir o corte ou o delta de um ensaio para outro",
    ],
    fontes: [UDMI, ESC],
  },
  {
    id: "sca-17", tema: "SCA", risco: "medio", sentinela: true,
    pergunta: "A angina instável permanece uma entidade relevante na era da troponina de alta sensibilidade?",
    obrigatorios: [
      "sim, mas tornou-se menos frequente (muitos casos passaram a preencher NSTEMI com hs-troponina)",
      "considerar quando há isquemia clínica + ausência de nova lesão aguda após coletas seriadas adequadas",
      "uma troponina < percentil 99 não diagnostica angina instável, não exclui NSTEMI nem encerra a investigação",
      "não usar 'angina instável' como diagnóstico residual para toda dor torácica com troponina negativa",
    ],
    errosGraves: [
      "excluir NSTEMI ou encerrar a investigação com uma única troponina < percentil 99",
      "rotular como 'angina instável' qualquer dor torácica sem confirmar os critérios",
    ],
    fontes: [UDMI, ESC],
  },
  {
    id: "sca-18", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "O que é MINOCA e por que deve ser considerado um diagnóstico de trabalho?",
    obrigatorios: [
      "MINOCA = infarto do miocárdio com artérias coronárias não obstrutivas",
      "critérios: critérios formais de IAM + ausência de estenose ≥ 50% em qualquer grande artéria epicárdica + ausência de diagnóstico alternativo manifesto",
      "o limite de 50% é operacional/angiográfico e não identifica o mecanismo",
      "diagnóstico de trabalho → investigar etiologia (ruptura/erosão, trombose com lise, embolia, SCAD, vasoespasmo, microvascular)",
      "miocardite e Takotsubo simulam MINOCA e, quando confirmadas, deixam de ser MINOCA; ausência de obstrução não significa benignidade nem exclui isquemia",
    ],
    errosGraves: [
      "tratar MINOCA como etiologia definitiva ou condição benigna",
      "aplicar tratamento uniforme sem investigar o mecanismo",
    ],
    fontes: [MINOCA, UDMI],
  },
  {
    id: "sca-19", tema: "SCA", risco: "alto",
    pergunta: "Como deve ser investigado um paciente inicialmente classificado como MINOCA?",
    obrigatorios: [
      "confirmar critérios de infarto e rever a angiografia (SCAD, hematoma, trombo, embolia, fluxo lento, lesões intermediárias)",
      "ecocardiograma; ressonância cardíaca precoce (idealmente na 1ª semana) diferencia infarto, miocardite e Takotsubo",
      "OCT/IVUS para ruptura/erosão/trombo/dissecção — mas SELETIVO na suspeita de SCAD (risco de propagar a dissecção)",
      "avaliação funcional (acetilcolina/adenosina) após estabilização, em centro experiente",
      "investigar embolia e trombofilia de forma seletiva; tratar o mecanismo identificado",
    ],
    errosGraves: [
      "usar imagem intracoronária de rotina na suspeita de SCAD (risco de propagar a dissecção/hematoma)",
      "investigar trombofilia rotineiramente em todos os pacientes",
    ],
    fontes: [MINOCA, SCAD],
  },
  {
    id: "sca-20", tema: "SCA", risco: "medio",
    pergunta: "O que são ANOCA e INOCA e como se diferenciam de MINOCA?",
    obrigatorios: [
      "ANOCA = angina com coronárias não obstrutivas (mesmo sem isquemia objetiva demonstrada)",
      "INOCA = isquemia (sintomas/evidência objetiva) sem doença epicárdica obstrutiva significativa (microvascular/vasoespasmo)",
      "MINOCA exige critérios formais de INFARTO (lesão miocárdica aguda); INOCA não exige elevação de troponina",
      "ANOCA/INOCA costumam ser crônicos/recorrentes — não classificar automaticamente como SCA",
    ],
    errosGraves: [
      "classificar ANOCA/INOCA automaticamente como SCA",
      "atribuir infarto ao INOCA sem lesão miocárdica aguda",
    ],
    fontes: [MINOCA],
  },
  {
    id: "sca-21", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "O que é dissecção coronariana espontânea (SCAD) e como ela pode produzir uma síndrome coronariana aguda?",
    obrigatorios: [
      "separação não aterosclerótica, não traumática e não iatrogênica das camadas da parede, geralmente com hematoma intramural ± ruptura da íntima",
      "pode se apresentar como NSTEMI, STEMI, arritmia ventricular, choque cardiogênico ou morte súbita",
      "mais frequente em mulheres; associada a displasia fibromuscular, gestação/puerpério, estresse intenso",
      "OCT/IVUS demonstram, mas NÃO de rotina — a instrumentação pode propagar a dissecção/hematoma",
      "no paciente estável, sem isquemia/instabilidade, a estratégia conservadora costuma ser favorecida (ICP é tecnicamente difícil e arriscada)",
    ],
    errosGraves: [
      "indicar ICP ou imagem intracoronária de rotina na SCAD estável (risco de propagar a dissecção)",
      "tratar SCAD como aterotrombose com a conduta antitrombótica padrão da SCA",
    ],
    fontes: [SCAD, ACC],
  },
  {
    id: "sca-22", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "Como o vasoespasmo coronariano epicárdico pode produzir isquemia, arritmias ou infarto?",
    obrigatorios: [
      "constrição intensa e transitória de uma artéria epicárdica, com ou sem estenose relevante",
      "pode causar supra/infra de ST transitório, arritmias ventriculares, bradiarritmias, síncope, lesão e infarto",
      "desencadeantes: tabagismo, cocaína, anfetaminas, triptanos/derivados do ergot, frio, hiperventilação, estresse",
      "nem todo episódio é infarto — para infarto exige lesão aguda + evidência de isquemia",
      "testes provocativos só após estabilização, em centro experiente, com capacidade de reverter o espasmo e tratar arritmia/instabilidade",
    ],
    errosGraves: [
      "realizar teste provocativo sem estabilização e sem estrutura para reverter espasmo/arritmia",
      "classificar todo vasoespasmo como infarto",
    ],
    fontes: [ACC, ESC],
  },
  {
    id: "sca-23", tema: "SCA", risco: "medio",
    pergunta: "Qual é o papel da disfunção microvascular coronariana na isquemia sem doença coronariana obstrutiva?",
    obrigatorios: [
      "compromete a regulação do fluxo na microcirculação (redução da vasodilatação, disfunção endotelial, aumento da resistência, redução da reserva de fluxo)",
      "mecanismo importante de INOCA; pode coexistir em pacientes classificados como MINOCA (sem provar causalidade)",
      "angiografia convencional não avalia diretamente a microcirculação",
      "adenosina (reserva de fluxo/IMR) e acetilcolina (vasoespasmo epicárdico/microvascular) avaliam componentes distintos e NÃO são intercambiáveis",
      "ausência de doença obstrutiva não significa sintomas não cardíacos, condição benigna ou ausência de risco",
    ],
    errosGraves: [
      "concluir que a ausência de doença obstrutiva significa causa não cardíaca/benigna",
      "tratar adenosina e acetilcolina como intercambiáveis",
    ],
    fontes: [MINOCA],
  },
  {
    id: "sca-24", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "Como deve ser avaliado um paciente com dor torácica, elevação dinâmica da troponina e coronariografia sem estenose coronariana obstrutiva?",
    obrigatorios: [
      "troponina dinâmica com ≥1 valor > percentil 99 demonstra lesão aguda; só é infarto se houver evidência de isquemia",
      "MINOCA exige critérios de infarto + ausência de estenose ≥ 50% + ausência de diagnóstico alternativo manifesto",
      "abordagem sistemática: confirmar lesão aguda → confirmar isquemia → rever angiografia → eco → RM precoce → OCT/IVUS (seletivo na SCAD) → função microvascular/vasoespasmo → embolia/trombofilia seletivas",
      "direcionar o tratamento ao mecanismo identificado; registrar a incerteza quando o mecanismo for indeterminado",
      "NÃO prescrever dupla antiagregação automaticamente a todo MINOCA/erosão/troponina elevada com coronárias não obstrutivas",
    ],
    errosGraves: [
      "prescrever dupla antiagregação automaticamente a todo paciente com MINOCA",
      "registrar MINOCA como se fosse uma etiologia definitiva",
    ],
    fontes: [MINOCA, UDMI],
  },

  // ————— MÓDULO II — Epidemiologia e fatores de risco (Q21–Q31 do banco autoral) —————
  {
    id: "sca-25", tema: "SCA", risco: "medio",
    pergunta: "Quais são os principais fatores de risco modificáveis ou parcialmente modificáveis para doença arterial coronariana?",
    obrigatorios: [
      "tabagismo/exposição ao tabaco, hipertensão, dislipidemia aterogênica (LDL/não-HDL/ApoB), inatividade física, alimentação não saudável e excesso de peso",
      "diabetes é fator PARCIALMENTE modificável (o diagnóstico não é reversível, mas o risco/controle sim)",
      "a ausência de fatores tradicionais NÃO exclui SCA",
      "separar fatores de risco de critérios diagnósticos",
    ],
    errosGraves: [
      "incluir idade, sexo ou história familiar entre os fatores modificáveis",
      "afirmar que a ausência de fatores exclui doença coronariana",
      "prescrever consumo de álcool para prevenção cardiovascular",
    ],
    fontes: [CCD, ACC],
  },
  {
    id: "sca-26", tema: "SCA", risco: "medio",
    pergunta: "Quais são os principais fatores de risco não modificáveis e como devem ser interpretados?",
    obrigatorios: [
      "idade, história familiar de DCV aterosclerótica prematura e predisposição genética (hipercolesterolemia familiar, Lp(a) elevada)",
      "sexo biológico pode modificar incidência/momento, mas NÃO deve excluir doença em mulheres",
      "fatores não modificáveis orientam a intensidade da prevenção, não diagnosticam SCA",
      "evitar interpretação determinística de raça/ancestralidade",
    ],
    errosGraves: [
      "afirmar que mulheres em idade fértil não apresentam SCA",
      "considerar história familiar irrelevante",
      "confundir hipercolesterolemia familiar com dieta rica em gordura",
      "misturar trombofilia e aterosclerose como se fossem o mesmo mecanismo",
    ],
    fontes: [CCD, ESC],
  },
  {
    id: "sca-27", tema: "SCA", risco: "medio",
    pergunta: "Como o diabetes mellitus modifica a apresentação e o prognóstico da síndrome coronariana aguda?",
    obrigatorios: [
      "maior risco aterosclerótico, doença mais difusa/multiarterial e pior prognóstico",
      "dor torácica típica continua possível; pode haver sintomas menos reconhecidos ou isquemia silenciosa",
      "manter ECG + troponina seriada",
      "no controle glicêmico agudo, EVITAR hipoglicemia (e hiperglicemia importante)",
    ],
    errosGraves: [
      "afirmar que o IAM no diabético é sempre indolor",
      "atribuir toda troponina elevada ao diabetes",
      "atrasar a investigação por ausência de dor típica",
      "fazer controle glicêmico excessivamente intensivo com risco de hipoglicemia",
    ],
    fontes: [ACC, ESC],
  },
  {
    id: "sca-28", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "Como a doença renal crônica influencia o risco, a apresentação e a investigação da síndrome coronariana aguda?",
    obrigatorios: [
      "DRC aumenta acentuadamente o risco CV e pode dar apresentações menos específicas",
      "troponina pode estar cronicamente > percentil 99 = lesão miocárdica real, NÃO 'falso-positivo renal'",
      "IAM exige elevação/queda de troponina + evidência de isquemia; não existe delta universal",
      "ajustar doses à função renal; NÃO negar angiografia/reperfusão apenas pela creatinina",
    ],
    errosGraves: [
      "descartar a troponina como 'falso-positivo renal'",
      "diagnosticar IAM só por troponina elevada, ou excluir IAM atribuindo o resultado à DRC",
      "usar doses plenas de fármacos de eliminação renal sem ajuste",
      "negar coronariografia unicamente pela função renal",
    ],
    fontes: [KDIGO, ACC],
  },
  {
    id: "sca-29", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "Como o sexo feminino influencia a apresentação clínica e o reconhecimento da síndrome coronariana aguda?",
    obrigatorios: [
      "mulheres podem apresentar dor torácica típica; avaliar com a MESMA prontidão e critérios de risco",
      "reconhecer maior risco de atraso e subdiagnóstico",
      "maior frequência relativa de SCAD e MINOCA",
      "manter investigação e urgência equivalentes (não reduzir pela variável sexo)",
    ],
    errosGraves: [
      "afirmar que mulheres geralmente não têm dor torácica",
      "atribuir os sintomas à ansiedade sem avaliação adequada",
      "considerar a mulher jovem protegida contra IAM ou reduzir a urgência diagnóstica pelo sexo",
      "presumir que toda SCA feminina é não obstrutiva",
      "classificar Takotsubo como IAM/SCA sem evidência de isquemia coronariana aguda",
    ],
    fontes: [ACC, ESC],
  },
  {
    id: "sca-30", tema: "SCA", risco: "medio",
    pergunta: "Como a idade avançada e a fragilidade modificam a apresentação, o prognóstico e o tratamento da síndrome coronariana aguda?",
    obrigatorios: [
      "maior carga aterosclerótica, comorbidades e risco (choque, IC, sangramento, injúria renal); pior prognóstico",
      "apresentações sem dor ou menos específicas (dispneia, síncope, confusão, queda, deterioração funcional)",
      "diferenciar idade cronológica de fragilidade; individualizar por risco, função e objetivos de cuidado",
      "NÃO negar terapia potencialmente benéfica (reperfusão/angiografia) apenas pela idade",
    ],
    errosGraves: [
      "tratar todo idoso como frágil",
      "negar reperfusão ou angiografia apenas pela idade cronológica",
      "ignorar peso e função renal no ajuste de doses",
    ],
    fontes: [ACC, ESC],
  },
  {
    id: "sca-31", tema: "SCA", risco: "baixo",
    pergunta: "Qual é a relação entre tabagismo e trombose coronariana?",
    obrigatorios: [
      "acelera aterosclerose e favorece eventos agudos (disfunção endotelial, inflamação, ativação plaquetária, estado pró-trombótico, vasoconstrição, CO reduzindo a oferta de O₂)",
      "o risco existe com exposição passiva e não se limita a grandes cargas",
      "a cessação completa reduz o risco e integra a prevenção secundária",
    ],
    errosGraves: [
      "afirmar efeito protetor do tabagismo após IAM ('paradoxo do fumante')",
      "limitar o risco a fumantes pesados ou considerar a exposição passiva irrelevante",
      "declarar cigarros eletrônicos comprovadamente seguros",
    ],
    fontes: [CCD, ACC],
  },
  {
    id: "sca-32", tema: "SCA", risco: "medio",
    pergunta: "Quais drogas recreativas podem precipitar isquemia miocárdica ou infarto, e qual é a hierarquia da evidência?",
    obrigatorios: [
      "cocaína, anfetaminas e metanfetamina têm a associação aguda mais direta (simpaticomiméticos: vasoespasmo, trombose, dissecção, arritmias, ↑demanda)",
      "cannabis: associação observacional, causalidade/magnitude incertas; opioides: lesão sobretudo por hipóxia/hipotensão/adulterantes",
      "separar associação direta de relações possíveis/indiretas",
      "obter história sem julgamento e manter ECG/troponina quando indicados",
    ],
    errosGraves: [
      "dar o mesmo peso causal a todas as substâncias",
      "limitar o mecanismo a vasoespasmo",
      "dispensar a investigação pela idade jovem",
      "atribuir toda troponina elevada a IAM tipo 1",
    ],
    fontes: [COCAINA, ACC],
  },
  {
    id: "sca-33", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "Como cocaína e anfetaminas podem provocar uma síndrome coronariana aguda, e como conduzir a intoxicação aguda?",
    obrigatorios: [
      "aumento simpático (FC, PA, contratilidade, demanda) + vasoconstrição/vasoespasmo, ativação plaquetária/trombose, dissecção, arritmias e toxicidade miocárdica",
      "pode ser IAM tipo 1, IAM tipo 2, vasoespasmo sem infarto ou lesão não isquêmica — não presumir mecanismo único",
      "na intoxicação aguda: suporte, controle da agitação/hiperatividade simpática (benzodiazepínico titulado) e vasodilatação quando indicada",
      "NÃO administrar betabloqueador puramente beta-adrenérgico de rotina na toxicidade simpaticomimética aguda; avaliar síndrome aórtica aguda",
    ],
    errosGraves: [
      "atribuir tudo a vasoespasmo ou classificar automaticamente como IAM tipo 1",
      "administrar fibrinolítico sem critérios e sem considerar dissecção de aorta",
      "afirmar que betabloqueadores são sempre obrigatórios ou sempre proibidos",
      "omitir a avaliação de síndrome aórtica aguda diante de sinais de alerta (déficit de pulso, assimetria pressórica)",
    ],
    fontes: [COCAINA, ACC],
  },
  {
    id: "sca-34", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "Quais condições inflamatórias ou infecciosas aumentam o risco de eventos coronarianos e como interpretar a troponina nesses cenários?",
    obrigatorios: [
      "infecções agudas (influenza, COVID-19, pneumonia, sepse) e inflamatórias crônicas aumentam o risco (inflamação, trombose, instabilização de placa, hipóxia, desequilíbrio oferta-demanda)",
      "troponina elevada pode ser IAM tipo 1, tipo 2 ou lesão não isquêmica; 'infarto' exige evidência de isquemia",
      "sepse/infecção NÃO classifica automaticamente o evento como IAM tipo 2, nem exclui SCA aterotrombótica concomitante",
      "não usar troponina isolada para indicar antitrombóticos",
    ],
    errosGraves: [
      "chamar toda troponina elevada na sepse de NSTEMI",
      "ignorar IAM tipo 1 concomitante",
      "prescrever dupla antiagregação ou anticoagulação apenas pela troponina",
      "transformar associação epidemiológica em causalidade individual",
    ],
    fontes: [ACC, UDMI],
  },
  {
    id: "sca-35", tema: "SCA", risco: "alto", sentinela: true,
    pergunta: "Como gestação e puerpério modificam o risco, os mecanismos, os diagnósticos diferenciais e a investigação da síndrome coronariana aguda?",
    obrigatorios: [
      "IAM associado à gestação é raro mas grave; SCAD é mecanismo particularmente relevante (peri/pós-parto), além de aterotrombose, trombose/embolia, vasoespasmo e desequilíbrio oferta-demanda",
      "ECG + troponina SEM atraso; a troponina não é fisiologicamente elevada apenas pela gestação",
      "diferenciais: embolia pulmonar, síndrome aórtica aguda, miocardite e Takotsubo",
      "NÃO negar angiografia/reperfusão necessária apenas pela gestação; priorizar estabilização materna + abordagem multidisciplinar",
    ],
    errosGraves: [
      "atribuir a dor torácica automaticamente a causas gestacionais benignas ou excluir IAM pela idade jovem",
      "presumir que toda SCA gestacional é SCAD",
      "adiar reperfusão/angiografia necessária apenas pela gestação",
      "ignorar embolia pulmonar ou síndrome aórtica aguda",
    ],
    fontes: [ACC, ESCPREG],
  },
];
