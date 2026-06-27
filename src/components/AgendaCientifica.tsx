import { createPublicClient, supabaseConfigured } from "@/lib/supabase/server";
import CalendarioCientifico from "./CalendarioCientifico";

// Busca os eventos científicos (medical_events) e mostra o calendário + lista
// numerada. Some se Supabase não estiver configurado ou se não houver eventos.
export default async function AgendaCientifica() {
  if (!supabaseConfigured()) return null;

  let eventos: any[] = [];
  try {
    const supabase = createPublicClient();
    const hoje = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("medical_events")
      .select("id,titulo,data_inicio,data_fim,cidade,local_nome,pais,modalidade,organizador,url_oficial")
      .eq("ativo", true)
      .gte("data_inicio", hoje)
      .order("data_inicio", { ascending: true })
      .limit(100);
    eventos = data ?? [];
  } catch {
    return null;
  }

  if (eventos.length === 0) return null;

  return <CalendarioCientifico eventos={eventos} />;
}
