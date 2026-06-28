import { Sparkles } from "lucide-react";

// Atalho para o assistente clínico de IA (membros).
export default function AssistenteButton() {
  return (
    <a
      href="/assistente"
      aria-label="Assistente clínico"
      title="Assistente clínico (IA)"
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[13px] font-semibold text-accent transition hover:bg-accent/20"
    >
      <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">Assistente</span>
    </a>
  );
}
