// Validação PÓS-resposta: a última barreira anti-alucinação, no código (não confia só no prompt).

// Extrai PMIDs citados no texto (formatos "PMID: 12345678", "PMID 12345678").
export function extractPmids(texto: string): string[] {
  return [...texto.matchAll(/PMID:?\s*(\d{4,9})/gi)].map((m) => m[1]);
}

// Remove QUALQUER PMID citado que não esteja no conjunto realmente recuperado.
// Se o modelo "inventou" um PMID, ele é apagado (preferimos sem PMID a com PMID falso).
export function stripFabricatedPmids(texto: string, pmidsReais: Set<string>): { texto: string; removidos: string[] } {
  const removidos: string[] = [];
  const limpo = texto.replace(/\(?\s*PMID:?\s*(\d{4,9})\s*\)?/gi, (match, pmid) => {
    if (pmidsReais.has(pmid)) return match;
    removidos.push(pmid);
    return "[referência removida: PMID não verificado]";
  });
  return { texto: limpo, removidos };
}

// Heurística leve: a resposta tem cara de conteúdo clínico afirmativo?
function pareceClinico(texto: string): boolean {
  return /\b(dose|mg|mcg|µg|mL|protocolo|conduta|administr|infus|bolus|titul|ventila|sedaç|sedo|posolog)/i.test(texto);
}

export function temReferenciaOuAviso(texto: string, temFontes: boolean): boolean {
  if (temFontes) return true;
  // marcador do disclaimer de "conhecimento de treino"
  return /não encontrei refer[êe]ncia|baseado no meu treinamento|verifique fontes prim|guideline vigente|protocolo institucional/i.test(texto);
}

// Garante que resposta clínica sem fontes carregue o aviso. Se faltar, prefixa.
export function garantirDisclaimer(texto: string, temFontes: boolean): string {
  if (temFontes || !pareceClinico(texto)) return texto;
  if (temReferenciaOuAviso(texto, false)) return texto;
  return `⚠️ Não encontrei referência específica na biblioteca do portal nem no PubMed. O que segue é baseado em conhecimento geral e pode não refletir as diretrizes mais recentes — verifique fontes primárias.\n\n${texto}`;
}
