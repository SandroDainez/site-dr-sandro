import { createPublicClient, supabaseConfigured } from "@/lib/supabase/server";
import { getCursos } from "@/lib/content";
import type { EventoData } from "@/lib/content";
import type { Especialidade } from "@/types/medical";
import CalendarioCientifico, { type EventoUnificado } from "./CalendarioCientifico";

const espToSite = (e?: Especialidade): string | null => (!e ? null : e === "terapia_intensiva" ? "ti" : e);
const arrEspToSite = (arr?: (string | null)[] | null): string[] =>
  (arr ?? []).filter(Boolean).map((e) => (e === "terapia_intensiva" ? "ti" : (e as string)));

interface MedicalEventRow {
  id: string | number;
  titulo: string;
  data_inicio: string;
  data_fim?: string | null;
  cidade?: string | null;
  local_nome?: string | null;
  pais?: string | null;
  modalidade?: string | null;
  organizador?: string | null;
  url_oficial: string;
  data_confirmada?: boolean | null;
  selo?: string | null;
  especialidades?: (string | null)[] | null;
}

// LOADER reutilizável: monta a lista unificada de eventos (cursos do médico + congressos).
// Com `especialidade`, filtra os congressos NO SERVIDOR (calendário do hub). Sem ela, traz
// TODOS e popula `areas` em cada congresso p/ o cliente filtrar (ex.: filtro de área da zona).
export async function carregarEventosUnificados({
  cursos = [],
  especialidade,
}: { cursos?: EventoData[]; especialidade?: Especialidade } = {}): Promise<EventoUnificado[]> {
  const hojeISO = new Date().toISOString().split("T")[0];

  const dosCursos: EventoUnificado[] = (cursos ?? [])
    .filter((c) => c.titulo && c.data)
    .map((c) => ({
      id: `curso-${c.slug || c.data}`, titulo: c.titulo, data_inicio: c.data,
      local: c.local ?? null, pais: null, modalidade: null, badge: c.tipo ?? null,
      href: `/inscricao?evento=${c.slug}&data=${c.data}`, external: false, data_confirmada: true, selo: "proprio",
    }));

  let dosCongressos: EventoUnificado[] = [];
  if (supabaseConfigured()) {
    try {
      const supabase = createPublicClient();
      let query = supabase
        .from("medical_events")
        .select("id,titulo,data_inicio,data_fim,cidade,local_nome,pais,modalidade,organizador,url_oficial,data_confirmada,selo,especialidades")
        .eq("ativo", true).gte("data_inicio", hojeISO).order("data_inicio", { ascending: true }).limit(200);
      if (especialidade) query = query.contains("especialidades", [especialidade]);
      const { data } = await query;
      dosCongressos = ((data ?? []) as MedicalEventRow[]).map((e) => ({
        id: `cong-${e.id}`, titulo: e.titulo, data_inicio: e.data_inicio, data_fim: e.data_fim,
        local: e.cidade || e.local_nome || null, pais: e.pais || null, modalidade: e.modalidade || null,
        badge: e.organizador || null, href: e.url_oficial, external: true,
        data_confirmada: e.data_confirmada !== false,
        selo: e.selo === "proprio" || e.selo === "parceiro" ? e.selo : null,
        areas: arrEspToSite(e.especialidades),
      }));
    } catch { dosCongressos = []; }
  }

  let dasFormacoes: EventoUnificado[] = [];
  try {
    const cursosPagina = await getCursos();
    const siteArea = espToSite(especialidade);
    dasFormacoes = cursosPagina
      .filter((c) => c.titulo && c.data && c.data >= hojeISO)
      .filter((c) => !siteArea || c.area === siteArea || c.area === "geral" || (c.areas?.includes(siteArea as "emergencias" | "ti" | "anestesiologia") ?? false))
      .map((c) => ({
        id: `cursopg-${c.id}`, titulo: c.titulo, data_inicio: c.data, local: null, pais: null,
        modalidade: c.acesso === "gratis" ? "online" : null, badge: c.professor || "Curso",
        href: `/cursos/${c.id}`, external: false, data_confirmada: true, selo: "proprio",
      }));
  } catch { dasFormacoes = []; }

  return [...dosCursos, ...dasFormacoes, ...dosCongressos];
}

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
  const eventos = await carregarEventosUnificados({ cursos, especialidade });
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
