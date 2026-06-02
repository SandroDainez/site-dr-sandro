"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  writeBlob,
  type EventoData,
  type AppData,
  type ContatoData,
  type HeroData,
} from "@/lib/content";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autorizado");
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
