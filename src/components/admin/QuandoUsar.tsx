import { Compass } from "lucide-react";

// Bloco "Quando usar este, e não outro" — resolve a confusão de propósito entre módulos
// parecidos (Científico×Premium×Arquiteto; Comparador×Atualizador×Pesquisador).
export default function QuandoUsar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-accent-blue/25 bg-accent-blue/[0.06] px-4 py-3 text-sm leading-relaxed text-white/75">
      <Compass className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
      <div>{children}</div>
    </div>
  );
}
