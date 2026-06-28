import { Search } from "lucide-react";

// Lupa no cabeçalho → página de busca.
export default function SearchButton() {
  return (
    <a
      href="/busca"
      aria-label="Buscar"
      title="Buscar"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition hover:border-accent/50 hover:text-accent"
    >
      <Search className="h-4 w-4" />
    </a>
  );
}
