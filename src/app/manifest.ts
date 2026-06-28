import type { MetadataRoute } from "next";
import { getHeader } from "@/lib/content";

// Manifesto do PWA — torna a plataforma instalável como app, abrindo direto na
// área do aluno (Minha área), em modo standalone (sem a barra do navegador).
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const header = await getHeader();
  const nome = header.name?.trim() || "Portal Médico";
  return {
    name: `${nome} — Plataforma Médica`,
    short_name: nome.length > 18 ? "Portal" : nome,
    description: "Cursos, atualizações clínicas, protocolos e assistente de IA para médicos.",
    start_url: "/minha-area",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07090f",
    theme_color: "#07090f",
    categories: ["medical", "education"],
    lang: "pt-BR",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
