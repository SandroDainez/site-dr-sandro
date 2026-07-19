export const dynamic = "force-dynamic";

import Link from "next/link";
import AdminHelp from "@/components/admin/AdminHelp";
import AmostraTrafego from "./AmostraTrafego";

export default function AmostraTrafegoPage() {
  return (
    <div className="max-w-4xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Amostra de tráfego real</h1>
        <p className="mt-1 text-sm text-white/50">
          A prova de <strong className="text-white/70">vida real</strong>: pega as perguntas que os usuários
          realmente fizeram, roda cada uma no assistente de hoje e um juiz <strong className="text-white/70">sem
          gabarito</strong> destaca as respostas arriscadas — invenção, red-flag de segurança ou resposta sem
          base. O objetivo é você <strong className="text-white/70">ler as marcadas</strong> (seu olho é o padrão-ouro).
        </p>
      </div>

      <AdminHelp>Escolha o período e clique em “Amostrar”. Cada pergunta real é re-executada no assistente atual e auditada. As de <strong className="text-white/70">risco alto</strong> aparecem primeiro — leia essas. Nada é gravado no banco; é uma leitura pontual do que está saindo.</AdminHelp>

      <AmostraTrafego />
    </div>
  );
}
