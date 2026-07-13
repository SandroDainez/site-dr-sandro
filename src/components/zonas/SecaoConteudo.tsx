import type { LucideIcon } from "lucide-react";
import ConteudoCard, { type ItemConteudo } from "./ConteudoCard";
import EmBreve from "./EmBreve";

// Seção de uma zona: cabeçalho + grade de cards (ou "em construção" se vazio).
// Presentacional — recebe os itens JÁ filtrados pela área ativa.
export default function SecaoConteudo({
  icon: Icon, titulo, sub, itens, cor, emBreve,
}: {
  icon: LucideIcon;
  titulo: string;
  sub: string;
  itens: ItemConteudo[];
  cor: string;
  emBreve: string;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Icon className="h-5 w-5" style={{ color: cor }} /> {titulo}
        </h2>
        <p className="mt-0.5 text-[13px] text-white/45">{sub}</p>
      </div>
      {itens.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((item) => <ConteudoCard key={item.id} item={item} cor={cor} />)}
        </div>
      ) : (
        <EmBreve texto={emBreve} />
      )}
    </section>
  );
}
