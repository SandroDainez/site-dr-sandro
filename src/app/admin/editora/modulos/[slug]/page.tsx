import Link from "next/link";
import { notFound } from "next/navigation";
import { getModulo, type ModuloTipo } from "@/lib/editora-modulos";

export const dynamic = "force-dynamic";

const TIPO_BADGE: Record<ModuloTipo, string> = {
  "geração": "border-accent/30 bg-accent/10 text-accent",
  "retrieval": "border-inten/30 bg-inten/10 text-inten",
  "híbrido": "border-accent-violet/30 bg-accent-violet/10 text-accent-violet",
};

export default async function ModuloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = getModulo(slug);
  if (!m) notFound();
  const Icon = m.icon;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/editora" className="text-xs text-muted hover:text-white transition">← Editora Médica</Link>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70"><Icon className="h-6 w-6" /></div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{m.nome}</h1>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIPO_BADGE[m.tipo]}`}>{m.tipo}</span>
          </div>
          <p className="text-sm text-white/50">{m.descricao}</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
        <p className="text-sm font-medium text-white/70">Módulo em desenvolvimento</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/45">
          A camada de IA deste módulo ainda será implementada. A arquitetura (providers, pipeline de 2 estágios,
          validação de citações) está em <span className="font-mono text-white/60">docs/ARQUITETURA-IA.md</span>.
        </p>
      </div>
    </div>
  );
}
