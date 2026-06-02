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

export async function saveEventos(eventos: EventoData[]) {
  await requireAdmin();
  await writeBlob("eventos", eventos);
  revalidatePath("/");
  revalidatePath("/inscricao");
}

export async function saveApps(apps: AppData[]) {
  await requireAdmin();
  await writeBlob("apps", apps);
  revalidatePath("/");
}

export async function saveContato(contato: ContatoData) {
  await requireAdmin();
  await writeBlob("contato", contato);
  revalidatePath("/");
}

export async function saveHero(hero: HeroData) {
  await requireAdmin();
  await writeBlob("hero", hero);
  revalidatePath("/");
}
