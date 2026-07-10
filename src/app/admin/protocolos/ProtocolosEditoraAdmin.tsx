"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, Trash2, ExternalLink, Loader2, Check } from "lucide-react";
import ImagemEditora from "@/components/admin/ImagemEditora";
import AreasEditora from "@/components/admin/AreasEditora";
import { AREAS_SITE } from "@/lib/editora/areas";
import { definirEspecialidadePrincipal, definirTituloEditora } from "@/app/admin/editora/areas-actions";
import { excluirDoc } from "@/app/admin/editora/arquiteto-protocolos/actions";

type Prot = { id: string; title: string; slug: string; status: string; specialty: string };
const ESP: Record<string, string> = { emergencias: "Emergências", ti: "Terapia Intensiva", anestesiologia: "Anestesiologia", geral: "Geral" };
const STATUS: Record<string, string> = { published: "publicado", draft: "rascunho", archived: "arquivado" };

// Mesma linguagem visual do editor manual (ProtocolosEditor.tsx): cartão sempre expandido,
// rótulos em maiúsculas pequenas, seções empilhadas — sem menus escondidos atrás de toggles.
const labelCls = "mb-1 block text-xs uppercase tracking-[0.1em] text-white/40";
const inputCls = "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50";

export default function ProtocolosEditoraAdmin({ protocolos }: { protocolos: Prot[] }) {
  const [lista, setLista] = useState(protocolos);
  const [titulos, setTitulos] = useState<Record<string, string>>(() => Object.fromEntries(protocolos.map((p) => [p.id, p.title])));
  const [salvoTitulo, setSalvoTitulo] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  if (lista.length === 0) return null;

  function mudarEspecialidade(p: Prot, especialidade: string) {
    setErro(null);
    setLista((prev) => prev.map((x) => (x.id === p.id ? { ...x, specialty: especialidade } : x)));
    start(async () => {
      const r = await definirEspecialidadePrincipal("protocols", p.id, especialidade);
      if (!r.ok) { setErro(r.error); setLista((prev) => prev.map((x) => (x.id === p.id ? { ...x, specialty: p.specialty } : x))); }
    });
  }

  function salvarTitulo(p: Prot) {
    const novo = (titulos[p.id] ?? "").trim();
    if (!novo || novo === p.title) return;
    setErro(null); setSalvoTitulo(null);
    start(async () => {
      const r = await definirTituloEditora("protocols", p.id, novo);
      if (r.ok) { setLista((prev) => prev.map((x) => (x.id === p.id ? { ...x, title: novo } : x))); setSalvoTitulo(p.id); setTimeout(() => setSalvoTitulo(null), 2000); }
      else { setErro(r.error); setTitulos((prev) => ({ ...prev, [p.id]: p.title })); }
    });
  }

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
    <div className="mb-10">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold text-white">Protocolos gerados por IA (Editora)</p>
      </div>
      <p className="mb-4 text-xs text-white/50">
        Estes são criados no <strong className="text-white/70">Arquiteto de Protocolos</strong>. Aqui você ajusta título,
        especialidade, imagem/logo e pode excluir. O <strong className="text-white/70">conteúdo</strong> (as seções do
        protocolo) só se edita no Arquiteto; o <strong className="text-white/70">PDF</strong> é gerado automaticamente a
        partir desse conteúdo — não há upload manual de PDF aqui.
      </p>
      {erro && <p className="mb-3 text-xs text-rose-300">{erro}</p>}
      <div className="space-y-4">
        {lista.map((p) => (
          <div key={p.id} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <span className={`rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${p.status === "published" ? "border-accent/40 bg-accent/10 text-accent" : "border-white/15 text-white/50"}`}>
                {STATUS[p.status] ?? p.status}
              </span>
              <div className="flex items-center gap-2">
                <Link href={`/protocolos/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-white/50 transition hover:text-white">
                  <ExternalLink className="h-3.5 w-3.5" /> Ver no site
                </Link>
                <button type="button" onClick={() => excluir(p)} disabled={busy} className="rounded-lg p-1.5 text-white/40 transition hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50" title="Excluir">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* título (editável) */}
            <div>
              <label className={labelCls}>Título</label>
              <div className="flex items-center gap-2">
                <input type="text" value={titulos[p.id] ?? p.title} onChange={(e) => setTitulos((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  onBlur={() => salvarTitulo(p)} className={inputCls} />
                {salvoTitulo === p.id && <Check className="h-4 w-4 shrink-0 text-accent" />}
              </div>
            </div>

            {/* slug (somente leitura — muda a URL pública, editar aqui é arriscado) */}
            <div>
              <label className={labelCls}>Slug (URL pública — gerado automaticamente)</label>
              <input type="text" value={p.slug} readOnly disabled className={inputCls + " cursor-not-allowed opacity-60"} />
            </div>

            {/* área principal */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Área (especialidade principal)</label>
                <select value={p.specialty} onChange={(e) => mudarEspecialidade(p, e.target.value)} disabled={busy} className={inputCls}>
                  {AREAS_SITE.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  {!AREAS_SITE.some((a) => a.id === p.specialty) && <option value={p.specialty}>{ESP[p.specialty] ?? p.specialty}</option>}
                </select>
              </div>
              <div>
                <label className={labelCls}>Conteúdo e PDF</label>
                <Link href="/admin/editora/arquiteto-protocolos" className={inputCls + " flex items-center justify-center gap-1.5 text-center text-accent transition hover:border-accent/40"}>
                  <ExternalLink className="h-3.5 w-3.5" /> Editar no Arquiteto de Protocolos
                </Link>
              </div>
            </div>

            <AreasEditora tabela="protocols" docId={p.id} />

            <div>
              <label className={labelCls}>Imagem</label>
              <ImagemEditora tabela="protocols" docId={p.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
