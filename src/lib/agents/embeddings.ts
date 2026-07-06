import { getOpenAI } from "@/lib/ai/openai";

// Embeddings p/ o RAG (assistente clínico). Modelo barato e bom: text-embedding-3-small (1536 dims).
export async function embedTextos(textos: string[]): Promise<number[][]> {
  const openai = getOpenAI();
  const out: number[][] = [];
  // lotes de 96 p/ não estourar o limite
  for (let i = 0; i < textos.length; i += 96) {
    const lote = textos.slice(i, i + 96).map((t) => t.slice(0, 8000));
    // RETRY com backoff: uma queda momentânea (rate limit/rede) não pode descartar
    // um livro inteiro. Tenta até 4x antes de desistir.
    let tent = 0;
    while (true) {
      try {
        const r = await openai.embeddings.create({ model: "text-embedding-3-small", input: lote });
        for (const d of r.data) out.push(d.embedding as number[]);
        break;
      } catch (e) {
        if (++tent >= 4) throw e;
        await new Promise((res) => setTimeout(res, 800 * tent));
      }
    }
  }
  return out;
}

export async function embedUm(texto: string): Promise<number[]> {
  return (await embedTextos([texto]))[0];
}

// pgvector aceita o array como string "[0.1,0.2,...]"
export function toVector(v: number[]): string {
  return `[${v.join(",")}]`;
}
