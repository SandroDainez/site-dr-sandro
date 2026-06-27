export const dynamic = "force-dynamic";

import Link from "next/link";
import { getHomeOrder } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import OrdemHomeEditor from "./OrdemHomeEditor";

export default async function OrdemHomePage() {
  const order = await getHomeOrder();
  return (
    <div className="max-w-2xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Ordem das seções da home</h1>
        <p className="mt-1 text-sm text-white/50">
          Defina em que ordem as seções aparecem ao rolar a página inicial. O bloco
          &quot;Navegue por especialidade&quot; e o topo (hero) ficam sempre no início.
        </p>
      </div>

      <AdminHelp>Use as setas ↑ ↓ para reordenar e clique em Salvar. Pode voltar ao padrão a qualquer momento.</AdminHelp>

      <OrdemHomeEditor initial={order} />
    </div>
  );
}
