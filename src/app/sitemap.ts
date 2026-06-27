import type { MetadataRoute } from "next";
import { getCursos } from "@/lib/content";

export const dynamic = "force-dynamic";

const SITE_URL = "https://site-dr-sandro.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/especialidade/emergencias",
    "/especialidade/ti",
    "/especialidade/anestesiologia",
    "/cursos",
    "/atualizacoes",
    "/protocolos",
    "/videoaulas",
    "/podcast",
    "/colaboradores",
    "/acervo",
    "/inscricao",
  ];

  let cursoRoutes: string[] = [];
  try {
    const cursos = await getCursos();
    cursoRoutes = cursos.filter((c) => c.id && c.titulo).map((c) => `/cursos/${c.id}`);
  } catch {
    /* ignore */
  }

  return [...staticRoutes, ...cursoRoutes].map((r) => ({
    url: `${SITE_URL}${r}`,
    changeFrequency: "weekly" as const,
    priority: r === "" ? 1 : 0.7,
  }));
}
