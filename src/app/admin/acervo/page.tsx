import { getAcervo, getTypography } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import AreaTypography from "@/components/admin/AreaTypography";
import AcervoEditor from "./AcervoEditor";
import Link from "next/link";

export default async function AdminAcervoPage() {
  const itens = await getAcervo();
  const typo = await getTypography();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">← Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Outros assuntos</h1>
        <p className="mt-1 text-sm text-white/50">
          Qualquer tema — inclusive fora da medicina — com texto, foto, vídeo e <strong className="text-white/70">arquivos
          para baixar</strong> (PDFs, livros). Aparece em <span className="font-mono text-white/70">/acervo</span> e na home.
        </p>
      </div>

      <AdminHelp>Clique em “Adicionar item”. Preencha título e categoria, escreva o texto, envie capa/vídeo (opcionais) e adicione arquivos para download (PDF, livro, imagem…). Salvar.</AdminHelp>

      <AcervoEditor initialItens={itens} saveLabel="Salvar" />

      <AreaTypography sectionKey="acervo" label="Outros assuntos" initial={typo["acervo"]} />
    </div>
  );
}
