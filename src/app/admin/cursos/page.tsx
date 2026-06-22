import { getCourses } from "@/lib/content";
import CursosEditor from "./CursosEditor";
import Link from "next/link";

export default async function AdminCursosPage() {
  const courses = await getCourses();

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:text-white transition">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Cursos</h1>
        <p className="mt-1 text-sm text-muted">
          Edite os tópicos de cursos exibidos na seção de atualização médica contínua.
        </p>
      </div>

      <CursosEditor initialCourses={courses} />
    </div>
  );
}
