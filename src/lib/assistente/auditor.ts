import { invariantesDisparados, invariantesFaltando, type Invariante } from "./safety-invariants";

// AUDITOR de segurança (STEP 4 do pipeline: interpreter → retriever → writer → AUDITOR).
// Depois que o writer produz a resposta, verifica de forma DETERMINÍSTICA (texto puro, SEM IA)
// que as ressalvas consagradas (safety-invariants.ts) não foram omitidas quando o tema apareceu.
// Prompt sozinho obedece ~2/3 das vezes; o auditor fecha a lacuna: regenera 1x com a regra
// obrigatória e, se ainda faltar, ANEXA o texto canônico (garantia final que NÃO depende de sorte).
// Só faz trabalho quando um tema de risco crítico dispara (senão retorna a resposta como está).

export type AuditResult = { resposta: string; regenerou: boolean; anexou: string[] };

// `regenerar` é injetado pelo orchestrator (mesma chamada do writer, com instrução extra) para
// não acoplar o auditor ao pipeline. Retorna a resposta corrigida.
export async function auditarResposta(
  pergunta: string,
  resposta: string,
  regenerar: (regras: Invariante[]) => Promise<string>,
): Promise<AuditResult> {
  const disparados = invariantesDisparados(pergunta, resposta);
  if (disparados.length === 0) return { resposta, regenerou: false, anexou: [] };

  let faltando = invariantesFaltando(disparados, resposta);
  if (faltando.length === 0) return { resposta, regenerou: false, anexou: [] };

  // 1) Regenera UMA vez com as regras que faltaram como obrigatórias (resposta integrada e limpa).
  let texto = resposta;
  let regenerou = false;
  try {
    const nova = (await regenerar(faltando)).trim();
    if (nova) {
      texto = nova;
      regenerou = true;
      faltando = invariantesFaltando(faltando, texto); // re-checa só as que faltavam
    }
  } catch {
    // Regeneração falhou → cai no backstop de anexar.
  }

  // 2) Backstop determinístico: o que AINDA faltar, anexa o texto canônico (garantia).
  const anexou: string[] = [];
  if (faltando.length > 0) {
    const blocos = faltando.map((i) => `- ${i.canonico}`).join("\n");
    texto = `${texto.trimEnd()}\n\n**⚠️ Ressalvas de segurança (não podem faltar):**\n${blocos}`;
    anexou.push(...faltando.map((i) => i.id));
  }

  return { resposta: texto, regenerou, anexou };
}
