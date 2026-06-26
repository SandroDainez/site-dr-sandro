import { getSectionTexts } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import TitulosEditor from "./TitulosEditor";
import Link from "next/link";

export default async function AdminTitulosPage() {
  const data = await getSectionTexts();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Títulos das seções</h1>
        <p className="mt-1 text-sm text-white/50">
          Edite o <strong className="text-white/70">rótulo pequeno</strong> e o{" "}
          <strong className="text-white/70">título grande</strong> de cada seção da página inicial
          (ex: “Aplicativos por assinatura” / “Apps médicos para decisão clínica”).
        </p>
      </div>

      <AdminHelp>Troque o rótulo (texto pequeno) e o título de cada seção da home. Deixe em branco para manter o padrão. Clique em Salvar.</AdminHelp>

      <TitulosEditor initial={data} />
    </div>
  );
}
