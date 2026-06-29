"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ArrowUpRight, Stethoscope } from "lucide-react";

type Fonte = { titulo: string; url: string | null; tipo: string; pmid?: string };
type Msg = { autor: "voce" | "ia"; texto: string; fontes?: Fonte[] };

const SUGESTOES = [
  "O que há de novo sobre sepse?",
  "Anestesia regional em paciente anticoagulado",
  "Sangue total no trauma — evidência recente",
];

export default function AssistenteChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, carregando]);

  async function enviar(pergunta: string) {
    const q = pergunta.trim();
    if (!q || carregando) return;
    setInput("");
    setMsgs((m) => [...m, { autor: "voce", texto: q }]);
    setCarregando(true);
    try {
      const r = await fetch("/api/assistente", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pergunta: q }) });
      const d = await r.json();
      if (!r.ok) setMsgs((m) => [...m, { autor: "ia", texto: d.error || "Não consegui responder agora." }]);
      else setMsgs((m) => [...m, { autor: "ia", texto: d.resposta, fontes: d.fontes }]);
    } catch {
      setMsgs((m) => [...m, { autor: "ia", texto: "Erro de conexão. Tente de novo." }]);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {msgs.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-2 flex items-center gap-2 text-accent"><Sparkles className="h-5 w-5" /><p className="font-semibold text-white">Pergunte sobre o conteúdo do portal</p></div>
            <p className="text-sm text-white/55">Respondo primeiro com o conteúdo curado do portal (sempre com a fonte) e, quando preciso, busco no PubMed. Não invento: se não houver referência, eu aviso.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button key={s} onClick={() => enviar(s)} className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:border-accent/40 hover:text-white">{s}</button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.autor === "voce" ? "justify-end" : ""}`}>
            {m.autor === "ia" && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><Stethoscope className="h-4 w-4" /></span>}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.autor === "voce" ? "bg-accent text-[#07090f]" : "border border-white/10 bg-white/[0.04] text-white/85"}`}>
              <p className="whitespace-pre-wrap">{m.texto}</p>
              {m.fontes && m.fontes.length > 0 && (
                <div className="mt-3 border-t border-white/10 pt-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">Fontes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.fontes.map((f, j) => {
                      const isPub = f.tipo === "pubmed";
                      const tag = isPub ? "PubMed" : "Portal";
                      const cls = `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition ${isPub ? "border-sky-400/30 bg-sky-400/10 text-sky-300 hover:bg-sky-400/20" : "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"}`;
                      const conteudo = (
                        <>
                          <span className="font-semibold opacity-70">{tag}</span> {f.titulo}
                          {f.url && <ArrowUpRight className="h-3 w-3" />}
                        </>
                      );
                      return f.url ? (
                        <a key={j} href={f.url} target={f.url.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={cls}>{conteudo}</a>
                      ) : (
                        <span key={j} className={cls}>{conteudo}</span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {carregando && (
          <div className="flex gap-3">
            <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><Stethoscope className="h-4 w-4" /></span>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/50">Consultando o portal e o PubMed…</div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); enviar(input); }} className="relative shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo clínico…"
          className="w-full rounded-2xl border border-white/15 bg-black/40 py-3.5 pl-4 pr-14 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
        />
        <button type="submit" disabled={carregando || !input.trim()} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-accent text-[#07090f] transition hover:opacity-90 disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-2 shrink-0 text-center text-[11px] text-white/35">Apoio à decisão — a palavra final é sempre do médico. Fontes: conteúdo do portal e PubMed.</p>
    </div>
  );
}
