import AdminHelp from "@/components/admin/AdminHelp";
import ReferenciasEditor from "./ReferenciasEditor";
import { listarReferencias } from "./actions";

export default async function AdminReferenciasPage() {
  const r = await listarReferencias();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Biblioteca de referência (Assistente IA)</h1>
        <p className="mt-1 text-sm text-white/50">
          Livros, artigos, diretrizes e PDFs que servem de base para o <span className="font-mono text-white/70">/assistente</span> responder — sempre citando a fonte.
        </p>
      </div>

      <AdminHelp>
        Adicione uma referência: dê um título, escolha o tipo, e <strong>cole o texto</strong> (resumo/trechos relevantes) ou <strong>envie um PDF</strong> (o texto é extraído automaticamente). Depois clique em <strong>“Reindexar assistente”</strong> para ele passar a usar o material. O assistente nunca inventa — só responde com base no que está aqui e nos boletins.
      </AdminHelp>

      {r.ok ? <ReferenciasEditor inicial={r.data ?? []} /> : <p className="text-sm text-red-400">{r.error}</p>}
    </div>
  );
}
