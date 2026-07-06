import Link from "next/link";
import { Columns3 } from "lucide-react";

// Atalho para o editor central "Cards por linha" (/admin/colunas), colocado no topo
// de cada editor de seção com cards — pra achar o controle sem sair procurando.
export default function ColsShortcut() {
  return (
    <Link
      href="/admin/colunas"
      className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.06] px-4 py-2 text-xs font-medium text-accent transition hover:border-accent/60 hover:bg-accent/[0.12]"
    >
      <Columns3 className="h-4 w-4" /> Ajustar cards por linha desta e de outras seções ↗
    </Link>
  );
}
