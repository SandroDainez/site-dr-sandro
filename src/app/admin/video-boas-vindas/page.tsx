export const dynamic = "force-dynamic";

import Link from "next/link";
import { getVideoBoasVindas } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import VideoBoasVindasEditor from "./VideoBoasVindasEditor";

export default async function VideoBoasVindasPage() {
  const video = await getVideoBoasVindas();
  return (
    <div className="max-w-2xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Vídeo de boas-vindas</h1>
        <p className="mt-1 text-sm text-white/50">
          Um vídeo seu que abre sozinho num cartão flutuante quando a pessoa entra no site — ela pode
          fechar/ignorar. Sempre que você <strong className="text-white/70">salvar</strong> (novo vídeo ou texto),
          ele <strong className="text-white/70">reaparece</strong> pra quem já tinha fechado (é um recado novo).
        </p>
      </div>

      <AdminHelp>Cole o link do vídeo (YouTube), escreva um título e ligue. Sem som automático — a pessoa clica pra ouvir. Para tirar, é só desligar e salvar.</AdminHelp>

      <VideoBoasVindasEditor initial={video} />
    </div>
  );
}
