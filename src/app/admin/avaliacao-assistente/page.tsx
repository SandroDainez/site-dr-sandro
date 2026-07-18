export const dynamic = "force-dynamic";

import Link from "next/link";
import AdminHelp from "@/components/admin/AdminHelp";
import { EVAL_QUESTOES } from "@/lib/ai/eval/questions";
import AvaliacaoAssistente from "./AvaliacaoAssistente";

export default function AvaliacaoAssistentePage() {
  return (
    <div className="max-w-4xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Avaliação do Assistente</h1>
        <p className="mt-1 text-sm text-white/50">
          A “prova de residência” do assistente: um banco de perguntas clínicas com gabarito. Roda cada
          pergunta no assistente real e um juiz-IA dá as notas — correção, cobertura, fidelidade à fonte,
          dose e reconhecimento de incerteza. É assim que “confiável” vira <strong className="text-white/70">número medido</strong>, não promessa.
        </p>
      </div>

      <AdminHelp>Clique em “Rodar avaliação” e aguarde 1-2 min. Cada questão reprova na hora se houver erro grave ou dose errada. Banco atual: {EVAL_QUESTOES.length} questões (ISR completo) — cresce à medida que você adiciona temas.</AdminHelp>

      <AvaliacaoAssistente />
    </div>
  );
}
