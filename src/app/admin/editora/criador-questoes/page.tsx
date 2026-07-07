import Link from "next/link";
import { listarDocs } from "./actions";
import AdminHelp from "@/components/admin/AdminHelp";
import ModuloResumo from "@/components/admin/ModuloResumo";
import CriadorQuestoes from "./CriadorQuestoes";
import { aiMode } from "@/lib/ai/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function CriadorQuestoesPage() {
  const res = await listarDocs();
  const docs = res.ok ? res.data : [];
  const modo = aiMode(); // "mock" | "real"

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/editora" className="text-xs text-muted hover:text-white transition">← Editora Médica</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Criador de Questões {modo === "real"
          ? <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-accent">DeepSeek + GPT-4o</span>
          : <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-400">piloto · mock</span>}</h1>
        <p className="mt-1 text-sm text-white/50">
          Cria <strong className="text-white/70">questões de múltipla escolha</strong> (enunciado, alternativas, gabarito e justificativa
          citada) a partir das <strong className="text-white/70">referências</strong>. Sempre com <strong className="text-white/70">2 estágios</strong>
          (a correção do gabarito é crítica) e confiança calculada pelo código. {modo === "real"
            ? <>Geração <strong className="text-white/70">DeepSeek</strong> + revisão <strong className="text-white/70">GPT-4o</strong>.</>
            : <>Nesta fase a IA é <strong className="text-white/70">simulada (mock)</strong> — defina <code className="text-white/70">AI_PROVIDER=real</code> para os modelos reais.</>}
        </p>
      </div>

      <ModuloResumo slug="criador-questoes" />


      <AdminHelp>
        1) Crie/abra um conjunto. 2) Cole as <strong className="text-white/85">referências</strong>. 3) Escolha área, nível e nº e
        <strong className="text-white/85"> gere</strong>. 4) <strong className="text-white/85">Revise</strong> (confere o gabarito) e salve.
        5) Publique — mostra em /questoes e <strong className="text-white/85">entra no quiz</strong> do /estudar.
      </AdminHelp>

      <CriadorQuestoes docsIniciais={docs} modo={modo} />
    </div>
  );
}
