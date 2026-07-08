"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, Trash2, ExternalLink, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import ImagemProtocolo from "@/components/admin/ImagemProtocolo";
import AreasEditora from "@/components/admin/AreasEditora";
import { excluirDoc } from "@/app/admin/editora/arquiteto-protocolos/actions";

type Prot = { id: string; title: string; slug: string; status: string; specialty: string };
const ESP: Record<string, string> = { emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral" };
const STATUS: Record<string, string> = { published: "publicado", draft: "rascunho", archived: "arquivado" };

export default function ProtocolosEditoraAdmin({ protocolos }: { protocolos: Prot[] }) {
  const [lista, setLista] = useState(protocolos);
  const [aberto, setAberto] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  if (lista.length === 0) return null;

  function excluir(p: Prot) {
    if (!window.confirm(`Excluir o protocolo "${p.title}"? Esta ação não pode ser desfeita.`)) return;
    setErro(null);
    start(async () => {
      const r = await excluirDoc(p.id);
      if (r.ok) setLista((prev) => prev.filter((x) => x.id !== p.id));
      else setErro(r.error);
    });
  }

  return (
    <div className="mb-10 rounded-2xl border border-accent/20 bg-accent/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold text-white">Protocolos gerados por IA (Editora)</p>
      </div>
      <p className="mb-4 text-xs text-white/50">
        Estes são criados no <strong className="text-white/70">Arquiteto de Protocolos</strong>. Aqui você define a
        <strong className="text-white/70"> imagem/logo</strong> e pode <strong className="text-white/70">excluir</strong>;
        para editar o conteúdo, abra no Arquiteto.
      </p>
      <div className="space-y-2">
        {lista.map((p) => (
          <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{p.title}</span>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase text-white/50">{ESP[p.specialty] ?? p.specialty}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] ${p.status === "published" ? "border-accent/40 bg-accent/10 text-accent" : "border-white/15 text-white/45"}`}>{STATUS[p.status] ?? p.status}</span>
              <button type="button" onClick={() => setAberto(aberto === `img:${p.id}` ? null : `img:${p.id}`)} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-white/70 transition hover:text-white">
                Imagem {aberto === `img:${p.id}` ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <button type="button" onClick={() => setAberto(aberto === `area:${p.id}` ? null : `area:${p.id}`)} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-white/70 transition hover:text-white">
                Especialidades {aberto === `area:${p.id}` ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <Link href="/admin/editora/arquiteto-protocolos" className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-white/70 transition hover:text-white">
                <ExternalLink className="h-3 w-3" /> Arquiteto
              </Link>
              <button type="button" onClick={() => excluir(p)} disabled={busy} className="inline-flex items-center gap-1 rounded-full border border-rose-400/25 px-2.5 py-1 text-[11px] text-rose-300/80 transition hover:text-rose-300 disabled:opacity-50">
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Excluir
              </button>
            </div>
            {aberto === `img:${p.id}` && <div className="border-t border-white/10 p-3"><ImagemProtocolo protocolId={p.id} /></div>}
            {aberto === `area:${p.id}` && <div className="border-t border-white/10 p-3"><AreasEditora tabela="protocols" docId={p.id} /></div>}
          </div>
        ))}
      </div>
      {erro && <p className="mt-2 text-xs text-rose-300">{erro}</p>}
    </div>
  );
}
