import { getProcedimentos, getTypography } from "@/lib/content";
import { saveProcedimentos } from "@/app/admin/actions";
import AdminHelp from "@/components/admin/AdminHelp";
import AreaTypography from "@/components/admin/AreaTypography";
import AcervoEditor from "@/app/admin/acervo/AcervoEditor";
import Link from "next/link";

export default async function AdminProcedimentosPage() {
  const itens = await getProcedimentos();
  const typo = await getTypography();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Procedimentos médicos</h1>
        <p className="mt-1 text-sm text-white/50">
          Procedimentos e técnicas com <strong className="text-white/70">vídeo, PDF, passo a passo</strong> e imagem —
          marcados por especialidade (aparecem nos hubs). Aparece em <span className="font-mono text-white/70">/procedimentos</span> e na home.
        </p>
      </div>

      <AdminHelp>Clique em “Adicionar item”. Informe título e especialidade (campo Área), escreva o passo a passo, envie o vídeo da técnica e/ou capa, e anexe PDFs/materiais para download. Salvar.</AdminHelp>

      <AcervoEditor initialItens={itens} onSave={saveProcedimentos} uploadPrefix="procedimentos" saveLabel="Salvar procedimentos" />

      <AreaTypography sectionKey="procedimentos" label="Procedimentos médicos" initial={typo["procedimentos"]} />
    </div>
  );
}
