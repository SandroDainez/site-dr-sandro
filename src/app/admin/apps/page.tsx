import { getApps, getTypography } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import AreaTypography from "@/components/admin/AreaTypography";
import AppsEditor from "./AppsEditor";
import Link from "next/link";

export default async function AdminAppsPage() {
  const apps = await getApps();
  const typo = await getTypography();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Apps por assinatura</h1>
        <p className="mt-1 text-sm text-muted">
          Edite os cards de aplicativos exibidos na home.
        </p>
      </div>

      <AdminHelp>Edite cada app por assinatura: logo/ícone, título, subtítulo, destaques e o link. Clique em Salvar para aplicar no site.</AdminHelp>

      <AppsEditor initialApps={apps} />

      <AreaTypography sectionKey="apps" label="Apps por assinatura" initial={typo["apps"]} />
    </div>
  );
}
