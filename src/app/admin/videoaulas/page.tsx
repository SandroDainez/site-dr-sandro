export const dynamic = "force-dynamic";

import { getVideoaulas, getTypography } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import AreaTypography from "@/components/admin/AreaTypography";
import VideoaulasEditor from "./VideoaulasEditor";

export default async function AdminVideoaulasPage() {
  const videoaulas = await getVideoaulas();
  const typo = await getTypography();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Videoaulas</h1>
        <p className="mt-1 text-sm text-white/50">
          Gerencie as videoaulas exibidas em{" "}
          <span className="font-mono text-white/70">/videoaulas</span> e na home.
        </p>
      </div>

      <AdminHelp>Adicione uma videoaula: cole o link do YouTube ou envie o vídeo; defina área e nível; ajuste o enquadramento no card. Salvar.</AdminHelp>

      <VideoaulasEditor initialVideoaulas={videoaulas} />

      <AreaTypography sectionKey="videoaulas" label="Videoaulas" initial={typo["videoaulas"]} />
    </div>
  );
}
