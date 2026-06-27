import Link from "next/link";

export default function AdminMenuPage() {
  return (
    <div className="max-w-2xl pb-24">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Menu do topo</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-relaxed text-white/70">
        <p className="mb-3 font-medium text-white">O menu agora tem uma estrutura fixa, organizada em grupos:</p>
        <p className="mb-4">
          <span className="text-white/90">Início · Especialidades ▾ · Apps ▾ · Podcast · Acervo · Parceiros · Eventos · Contato</span>
        </p>
        <p className="mb-2">
          Essa estrutura é mantida no código para ficar estável e bem organizada — por isso não é editada por aqui.
          Os <span className="text-white/90">conteúdos</span> de cada seção (protocolos, atualizações, cursos etc.) seguem
          totalmente editáveis nas áreas correspondentes do admin.
        </p>
        <p className="text-white/50">
          Se quiser mudar a divisão dos grupos do menu, me avise que ajusto a estrutura.
        </p>
      </div>
    </div>
  );
}
