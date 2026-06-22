"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import type { HeaderData } from "@/lib/content";
import { saveHeader } from "@/app/admin/actions";

type Props = {
  initialHeader: HeaderData;
};

export default function HeaderEditor({ initialHeader }: Props) {
  const [header, setHeader] = useState<HeaderData>(initialHeader);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof HeaderData, value: string) {
    setHeader((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveHeader(header);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            Nome completo
          </label>
          <input
            type="text"
            value={header.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            CRM (ex: CREMESP 76.907)
          </label>
          <input
            type="text"
            value={header.cremesp}
            onChange={(e) => update("cremesp", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            Especialidade 1 — RQE (ex: Anestesiologia RQE 58.201)
          </label>
          <input
            type="text"
            value={header.rqe1}
            onChange={(e) => update("rqe1", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            Especialidade 2 — RQE (ex: Medicina Intensiva RQE 58.202)
          </label>
          <input
            type="text"
            value={header.rqe2}
            onChange={(e) => update("rqe2", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
            URL da logo (ex: /logo-medicina.png ou URL externa)
          </label>
          <input
            type="text"
            value={header.logoUrl}
            onChange={(e) => update("logoUrl", e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
          />
          <p className="mt-1 text-xs text-muted">
            Para trocar a logo, faça upload da imagem na pasta /public do projeto e coloque o caminho aqui (ex: /minha-logo.png).
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.1em] text-muted">Preview</p>
          <p className="text-base font-bold text-white">{header.name}</p>
          <p className="text-xs text-accent">{header.cremesp}</p>
          <p className="text-xs text-accent">{header.rqe1}</p>
          <p className="text-xs text-accent">{header.rqe2}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#07090f] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar cabeçalho"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
