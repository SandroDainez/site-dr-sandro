export const dynamic = "force-dynamic";

import { getVideoaulas } from "@/lib/content";
import VideoaulasEditor from "./VideoaulasEditor";

export default async function AdminVideoaulasPage() {
  const videoaulas = await getVideoaulas();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Videoaulas</h1>
        <p className="mt-1 text-sm text-white/50">
          Gerencie as videoaulas exibidas em{" "}
          <span className="font-mono text-white/70">/videoaulas</span> e na home.
        </p>
      </div>

      <VideoaulasEditor initialVideoaulas={videoaulas} />
    </div>
  );
}
