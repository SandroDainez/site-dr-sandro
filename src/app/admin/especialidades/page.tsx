import Link from "next/link";
import { getEspecialidades } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import EspecialidadesEditor from "./EspecialidadesEditor";

export default async function AdminEspecialidadesPage() {
  const items = await getEspecialidades();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Navegue por especialidade</h1>
        <p className="mt-1 text-sm text-white/50">
          Os cards da seção <strong className="text-white/70">&quot;Navegue por especialidade&quot;</strong> na home.
          Envie um <strong className="text-white/70">logo</strong> para cada uma (ou use o emoji), edite o texto,
          escolha a cor e o destino do clique, reordene e adicione novos cards. Se marcar a
          <strong className="text-white/70"> área das Atualizações</strong>, o mesmo logo aparece nos boletins daquela área.
        </p>
      </div>

      <AdminHelp>
        Cada card = uma especialidade. Envie o logo (PNG/SVG), preencha nome e descrição, escolha a cor do tema
        e para onde o card leva (um hub existente como <span className="font-mono">/especialidade/emergencias</span> ou
        qualquer URL). Use as setas para reordenar e o botão abaixo para adicionar mais. Salvar.
      </AdminHelp>

      <EspecialidadesEditor initial={items} />
    </div>
  );
}
