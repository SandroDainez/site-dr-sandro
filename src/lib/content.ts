import { list, put, getDownloadUrl } from "@vercel/blob";
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

export type ContentMap = {
  eventos: EventoData[];
  apps: AppData[];
  contato: ContatoData;
  hero: HeroData;
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
  },
  {
    title: "MedEscala",
    subtitle: "Organização de plantões e equipe médica",
    text: "Escalas com previsibilidade, registro de trocas e visão operacional da cobertura assistencial.",
    icon: "CalendarClock",
    glow: "from-blue-400/30 to-blue-600/5",
    highlights: ["Distribuição mais equilibrada", "Visão da cobertura por equipe"],
  },
  {
    title: "Ficha de Anestesia",
    subtitle: "Registro digital intraoperatório",
    text: "Registro padronizado do pré, intra e pós-operatório, incluindo avaliação pré-anestésica e sala de recuperação anestésica.",
    icon: "FileText",
    glow: "from-violet-400/30 to-violet-600/5",
    highlights: ["Pré, intra e pós-operatório", "SRPA e avaliação pré-anestésica"],
  },
  {
    title: "Emergências Médicas",
    subtitle: "Resposta inicial em cenários críticos",
    text: "Algoritmos rápidos, doses e condutas críticas para plantão.",
    icon: "Zap",
    glow: "from-cyan-400/30 to-cyan-600/5",
    highlights: ["Acesso rápido em cenário crítico", "Condutas com foco em tempo-resposta"],
  },
  {
    title: "ACLS Guiado",
    subtitle: "Roteiro prático para PCR intra-hospitalar guiado por voz",
    text: "Cronometria de ciclos, condutas e checkpoints para alinhamento da equipe de reanimação.",
    icon: "HeartPulse",
    glow: "from-amber-400/30 to-amber-600/5",
    highlights: ["Comandos guiados por voz", "Sequência prática para equipe"],
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
  if (!process.env.BLOB_READ_WRITE_TOKEN) return readLocal(key, fallback);
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${key}.json` });
    const blob = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${key}.json`);
    if (!blob) return fallback;
    const downloadUrl = await getDownloadUrl(blob.url);
    const res = await fetch(downloadUrl);
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
