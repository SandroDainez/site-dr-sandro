import { list, put } from "@vercel/blob";
import { unstable_noStore as noStore } from "next/cache";
import fs from "fs/promises";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventoData = {
  slug: string;
  titulo: string;
  descricao: string;
  investimento: string;
  data: string; // YYYY-MM-DD
};

export type AppData = {
  title: string;
  subtitle: string;
  text: string;
  icon: string;
  glow: string;
  highlights: string[];
  link: string;
};

export type FreeAppData = {
  title: string;
  desc: string;
  icon: string;
  link: string;
};

export type ContentItemData = {
  title: string;
  subtitle: string;
  link: string;
};

export type CourseData = {
  id: string;
  title: string;
  link: string;
};

export type WhyUsData = {
  icon: string;
  title: string;
  text: string;
};

export type SiteConfig = {
  marqueeItems: string[];
  footerName: string;
  footerTagline: string;
};

export type ContatoData = {
  email: string;
  whatsapp: string;
  whatsappLink: string;
  telefone: string;
  telefoneLink: string;
  instagram: string;
  instagramLink: string;
};

export type HeroData = {
  badge: string;
  title: string;
  subtitle: string;
};

export type HeaderData = {
  name: string;
  cremesp: string;
  rqe1: string;
  rqe2: string;
  logoUrl: string;
};

