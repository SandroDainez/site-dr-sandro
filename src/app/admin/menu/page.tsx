export const dynamic = "force-dynamic";

import { getNavItems } from "@/lib/content";
import MenuEditor from "./MenuEditor";
import Link from "next/link";

export default async function AdminMenuPage() {
  const items = await getNavItems();

  return (
    <div className="max-w-2xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Menu do topo</h1>
        <p className="mt-1 text-sm text-muted">
          Adicione, exclua, reordene e edite os itens do menu de navegação. Para mudar o tamanho/cor
          da fonte do menu, use <Link href="/admin/tipografia" className="text-accent underline underline-offset-2">Aparência do texto</Link> → seção &quot;Menu (navegação)&quot;.
        </p>
      </div>

      <MenuEditor initialItems={items} />
    </div>
  );
}
