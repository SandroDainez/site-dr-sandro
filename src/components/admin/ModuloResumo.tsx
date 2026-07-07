import { ArrowRight, Inbox, FileText, Globe } from "lucide-react";
import { getModulo } from "@/lib/editora-modulos";

// Resumo "Você dá → Produz → Publica" de um módulo da Editora, para o topo da página do
// módulo (deixa claro o que dar, o que sai e onde vai). Fonte única: editora-modulos.ts.

function Passo({ icon: Icon, rotulo, valor, cor }: { icon: typeof Inbox; rotulo: string; valor: string; cor: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${cor}`}><Icon className="h-3 w-3" /> {rotulo}</p>
      <p className="mt-0.5 text-sm text-white/85">{valor}</p>
    </div>
  );
}

export default function ModuloResumo({ slug }: { slug: string }) {
  const m = getModulo(slug);
  if (!m) return null;
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center">
      <Passo icon={Inbox} rotulo="Você dá" valor={m.recebe} cor="text-accent-blue" />
      <ArrowRight className="hidden h-4 w-4 shrink-0 text-white/25 sm:block" />
      <Passo icon={FileText} rotulo="Produz" valor={m.produz} cor="text-accent" />
      <ArrowRight className="hidden h-4 w-4 shrink-0 text-white/25 sm:block" />
      <Passo icon={Globe} rotulo="Publica em" valor={m.publicaEm} cor="text-accent-violet" />
    </div>
  );
}
