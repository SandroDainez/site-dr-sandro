import Link from "next/link";
import { listarDocs, listarProtocolosPublicados } from "./actions";
import AdminHelp from "@/components/admin/AdminHelp";
import ModuloResumo from "@/components/admin/ModuloResumo";
import QuandoUsar from "@/components/admin/QuandoUsar";
import AtualizadorProtocolos from "./AtualizadorProtocolos";
import { aiMode } from "@/lib/ai/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function AtualizadorProtocolosPage() {
  const [dres, pres] = await Promise.all([listarDocs(), listarProtocolosPublicados()]);
  const docs = dres.ok ? dres.data : [];
  const protocolos = pres.ok ? pres.data : [];
  const modo = aiMode();

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/editora" className="text-xs text-muted hover:text-white transition">← Editora Médica</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Atualizador de Protocolos {modo === "real"
          ? <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-accent">DeepSeek + GPT-4o</span>
          : <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-400">piloto · mock</span>}</h1>
        <p className="mt-1 text-sm text-white/50">
          Busca <strong className="text-white/70">novidades</strong> na <strong className="text-white/70">biblioteca interna</strong> e no
          <strong className="text-white/70"> PubMed</strong> e as compara com um protocolo publicado, gerando um <strong className="text-white/70">relatório
          de atualização</strong> (delta) citado, com validação de citações e confiança calculada pelo código. {modo === "real"
            ? <>Geração <strong className="text-white/70">DeepSeek</strong> + revisão <strong className="text-white/70">GPT-4o</strong>.</>
            : <>Nesta fase a IA é <strong className="text-white/70">simulada (mock)</strong> — defina <code className="text-white/70">AI_PROVIDER=real</code> para os modelos reais.</>}
        </p>
      </div>

      <ModuloResumo slug="atualizador-protocolos" />

      <QuandoUsar>
        <strong className="text-white">Não é automático</strong> — não roda sozinho, você aciona quando quiser conferir. Escolha um
        <strong className="text-white/90"> protocolo já publicado</strong> (feito no Arquiteto) e clique em Buscar e gerar: a IA procura evidência
        mais recente e mostra o que <strong className="text-white/90">mudaria</strong> (delta), citado. <strong className="text-white/90">Importante:
        isto NÃO edita o protocolo original</strong> — gera um relatório separado (publicado em /atualizacoes-protocolos). Se achar que vale incorporar,
        você mesmo edita o protocolo no Arquiteto usando esse relatório como referência.
      </QuandoUsar>

      <AdminHelp>
        1) Escolha um <strong className="text-white/85">protocolo publicado</strong> (do Arquiteto). 2) Clique em
        <strong className="text-white/85"> Buscar e gerar</strong> — busca biblioteca interna + PubMed e monta o delta.
        3) <strong className="text-white/85">Revise</strong> (confere respaldo real) e salve. 4) Publique em /atualizacoes-protocolos.
      </AdminHelp>

      <AtualizadorProtocolos docsIniciais={docs} protocolos={protocolos} modo={modo} />
    </div>
  );
}
