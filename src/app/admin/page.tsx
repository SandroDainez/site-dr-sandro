import Link from "next/link";
import {
  AudioLines,
  BookOpen,
  CalendarDays,
  Contact,
  GraduationCap,
  ImageIcon,
  Layers,
  Newspaper,
  Settings,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCircle,
} from "lucide-react";

const sections = [
  {
    href: "/admin/header",
    icon: UserCircle,
    label: "Cabeçalho",
    desc: "Edite nome, CRM, RQEs e URL da logo no topo do site.",
    color: "text-accent",
    border: "hover:border-accent/40",
  },
  {
    href: "/admin/hero",
    icon: Sparkles,
    label: "Hero da Home",
    desc: "Edite o badge, título e subtítulo da seção principal.",
    color: "text-amber-400",
    border: "hover:border-amber-400/40",
  },
  {
    href: "/admin/apps",
    icon: Layers,
    label: "Apps por assinatura",
    desc: "Edite título, descrição, destaques e link de cada app.",
    color: "text-accent-blue",
    border: "hover:border-accent-blue/40",
  },
  {
    href: "/admin/apps-gratis",
    icon: BookOpen,
    label: "Apps Grátis",
    desc: "Edite os cards de aplicativos gratuitos com ícone e link.",
    color: "text-emerald-400",
    border: "hover:border-emerald-400/40",
  },
  {
    href: "/admin/conteudo",
    icon: AudioLines,
    label: "Conteúdo",
    desc: "Edite os itens da seção de podcasts, aulas e atualizações.",
    color: "text-cyan-400",
    border: "hover:border-cyan-400/40",
  },
  {
    href: "/admin/cursos",
    icon: GraduationCap,
    label: "Cursos",
    desc: "Edite os tópicos de cursos com título, ID âncora e link.",
    color: "text-accent-violet",
    border: "hover:border-accent-violet/40",
  },
  {
    href: "/admin/por-que-nos",
    icon: ShieldCheck,
    label: "Por que nós",
    desc: "Edite os cards de diferenciais no rodapé da home.",
    color: "text-accent",
    border: "hover:border-accent/40",
  },
  {
    href: "/admin/eventos",
    icon: CalendarDays,
    label: "Eventos",
    desc: "Adicione, edite ou remova eventos do calendário e da página de inscrição.",
    color: "text-accent-violet",
    border: "hover:border-accent-violet/40",
  },
  {
    href: "/admin/contato",
    icon: Contact,
    label: "Contato",
    desc: "Atualize e-mail, WhatsApp, telefone e redes sociais.",
    color: "text-white/60",
    border: "hover:border-white/30",
  },
  {
    href: "/admin/imagens",
    icon: ImageIcon,
    label: "Imagens",
    desc: "Faça upload de imagens para o Vercel Blob e copie a URL.",
    color: "text-pink-400",
    border: "hover:border-pink-400/40",
  },
  {
    href: "/admin/atualizacoes",
    icon: Newspaper,
    label: "Atualizações",
    desc: "Publique e gerencie atualizações médicas por área clínica.",
    color: "text-orange-400",
    border: "hover:border-orange-400/40",
  },
  {
    href: "/admin/config",
    icon: Settings,
    label: "Configurações",
    desc: "Edite os itens do marquee e os textos do rodapé.",
    color: "text-white/60",
    border: "hover:border-white/30",
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
