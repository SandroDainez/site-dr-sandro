import { getContentItems } from "@/lib/content";
import ConteudoEditor from "./ConteudoEditor";
import Link from "next/link";

export default async function AdminConteudoPage() {
  const items = await getContentItems();

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Conteúdo</h1>
        <p className="mt-1 text-sm text-muted">
          Edite os itens da seção de podcasts, aulas e atualizações educacionais.
        </p>
      </div>

      <ConteudoEditor initialItems={items} />
    </div>
  );
}
