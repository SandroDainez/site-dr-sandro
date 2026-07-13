"use server";

import { revalidatePath } from "next/cache";
import type { NavOverride } from "@/lib/nav-structure";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { getOpenAI, AI_MODELS } from "@/lib/ai/openai";
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
  type EspecialidadeCardData,
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

export async function saveAviso(aviso: { ativo: boolean; texto: string }): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("aviso", aviso);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

export async function saveCardCols(cols: Record<string, number>): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("cardCols", cols);
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

export async function saveEspecialidades(items: EspecialidadeCardData[]): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("especialidades", items);
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

// Salva as edições do menu principal (ordem / ocultar / renomear). O menu aparece em
// todas as páginas, então revalida o layout inteiro.
export async function saveNavMenu(override: NavOverride): Promise<Result> {
  try {
    await requireAdmin();
    await writeBlob("navOverride", override);
    revalidatePath("/", "layout");
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

// Gera um RASCUNHO de prova (pré/pós) para uma videoaula com IA, seguindo a
// ORIENTAÇÃO do admin (assuntos/pontos-chave). O admin edita depois.
export async function gerarQuizVideoaula(input: { titulo: string; descricao: string; area: string; n?: number; instrucoes?: string }):
  Promise<{ ok: true; questoes: { enunciado: string; opcoes: string[]; correta: number; justificativa?: string }[] } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    if (!process.env.OPENAI_API_KEY) return { ok: false, error: "OpenAI não configurado no servidor." };
    const n = Math.min(Math.max(input.n ?? 5, 1), 12);
    const desc = (input.descricao || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 1500);
    const orientacao = (input.instrucoes || "").trim().slice(0, 2000);

    const prompt = `Você é professor titular de medicina (anestesiologia, terapia intensiva, medicina de emergência) e elaborador de questões de prova de título de especialista. Elabore ${n} questões de múltipla escolha para uma PROVA aplicada ANTES e DEPOIS de uma videoaula (as mesmas perguntas medem a evolução do conhecimento).

AULA
- Título: ${input.titulo}
- Descrição: ${desc || "(sem descrição)"}
- Área: ${input.area}

${orientacao ? `ORIENTAÇÃO DO PROFESSOR (SIGA À RISCA — estes são os assuntos e pontos-chave que DEVEM ser cobrados):\n${orientacao}\n` : ""}
REGRAS DE QUALIDADE (obrigatórias):
- Cubra os PONTOS DE ALTO RENDIMENTO do tema (condutas, doses, critérios, indicações, contraindicações, valores de corte) — o que muda a prática.${orientacao ? " Priorize ESTRITAMENTE o que o professor pediu acima." : ""}
- Conteúdo CORRETO e atual, baseado em diretrizes consolidadas. NÃO crie questão sobre ponto controverso/ambíguo. Se não tiver certeza de um dado, não use.
- Cada questão: enunciado clínico claro, 4 alternativas, EXATAMENTE UMA inequivocamente correta; as outras 3 plausíveis mas claramente erradas (sem "todas acima", sem pegadinha de redação).
- Nível: médico especialista/residente. Sem perguntas triviais nem decoreba irrelevante.
- Para CADA questão, escreva uma "justificativa" curta (1-2 frases) explicando por que a correta está certa — para o professor conferir a confiabilidade.

Retorne APENAS JSON:
{"questoes":[{"enunciado":"...","opcoes":["...","...","...","..."],"correta":0,"justificativa":"..."}]}
"correta" = ÍNDICE (0 a 3) da alternativa certa. NÃO use prefixos "A)"/"1." nas alternativas.`;

    const openai = getOpenAI();
    const r = await openai.chat.completions.create({
      model: AI_MODELS.chat,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2600,
      response_format: { type: "json_object" },
    });
    const data = JSON.parse(r.choices[0].message.content ?? "{}");
    const arr: Record<string, unknown>[] = Array.isArray(data.questoes) ? data.questoes : [];
    const questoes = arr.map((q) => ({
      enunciado: String(q.enunciado ?? "").trim(),
      opcoes: (Array.isArray(q.opcoes) ? q.opcoes : [])
        // remove SÓ rótulos de enumeração reais ("A)", "1.", "(A)") — exige terminador )/. + espaço.
        // NÃO mexe em valores que começam com número (ex.: "0,3 mg/kg", "2 mg/kg").
        .map((o: unknown) => String(o).replace(/^\s*\(?[A-Da-d0-9]{1,2}\)?[).\-]\s+/, "").trim())
        .filter(Boolean),
      correta: Number.isInteger(q.correta) ? (q.correta as number) : 0,
      justificativa: q.justificativa ? String(q.justificativa).trim() : "",
    })).filter((q) => q.enunciado && q.opcoes.length >= 2 && q.correta >= 0 && q.correta < q.opcoes.length);
    if (questoes.length === 0) return { ok: false, error: "A IA não retornou questões válidas. Tente novamente." };
    return { ok: true, questoes };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao gerar a prova." };
  }
}
