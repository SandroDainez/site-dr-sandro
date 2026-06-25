import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Poppins, Lora } from "next/font/google";
import { getHeader, getHero, headerSubtitleLines } from "@/lib/content";
import TrackVisit from "@/components/TrackVisit";
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

export async function generateMetadata(): Promise<Metadata> {
  const [header, hero] = await Promise.all([getHeader(), getHero()]);
  const name = header.name?.trim() || "Portal Médico";
  const subtitle = headerSubtitleLines(header)[0];
  return {
    title: subtitle ? `${name} — ${subtitle}` : name,
    description:
      hero.subtitle?.trim() ||
      "Portal médico com apps, cursos, podcasts e atualizações clínicas.",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
        <TrackVisit />
      </body>
    </html>
  );
}
