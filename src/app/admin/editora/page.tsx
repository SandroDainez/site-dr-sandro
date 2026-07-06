import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import { EDITORA_MODULOS, type ModuloTipo } from "@/lib/editora-modulos";

export const dynamic = "force-dynamic";

const TIPO_BADGE: Record<ModuloTipo, string> = {
  "geração": "border-accent/30 bg-accent/10 text-accent",
  "retrieval": "border-inten/30 bg-inten/10 text-inten",
  "híbrido": "border-accent-violet/30 bg-accent-violet/10 text-accent-violet",
};

export default function AdminEditoraPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Editora Médica</h1>
        <p className="mt-1 text-sm text-white/50">
          Produção de conteúdo médico assistida por IA. Os <strong className="text-white/70">módulos de IA</strong> abaixo
          ainda serão implementados (ver arquitetura em <span className="font-mono text-white/60">docs/ARQUITETURA-IA.md</span>).
        </p>
      </div>

      {/* Artigos — já funcional */}
      <Link
        href="/admin/editora/artigos"
        className="group mb-8 flex items-center gap-4 rounded-2xl border border-accent/25 bg-accent/[0.05] p-5 transition hover:border-accent/45"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent"><Newspaper className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">Artigos</p>
          <p className="text-sm text-white/55">Criar, editar e publicar artigos/matérias (funcional). Aparecem em /artigos.</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-white/70" />
      </Link>

      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Módulos de IA</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {EDITORA_MODULOS.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.slug}
              href={`/admin/editora/modulos/${m.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-white/70" />
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIPO_BADGE[m.tipo]}`}>{m.tipo}</span>
              </div>
              <div>
                <p className="font-medium text-white">{m.nome}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{m.descricao}</p>
              </div>
              <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white/40">em breve</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
