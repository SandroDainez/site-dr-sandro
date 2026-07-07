import Link from "next/link";
import { Newspaper, ArrowRight, Globe, PencilLine, Sparkles, ShieldCheck, Save, Send } from "lucide-react";
import { EDITORA_MODULOS, GRUPOS, ENTRADA_LABEL } from "@/lib/editora-modulos";

export const dynamic = "force-dynamic";

// Passos do fluxo — iguais em TODOS os módulos (o usuário pediu clareza sobre isso).
const FLUXO = [
  { icon: PencilLine, titulo: "1. Criar", txt: "dê um título ao conteúdo" },
  { icon: Newspaper, titulo: "2. Alimentar", txt: "cole as referências (ou deixe a IA buscar)" },
  { icon: Sparkles, titulo: "3. Gerar", txt: "a IA escreve, seção por seção" },
  { icon: ShieldCheck, titulo: "4. Revisar", txt: "um 2º modelo confere as citações" },
  { icon: Save, titulo: "5. Salvar", txt: "vira uma versão na sua biblioteca" },
  { icon: Send, titulo: "6. Publicar", txt: "aparece sozinho no site" },
];

export default function AdminEditoraPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Editora Médica</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/55">
          Ferramentas de IA para criar conteúdo médico <strong className="text-white/75">com fontes citadas</strong>.
          Escolha o que quer criar abaixo. O que você <strong className="text-white/75">publicar</strong> aparece
          automaticamente na página pública correspondente do site.
        </p>
      </div>

      {/* FLUXO — o mesmo nos 9 módulos */}
      <div className="mb-8 rounded-2xl border border-accent/20 bg-accent/[0.04] p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent">Como funciona (igual em todos)</p>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FLUXO.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.titulo} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <Icon className="mb-1.5 h-4 w-4 text-accent" />
                <p className="text-[13px] font-semibold text-white">{s.titulo}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-white/50">{s.txt}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-[11px] text-white/40">
          Enquanto não publica, o conteúdo fica como <strong className="text-white/60">rascunho na biblioteca do módulo</strong> (só você vê).
          Para publicar: role até a seção <strong className="text-white/60">“Publicação”</strong> no fim do módulo e clique em <strong className="text-white/60">Publicar</strong>.
        </p>
      </div>

      {/* Artigos — ferramenta simples, separada dos módulos de IA */}
      <Link
        href="/admin/editora/artigos"
        className="group mb-10 flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.03] p-5 transition hover:border-white/25"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-white/70"><Newspaper className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">Artigos / matérias</p>
          <p className="text-sm text-white/55">Editor simples de artigos e notícias (com um rascunho por IA opcional). Publica em <span className="font-mono text-white/50">/artigos</span>.</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-white/70" />
      </Link>

      {/* MÓDULOS DE IA — agrupados por finalidade */}
      {GRUPOS.map((g) => {
        const mods = EDITORA_MODULOS.filter((m) => m.grupo === g.id);
        if (mods.length === 0) return null;
        return (
          <section key={g.id} className="mb-10">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-white">{g.titulo}</h2>
              <p className="text-xs text-white/45">{g.descricao}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mods.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.slug}
                    href={m.href ?? "#"}
                    className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-accent/40 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent"><Icon className="h-5 w-5" /></div>
                      <ArrowRight className="h-4 w-4 text-white/30 transition group-hover:translate-x-1 group-hover:text-white/60" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{m.nome}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted">{m.descricao}</p>
                    </div>
                    <div className="mt-auto space-y-1.5 border-t border-white/8 pt-3">
                      <p className="text-[11px] text-white/45"><span className="text-white/35">Entrada:</span> {ENTRADA_LABEL[m.entrada]}</p>
                      <p className="inline-flex items-center gap-1 text-[11px] font-medium text-accent"><Globe className="h-3 w-3" /> Publica em <span className="font-mono">{m.publicaEm}</span></p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
