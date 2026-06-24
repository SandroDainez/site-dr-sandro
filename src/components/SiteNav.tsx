import type { NavItemData } from "@/lib/content";

type Props = {
  items: NavItemData[];
  internal?: boolean; // páginas internas: âncoras "#x" viram "/#x"
  currentPath?: string; // destaca o item da página atual
};

export default function SiteNav({ items, internal = false, currentPath }: Props) {
  return (
    <nav
      data-typo="nav"
      className="hidden items-center gap-3 rounded-full border border-white/10 bg-black/75 px-3 py-2 text-sm text-white/70 backdrop-blur-md lg:flex"
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
            className={
              active
                ? "rounded-full bg-white/10 px-3 py-1.5 font-medium text-white"
                : "nav-beam rounded-full px-3 py-1.5 transition hover:text-white"
            }
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
