"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import type { CourseData } from "@/lib/content";
import { saveCourses } from "@/app/admin/actions";

type Props = {
  initialCourses: CourseData[];
};

export default function CursosEditor({ initialCourses }: Props) {
  const [courses, setCourses] = useState<CourseData[]>(initialCourses);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(index: number, field: keyof CourseData, value: string) {
    setCourses((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
    setSaved(false);
  }

  function removeCourse(index: number) {
    setCourses((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function addCourse() {
    setCourses((prev) => [...prev, { id: "", title: "", link: "" }]);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveCourses(courses);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {courses.map((course, index) => (
        <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.12em] text-white/40">Curso {index + 1}</span>
            <button
              type="button"
              onClick={() => removeCourse(index)}
              className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Título</label>
            <input
              type="text"
              value={course.title}
              onChange={(e) => update(index, "title", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">
              ID âncora (slug para scroll, ex: via-aerea-dificil)
            </label>
            <input
              type="text"
              value={course.id}
              onChange={(e) => update(index, "id", e.target.value)}
              placeholder="meu-curso"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
            <p className="mt-1 text-[11px] text-white/35">
              Usado como <code className="text-white/50">id</code> no elemento HTML para o link &quot;Via aérea difícil&quot; no menu.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-muted">Link (URL)</label>
            <input
              type="url"
              value={course.link}
              onChange={(e) => update(index, "link", e.target.value)}
              placeholder="https://"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addCourse}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm text-white/50 transition hover:border-accent/40 hover:text-accent"
      >
        <Plus className="h-4 w-4" /> Adicionar curso
      </button>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#0f1420] transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar cursos"}
        </button>
        {saved && <span className="text-sm text-accent">✓ Salvo com sucesso</span>}
        {error && <p className="text-sm text-red-400 max-w-md leading-relaxed">{error}</p>}
      </div>
    </div>
  );
}
