export const dynamic = "force-dynamic";
export const maxDuration = 300; // o botão "executar agora" roda o agente em processo

import Link from "next/link";
import { createPublicClient, supabaseConfigured, serviceConfigured } from "@/lib/supabase/server";
import { ESPECIALIDADE_LABELS } from "@/lib/agents/utils";
import type { Especialidade } from "@/types/medical";
import AutoPanel from "./AutoPanel";

const ESPECIALIDADES: Especialidade[] = ["anestesiologia", "terapia_intensiva", "emergencias"];

export default async function ConteudoAutomaticoPage() {
  const configured = supabaseConfigured();
  const openaiOk = !!process.env.OPENAI_API_KEY;
  const serviceOk = serviceConfigured();

  const status: Record<string, any> = {};
  let eventos: any[] = [];

  if (configured) {
    try {
      const supabase = createPublicClient();
      for (const esp of ESPECIALIDADES) {
        const { data } = await supabase
          .from("medical_updates")
          .select("titulo,semana_referencia,data_publicacao,topicos,fontes")
          .eq("especialidade", esp)
          .eq("publicado", true)
          .order("data_publicacao", { ascending: false })
          .limit(1)
          .maybeSingle();
        status[esp] = data
          ? {
              semana: data.semana_referencia,
              data: data.data_publicacao,
              topicos: Array.isArray(data.topicos) ? data.topicos.length : 0,
              fontes: Array.isArray(data.fontes) ? data.fontes.length : 0,
            }
          : null;
      }
      const hoje = new Date().toISOString().split("T")[0];
      const { data: evs } = await supabase
        .from("medical_events")
        .select("*")
        .gte("data_inicio", hoje)
        .order("data_inicio", { ascending: true })
        .limit(50);
      eventos = evs ?? [];
    } catch {
      /* tabelas podem não existir ainda */
    }
  }

  return (
    <div className="max-w-4xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Conteúdo automático (IA)</h1>
        <p className="mt-1 text-sm text-white/50">
          Dois agentes de IA mantêm o site atualizado: <strong className="text-white/70">Atualizações clínicas</strong> semanais
          (PubMed, journals, sociedades, regulatórios) e <strong className="text-white/70">Eventos científicos</strong> (congressos mundiais).
          Rodam sozinhos por cron; aqui você acompanha e pode rodar na hora.
        </p>
      </div>

      <AutoPanel
        config={{ supabase: configured, openai: openaiOk, service: serviceOk }}
        status={status}
        labels={ESPECIALIDADE_LABELS}
        especialidades={ESPECIALIDADES}
        eventos={eventos}
      />
    </div>
  );
}
