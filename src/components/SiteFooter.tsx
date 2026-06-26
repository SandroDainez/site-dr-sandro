import { getSiteConfig } from "@/lib/content";
import { Home } from "lucide-react";

// Links absolutos (funcionam de qualquer página: "/#x" vai pra home e rola até a seção)
const LINKS: { label: string; href: string }[] = [
  { label: "Cursos", href: "/cursos" },
  { label: "Atualizações", href: "/atualizacoes" },
  { label: "Protocolos", href: "/protocolos" },
  { label: "Videoaulas", href: "/videoaulas" },
  { label: "Podcast", href: "/podcast" },
  { label: "Colaboradores", href: "/colaboradores" },
  { label: "Apps", href: "/#apps-assinatura" },
  { label: "Apps do dia a dia", href: "/#apps-uteis" },
  { label: "Eventos", href: "/#eventos" },
  { label: "Contato", href: "/#contato" },
];

export default async function SiteFooter() {
  const cfg = await getSiteConfig();

  return (
    <footer className="border-t border-white/10 bg-black/20 py-10" data-typo="footer">
      <div className="mx-auto w-full max-w-7xl px-6">
        {/* Atalho claro para o início */}
        <div className="flex justify-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-accent/40 hover:text-white"
          >
            <Home className="h-4 w-4" /> Voltar ao início
          </a>
        </div>

        {/* Mapa do site */}
        <nav className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/55">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-white">
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
