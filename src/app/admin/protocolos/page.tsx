import { getProtocolos, getTypography } from "@/lib/content";
import AdminHelp from "@/components/admin/AdminHelp";
import ColsShortcut from "@/components/admin/ColsShortcut";
import AreaTypography from "@/components/admin/AreaTypography";
import ProtocolosEditor from "./ProtocolosEditor";
import ProtocolosEditoraAdmin from "./ProtocolosEditoraAdmin";
import { listarProtocolos } from "@/app/admin/editora/arquiteto-protocolos/actions";

export const dynamic = "force-dynamic";

export default async function AdminProtocolosPage() {
  const protocolos = await getProtocolos();
  const typo = await getTypography();
  const editoraRes = await listarProtocolos();
  const protocolosEditora = editoraRes.ok ? editoraRes.data : [];

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Protocolos clínicos</h1>
        <p className="mt-1 text-sm text-white/50">
          Gerencie os protocolos exibidos em{" "}
          <span className="font-mono text-white/70">/protocolos</span> e na home.
        </p>
      </div>

      <AdminHelp>Clique em “Adicionar protocolo”. Preencha título, área e descrição; envie o PDF e/ou a imagem do infográfico. Salvar para publicar.</AdminHelp>

      <ColsShortcut />

      <ProtocolosEditoraAdmin protocolos={protocolosEditora} />

      <ProtocolosEditor initialProtocolos={protocolos} />

      <AreaTypography sectionKey="protocolos" label="Protocolos" initial={typo["protocolos"]} />
    </div>
  );
}
