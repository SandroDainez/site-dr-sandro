import Link from "next/link";
import { getArtigosAdmin } from "@/lib/editora";
import AdminHelp from "@/components/admin/AdminHelp";
import EditoraManager from "./EditoraManager";

export const dynamic = "force-dynamic";

export default async function AdminEditoraPage() {
  const artigos = await getArtigosAdmin();

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Editora Médica</h1>
        <p className="mt-1 text-sm text-white/50">
          Crie, edite e publique <strong className="text-white/70">artigos/matérias</strong> médicas. Pode escrever do
          zero ou gerar um rascunho com IA e revisar. Publicados aparecem em{" "}
          <span className="font-mono text-white/70">/artigos</span>.
        </p>
      </div>

      <AdminHelp>
        Clique em <strong className="text-white/85">Novo artigo</strong> (ou num existente para editar). Preencha
        título, autor e a área; escreva o corpo (ou use <strong className="text-white/85">Gerar rascunho com IA</strong> a
        partir de um tema e revise). Deixe em <strong className="text-white/85">Rascunho</strong> enquanto trabalha e mude
        para <strong className="text-white/85">Publicado</strong> quando estiver pronto. Salvar.
      </AdminHelp>

      <EditoraManager initial={artigos} />
    </div>
  );
}
