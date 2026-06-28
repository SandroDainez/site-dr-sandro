import OpenAI from "openai";

// Embeddings p/ o RAG (assistente clínico). Modelo barato e bom: text-embedding-3-small (1536 dims).
export async function embedTextos(textos: string[]): Promise<number[][]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const out: number[][] = [];
  // lotes de 96 p/ não estourar o limite
  for (let i = 0; i < textos.length; i += 96) {
    const lote = textos.slice(i, i + 96).map((t) => t.slice(0, 8000));
    const r = await openai.embeddings.create({ model: "text-embedding-3-small", input: lote });
    for (const d of r.data) out.push(d.embedding as number[]);
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
