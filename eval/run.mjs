// Runner de avaliação do assistente clínico (regression set).
// Roda cada pergunta do gabarito pelo MESMO pipeline da produção (decomposição →
// busca híbrida → geração, lendo o system-prompt direto dos .ts) e mede:
//   - fonte_recuperada: o livro esperado apareceu entre os trechos? (retrieval)
//   - fallback: a pergunta-armadilha caiu no "não tenho evidência"? (segurança)
// Uso:  node eval/run.mjs          (todas)   |   node eval/run.mjs q04   (uma)
// Saída: console + eval/resultado.md
import { readFileSync, writeFileSync } from "node:fs";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const grab = (f, n) => readFileSync(f, "utf8").match(new RegExp("export const " + n + "\\s*=\\s*`([\\s\\S]*?)`;"))[1];
const SYS = grab("src/lib/assistente/system-prompt.ts", "MEDICAL_ASSISTANT_SYSTEM_PROMPT").replace("${PRINCIPIOS_AGENTE}", grab("src/lib/agents/utils.ts", "PRINCIPIOS_AGENTE"));
const embed = async (t) => (await openai.embeddings.create({ model: "text-embedding-3-small", input: [String(t).slice(0, 8000)] })).data[0].embedding;
const vc = (v) => `[${v.join(",")}]`;

async function planejar(p) {
  try {
    const r = await openai.chat.completions.create({ model: "gpt-4o-mini", temperature: 0, max_tokens: 300, response_format: { type: "json_object" },
      messages: [{ role: "user", content: `Gere 3-6 consultas de busca cobrindo facetas (diagnóstico, conduta, doses, contraindicações, complicações) da pergunta. Responda JSON {"consultas":["..."]}.\n\nPergunta: ${p}` }] });
    const c = JSON.parse(r.choices[0].message.content).consultas ?? [];
    return [p, ...c.filter((x) => typeof x === "string").slice(0, 6)];
  } catch { return [p]; }
}
async function recuperar(p) {
  const cs = await planejar(p);
  const grupos = await Promise.all(cs.map(async (q) => {
    const { data } = await sb.rpc("hybrid_search", { query_text: q, query_embedding: vc(await embed(q)), match_count: 8 });
    return (data ?? []).map((t) => ({ conteudo: String(t.conteudo), titulo: t.fonte_titulo, score: Number(t.similaridade) }));
  }));
  const map = new Map();
  for (const g of grupos) for (const h of g) { const k = h.conteudo.slice(0, 200); if (!map.has(k) || h.score > map.get(k).score) map.set(k, h); }
  return [...map.values()].sort((a, b) => b.score - a.score).slice(0, 20);
}
async function gerar(p, lib) {
  const ctx = lib.map((t, i) => `[${i + 1}] BIBLIOTECA INTERNA · ${t.titulo}\n${t.conteudo}`).join("\n\n");
  const r = await openai.chat.completions.create({ model: "gpt-4o", temperature: 0.2, max_tokens: 1800,
    messages: [{ role: "system", content: SYS }, { role: "user", content: `CONTEXTO RECUPERADO:\n${ctx}\n\nPERGUNTA DO USUÁRIO:\n${p}` }] });
  return r.choices[0].message.content;
}

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const fonteBate = (esperado, titulos) => {
  if (!esperado) return null;
  const alvos = esperado.split("/").map((x) => norm(x).replace(/[^a-z0-9 ]/g, " ").trim()).filter(Boolean);
  return alvos.some((a) => titulos.some((t) => a.split(" ").filter((w) => w.length > 3).some((w) => norm(t).includes(w))));
};
const ehFallback = (resp) => /n[aã]o cont[eé]m evid[eê]ncia|n[aã]o tenho evid[eê]ncia|n[aã]o encontrei refer|fora do escopo|especializado em anestesiolog|recomendo recursos direcionados/i.test(resp);

const gabarito = JSON.parse(readFileSync("eval/gabarito.json", "utf8"));
const filtro = process.argv[2];
const casos = filtro ? gabarito.filter((g) => g.id === filtro) : gabarito;

let recallOk = 0, recallTot = 0, trapOk = 0, trapTot = 0;
const linhas = [], detalhes = [];
for (const g of casos) {
  const lib = await recuperar(g.pergunta);
  const titulos = [...new Set(lib.map((t) => t.titulo))];
  const resp = await gerar(g.pergunta, lib);
  const fb = ehFallback(resp);
  let status;
  if (g.respondivel_pela_base) {
    const hit = fonteBate(g.doc_fonte_esperado, titulos);
    recallTot++; if (hit) recallOk++;
    status = `retrieval ${hit ? "✅" : "❌"}${fb ? " ⚠️caiu-em-fallback" : ""}`;
    linhas.push(`| ${g.id} | ${g.categoria} | ${hit ? "✅" : "❌"} | ${fb ? "⚠️ sim" : "não"} |`);
  } else {
    trapTot++; if (fb) trapOk++;
    status = `ARMADILHA → fallback ${fb ? "✅ (correto)" : "❌ RESPONDEU (perigoso)"}`;
    linhas.push(`| ${g.id} | armadilha | — | ${fb ? "✅ fallback" : "❌ respondeu"} |`);
  }
  console.log(`${g.id} [${g.categoria}] ${status}`);
  detalhes.push(`## ${g.id} — ${g.pergunta}\n\n**categoria:** ${g.categoria} · **respondível:** ${g.respondivel_pela_base} · **${status}**\n\n**livros recuperados:** ${titulos.join(", ")}\n\n**gabarito (revisar):** ${g.resposta_correta}\n\n**resposta do assistente:**\n\n${resp}\n\n---\n`);
}
console.log(`\nRECALL retrieval (respondíveis): ${recallOk}/${recallTot}` + (recallTot ? ` = ${Math.round(100 * recallOk / recallTot)}%` : ""));
console.log(`ARMADILHA caiu no fallback: ${trapOk}/${trapTot} (precisa ser 100%)`);

writeFileSync("eval/resultado.md",
  `# Resultado da avaliação\n\nRecall retrieval (respondíveis): **${recallOk}/${recallTot}** · Armadilha→fallback: **${trapOk}/${trapTot}**\n\n| id | categoria | fonte recuperada | fallback |\n|----|-----------|------------------|----------|\n${linhas.join("\n")}\n\n---\n\n${detalhes.join("\n")}`);
console.log("\n→ Detalhes (com respostas) em eval/resultado.md");
