import Link from "next/link";
import { CalendarDays, Contact, Layers, Sparkles, ArrowRight } from "lucide-react";

const sections = [
  {
    href: "/admin/eventos",
    icon: CalendarDays,
    label: "Eventos",
    desc: "Adicione, edite ou remova eventos do calendário e da página de inscrição.",
    color: "text-accent-blue",
    border: "hover:border-accent-blue/40",
  },
  {
    href: "/admin/apps",
    icon: Layers,
    label: "Apps por assinatura",
    desc: "Edite título, descrição e destaques de cada aplicativo.",
    color: "text-accent",
    border: "hover:border-accent/40",
  },
  {
    href: "/admin/contato",
    icon: Contact,
    label: "Contato",
    desc: "Atualize e-mail, WhatsApp, telefone e redes sociais.",
    color: "text-accent-violet",
    border: "hover:border-accent-violet/40",
  },
  {
    href: "/admin/hero",
    icon: Sparkles,
    label: "Hero da Home",
    desc: "Edite o badge, título e subtítulo da seção principal.",
    color: "text-amber-400",
    border: "hover:border-amber-400/40",
  },
];

export default function AdminPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Painel Admin</h1>
        <p className="mt-1 text-sm text-muted">
          Selecione uma seção para editar o conteúdo do site.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, icon: Icon, label, desc, color, border }) => (
          <Link
            key={href}
            href={href}
            className={`group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06] ${border}`}
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <div>
              <p className="font-medium text-white">{label}</p>
              <p className="mt-1 text-sm text-muted leading-relaxed">{desc}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-white/50 transition group-hover:text-white/80">
              Editar <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="text-sm text-muted underline underline-offset-4 hover:text-white transition"
        >
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}
