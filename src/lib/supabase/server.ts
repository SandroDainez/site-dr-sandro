import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Conteúdo automático (atualizações semanais + eventos científicos) vive no
// Supabase, separado do conteúdo manual (Vercel Blob). Enquanto as chaves não
// estão configuradas, `supabaseConfigured()` é false e quem lê simplesmente não
// renderiza — o site continua funcionando normalmente.

export function supabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function serviceConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Service role — uso EXCLUSIVO no servidor (agentes/cron). Ignora RLS para escrever.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Cliente anônimo no servidor — leitura pública (RLS libera só o que é publicado/ativo).
// Sem cookies: os dados aqui são públicos, então não precisamos de sessão.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// Busca os boletins clínicos da IA (medical_updates). Opcionalmente por especialidade
// (valor do agente: anestesiologia | terapia_intensiva | emergencias). Vazio se sem config.
export async function fetchMedicalUpdates(especialidade?: string): Promise<any[]> {
  if (!supabaseConfigured()) return [];
  try {
    const supabase = createPublicClient();
    let q = supabase
      .from("medical_updates")
      .select("*")
      .eq("publicado", true)
      .order("data_publicacao", { ascending: false })
      .limit(60);
    if (especialidade) q = q.eq("especialidade", especialidade);
    const { data } = await q;
    return data ?? [];
  } catch {
    return [];
  }
}
