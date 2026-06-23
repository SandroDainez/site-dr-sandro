export const dynamic = "force-dynamic";

import { getTypography } from "@/lib/content";
import TypographyEditor from "./TypographyEditor";
import Link from "next/link";

export default async function AdminTipografiaPage() {
  const typography = await getTypography();

  return (
    <div className="max-w-2xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Tamanho das fontes</h1>
        <p className="mt-1 text-sm text-muted">
          Aumente ou diminua o tamanho das letras de cada seção da página inicial, de forma independente.
        </p>
      </div>

      <TypographyEditor initialTypography={typography} />
    </div>
  );
}
