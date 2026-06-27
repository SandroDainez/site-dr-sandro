import { createPublicClient, supabaseConfigured } from "@/lib/supabase/server";
import type { EventoData } from "@/lib/content";
import type { Especialidade } from "@/types/medical";
import CalendarioCientifico, { type EventoUnificado } from "./CalendarioCientifico";

// Agenda ÚNICA: junta os cursos/imersões do médico (EventoData, Blob) com os
// congressos científicos (medical_events, Supabase) num só calendário + lista.
// Com `especialidade`, mostra só os congressos daquela área (calendário do hub).
export default async function AgendaCientifica({
  cursos = [],
  especialidade,
  embedded = false,
  eyebrow,
  titulo,
  subtitulo,
}: {
  cursos?: EventoData[];
  especialidade?: Especialidade;
  embedded?: boolean;
  eyebrow?: string;
  titulo?: string;
  subtitulo?: string;
}) {
  const hojeISO = new Date().toISOString().split("T")[0];

  // 1) Cursos/imersões → link interno de inscrição
  const dosCursos: EventoUnificado[] = (cursos ?? [])
    .filter((c) => c.titulo && c.data)
    .map((c) => ({
      id: `curso-${c.slug || c.data}`,
      titulo: c.titulo,
      data_inicio: c.data,
      local: c.local ?? null,
      pais: null,
      modalidade: null,
      badge: c.tipo ?? null,
      href: `/inscricao?evento=${c.slug}&data=${c.data}`,
      external: false,
      data_confirmada: true,
    }));

  // 2) Congressos científicos (Supabase)
  let dosCongressos: EventoUnificado[] = [];
  if (supabaseConfigured()) {
    try {
      const supabase = createPublicClient();
      let query = supabase
        .from("medical_events")
        .select("id,titulo,data_inicio,data_fim,cidade,local_nome,pais,modalidade,organizador,url_oficial,data_confirmada")
        .eq("ativo", true)
        .gte("data_inicio", hojeISO)
        .order("data_inicio", { ascending: true })
        .limit(200);
      if (especialidade) query = query.contains("especialidades", [especialidade]);
      const { data } = await query;
      dosCongressos = (data ?? []).map((e: any) => ({
        id: `cong-${e.id}`,
        titulo: e.titulo,
        data_inicio: e.data_inicio,
        data_fim: e.data_fim,
        local: e.cidade || e.local_nome || null,
        pais: e.pais || null,
        modalidade: e.modalidade || null,
        badge: e.organizador || null,
        href: e.url_oficial,
        external: true,
        data_confirmada: e.data_confirmada !== false,
      }));
    } catch {
      dosCongressos = [];
    }
  }

  const eventos = [...dosCursos, ...dosCongressos];
  if (eventos.length === 0) return null;

  return (
    <CalendarioCientifico
      eventos={eventos}
      embedded={embedded}
      {...(eyebrow ? { eyebrow } : {})}
      {...(titulo ? { titulo } : {})}
      {...(subtitulo ? { subtitulo } : {})}
    />
  );
}
