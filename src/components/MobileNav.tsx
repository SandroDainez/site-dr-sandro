import type { NavItemData, NavStyleData } from "@/lib/content";

type Props = {
  items: NavItemData[];
  style?: NavStyleData;
  internal?: boolean;
  currentPath?: string;
};

// Menu para telas pequenas: faixa de "pílulas" rolável horizontalmente,
// abaixo do cabeçalho. Aparece só no mobile (escondido em lg+).
export default function MobileNav({ items, style, internal = false, currentPath }: Props) {
  const fontSize = style?.fontScale ? `${0.8125 * style.fontScale}rem` : undefined;
  return (
    <nav
      data-typo="nav"
      aria-label="Menu"
      className="mobile-nav-scroll -mx-6 w-[calc(100%+3rem)] overflow-x-auto px-6 pt-1 lg:hidden"
    >
      <div className="flex w-max items-center gap-2">
        {items.map((item, i) => {
          let href = item.href || "#";
          if (internal && href.startsWith("#")) href = "/" + href;
          const isExternal = /^https?:\/\//.test(href);
          const active = !!currentPath && href === currentPath;
          return (
            <a
              key={`${item.label}-${i}`}
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noreferrer" : undefined}
              style={{ fontSize }}
              className={
                "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] transition " +
                (active
                  ? "border-accent/40 bg-accent/15 font-medium text-accent"
                  : "border-white/10 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white")
              }
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
