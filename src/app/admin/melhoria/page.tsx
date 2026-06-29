export const dynamic = "force-dynamic";
export const maxDuration = 120; // o botão "gerar agora" roda o agente em processo

import Link from "next/link";
import AdminHelp from "@/components/admin/AdminHelp";
import { createServiceClient, serviceConfigured } from "@/lib/supabase/server";
import MelhoriaPanel, { type Relatorio } from "./MelhoriaPanel";

export default async function AdminMelhoriaPage() {
  let inicial: Relatorio = null;
  if (serviceConfigured()) {
    try {
      const { data } = await createServiceClient()
        .from("improvement_reports")
        .select("gerado_em,resumo,conteudo")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) inicial = data as Relatorio;
    } catch { /* sem relatório ainda */ }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Sugestões de melhoria (IA)</h1>
        <p className="mt-1 text-sm text-muted">O que adicionar ao portal, com base no que os usuários procuram e o assistente não responde.</p>
      </div>

      <AdminHelp>
        Este agente analisa, dos últimos 30 dias, as <strong>buscas sem resultado</strong> e as <strong>perguntas que o assistente não soube responder</strong>, e sugere o que criar. Ele só <strong>sugere</strong> — não altera nada. Roda sozinho toda segunda; use &quot;Gerar agora&quot; para rodar na hora.
      </AdminHelp>

      <MelhoriaPanel inicial={inicial} />
    </div>
  );
}
