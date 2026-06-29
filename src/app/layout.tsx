import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Poppins, Lora } from "next/font/google";
import { getHeader, getHero, headerSubtitleLines } from "@/lib/content";
import { getUsuario } from "@/lib/supabase/auth-server";
import TrackVisit from "@/components/TrackVisit";
import PWARegister from "@/components/PWARegister";
import MemberTabBar from "@/components/MemberTabBar";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fontes adicionais oferecidas no controle de tipografia do admin.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });

const SITE_URL = "https://medcampus.com.br";

export async function generateMetadata(): Promise<Metadata> {
  const [header, hero] = await Promise.all([getHeader(), getHero()]);
  const name = header.name?.trim() || "Portal Médico";
  const subtitle = headerSubtitleLines(header)[0];
  const full = subtitle ? `${name} — ${subtitle}` : name;
  const description =
    hero.subtitle?.trim() ||
    "Plataforma de referência em emergências, terapia intensiva e anestesiologia: protocolos, atualizações, cursos, videoaulas, podcasts e materiais para download.";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: full, template: `%s · ${name}` },
    description,
    applicationName: name,
    keywords: [
      "medicina", "emergências", "terapia intensiva", "anestesiologia",
      "protocolos clínicos", "atualizações médicas", "cursos de medicina",
      "videoaulas", "podcast médico", "ensino médico",
    ],
    authors: [{ name }],
    openGraph: { type: "website", locale: "pt_BR", url: SITE_URL, siteName: name, title: full, description },
    twitter: { card: "summary_large_image", title: full, description },
    robots: { index: true, follow: true },
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: name },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07090f",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUsuario();
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
        {user && <MemberTabBar />}
        <PWARegister />
        <TrackVisit />
        <Analytics />
      </body>
    </html>
  );
}
