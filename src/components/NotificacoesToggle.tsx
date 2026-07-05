"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { salvarInscricao, removerInscricao } from "@/app/minha-area/push-actions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function NotificacoesToggle() {
  const [suportado, setSuportado] = useState(false);
  const [ativado, setAtivado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
    setSuportado(ok);
    if (!ok) return;
    navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then((s) => setAtivado(!!s)).catch(() => {});
  }, []);

  async function ativar() {
    setErro(null); setOcupado(true);
    try {
      const { publicKey } = await (await fetch("/api/push/vapid")).json();
      if (!publicKey) { setErro("Notificações ainda não configuradas no servidor."); setOcupado(false); return; }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setErro("Permissão negada. Ative as notificações nas configurações do navegador."); setOcupado(false); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const j: any = sub.toJSON();
      const r = await salvarInscricao({ endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } });
      if (r.ok) setAtivado(true); else setErro("Não consegui salvar. Tente de novo.");
    } catch { setErro("Não foi possível ativar (no iPhone, instale o app na tela inicial primeiro)."); }
    finally { setOcupado(false); }
  }

  async function desativar() {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await removerInscricao(sub.endpoint); await sub.unsubscribe(); }
      setAtivado(false);
    } catch {} finally { setOcupado(false); }
  }

  if (!suportado) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        {ativado ? <Bell className="h-5 w-5 text-accent" /> : <BellOff className="h-5 w-5 text-white/50" />}
        <div>
          <p className="text-sm font-semibold text-white">Lembretes de estudo</p>
          <p className="text-[11px] text-white/45">{ativado ? "Você recebe um lembrete quando há questões para revisar." : "Receba um lembrete diário para manter a ofensiva."}</p>
        </div>
      </div>
      <button type="button" onClick={ativado ? desativar : ativar} disabled={ocupado}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${ativado ? "border border-white/15 text-white/70 hover:text-white" : "bg-accent text-[#0f1420] hover:opacity-90"}`}>
        {ocupado ? "…" : ativado ? "Desativar" : "Ativar"}
      </button>
      {erro && <p className="w-full text-xs text-amber-300">{erro}</p>}
    </div>
  );
}
