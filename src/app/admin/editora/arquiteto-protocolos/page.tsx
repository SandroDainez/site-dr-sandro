import Link from "next/link";
import { listarProtocolos } from "./actions";
import AdminHelp from "@/components/admin/AdminHelp";
import ModuloResumo from "@/components/admin/ModuloResumo";
import ArquitetoProtocolos from "./ArquitetoProtocolos";
import { aiMode } from "@/lib/ai/config";

export const dynamic = "force-dynamic";
// Geração por bloco (invocações separadas) + revisão (1 chamada), cada uma bem abaixo
// do teto. Alinhado ao default de 300s da Vercel para não estourar em fontes grandes.
export const maxDuration = 300;

export default async function ArquitetoProtocolosPage() {
  const res = await listarProtocolos();
  const protocolos = res.ok ? res.data : [];
  const modo = aiMode(); // "mock" | "real"

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/editora" className="text-xs text-muted hover:text-white transition">← Editora Médica</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Arquiteto de Protocolos {modo === "real"
          ? <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-accent">DeepSeek + GPT-4o</span>
          : <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-400">piloto · mock</span>}</h1>
        <p className="mt-1 text-sm text-white/50">
          Gera um protocolo institucional a partir das <strong className="text-white/70">fontes que você cola</strong>,
          seção por seção (em blocos), com <strong className="text-white/70">validação de citações</strong> e um índice
          de confiança calculado pelo código. {modo === "real"
            ? <>Geração com <strong className="text-white/70">DeepSeek</strong> e revisão com <strong className="text-white/70">GPT-4o</strong>.</>
            : <>Nesta fase a IA é <strong className="text-white/70">simulada (mock)</strong> — defina <code className="text-white/70">AI_PROVIDER=real</code> para usar os modelos reais.</>}
        </p>
      </div>

      <ModuloResumo slug="arquiteto-protocolos" />


      <AdminHelp>
        1) Escolha ou crie um protocolo. 2) Cole as <strong className="text-white/85">fontes</strong> (guideline, artigo,
        livro, consenso) com seus metadados. 3) Escolha a área. 4) Clique em <strong className="text-white/85">Gerar</strong> —
        acompanhe os blocos. 5) Revise/edite e <strong className="text-white/85">salve como versão</strong>. A confiança e o
        método aparecem no fim (afirmações clínicas com citação validada ÷ total).
      </AdminHelp>

      <ArquitetoProtocolos protocolosIniciais={protocolos} modo={modo} />
    </div>
  );
}
