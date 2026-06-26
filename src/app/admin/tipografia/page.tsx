export const dynamic = "force-dynamic";

import { getTypography } from "@/lib/content";
import { TYPOGRAPHY_SECTIONS } from "@/lib/typography-sections";
import AreaTypography from "@/components/admin/AreaTypography";
import AdminHelp from "@/components/admin/AdminHelp";
import Link from "next/link";

export default async function AdminTipografiaPage() {
  const typo = await getTypography();

  return (
    <div className="max-w-2xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Aparência do texto</h1>
        <p className="mt-1 text-sm text-muted">
          Controle tamanho, fonte, cor e peso das letras de cada seção da página inicial. O mesmo
          controle também aparece dentro de cada área de edição.
        </p>
      </div>

      <AdminHelp>Escolha a seção, ajuste fonte, tamanho, cor e peso, e clique em Salvar (em cada bloco). O mesmo controle também aparece dentro de cada área de edição.</AdminHelp>

      <div className="space-y-6">
        {TYPOGRAPHY_SECTIONS.map((s) => (
          <AreaTypography key={s.key} sectionKey={s.key} label={s.label} initial={typo[s.key]} />
        ))}
      </div>
    </div>
  );
}
