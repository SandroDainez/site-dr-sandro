import { Hammer } from "lucide-react";

// Estado "em construção" — regra de ouro: nunca inventar conteúdo. Onde uma seção/área
// ainda não tem material real, mostramos isto (espaço pronto, esperando conteúdo).
export default function EmBreve({ texto }: { texto?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-5 py-6">
      <Hammer className="h-5 w-5 shrink-0 text-white/25" />
      <p className="text-sm text-white/45">{texto ?? "Em construção — conteúdo desta área chega em breve."}</p>
    </div>
  );
}
