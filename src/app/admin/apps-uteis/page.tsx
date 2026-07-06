import { getUtilApps, getTypography } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import ColsShortcut from "@/components/admin/ColsShortcut";
import AreaTypography from "@/components/admin/AreaTypography";
import AppsUteisEditor from "./AppsUteisEditor";
import Link from "next/link";

export default async function AdminAppsUteisPage() {
  const apps = await getUtilApps();
  const typo = await getTypography();

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Apps do dia a dia</h1>
        <p className="mt-1 text-sm text-muted">
          Apps genéricos (finanças, organização, produtividade — podem ser fora da medicina),
          exibidos na seção <span className="font-mono text-white/70">Para o seu dia a dia</span> da home.
          Use a <strong className="text-white/70">categoria</strong> como badge (ex: Finanças, Organização).
        </p>
      </div>

      <AdminHelp>Clique em “Adicionar app”. Defina a categoria (vira o selo), envie o logo, escreva título e descrição, cole o link e Salvar.</AdminHelp>

      <ColsShortcut />

      <AppsUteisEditor initialApps={apps} />

      <AreaTypography sectionKey="utilApps" label="Apps do dia a dia" initial={typo["utilApps"]} />
    </div>
  );
}
