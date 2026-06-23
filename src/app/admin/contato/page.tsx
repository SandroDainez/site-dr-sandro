import { getContato, getTypography } from "@/lib/content";
import AreaTypography from "@/components/admin/AreaTypography";
import ContatoEditor from "./ContatoEditor";
import Link from "next/link";

export default async function AdminContatoPage() {
  const contato = await getContato();
  const typo = await getTypography();

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Contato</h1>
        <p className="mt-1 text-sm text-muted">
          Atualize os dados de contato exibidos na home.
        </p>
      </div>

      <ContatoEditor initialContato={contato} />

      <AreaTypography sectionKey="contato" label="Contato" initial={typo["contato"]} />
    </div>
  );
}
