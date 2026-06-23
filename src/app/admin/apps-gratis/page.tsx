import { getFreeApps, getTypography } from "@/lib/content";
import AreaTypography from "@/components/admin/AreaTypography";
import AppsGratisEditor from "./AppsGratisEditor";
import Link from "next/link";

export default async function AdminAppsGratisPage() {
  const apps = await getFreeApps();
  const typo = await getTypography();

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Apps Grátis</h1>
        <p className="mt-1 text-sm text-muted">
          Edite os cards de aplicativos gratuitos exibidos na seção de acesso aberto.
        </p>
      </div>

      <AppsGratisEditor initialApps={apps} />

      <AreaTypography sectionKey="freeApps" label="Apps grátis" initial={typo["freeApps"]} />
    </div>
  );
}
