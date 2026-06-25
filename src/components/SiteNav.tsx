import type { NavItemData, NavStyleData } from "@/lib/content";

type Props = {
  items: NavItemData[];
  style?: NavStyleData; // aparência da barra (tamanho/espaçamento/fonte)
  internal?: boolean; // páginas internas: âncoras "#x" viram "/#x"
  currentPath?: string; // destaca o item da página atual
};

export default function SiteNav({ items, style, internal = false, currentPath }: Props) {
  const s = style ?? {};
  const navStyle: React.CSSProperties = {
    paddingLeft: s.paddingX,
    paddingRight: s.paddingX,
    paddingTop: s.paddingY,
    paddingBottom: s.paddingY,
    gap: s.gap,
  };
  const itemStyle: React.CSSProperties = {
    paddingLeft: s.itemPaddingX,
    paddingRight: s.itemPaddingX,
    fontSize: s.fontScale ? `${0.875 * s.fontScale}rem` : undefined,
  };

  return (
    <nav
      data-typo="nav"
      style={navStyle}
      className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-black/75 px-2 py-2 text-[13px] text-white/70 backdrop-blur-md lg:flex"
    >
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
            style={itemStyle}
            className={
              active
                ? "whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1.5 font-medium text-white"
                : "nav-beam whitespace-nowrap rounded-full px-2.5 py-1.5 transition hover:text-white"
            }
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
