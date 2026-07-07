import AdminHelp from "@/components/admin/AdminHelp";
import BancoEditor, { type Q } from "./BancoEditor";
import { listarQuestoes } from "./actions";

export default async function AdminBancoQuestoesPage() {
  const r = await listarQuestoes();
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Banco de questões</h1>
        <p className="mt-1 text-sm text-white/50">Questões para os alunos praticarem em <span className="font-mono text-white/70">/estudar</span>, com repetição espaçada.</p>
      </div>
      <AdminHelp>
        Crie questões manualmente ou <strong>gere por IA</strong> a partir do seu conteúdo (boletins, referências). As geradas por IA entram como <strong>rascunho</strong> — revise a correção e <strong>ative</strong> antes de liberar aos alunos. O aluno responde uma de cada vez; o sistema agenda a revisão pelo desempenho (acertou → volta mais tarde; errou → volta logo).
      </AdminHelp>
      {r.ok ? <BancoEditor inicial={(r.data as Q[] | undefined) ?? []} /> : <p className="text-sm text-red-400">{r.error}</p>}
    </div>
  );
}
