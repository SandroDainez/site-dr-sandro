import { getPodcasts, getTypography } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import ColsShortcut from "@/components/admin/ColsShortcut";
import AreaTypography from "@/components/admin/AreaTypography";
import PodcastEditor from "./PodcastEditor";
import Link from "next/link";

export default async function AdminPodcastPage() {
  const podcasts = await getPodcasts();
  const typo = await getTypography();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Podcast</h1>
        <p className="mt-1 text-sm text-white/50">
          Crie episódios: envie <strong className="text-white/70">suas gravações</strong> (áudio do PC)
          e/ou cole <strong className="text-white/70">links</strong> (Spotify, YouTube, Apple Podcasts).
          Aparecem em <span className="font-mono text-white/70">/podcast</span> e na home.
        </p>
      </div>

      <AdminHelp>Clique em “Adicionar episódio”. Envie sua gravação (áudio) e/ou cole um link (Spotify, YouTube, Apple). Capa e descrição são opcionais. Salvar.</AdminHelp>

      <ColsShortcut />

      <PodcastEditor initialPodcasts={podcasts} />

      <AreaTypography sectionKey="podcast" label="Podcast" initial={typo["podcast"]} />
    </div>
  );
}
