import { createHash } from "crypto";

// Lógica PURA do token de admin (só `crypto`, sem `next/headers`) — pode ser
// importada tanto pelo middleware (src/proxy.ts) quanto pelo servidor.
// Ver docs/AUTH-ADMIN.md. Segredo `ADMIN_PASSWORD` é server-only.

export function adminTokenEsperado(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHash("sha256").update(pw).digest("hex");
}

export function tokenAdminValido(token: string | undefined | null): boolean {
  const esperado = adminTokenEsperado();
  return !!esperado && token === esperado;
}
