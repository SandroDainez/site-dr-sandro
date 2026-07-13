// Finalidade de um aplicativo (pra que serve) — eixo de organização da seção de apps
// na home. Ortogonal ao acesso (grátis × assinatura) e à área (especialidade).

export type Finalidade = "decisao" | "estudo" | "gestao" | "utilidade";

export const FINALIDADES: { valor: Finalidade; label: string; sub: string }[] = [
  { valor: "decisao", label: "Decisão clínica", sub: "Apoio à beira do leito e na emergência." },
  { valor: "estudo", label: "Estudo e preparação", sub: "Residência, título e atualização." },
  { valor: "gestao", label: "Gestão e equipes", sub: "Escalas, plantões e organização da equipe." },
  { valor: "utilidade", label: "Utilidades do dia a dia", sub: "Ferramentas gerais e de produtividade." },
];

export const FINALIDADE_LABEL: Record<Finalidade, string> = {
  decisao: "Decisão clínica", estudo: "Estudo", gestao: "Gestão", utilidade: "Utilidade",
};

function ehFinalidade(v: unknown): v is Finalidade {
  return v === "decisao" || v === "estudo" || v === "gestao" || v === "utilidade";
}

// Deduz a finalidade a partir do texto do app (título/subtítulo/descrição). Usado como
// FALLBACK quando o campo "finalidade" ainda não foi marcado no admin — assim os apps já
// caem no grupo certo sem re-marcar tudo à mão.
export function inferFinalidade(texto: string): Finalidade {
  const t = (texto || "").toLowerCase();
  if (/escala|plant[ãa]o|equipe|gest[ãa]o|cobertura assistencial/.test(t)) return "gestao";
  if (/estud|study|resid[êe]ncia|t[íi]tulo|prova|quest[õo]es|flashcard|simulad|anesmap|prepara/.test(t)) return "estudo";
  if (/acls|pcr|protocolo|dose|c[áa]lcul|decis[ãa]o|emerg[êe]ncia|gasometria|escore|beira do leito/.test(t)) return "decisao";
  return "decisao";
}

// Finalidade efetiva: usa a marcada; se ausente, infere pelos textos fornecidos.
export function finalidadeEfetiva(marcada: unknown, ...textos: (string | undefined)[]): Finalidade {
  if (ehFinalidade(marcada)) return marcada;
  return inferFinalidade(textos.filter(Boolean).join(" "));
}
