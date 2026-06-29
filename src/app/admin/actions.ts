"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import OpenAI from "openai";
import {
  writeBlob,
  getTypography,
  uploadImageToBlob,
  uploadPublicImageToBlob,
  type SectionStyle,
  type EventoData,
  type AppData,
  type ContatoData,
  type HeroData,
  type HeaderData,
  type FreeAppData,
  type UtilAppData,
  type ContentItemData,
  type CourseData,
  type WhyUsData,
  type SiteConfig,
  type NavItemData,
  type NavStyleData,
  type TypographyData,
  type AtualizacaoData,
  type ProtocoloData,
  type VideoaulaData,
  type CursoData,
  type PodcastData,
  type ColaboradorData,
  type AcervoItemData,
} from "@/lib/content";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || token !== createHash("sha256").update(pw).digest("hex")) {
    throw new Error("Não autorizado");
  }
}

type Result = { ok: true } | { ok: false; error: string };

export async function saveHomeOrder(order: string[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("homeOrder", order);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

export async function saveEventos(eventos: EventoData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("eventos", eventos);
    revalidatePath("/");
    revalidatePath("/inscricao");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveApps(apps: AppData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("apps", apps);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveContato(contato: ContatoData): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("contato", contato);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveHero(hero: HeroData): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("hero", hero);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveHeader(header: HeaderData): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("header", header);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveFreeApps(apps: FreeAppData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("freeApps", apps);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveUtilApps(apps: UtilAppData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("utilApps", apps);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveContentItems(items: ContentItemData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("contentItems", items);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveCourses(courses: CourseData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("courses", courses);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveWhyUs(cards: WhyUsData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("whyUs", cards);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveSiteConfig(config: SiteConfig): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("siteConfig", config);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveNavItems(items: NavItemData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("navItems", items);
    revalidatePath("/");
    revalidatePath("/atualizacoes");
    revalidatePath("/protocolos");
    revalidatePath("/videoaulas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveNavStyle(style: NavStyleData): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("navStyle", style);
    revalidatePath("/");
    revalidatePath("/atualizacoes");
    revalidatePath("/protocolos");
    revalidatePath("/videoaulas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveTypography(typography: TypographyData): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("typography", typography);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

// Salva o estilo de UMA seção, fazendo merge no blob de tipografia.
// Usado pelos controles embutidos em cada área de edição.
export async function saveTypographySection(
  key: string,
  style: SectionStyle
): Promise<Result> {
  try {
    await requireAdmin();
    const current = await getTypography();
    const next: TypographyData = { ...current, [key]: style };
    await writeBlob("typography", next);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveAtualizacoes(atualizacoes: AtualizacaoData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("atualizacoes", atualizacoes);
    revalidatePath("/");
    revalidatePath("/atualizacoes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveProtocolos(protocolos: ProtocoloData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("protocolos", protocolos);
    revalidatePath("/");
    revalidatePath("/protocolos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveVideoaulas(videoaulas: VideoaulaData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("videoaulas", videoaulas);
    revalidatePath("/");
    revalidatePath("/videoaulas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveColaboradores(colaboradores: ColaboradorData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("colaboradores", colaboradores);
    revalidatePath("/");
    revalidatePath("/colaboradores");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveSectionTexts(
  data: import("@/lib/section-texts").SectionTextsData
): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("sectionTexts", data);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveUiTexts(
  data: import("@/lib/ui-texts").UiTextsData
): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("uiTexts", data);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveAcervo(itens: AcervoItemData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("acervo", itens);
    revalidatePath("/");
    revalidatePath("/acervo");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveProcedimentos(itens: AcervoItemData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("procedimentos", itens);
    revalidatePath("/");
    revalidatePath("/procedimentos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function savePodcasts(podcasts: PodcastData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("podcasts", podcasts);
    revalidatePath("/");
    revalidatePath("/podcast");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function saveCursos(cursos: CursoData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("cursos", cursos);
    revalidatePath("/");
    revalidatePath("/cursos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function uploadImage(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      return { ok: false, error: "Nenhum arquivo enviado." };
    }
    const url = await uploadImageToBlob(file);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function uploadPublicImage(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      return { ok: false, error: "Nenhum arquivo enviado." };
    }
    const url = await uploadPublicImageToBlob(file);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

// Gera um RASCUNHO de prova (pré/pós) para uma videoaula com IA. O admin edita depois.
export async function gerarQuizVideoaula(input: { titulo: string; descricao: string; area: string; n?: number }):
  Promise<{ ok: true; questoes: { enunciado: string; opcoes: string[]; correta: number }[] } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    if (!process.env.OPENAI_API_KEY) return { ok: false, error: "OpenAI não configurado no servidor." };
    const n = Math.min(Math.max(input.n ?? 5, 3), 10);
    const desc = (input.descricao || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 1500);
    const prompt = `Você é professor de medicina (anestesiologia, terapia intensiva, medicina de emergência). Crie ${n} questões de múltipla escolha para uma PROVA aplicada ANTES e DEPOIS de uma videoaula, para medir a evolução do conhecimento. Nível: médico especialista/residente. Cada questão com 4 alternativas e UMA correta. Foque no conteúdo do tema da aula; evite pegadinhas triviais.

TÍTULO: ${input.titulo}
DESCRIÇÃO: ${desc}
ÁREA: ${input.area}

Retorne APENAS JSON: {"questoes":[{"enunciado":"...","opcoes":["...","...","...","..."],"correta":0}]} onde "correta" é o ÍNDICE (0 a 3) da alternativa certa. NÃO use prefixos como "A)" ou "1." nas alternativas.`;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1800,
      response_format: { type: "json_object" },
    });
    const data = JSON.parse(r.choices[0].message.content ?? "{}");
    const arr = Array.isArray(data.questoes) ? data.questoes : [];
    const questoes = arr.map((q: any) => ({
      enunciado: String(q.enunciado ?? "").trim(),
      opcoes: (Array.isArray(q.opcoes) ? q.opcoes : [])
        .map((o: any) => String(o).replace(/^\s*[A-Da-d0-9][).\.\s-]+/, "").trim())
        .filter(Boolean),
      correta: Number.isInteger(q.correta) ? q.correta : 0,
    })).filter((q: any) => q.enunciado && q.opcoes.length >= 2 && q.correta >= 0 && q.correta < q.opcoes.length);
    if (questoes.length === 0) return { ok: false, error: "A IA não retornou questões válidas. Tente novamente." };
    return { ok: true, questoes };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao gerar a prova." };
  }
}
