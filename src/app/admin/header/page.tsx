export const dynamic = "force-dynamic";

import { getHeader } from "@/lib/content";
import HeaderEditor from "./HeaderEditor";
import Link from "next/link";

export default async function AdminHeaderPage() {
  const header = await getHeader();

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Cabeçalho do site</h1>
        <p className="mt-1 text-sm text-muted">
          Edite o nome, CRM, RQEs e logo exibidos no topo de todas as páginas.
        </p>
      </div>

      {/* Debug: mostra URL atual salva no blob */}
      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.1em] text-white/35 mb-1">URL do logo salva no blob</p>
        <p className="text-xs text-white/60 break-all">{header.logoUrl || "(vazio)"}</p>
      </div>

      <HeaderEditor initialHeader={header} />
    </div>
  );
}
