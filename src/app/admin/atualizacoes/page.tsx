import { getAtualizacoes, getTypography } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import AreaTypography from "@/components/admin/AreaTypography";
import AtualizacoesEditor from "./AtualizacoesEditor";

export default async function AdminAtualizacoesPage() {
  const atualizacoes = await getAtualizacoes();
  const typo = await getTypography();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Atualizações clínicas</h1>
        <p className="mt-1 text-sm text-white/50">
          Gerencie as atualizações médicas exibidas em{" "}
          <span className="font-mono text-white/70">/atualizacoes</span> e na home.
        </p>
      </div>

      <AdminHelp>Clique em “Adicionar atualização”. Escolha a área, escreva o conteúdo e (opcional) envie um logo pequeno. Salvar para publicar.</AdminHelp>

      <AtualizacoesEditor initialAtualizacoes={atualizacoes} />

      <AreaTypography sectionKey="atualizacoes" label="Atualizações" initial={typo["atualizacoes"]} />
    </div>
  );
}