export type ContentMap = {
  eventos: EventoData[];
  apps: AppData[];
  contato: ContatoData;
  hero: HeroData;
  header: HeaderData;
  freeApps: FreeAppData[];
  contentItems: ContentItemData[];
  courses: CourseData[];
  whyUs: WhyUsData[];
  siteConfig: SiteConfig;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const defaultEventos: EventoData[] = [
  {
    slug: "manejo-via-aerea-critico",
    titulo: "Manejo de via aérea no paciente crítico",
    descricao:
      "Treinamento com foco em preparação, escolha de estratégia e execução segura no cenário crítico.",
    investimento: "R$ 890,00",
    data: "2026-05-24",
  },
  {
    slug: "via-aerea-dificil-no-critico",
    titulo: "Via aérea difícil no crítico",
    descricao:
      "Imersão prática em predição, dispositivos de resgate e algoritmo para falha de intubação.",
    investimento: "R$ 990,00",
    data: "2026-05-28",
  },
  {
    slug: "acls-guiado-por-voz",
    titulo: "ACLS guiado por voz na prática",
    descricao:
      "Atualização prática em PCR intra-hospitalar com simulação de comando e coordenação de equipe.",
    investimento: "R$ 790,00",
    data: "2026-06-03",
  },
  {
    slug: "emergencias-medicas-plantao",
    titulo: "Emergências médicas no plantão",
    descricao:
      "Abordagem dos principais cenários críticos com tomada de decisão rápida e estruturada.",
    investimento: "R$ 840,00",
    data: "2026-06-11",
  },
];

export const defaultApps: AppData[] = [
  {
    title: "AnesMap",
    subtitle: "Preparação estruturada para residência, especialização e título",
    text: "Banco de questões, flashcards SM-2 e protocolos por área, com foco em retenção e tomada de decisão.",
    icon: "Layers",
    glow: "from-emerald-400/30 to-emerald-600/5",
    highlights: ["Questões comentadas por tema", "Revisão espaçada com SM-2"],
    link: "",
  },
  {
    title: "MedEscala",
    subtitle: "Organização de plantões e equipe médica",
    text: "Escalas com previsibilidade, registro de trocas e visão operacional da cobertura assistencial.",
    icon: "CalendarClock",
    glow: "from-blue-400/30 to-blue-600/5",
    highlights: ["Distribuição mais equilibrada", "Visão da cobertura por equipe"],
    link: "",
  },
  {
    title: "Ficha de Anestesia",
    subtitle: "Registro digital intraoperatório",
    text: "Registro padronizado do pré, intra e pós-operatório, incluindo avaliação pré-anestésica e sala de recuperação anestésica.",
    icon: "FileText",
    glow: "from-violet-400/30 to-violet-600/5",
    highlights: ["Pré, intra e pós-operatório", "SRPA e avaliação pré-anestésica"],
    link: "",
  },
  {
    title: "Emergências Médicas",
    subtitle: "Resposta inicial em cenários críticos",
    text: "Algoritmos rápidos, doses e condutas críticas para plantão.",
    icon: "Zap",
    glow: "from-cyan-400/30 to-cyan-600/5",
    highlights: ["Acesso rápido em cenário crítico", "Condutas com foco em tempo-resposta"],
    link: "",
  },
  {
    title: "ACLS Guiado",
    subtitle: "Roteiro prático para PCR intra-hospitalar guiado por voz",
    text: "Cronometria de ciclos, condutas e checkpoints para alinhamento da equipe de reanimação.",
    icon: "HeartPulse",
    glow: "from-amber-400/30 to-amber-600/5",
    highlights: ["Comandos guiados por voz", "Sequência prática para equipe"],
    link: "",
  },
];

export const defaultContato: ContatoData = {
  email: "contato@drsandro.com.br",
  whatsapp: "+55 (11) 99999-9999",
  whatsappLink: "https://wa.me/5511999999999",
  telefone: "+55 (11) 4000-0000",
  telefoneLink: "tel:+551140000000",
  instagram: "Instagram e Telegram",
  instagramLink: "https://instagram.com/",
};

export const defaultHero: HeroData = {
  badge: "Conteúdo técnico e prática clínica",
  title: "Atualização médica digital com alto padrão",
  subtitle:
    "Plataforma de apoio à decisão em medicina de urgência e emergência, terapia intensiva e anestesiologia.",
};

export const defaultHeader: HeaderData = {
  name: "Dr. Sandro Dainez",
  cremesp: "CREMESP 76.907",
  rqe1: "Anestesiologia RQE 58.201",
  rqe2: "Medicina Intensiva RQE 58.202",
  logoUrl: "/logo-medicina.png",
};

export const defaultFreeApps: FreeAppData[] = [
  {
    title: "Aplicativos gratuitos",
    desc: "Ferramentas abertas para consulta rápida e suporte à conduta no plantão.",
    icon: "BookOpen",
    link: "",
  },
  {
    title: "Aulas e podcasts gratuitos",
    desc: "Conteúdo aberto para atualização objetiva, sem necessidade de login.",
    icon: "AudioLines",
    link: "",
  },
];

export const defaultContentItems: ContentItemData[] = [
  { title: "Aulas abertas", subtitle: "Acesso livre para revisão rápida", link: "" },
  { title: "Podcasts clínicos", subtitle: "Discussão de casos e condutas", link: "" },
  { title: "Atualizações semanais", subtitle: "Evidência recente aplicada", link: "" },
  { title: "Protocolos guiados", subtitle: "Fluxos de conduta passo a passo", link: "" },
];

export const defaultCourses: CourseData[] = [
  { id: "manejo-via-aerea", title: "Manejo de via aérea no paciente crítico", link: "" },
  { id: "via-aerea-dificil", title: "Via aérea difícil no crítico", link: "" },
];

export const defaultWhyUs: WhyUsData[] = [
  {
    icon: "ShieldCheck",
    title: "Segurança clínica",
    text: "Condutas estruturadas para reduzir variabilidade assistencial.",
  },
  {
    icon: "BrainCircuit",
    title: "Decisão baseada em evidência",
    text: "Síntese objetiva da literatura para suporte à conduta.",
  },
  {
    icon: "Sparkles",
    title: "Usabilidade orientada ao plantão",
    text: "Acesso rápido à informação crítica em momentos de decisão.",
  },
];

export const defaultSiteConfig: SiteConfig = {
  marqueeItems: [
    "Protocolos revisados semanalmente",
    "Ferramentas para decisão à beira-leito",
    "Conteúdo aberto sem login",
    "Cursos presenciais, híbridos e online",
    "Atualização científica contínua",
    "Material orientado à prática assistencial",
  ],
  footerName: "Dr. Sandro • Portal de Anestesiologia e Medicina Intensiva",
  footerTagline: "© 2026 Todos os direitos reservados.",
};

// ─── Storage helpers (local files em dev, Vercel Blob em produção) ────────────

const DATA_DIR = path.join(process.cwd(), "src", "data");
const BLOB_PREFIX = "content/";

async function readLocal<T>(key: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(path.join(DATA_DIR, `${key}.json`), "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeLocal<T>(key: string, data: T): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, `${key}.json`),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}

async function readBlob<T>(key: string, fallback: T): Promise<T> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return readLocal(key, fallback);
  noStore();
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${key}.json` });
    const blob = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${key}.json`);
    if (!blob) return fallback;
    // store is private: pass token as Bearer to authorize the fetch
    const res = await fetch(blob.url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function writeBlob<T>(key: string, data: T): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    if (process.env.NODE_ENV === "development") {
      await writeLocal(key, data);
      return;
    }
    throw new Error(
      "BLOB_READ_WRITE_TOKEN não configurado. Adicione o Vercel Blob ao projeto no painel da Vercel (Storage → Blob) e faça Redeploy."
    );
  }
  await put(`${BLOB_PREFIX}${key}.json`, JSON.stringify(data, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

// ─── Public read functions ────────────────────────────────────────────────────

export async function getEventos(): Promise<EventoData[]> {
  return readBlob("eventos", defaultEventos);
}

export async function getApps(): Promise<AppData[]> {
  return readBlob("apps", defaultApps);
}

export async function getContato(): Promise<ContatoData> {
  return readBlob("contato", defaultContato);
}

export async function getHero(): Promise<HeroData> {
  return readBlob("hero", defaultHero);
}

export async function getHeader(): Promise<HeaderData> {
  return readBlob("header", defaultHeader);
}

export async function getFreeApps(): Promise<FreeAppData[]> {
  return readBlob("freeApps", defaultFreeApps);
}

export async function getContentItems(): Promise<ContentItemData[]> {
  return readBlob("contentItems", defaultContentItems);
}

export async function getCourses(): Promise<CourseData[]> {
  return readBlob("courses", defaultCourses);
}

export async function getWhyUs(): Promise<WhyUsData[]> {
  return readBlob("whyUs", defaultWhyUs);
}

export async function getSiteConfig(): Promise<SiteConfig> {
  return readBlob("siteConfig", defaultSiteConfig);
}

export async function uploadImageToBlob(file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN não configurado.");
  }
  const { url } = await put(`images/${Date.now()}-${file.name}`, file, {
    access: "private",
    addRandomSuffix: false,
  });
  // Return a proxy URL so the private blob is accessible on the site
  return `/api/img?url=${encodeURIComponent(url)}`;
}
