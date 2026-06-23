import { getEventos, getTypography } from "@/lib/content";
import AreaTypography from "@/components/admin/AreaTypography";
import EventosEditor from "./EventosEditor";
import Link from "next/link";

export default async function AdminEventosPage() {
  const eventos = await getEventos();
  const typo = await getTypography();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Eventos</h1>
        <p className="mt-1 text-sm text-muted">
          Gerencie os eventos exibidos no calendário e na página de inscrição.
        </p>
      </div>

      <EventosEditor initialEventos={eventos} />

      <AreaTypography sectionKey="eventos" label="Eventos / calendário" initial={typo["eventos"]} />
    </div>
  );
}
