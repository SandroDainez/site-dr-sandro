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
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Parceiros (material cedido)</h1>
        <p className="mt-1 text-sm text-white/50">
          Materiais cedidos por outros profissionais, com crédito
          (<strong className="text-white/70">nome + especialidade</strong>), mini-bio e contatos/redes deles.
          Envie o vídeo do PC ou cole um link do YouTube. Aparecem em <span className="font-mono text-white/70">/colaboradores</span> e na home.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-accent/25 bg-accent/[0.06] px-4 py-3 text-sm text-white/70">
        ✍️ Para editar o <strong className="text-white/85">título da página</strong> e a{" "}
        <strong className="text-white/85">frase de agradecimento</strong>, vá em{" "}
        <Link href="/admin/titulos" className="font-medium text-accent underline underline-offset-2">Títulos das seções</Link>{" "}
        → <span className="text-white/85">Páginas internas → &quot;Página Parceiros&quot;</span> (o campo de descrição é a frase de agradecimento).
      </div>

      <AdminHelp>Adicione o material de um profissional parceiro: cole o link do YouTube ou envie o vídeo, informe o nome e a especialidade, e — se ele quiser divulgação — preencha a mini-bio e os links (Instagram, site, WhatsApp...). Salvar.</AdminHelp>

      <ColaboradoresEditor initialItems={items} />

      <AreaTypography sectionKey="colaboradores" label="Parceiros" initial={typo["colaboradores"]} />
    </div>
  );
}
