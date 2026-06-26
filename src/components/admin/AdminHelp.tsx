import { Info } from "lucide-react";

// Linha de ajuda "Como usar" padrão no topo de cada página do admin.
export default function AdminHelp({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent/[0.05] px-4 py-3 text-sm leading-relaxed text-white/75">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <p>
        <span className="font-semibold text-accent">Como usar: </span>
        {children}
      </p>
    </div>
  );
}
