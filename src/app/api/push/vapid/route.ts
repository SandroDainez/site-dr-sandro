import { NextResponse } from "next/server";

// Entrega a chave pública VAPID em tempo de execução (não precisa rebuild ao
// configurar). Vazio = notificações ainda não configuradas (UI esconde o botão).
export function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
}
