export const dynamic = "force-dynamic";

import { getAplicativos, getTypography } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import ColsShortcut from "@/components/admin/ColsShortcut";
import AreaTypography from "@/components/admin/AreaTypography";
import AplicativosEditor from "./AplicativosEditor";
import Link from "next/link";

export default async function AdminAplicativosPage() {
  const [apps, typo] = await Promise.all([getAplicativos(), getTypography()]);

  return (
    <div className="max-w-2xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Aplicativos</h1>
        <p className="mt-1 text-sm text-muted">
          Todos os apps num lugar só. Em cada um, escolha <strong className="text-white/80">Acesso</strong> (Grátis
          ou Assinatura) e <strong className="text-white/80">Finalidade</strong> (o grupo onde ele aparece na home).
        </p>
      </div>

      <AdminHelp>
        Adicione qualquer app aqui e decida por app: Grátis × Assinatura, e a finalidade (Decisão clínica · Estudo ·
        Gestão e equipes · Utilidades). A home organiza sozinha por finalidade, com o selo Grátis/Assinatura. Os apps
        que você já tinha (dos 3 lugares antigos) já vêm carregados aqui — é só ajustar e Salvar.
      </AdminHelp>

      <ColsShortcut />

      <AplicativosEditor initial={apps} />

      <AreaTypography sectionKey="apps" label="Aplicativos" initial={typo["apps"]} />
    </div>
  );
}
