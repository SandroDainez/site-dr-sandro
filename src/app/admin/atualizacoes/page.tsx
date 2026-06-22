import { getAtualizacoes } from "@/lib/content";
import AtualizacoesEditor from "./AtualizacoesEditor";

export default async function AdminAtualizacoesPage() {
  const atualizacoes = await getAtualizacoes();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Atualizações clínicas</h1>
        <p className="mt-1 text-sm text-white/50">
          Gerencie as atualizações médicas exibidas em{" "}
          <span className="font-mono text-white/70">/atualizacoes</span> e na home.
        </p>
      </div>

      <AtualizacoesEditor initialAtualizacoes={atualizacoes} />
    </div>
  );
}
