export const dynamic = "force-dynamic";

import Link from "next/link";
import { listarUsuarios } from "./actions";
import UsuariosManager from "./UsuariosManager";

export const metadata = { title: "Usuários" };

export default async function AdminUsuariosPage() {
  const usuarios = await listarUsuarios();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Usuários</h1>
        <p className="mt-1 text-sm text-muted">
          Aprove ou bloqueie o acesso à área de membro. Novos cadastros entram como <strong>pendentes</strong> até você liberar.
        </p>
      </div>

      <UsuariosManager initial={usuarios} />
    </div>
  );
}
