export const dynamic = "force-dynamic";

import Link from "next/link";
import { getCardCols } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import ColunasEditor from "./ColunasEditor";

export default async function ColunasPage() {
  const cols = await getCardCols();
  return (
    <div className="max-w-2xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Cards por linha</h1>
        <p className="mt-1 text-sm text-white/50">
          Escolha quantos cards cada seção mostra por linha no computador. Menos colunas = cards maiores.
          No tablet cai para no máx. 2 e no celular fica 1 por linha automaticamente.
        </p>
      </div>

      <AdminHelp>Ajuste cada seção e clique em Salvar. Vale para a página inicial.</AdminHelp>

      <ColunasEditor initial={cols} />
    </div>
  );
}
