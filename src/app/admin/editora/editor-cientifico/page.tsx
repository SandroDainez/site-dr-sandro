import Link from "next/link";
import { listarDocs } from "./actions";
import AdminHelp from "@/components/admin/AdminHelp";
import ModuloResumo from "@/components/admin/ModuloResumo";
import QuandoUsar from "@/components/admin/QuandoUsar";
import EditorCientifico from "./EditorCientifico";
import { aiMode } from "@/lib/ai/config";

export const dynamic = "force-dynamic";
// Geração por bloco (invocações separadas) + revisão (1 chamada), cada uma bem abaixo
// do teto. Alinhado ao default de 300s da Vercel.
export const maxDuration = 300;

export default async function EditorCientificoPage() {
  const res = await listarDocs();
  const docs = res.ok ? res.data : [];
  const modo = aiMode(); // "mock" | "real"

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/editora" className="text-xs text-muted hover:text-white transition">← Editora Médica</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Editor Científico {modo === "real"
          ? <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-accent">DeepSeek + GPT-4o</span>
          : <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-400">piloto · mock</span>}</h1>
        <p className="mt-1 text-sm text-white/50">
          Redige um texto científico a partir das <strong className="text-white/70">referências que você cola</strong>,
          seção por seção, com <strong className="text-white/70">validação de citações</strong> e um índice de confiança
          calculado pelo código. {modo === "real"
            ? <>Geração com <strong className="text-white/70">DeepSeek</strong> e revisão com <strong className="text-white/70">GPT-4o</strong>.</>
            : <>Nesta fase a IA é <strong className="text-white/70">simulada (mock)</strong> — defina <code className="text-white/70">AI_PROVIDER=real</code> para usar os modelos reais.</>}
        </p>
      </div>

      <ModuloResumo slug="editor-cientifico" />

      <QuandoUsar>
        <strong className="text-white">Use este quando:</strong> você tem referências prontas (diretrizes, artigos, livros) e quer que a IA
        <strong className="text-white/90"> redija um texto científico do zero</strong> — revisão, artigo, resumo clínico. <strong className="text-white/90">Não</strong> é
        para protocolo institucional (isso é o <strong className="text-white/90">Arquiteto de Protocolos</strong>, 33 seções fixas) nem para refinar um texto
        que você já escreveu (isso é o <strong className="text-white/90">Editor Premium</strong> — você cola o rascunho e a IA densifica/refina em cima dele).
      </QuandoUsar>

      <AdminHelp>
        1) Crie ou abra um texto na <strong className="text-white/85">biblioteca</strong>. 2) Cole as <strong className="text-white/85">referências</strong>
        (guideline, artigo, livro, consenso) com seus metadados. 3) Escolha a área. 4) Clique em <strong className="text-white/85">Gerar</strong>.
        5) Revise/edite, rode a <strong className="text-white/85">revisão</strong> e <strong className="text-white/85">salve como versão</strong>.
        6) Publique quando quiser — só o publicado aparece em /biblioteca-cientifica.
      </AdminHelp>

      <EditorCientifico docsIniciais={docs} modo={modo} />
    </div>
  );
}
