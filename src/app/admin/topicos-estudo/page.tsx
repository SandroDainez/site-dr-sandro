import { getCourses, getTypography } from "@/lib/content";
import AreaTypography from "@/components/admin/AreaTypography";
import TopicosEditor from "./TopicosEditor";
import Link from "next/link";

export default async function AdminTopicosEstudoPage() {
  const courses = await getCourses();
  const typo = await getTypography();

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Tópicos de estudo (home)</h1>
        <p className="mt-1 text-sm text-muted">
          Lista simples de tópicos exibida na seção de atualização médica contínua da home.
          Para os cursos completos (aulas, vídeos, slides, PDF), use a área{" "}
          <span className="font-mono text-white/70">Cursos</span>.
        </p>
      </div>

      <TopicosEditor initialCourses={courses} />

      <AreaTypography sectionKey="cursos" label="Tópicos de estudo" initial={typo["cursos"]} />
    </div>
  );
}
