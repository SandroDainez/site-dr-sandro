import Link from "next/link";
import { getNavStyle, getNavOverride } from "@/lib/content";
import MenuEditor from "./MenuEditor";
import MenuOrderEditor from "./MenuOrderEditor";

export default async function AdminMenuPage() {
  const [navStyle, navOverride] = await Promise.all([getNavStyle(), getNavOverride()]);

  return (
    <div className="max-w-2xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Menu do topo</h1>
        <p className="mt-1 text-sm text-white/50">Reordene, oculte e renomeie os itens — e ajuste o tamanho da barra.</p>
      </div>

      <div className="mb-4">
        <MenuOrderEditor initial={navOverride} />
      </div>

      <MenuEditor initialStyle={navStyle} />
    </div>
  );
}
