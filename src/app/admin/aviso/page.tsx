export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAviso } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import AvisoEditor from "./AvisoEditor";

export default async function AvisoPage() {
  const aviso = await getAviso();
  return (
    <div className="max-w-2xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Aviso no topo do site</h1>
        <p className="mt-1 text-sm text-white/50">
          Uma faixa de aviso que aparece no topo de todas as páginas (ex.: &quot;em construção&quot;).
          O visitante pode fechar; se você mudar o texto, o aviso reaparece pra quem já tinha fechado.
        </p>
      </div>

      <AdminHelp>Deixe ativo enquanto quiser. Para tirar o aviso, é só desligar e salvar.</AdminHelp>

      <AvisoEditor initial={aviso} />
    </div>
  );
}
