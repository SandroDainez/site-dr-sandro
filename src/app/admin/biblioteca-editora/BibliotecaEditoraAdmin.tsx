"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Search, Globe, Download, SendHorizonal, Loader2, CheckCircle2, Library } from "lucide-react";
import { listarBibliotecaEditora, enviarParaReferencias, type ItemBiblioteca } from "./actions";

const MODULO_LABEL: Record<string, string> = {
  "arquiteto-protocolos": "Arquiteto de Protocolos",
  "editor-cientifico": "Editor Científico",
  "editor-premium": "Editor Premium",
  "criador-aulas": "Criador de Aulas",
  "criador-flashcards": "Criador de Flashcards",
  "criador-questoes": "Criador de Questões",
  "comparador-guidelines": "Comparador de Guidelines",
  "pesquisador-cientifico": "Pesquisador Científico",
  "atualizador-protocolos": "Atualizador de Protocolos",
};

const ESP_LABEL: Record<string, string> = { emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral" };

function exportarTxt(item: ItemBiblioteca) {
  const blob = new Blob([`${item.titulo}\n\n${item.texto}`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${item.slug || "conteudo"}.txt`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function BibliotecaEditoraAdmin({ inicial }: { inicial: ItemBiblioteca[] }) {
  const [itens, setItens] = useState<ItemBiblioteca[]>(inicial);
  const [q, setQ] = useState("");
  const [modulo, setModulo] = useState<string>("");
  const [busy, startTransition] = useTransition();
  const [enviando, setEnviando] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function buscar() {
    setError(null);
    startTransition(async () => {
      const r = await listarBibliotecaEditora({ q: q.trim() || undefined, modulo: modulo || undefined });
      if (r.ok) setItens(r.data ?? []); else setError(r.error ?? "Erro ao buscar.");
    });
  }

  function enviarPraReferencias(item: ItemBiblioteca) {
    setEnviando(item.id); setError(null);
    startTransition(async () => {
      const r = await enviarParaReferencias(item.id);
      if (r.ok) setEnviados((prev) => new Set(prev).add(item.id));
      else setError(r.error ?? "Erro ao enviar.");
      setEnviando(null);
    });
  }

  const modulosPresentes = useMemo(() => Array.from(new Set(inicial.map((i) => i.modulo))), [inicial]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && buscar()}
            placeholder="Buscar por título ou conteúdo…"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-accent/50"
          />
        </div>
        <select value={modulo} onChange={(e) => setModulo(e.target.value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-accent/50">
          <option value="">Todos os módulos</option>
          {modulosPresentes.map((m) => <option key={m} value={m}>{MODULO_LABEL[m] ?? m}</option>)}
        </select>
        <button type="button" onClick={buscar} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
        </button>
      </div>

      {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>}

      {itens.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <Library className="mx-auto mb-2 h-6 w-6 text-white/25" />
          <p className="text-sm text-white/50">Nada publicado ainda (ou nada bate com essa busca). Publique algo em qualquer módulo da Editora e aparece aqui automaticamente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">{MODULO_LABEL[item.modulo] ?? item.modulo}</span>
                <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] text-white/50">{ESP_LABEL[item.especialidade] ?? item.especialidade}</span>
                {item.areas.length > 0 && item.areas.map((a) => <span key={a} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/35">+{ESP_LABEL[a] ?? a}</span>)}
              </div>
              <p className="font-medium text-white">{item.titulo}</p>
              <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-white/50">{item.texto.slice(0, 280)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link href={item.url_publica} target="_blank" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition hover:text-white">
                  <Globe className="h-3.5 w-3.5" /> Ver no site
                </Link>
                <button type="button" onClick={() => exportarTxt(item)} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition hover:text-white">
                  <Download className="h-3.5 w-3.5" /> Exportar
                </button>
                {enviados.has(item.id) ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"><CheckCircle2 className="h-3.5 w-3.5" /> Enviado pro Banco de Referências</span>
                ) : (
                  <button type="button" onClick={() => enviarPraReferencias(item)} disabled={enviando === item.id} className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50">
                    {enviando === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SendHorizonal className="h-3.5 w-3.5" />} Enviar pro Banco de Referências 1
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
