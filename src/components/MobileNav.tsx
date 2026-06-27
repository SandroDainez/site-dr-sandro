"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { NavItemData, NavStyleData } from "@/lib/content";
import { NAV_GROUPS, resolveHref, isGroupActive } from "@/lib/nav-structure";

type Props = {
  items?: NavItemData[]; // compat; estrutura vem de NAV_GROUPS
  style?: NavStyleData;
  internal?: boolean;
  currentPath?: string;
};

// Menu mobile (escondido em lg+): linha de grupos; tocar um grupo abre os
// assuntos relacionados logo abaixo. Início navega direto.
export default function MobileNav({ style, internal = false, currentPath }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const fontSize = style?.fontScale ? `${0.8125 * style.fontScale}rem` : undefined;
  const openGroup = open ? NAV_GROUPS.find((g) => g.label === open) : null;

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
          {NAV_GROUPS.map((group) => {
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
                {c.emoji && <span className="text-sm leading-none">{c.emoji}</span>}
                {c.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
