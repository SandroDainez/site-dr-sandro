import { getCursos, getTypography } from "@/lib/content";
import AreaTypography from "@/components/admin/AreaTypography";
import CursosEditor from "./CursosEditor";
import Link from "next/link";

export default async function AdminCursosPage() {
  const cursos = await getCursos();
  const typo = await getTypography();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Cursos</h1>
        <p className="mt-1 text-sm text-white/50">
          Crie cursos completos com <strong className="text-white/70">aulas sequenciais</strong> e
          materiais (vídeo, slides, PDF/ebook). Cursos gratuitos abrem para todos; cursos pagos
          ficam <span className="text-white/70">🔒 em breve</span> até a etapa de pagamento.
          Aparecem em <span className="font-mono text-white/70">/cursos</span> e na home.
        </p>
      </div>

      <CursosEditor initialCursos={cursos} />

      <AreaTypography sectionKey="cursos" label="Cursos" initial={typo["cursos"]} />
    </div>
  );
}
