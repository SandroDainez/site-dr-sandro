"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import {
  writeBlob,
  uploadImageToBlob,
  type EventoData,
  type AppData,
  type ContatoData,
  type HeroData,
  type HeaderData,
  type FreeAppData,
  type ContentItemData,
  type CourseData,
  type WhyUsData,
  type SiteConfig,
  type AtualizacaoData,
  type ProtocoloData,
  type VideoaulaData,
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
