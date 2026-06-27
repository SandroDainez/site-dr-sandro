import { createPublicClient, supabaseConfigured } from "@/lib/supabase/server";
import { ESPECIALIDADE_LABELS } from "@/lib/agents/utils";
import type { Especialidade } from "@/types/medical";
import { Sparkles, ArrowRight } from "lucide-react";
import UpdateContent from "./UpdateContent";

// Última atualização clínica da semana (agente de IA) para uma especialidade.
// Some se Supabase não configurado ou sem dados. Histórico em /atualizacoes-semanais.

export default async function AtualizacaoSemanal({ especialidade }: { especialidade: Especialidade }) {
  if (!supabaseConfigured()) return null;

  let update: any = null;
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("medical_updates")
      .select("*")
      .eq("especialidade", especialidade)
      .eq("publicado", true)
      .order("data_publicacao", { ascending: false })
      .limit(1)
      .maybeSingle();
    update = data;
  } catch {
    return null;
  }

  if (!update) return null;

  const dataFormatada = new Date(update.data_publicacao).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <section className="mb-10 overflow-hidden rounded-3xl border border-accent/25 bg-accent/[0.04] p-6 md:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white/45">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-semibold text-accent">
          <Sparkles className="h-3.5 w-3.5" /> Atualização da semana
        </span>
        <span>·</span>
        <span>{ESPECIALIDADE_LABELS[especialidade]}</span>
        <span>·</span>
        <span>{update.semana_referencia}</span>
        <span>·</span>
        <span>{dataFormatada}</span>
      </div>

      <h2 className="mb-2 text-xl font-semibold tracking-tight text-white md:text-2xl">{update.titulo}</h2>

      <UpdateContent update={update} />

      <a
        href={`/atualizacoes-semanais?area=${especialidade}`}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition hover:gap-2.5"
      >
        Ver atualizações anteriores <ArrowRight className="h-4 w-4" />
      </a>
    </section>
  );
}
