export const dynamic = "force-dynamic";

import Link from "next/link";
import AdminHelp from "@/components/admin/AdminHelp";
import { TEMAS, bancoDoTema } from "@/lib/ai/eval/questions";
import AvaliacaoAssistente from "./AvaliacaoAssistente";

export default function AvaliacaoAssistentePage() {
  // Contagem por tema (total e sentinelas) p/ os rótulos dos botões.
  const contagens = Object.fromEntries(
    TEMAS.map((t) => {
      const banco = bancoDoTema(t);
      return [t, { total: banco.length, sentinelas: banco.filter((q) => q.sentinela).length }];
    }),
  );
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

      <AdminHelp>Escolha o <strong className="text-white/70">tema</strong> e clique em rodar. Cada questão reprova na hora se houver erro grave ou dose errada. Temas disponíveis: {TEMAS.join(", ")} — cresce à medida que você adiciona bancos.</AdminHelp>

      <AvaliacaoAssistente temas={TEMAS} contagens={contagens} />
    </div>
  );
}
