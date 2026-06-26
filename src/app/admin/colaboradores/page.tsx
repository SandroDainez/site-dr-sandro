import { getColaboradores, getTypography } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import AreaTypography from "@/components/admin/AreaTypography";
import ColaboradoresEditor from "./ColaboradoresEditor";
import Link from "next/link";

export default async function AdminColaboradoresPage() {
  const items = await getColaboradores();
  const typo = await getTypography();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Vídeos de colaboradores</h1>
        <p className="mt-1 text-sm text-white/50">
          Vídeos de outros médicos que autorizaram a publicação, com crédito
          (<strong className="text-white/70">nome + especialidade</strong>). Envie o vídeo do PC ou
          cole um link do YouTube. Aparecem em <span className="font-mono text-white/70">/colaboradores</span> e na home.
        </p>
      </div>

      <AdminHelp>Adicione o vídeo de um médico convidado: cole o link do YouTube ou envie o vídeo, e informe o nome e a especialidade. Salvar.</AdminHelp>

      <ColaboradoresEditor initialItems={items} />

      <AreaTypography sectionKey="colaboradores" label="Colaboradores" initial={typo["colaboradores"]} />
    </div>
  );
}
