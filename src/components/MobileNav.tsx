"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { NavStyleData } from "@/lib/content";
import { NAV_GROUPS, resolveHref, isGroupActive, type NavGroup } from "@/lib/nav-structure";
import NavBack from "@/components/NavBack";

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
          {currentPath && currentPath !== "/" && (
            <NavBack currentPath={currentPath} className={`${chip} flex items-center gap-1 ${chipIdle}`} />
          )}
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
            // Zona (tem href): o rótulo NAVEGA e o chevron ao lado ABRE a lista do que
            // tem dentro — dois alvos no mesmo pill. "Mais" (sem href) é só um toggle.
            if (group.href) {
              return (
                <span
                  key={group.label}
                  style={{ fontSize }}
                  className={`${chip} inline-flex items-center gap-1.5 !pr-1.5 ${active || isOpen ? chipActive : chipIdle}`}
                >
                  <a href={resolveHref(group.href, internal)} className="whitespace-nowrap">{group.label}</a>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-label={`Ver o que tem em ${group.label}`}
                    onClick={() => setOpen(isOpen ? null : group.label)}
                    className="-my-1 rounded-full p-1 hover:bg-white/10"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </span>
              );
            }
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
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {openGroup.children.map((c) => {
            const isActive = !!currentPath && c.href === currentPath;
            return (
              <a
                key={c.label}
                href={resolveHref(c.href, internal)}
                onClick={() => setOpen(null)}
                style={{ fontSize }}
                className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-2.5 text-[13px] transition ${isActive ? chipActive : "border-white/10 bg-white/[0.04] text-white/85"}`}
              >
                {c.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logoUrl} alt="" className="mt-0.5 h-4 w-4 shrink-0 rounded object-contain" />
                ) : c.emoji ? (
                  <span className="mt-0.5 text-sm leading-none">{c.emoji}</span>
                ) : null}
                <span className="min-w-0">
                  <span className="block font-medium leading-tight">{c.label}</span>
                  {c.hint && <span className="mt-0.5 block text-[11px] leading-snug text-white/45">{c.hint}</span>}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
