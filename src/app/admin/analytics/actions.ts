"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { writeBlob } from "@/lib/content";

// Zera os acessos (útil enquanto o dono testa o site e não quer contar as próprias visitas).
// Analytics fica no Vercel Blob em 2 chaves: 'analytics' (contagem diária) e
// 'analyticsDetail' (páginas/origem/dispositivo). Reset = gravar vazios. Irreversível.
export async function zerarAcessos(): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await writeBlob("analytics", {});
    await writeBlob("analyticsDetail", { paths: {}, refs: {}, dev: {} });
    revalidatePath("/admin/analytics");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}
