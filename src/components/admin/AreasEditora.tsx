"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Loader2, MapPin } from "lucide-react";
import { AREAS_SITE } from "@/lib/editora/areas";
import { getAreasEditora, definirAreasEditora } from "@/app/admin/editora/areas-actions";

// Seleção múltipla PLANA de especialidades onde o conteúdo publicado aparece nos hubs
// (/especialidade/[area]). Todas as áreas têm o mesmo peso — marque quantas quiser.
// Autossuficiente: carrega o valor atual do documento e salva a cada clique.
export default function AreasEditora({ tabela, docId }: { tabela: string; docId: string }) {
  const [areas, setAreas] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    getAreasEditora(tabela, docId).then((r) => {
      if (!vivo) return;
      if (r.ok) setAreas(r.data);
      setCarregando(false);
    });
    return () => { vivo = false; };
  }, [tabela, docId]);

  function alternar(id: string) {
    const proximo = areas.includes(id) ? areas.filter((a) => a !== id) : [...areas, id];
    setAreas(proximo); // otimista
    setErro(null);
    start(async () => {
      const r = await definirAreasEditora(tabela, docId, proximo);
      if (r.ok) setAreas(r.data);
      else setErro(r.error);
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold text-white">Aparece nos hubs de</p>
        {salvando && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />}
      </div>
      <p className="mb-3 text-xs text-white/50">
        Marque as especialidades em que este conteúdo deve aparecer na página da especialidade.
        Sem nenhuma marcada, ele fica só na sua listagem — não aparece em hub nenhum.
      </p>
      <div className="flex flex-wrap gap-2">
        {AREAS_SITE.map((a) => {
          const on = areas.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              disabled={carregando}
              onClick={() => alternar(a.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                on
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-white/15 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white/80"
              }`}
            >
              {on && <Check className="h-3.5 w-3.5" />}
              {a.label}
            </button>
          );
        })}
      </div>
      {erro && <p className="mt-2 text-xs text-rose-300">{erro}</p>}
    </div>
  );
}
