import { getWhyUs, getTypography } from "@/lib/content";
import AreaTypography from "@/components/admin/AreaTypography";
import PorQueNosEditor from "./PorQueNosEditor";
import Link from "next/link";

export default async function AdminPorQueNosPage() {
  const cards = await getWhyUs();
  const typo = await getTypography();

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Por que nós</h1>
        <p className="mt-1 text-sm text-muted">
          Edite os cards de diferenciais exibidos no rodapé da home.
        </p>
      </div>

      <PorQueNosEditor initialCards={cards} />

      <AreaTypography sectionKey="whyUs" label="Por que nós" initial={typo["whyUs"]} />
    </div>
  );
}
