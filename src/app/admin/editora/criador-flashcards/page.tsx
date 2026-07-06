import Link from "next/link";
import { listarDocs } from "./actions";
import AdminHelp from "@/components/admin/AdminHelp";
import CriadorFlashcards from "./CriadorFlashcards";
import { aiMode } from "@/lib/ai/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function CriadorFlashcardsPage() {
  const res = await listarDocs();
  const docs = res.ok ? res.data : [];
  const modo = aiMode(); // "mock" | "real"

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/editora" className="text-xs text-muted hover:text-white transition">← Editora Médica</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Criador de Flashcards {modo === "real"
          ? <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-accent">DeepSeek + GPT-4o</span>
          : <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-400">piloto · mock</span>}</h1>
        <p className="mt-1 text-sm text-white/50">
          Gera <strong className="text-white/70">flashcards</strong> (frente/verso) fundamentados nas <strong className="text-white/70">referências</strong>,
          com validação de citações e confiança calculada pelo código. {modo === "real"
            ? <>Geração com <strong className="text-white/70">DeepSeek</strong> e revisão com <strong className="text-white/70">GPT-4o</strong>.</>
            : <>Nesta fase a IA é <strong className="text-white/70">simulada (mock)</strong> — defina <code className="text-white/70">AI_PROVIDER=real</code> para usar os modelos reais.</>}
        </p>
      </div>

      <AdminHelp>
        1) Crie/abra um baralho. 2) Cole as <strong className="text-white/85">referências</strong>. 3) Escolha a área e o
        <strong className="text-white/85"> nº de cartões</strong> e clique em <strong className="text-white/85">Gerar</strong>.
        4) Revise/edite o verso, rode a <strong className="text-white/85">revisão</strong> e <strong className="text-white/85">salve</strong>.
        5) Publique quando quiser — vai para /flashcards.
      </AdminHelp>

      <CriadorFlashcards docsIniciais={docs} modo={modo} />
    </div>
  );
}
