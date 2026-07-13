import { ArrowRight, CheckCircle2, Stethoscope, BookOpen, CalendarDays, Wrench, type LucideIcon } from "lucide-react";
import type { AppData, FreeAppData, UtilAppData } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";
import { colStyle } from "@/lib/card-grid";
import { FINALIDADES, finalidadeEfetiva, type Finalidade } from "@/lib/finalidades";

// Seção unificada de aplicativos, agrupada por FINALIDADE (pra que serve). Junta apps por
// assinatura, apps gratuitos e utilidades — cada card com selo Grátis/Assinatura. Substitui
// o antigo "só assinatura" com título de decisão clínica (que rotulava tudo errado).

type AppUnificado = {
  key: string;
  title: string;
  subtitle?: string;
  desc: string;
  imageUrl?: string;
  imageSize?: number;
  highlights?: string[];
  link: string;
  pago: boolean; // true = assinatura; false = grátis
  finalidade: Finalidade;
  glow?: string;
};

const ICONE_FINALIDADE: Record<Finalidade, LucideIcon> = {
  decisao: Stethoscope, estudo: BookOpen, gestao: CalendarDays, utilidade: Wrench,
};

function normalizar(apps: AppData[], freeApps: FreeAppData[], utilApps: UtilAppData[]): AppUnificado[] {
  const a: AppUnificado[] = apps.map((x) => ({
    key: `a-${x.title}`, title: x.title, subtitle: x.subtitle, desc: x.text,
    imageUrl: x.thumbnailUrl, imageSize: x.thumbnailSize, highlights: x.highlights, link: x.link,
    pago: true, finalidade: finalidadeEfetiva(x.finalidade, x.title, x.subtitle, x.text), glow: x.glow,
  }));
  const f: AppUnificado[] = freeApps.map((x) => ({
    key: `f-${x.title}`, title: x.title, desc: x.desc, imageUrl: x.imageUrl, imageSize: x.imageSize,
    link: x.link, pago: false, finalidade: finalidadeEfetiva(x.finalidade, x.title, x.desc),
  }));
  const u: AppUnificado[] = utilApps.map((x) => ({
    key: `u-${x.title}`, title: x.title, subtitle: x.categoria, desc: x.desc, imageUrl: x.imageUrl,
    imageSize: x.imageSize, link: x.link, pago: false, finalidade: "utilidade" as const,
  }));
  return [...a, ...f, ...u];
}

function Card({ app }: { app: AppUnificado }) {
  const Icone = ICONE_FINALIDADE[app.finalidade];
  const inner = (
    <>
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${app.pago ? (app.glow || "from-accent-blue/15") : "from-emerald-500/10"} to-transparent`} />
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:bg-white/20" />
      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          {app.imageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)]" style={{ width: app.imageSize ?? 48, height: app.imageSize ?? 48 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={app.imageUrl} alt={app.title} className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <Icone className="h-5 w-5 text-white" />
            </div>
          )}
          {app.pago ? (
            <span className="rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">Assinatura</span>
          ) : (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">Grátis</span>
          )}
        </div>
        <h3 className="text-2xl font-medium tracking-tight">{app.title}</h3>
        {app.subtitle && <p className="mt-1 text-sm text-accent-blue" dangerouslySetInnerHTML={{ __html: sanitizeRichText(app.subtitle) }} />}
        {app.desc && <p className="mt-4 text-sm leading-relaxed text-muted" dangerouslySetInnerHTML={{ __html: sanitizeRichText(app.desc) }} />}
        {app.highlights && app.highlights.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {app.highlights.map((h) => (
              <div key={h} className="flex items-center gap-2 text-xs text-white/80"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /><span>{h}</span></div>
            ))}
          </div>
        )}
        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition group-hover:scale-[1.02] group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(95,143,255,0.35)]">
          {app.pago ? "Ver detalhes" : app.link ? "Abrir app" : "Em breve"} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </>
  );
  const cls = "group finex-scan relative overflow-hidden rounded-3xl border border-white/10 bg-panel p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20";
  return app.link
    ? <a href={app.link} target="_blank" rel="noreferrer" className={`${cls} block`}>{inner}</a>
    : <article className={cls}>{inner}</article>;
}

export default function AppsUnificados({ apps, freeApps, utilApps, cols = 3 }: {
  apps: AppData[]; freeApps: FreeAppData[]; utilApps: UtilAppData[]; cols?: number;
}) {
  const todos = normalizar(apps, freeApps, utilApps);
  const grupos = FINALIDADES
    .map((f) => ({ ...f, itens: todos.filter((a) => a.finalidade === f.valor) }))
    .filter((g) => g.itens.length > 0);

  return (
    <div className="space-y-12">
      {grupos.map((g) => (
        <div key={g.valor}>
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-white">{g.label}</h3>
            <p className="mt-0.5 text-sm text-white/45">{g.sub}</p>
          </div>
          <div className="card-grid items-start gap-5" style={colStyle(cols)}>
            {g.itens.map((app) => <Card key={app.key} app={app} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
