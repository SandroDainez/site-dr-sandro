import { getSiteConfig, getUiTexts, getNavItems } from "@/lib/content";
import { uiText } from "@/lib/ui-texts";
import { Home } from "lucide-react";

export default async function SiteFooter() {
  const [cfg, ui, navItems] = await Promise.all([getSiteConfig(), getUiTexts(), getNavItems()]);

  // Mapa do site = o menu do topo (editável em /admin/menu) + as páginas de
  // tipo que ficam dentro dos hubs de especialidade (p/ continuarem acessíveis).
  // Âncoras "#x" viram "/#x"; pula "Início" (já tem o botão "Voltar ao início").
  const base = navItems
    .filter((it) => (it.href || "/") !== "/")
    .map((it) => ({ label: it.label, href: it.href?.startsWith("#") ? `/${it.href}` : it.href || "/" }));
  const extras = [
    { label: "Protocolos", href: "/protocolos" },
    { label: "Videoaulas", href: "/videoaulas" },
    { label: "Atualizações", href: "/atualizacoes" },
  ].filter((e) => !base.some((b) => b.href === e.href));
  const links = [...base, ...extras];

  return (
    <footer className="border-t border-white/10 bg-black/20 py-10" data-typo="footer">
      <div className="mx-auto w-full max-w-7xl px-6">
        {/* Atalho claro para o início */}
        <div className="flex justify-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-accent transition hover:border-accent/70 hover:bg-accent/20"
          >
            <Home className="h-4 w-4" /> {uiText(ui, "footerVoltar")}
          </a>
        </div>

        {/* Mapa do site */}
        <nav className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/55">
          {links.map((l, i) => (
            <a key={`${l.href}-${i}`} href={l.href} className="transition hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Assinatura */}
        <div className="mt-7 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row">
          <p>{cfg.footerName}</p>
          <p>{cfg.footerTagline}</p>
        </div>
      </div>
    </footer>
  );
}
