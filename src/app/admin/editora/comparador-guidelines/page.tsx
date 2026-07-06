import Link from "next/link";
import { listarDocs } from "./actions";
import AdminHelp from "@/components/admin/AdminHelp";
import ComparadorGuidelines from "./ComparadorGuidelines";
import { aiMode } from "@/lib/ai/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function ComparadorGuidelinesPage() {
  const res = await listarDocs();
  const docs = res.ok ? res.data : [];
  const modo = aiMode();

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/editora" className="text-xs text-muted hover:text-white transition">← Editora Médica</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Comparador de Guidelines {modo === "real"
          ? <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-accent">DeepSeek + GPT-4o</span>
          : <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-400">piloto · mock</span>}</h1>
        <p className="mt-1 text-sm text-white/50">
          Busca <strong className="text-white/70">diretrizes/fontes</strong> na <strong className="text-white/70">biblioteca interna</strong> e no
          <strong className="text-white/70"> PubMed</strong> sobre um tema e monta uma <strong className="text-white/70">comparação por aspectos</strong>
          (concordâncias e divergências), com citações validadas e confiança calculada pelo código. {modo === "real"
            ? <>Geração <strong className="text-white/70">DeepSeek</strong> + revisão <strong className="text-white/70">GPT-4o</strong>.</>
            : <>Nesta fase a IA é <strong className="text-white/70">simulada (mock)</strong> — defina <code className="text-white/70">AI_PROVIDER=real</code> para os modelos reais.</>}
        </p>
      </div>

      <AdminHelp>
        1) Informe um <strong className="text-white/85">tema</strong> e a área. 2) Clique em <strong className="text-white/85">Buscar e comparar</strong>
        — busca biblioteca interna + PubMed e monta a tabela comparativa. 3) <strong className="text-white/85">Revise</strong> e salve.
        4) Publique em /comparativos.
      </AdminHelp>

      <ComparadorGuidelines docsIniciais={docs} modo={modo} />
    </div>
  );
}
