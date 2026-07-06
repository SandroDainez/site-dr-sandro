"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { NavStyleData } from "@/lib/content";
import { NAV_GROUPS, resolveHref, isGroupActive, type NavGroup } from "@/lib/nav-structure";

type Props = {
  items?: NavGroup[]; // estrutura EFETIVA (NAV_GROUPS + edições do admin); fallback p/ NAV_GROUPS
  style?: NavStyleData;
  internal?: boolean;
  currentPath?: string;
};

// Menu mobile (escondido em lg+): linha de grupos; tocar um grupo abre os
// assuntos relacionados logo abaixo. Início navega direto.
export default function MobileNav({ items, style, internal = false, currentPath }: Props) {
  const groups = items && items.length ? items : NAV_GROUPS;
  const [open, setOpen] = useState<string | null>(null);
  const fontSize = style?.fontScale ? `${0.8125 * style.fontScale}rem` : undefined;
  const openGroup = open ? groups.find((g) => g.label === open) : null;

  const chip = "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] transition";
  const chipIdle = "border-white/10 bg-black/40 text-white/70";
  const chipActive = "border-accent/40 bg-accent/15 font-medium text-accent";

  return (
    <div className="w-full lg:hidden">
      <nav
        data-typo="nav"
        aria-label="Menu"
        className="mobile-nav-scroll -mx-6 w-[calc(100%+3rem)] overflow-x-auto px-6 pt-1"
      >
        <div className="flex w-max items-center gap-2">
          {groups.map((group) => {
            const active = isGroupActive(group, currentPath);
            if (!group.children) {
              return (
                <a
                  key={group.label}
                  href={resolveHref(group.href || "#", internal)}
                  style={{ fontSize }}
                  className={`${chip} ${active ? chipActive : chipIdle}`}
                >
                  {group.label}
                </a>
              );
            }
            const isOpen = open === group.label;
            return (
              <button
                key={group.label}
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : group.label)}
                style={{ fontSize }}
                className={`${chip} flex items-center gap-1 ${active || isOpen ? chipActive : chipIdle}`}
              >
                {group.label}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
            );
          })}
        </div>
      </nav>

      {openGroup?.children && (
        <div className="mt-2 flex flex-wrap gap-2">
          {openGroup.children.map((c) => {
            const isActive = !!currentPath && c.href === currentPath;
            return (
              <a
                key={c.label}
                href={resolveHref(c.href, internal)}
                onClick={() => setOpen(null)}
                style={{ fontSize }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition ${isActive ? chipActive : "border-white/10 bg-white/[0.04] text-white/80"}`}
              >
                {c.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logoUrl} alt="" className="h-4 w-4 shrink-0 rounded object-contain" />
                ) : c.emoji ? (
                  <span className="text-sm leading-none">{c.emoji}</span>
                ) : null}
                {c.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
