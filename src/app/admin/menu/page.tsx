import Link from "next/link";
import { getNavStyle } from "@/lib/content";
import MenuEditor from "./MenuEditor";

export default async function AdminMenuPage() {
  const navStyle = await getNavStyle();

  return (
    <div className="max-w-2xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Menu do topo</h1>
        <p className="mt-1 text-sm text-white/50">Ajuste o tamanho da barra para caber na tela.</p>
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-relaxed text-white/70">
        <p className="mb-3 font-medium text-white">O menu tem uma estrutura fixa, organizada em grupos:</p>
        <p className="mb-4 text-white/90">
          Início · Especialidades ▾ · Cursos · Apps ▾ · Procedimentos · Podcast · Outros assuntos · Parceiros · Eventos · Contato
        </p>
        <p className="text-white/50">
          A divisão dos grupos é mantida no código para ficar estável. Se quiser incluir, remover ou reordenar um item do
          menu, me avise que ajusto. Aqui embaixo você controla o <strong className="text-white">tamanho</strong> da barra.
        </p>
      </div>

      <MenuEditor initialStyle={navStyle} />
    </div>
  );
}
