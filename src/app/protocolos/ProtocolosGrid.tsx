"use client";

import { useState } from "react";
import type { ProtocoloData } from "@/lib/content";
import ProtocoloCard from "@/components/ProtocoloCard";
import { colStyle } from "@/lib/card-grid";

type Props = {
  protocolos: ProtocoloData[];
  cols?: number;
};

type FilterArea = "todos" | ProtocoloData["area"];

const tabs: { value: FilterArea; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "emergencias", label: "Emergências" },
  { value: "ti", label: "TI" },
  { value: "anestesiologia", label: "Anestesiologia" },
];

export default function ProtocolosGrid({ protocolos, cols }: Props) {
  const [active, setActive] = useState<FilterArea>("todos");

  const sorted = [...protocolos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const filtered = active === "todos" ? sorted : sorted.filter((p) => p.area === active || p.areas?.includes(active));

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActive(tab.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              active === tab.value
                ? "border-accent bg-accent/15 text-accent"
                : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-sm text-white/40">Nenhum protocolo nesta área ainda.</p>}

      <div className="card-grid gap-5" style={colStyle(cols)}>
        {filtered.map((item) => (
          <ProtocoloCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
