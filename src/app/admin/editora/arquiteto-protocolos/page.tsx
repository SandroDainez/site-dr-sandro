import Link from "next/link";
import { listarProtocolos } from "./actions";
import AdminHelp from "@/components/admin/AdminHelp";
import ArquitetoProtocolos from "./ArquitetoProtocolos";

export const dynamic = "force-dynamic";

export default async function ArquitetoProtocolosPage() {
  const res = await listarProtocolos();
  const protocolos = res.ok ? res.data : [];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/editora" className="text-xs text-muted hover:text-white transition">← Editora Médica</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Arquiteto de Protocolos <span className="align-middle text-[10px] font-semibold uppercase tracking-wide text-accent">piloto · mock</span></h1>
        <p className="mt-1 text-sm text-white/50">
          Gera um protocolo institucional a partir das <strong className="text-white/70">fontes que você cola</strong>,
          seção por seção (em 6 blocos), com <strong className="text-white/70">validação de citações</strong> e um índice
          de confiança calculado pelo código. Nesta fase a IA é <strong className="text-white/70">simulada (mock)</strong>
          — o modelo real entra depois.
        </p>
      </div>

      <AdminHelp>
        1) Escolha ou crie um protocolo. 2) Cole as <strong className="text-white/85">fontes</strong> (guideline, artigo,
        livro, consenso) com seus metadados. 3) Escolha a área. 4) Clique em <strong className="text-white/85">Gerar</strong> —
        acompanhe os 6 blocos. 5) Revise/edite e <strong className="text-white/85">salve como versão</strong>. A confiança e o
        método aparecem no fim (afirmações clínicas com citação validada ÷ total).
      </AdminHelp>

      <ArquitetoProtocolos protocolosIniciais={protocolos} />
    </div>
  );
}
