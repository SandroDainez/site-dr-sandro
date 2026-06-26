import { getUiTexts } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import TextosBotoesEditor from "./TextosBotoesEditor";
import Link from "next/link";

export default async function AdminTextosBotoesPage() {
  const data = await getUiTexts();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Textos e botões</h1>
        <p className="mt-1 text-sm text-white/50">
          Frases e botões soltos do site: os botões do topo, o link “Ver todos” das seções, o rodapé e
          os textos do curso pago.
        </p>
      </div>

      <AdminHelp>Edite cada frase/botão. Deixe em branco para usar o texto padrão. Clique em Salvar.</AdminHelp>

      <TextosBotoesEditor initial={data} />
    </div>
  );
}
