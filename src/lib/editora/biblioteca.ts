import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Afirmacao, SecaoGerada } from "@/lib/ai/types";
import type { QuestaoGerada } from "@/lib/editora/questao-estrutura";

// Biblioteca da Editora ("banco 2") — chamada pelo publicarDoc de CADA um dos 7 pares
// doc/versão sempre que algo é publicado/despublicado. Ver supabase/migrations/011_biblioteca_editora.sql.
// Extrai um texto único e limpo do content JSON (formato varia: secoes-based nos 6 módulos
// "de texto", questoes-based no Criador de Questões) e faz upsert/delete na tabela.

// Mesma lógica de textoSecao() duplicada em cada page.tsx público (prioriza edição manual).
function textoDaSecao(sec: SecaoGerada, textoEditado?: Record<string, string>): string {
  if (textoEditado?.[sec.secao]) return textoEditado[sec.secao];
  return sec.afirmacoes.map((a) => a.texto).join("\n");
}

export function textoConsolidadoDeSecoes(secoes: SecaoGerada[], textoEditado?: Record<string, string>): string {
  return (secoes ?? [])
    .map((s) => `${s.secao}\n${textoDaSecao(s, textoEditado)}`)
    .filter((t) => t.trim().length > 0)
    .join("\n\n");
}

export function textoConsolidadoDeQuestoes(questoes: QuestaoGerada[]): string {
  return (questoes ?? [])
    .map((q, i) => {
      const alt = q.opcoes.map((o, j) => `${String.fromCharCode(65 + j)}) ${o}`).join("\n");
      const gabarito = q.opcoes[q.correta] ?? "";
      const just = (q.justificativa ?? []).map((a: Afirmacao) => a.texto).join(" ");
      return `Questão ${i + 1}: ${q.enunciado}\n${alt}\nGabarito: ${gabarito}\nJustificativa: ${just}`;
    })
    .filter((t) => t.trim().length > 0)
    .join("\n\n");
}

export type SincronizarBibliotecaInput = {
  modulo: string;
  tabelaOrigem: string;
  docId: string;
  titulo: string;
  slug: string;
  urlPublica: string;
  especialidade: string;
  areas?: string[];
  texto: string;
};

// Upsert por (tabela_origem, doc_id) — republicar atualiza a mesma linha (unique constraint).
export async function sincronizarBiblioteca(supabase: SupabaseClient, input: SincronizarBibliotecaInput) {
  if (!input.texto.trim()) return; // nada de útil pra reaproveitar (ex.: doc vazio)
  await supabase.from("biblioteca_editora").upsert(
    {
      modulo: input.modulo,
      tabela_origem: input.tabelaOrigem,
      doc_id: input.docId,
      titulo: input.titulo,
      slug: input.slug,
      url_publica: input.urlPublica,
      especialidade: input.especialidade,
      areas: input.areas ?? [],
      texto: input.texto,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "tabela_origem,doc_id" },
  );
}

// Despublicar/arquivar/excluir tiram o item da Biblioteca (só o que está PUBLICADO entra —
// evita reaproveitar rascunho não revisado como fonte de outro trabalho).
export async function removerDaBiblioteca(supabase: SupabaseClient, tabelaOrigem: string, docId: string) {
  await supabase.from("biblioteca_editora").delete().eq("tabela_origem", tabelaOrigem).eq("doc_id", docId);
}
