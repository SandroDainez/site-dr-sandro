import type { NavStyleData } from "@/lib/content";
import { NAV_GROUPS, resolveHref, isGroupActive, type NavGroup } from "@/lib/nav-structure";
import { ChevronDown } from "lucide-react";

type Props = {
  items?: NavGroup[]; // estrutura EFETIVA (NAV_GROUPS + edições do admin); fallback p/ NAV_GROUPS
  style?: NavStyleData; // aparência da barra (tamanho/espaçamento/fonte)
  internal?: boolean; // páginas internas: âncoras "#x" viram "/#x"
  currentPath?: string; // destaca o grupo da página atual
};

// Menu principal (desktop, lg+): poucos botões agrupados. Os grupos abrem um
// dropdown no hover OU quando um item recebe foco por teclado (group-focus-within),
// então funciona sem JS e continua acessível.
export default function SiteNav({ items, style, internal = false, currentPath }: Props) {
  const groups = items && items.length ? items : NAV_GROUPS;
  const s = style ?? {};
  const navStyle: React.CSSProperties = {
    paddingLeft: s.paddingX,
    paddingRight: s.paddingX,
    paddingTop: s.paddingY,
    paddingBottom: s.paddingY,
    gap: s.gap,
  };
  const fontSize = s.fontScale ? `${0.875 * s.fontScale}rem` : undefined;
  const itemStyle: React.CSSProperties = { paddingLeft: s.itemPaddingX, paddingRight: s.itemPaddingX, fontSize };

  const triggerBase = "nav-beam flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 transition";

  return (
    <nav
      data-typo="nav"
      style={navStyle}
      className="hidden items-center gap-0 rounded-full border border-white/15 bg-black/80 px-1.5 py-1.5 text-[12.5px] font-medium text-white/85 backdrop-blur-md lg:flex"
    >
      {groups.map((group) => {
        const active = isGroupActive(group, currentPath);

        // Item simples (sem filhos), ex.: Início
        if (!group.children) {
          const href = resolveHref(group.href || "#", internal);
          return (
            <a
              key={group.label}
              href={href}
              style={itemStyle}
              className={
                active
                  ? "whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1.5 font-medium text-white"
                  : `${triggerBase} text-white/85 hover:bg-white/10 hover:text-white`
              }
            >
              {group.label}
            </a>
          );
        }

        // Grupo com dropdown
        return (
          <div key={group.label} className="group relative">
            <button
              type="button"
              aria-haspopup="true"
              style={itemStyle}
              className={`${triggerBase} ${active ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/10 hover:text-white group-hover:bg-white/10 group-hover:text-white"}`}
            >
              {group.label}
              <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-hover:rotate-180" />
            </button>

            {/* painel: invisível por opacidade (links continuam focáveis p/ teclado) */}
            <div className="pointer-events-none absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
              <div className="min-w-[210px] overflow-hidden rounded-2xl border border-white/15 bg-[#0b0f17]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl">
                {group.children.map((c) => {
                  const href = resolveHref(c.href, internal);
                  const isActive = !!currentPath && c.href === currentPath;
                  return (
                    <a
                      key={c.label}
                      href={href}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition ${isActive ? "bg-white/10 font-medium text-white" : "text-white/75 hover:bg-white/[0.07] hover:text-white"}`}
                    >
                      {c.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logoUrl} alt="" className="h-5 w-5 shrink-0 rounded-md object-contain" />
                      ) : c.emoji ? (
                        <span className="text-base leading-none">{c.emoji}</span>
                      ) : null}
                      {c.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
