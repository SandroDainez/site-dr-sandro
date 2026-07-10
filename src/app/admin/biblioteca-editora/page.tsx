import Link from "next/link";
import AdminHelp from "@/components/admin/AdminHelp";
import BibliotecaEditoraAdmin from "./BibliotecaEditoraAdmin";
import { listarBibliotecaEditora } from "./actions";

export const dynamic = "force-dynamic";

export default async function BibliotecaEditoraPage() {
  const r = await listarBibliotecaEditora();

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/editora" className="text-xs text-muted hover:text-white transition">← Editora Médica</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Biblioteca da Editora</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Tudo que já foi <strong className="text-white/75">publicado</strong> por qualquer um dos 9 módulos, num catálogo só —
          pra reaproveitar em qualquer outro trabalho.
        </p>
      </div>

      <AdminHelp>
        Preenche sozinha: sempre que você <strong>publica</strong> algo em qualquer módulo da Editora, entra aqui automaticamente
        (despublicar/arquivar/excluir tira daqui também). Em cada item: <strong>Ver no site</strong> (abre a página pública),
        <strong> Exportar</strong> (baixa o texto), ou <strong>Enviar pro Banco de Referências 1</strong> — aí passa a valer
        também pro assistente de IA do site e pro modo &quot;Buscar na biblioteca&quot; de qualquer módulo.
      </AdminHelp>

      {r.ok ? <BibliotecaEditoraAdmin inicial={r.data ?? []} /> : <p className="text-sm text-red-400">{r.error}</p>}
    </div>
  );
}
