"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import {
  writeBlob,
  type EventoData,
  type AppData,
  type ContatoData,
  type HeroData,
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
