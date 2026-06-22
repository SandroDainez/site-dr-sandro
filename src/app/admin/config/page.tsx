import { getSiteConfig } from "@/lib/content";
import ConfigEditor from "./ConfigEditor";
import Link from "next/link";

export default async function AdminConfigPage() {
  const config = await getSiteConfig();

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Configurações</h1>
        <p className="mt-1 text-sm text-muted">
          Edite os itens do marquee e os textos do rodapé do site.
        </p>
      </div>

      <ConfigEditor initialConfig={config} />
    </div>
  );
}
