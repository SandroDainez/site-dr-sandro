import Link from "next/link";
import { listarDocs } from "./actions";
import AdminHelp from "@/components/admin/AdminHelp";
import ModuloResumo from "@/components/admin/ModuloResumo";
import EditorPremium from "./EditorPremium";
import { aiMode } from "@/lib/ai/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function EditorPremiumPage() {
  const res = await listarDocs();
  const docs = res.ok ? res.data : [];
  const modo = aiMode(); // "mock" | "real"

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/editora" className="text-xs text-muted hover:text-white transition">← Editora Médica</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Editor Premium {modo === "real"
          ? <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-accent">DeepSeek + GPT-4o</span>
          : <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-400">piloto · mock</span>}</h1>
        <p className="mt-1 text-sm text-white/50">
          Recebe um <strong className="text-white/70">rascunho</strong> + as <strong className="text-white/70">referências</strong> e o
          <strong className="text-white/70"> refina</strong> (mais densidade e melhor forma), mantendo cada afirmação ancorada nas fontes,
          com validação de citações e confiança calculada pelo código. {modo === "real"
            ? <>Refinamento com <strong className="text-white/70">DeepSeek</strong> e revisão com <strong className="text-white/70">GPT-4o</strong>.</>
            : <>Nesta fase a IA é <strong className="text-white/70">simulada (mock)</strong> — defina <code className="text-white/70">AI_PROVIDER=real</code> para usar os modelos reais.</>}
        </p>
      </div>

      <ModuloResumo slug="editor-premium" />


      <AdminHelp>
        1) Crie/abra um texto na biblioteca. 2) Cole as <strong className="text-white/85">referências</strong>. 3) Cole o
        <strong className="text-white/85"> rascunho</strong> a refinar. 4) Clique em <strong className="text-white/85">Refinar</strong>.
        5) Revise/edite, rode a <strong className="text-white/85">revisão</strong> e <strong className="text-white/85">salve</strong>.
        6) Publique quando quiser — vai para /biblioteca-cientifica (mesma biblioteca do Editor Científico).
      </AdminHelp>

      <EditorPremium docsIniciais={docs} modo={modo} />
    </div>
  );
}
