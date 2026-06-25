import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createHash } from "crypto";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Contact,
  GraduationCap,
  ImageIcon,
  LayoutDashboard,
  Layers,
  LogOut,
  Mic,
  Newspaper,
  PlayCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Menu,
  Type,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import { adminLogout } from "@/app/admin-login/actions";

function getExpectedToken() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHash("sha256").update(pw).digest("hex");
}

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/header", label: "Cabeçalho", icon: UserCircle },
  { href: "/admin/menu", label: "Menu do topo", icon: Menu },
  { href: "/admin/tipografia", label: "Aparência do texto", icon: Type },
  { href: "/admin/hero", label: "Hero", icon: Sparkles },
  { href: "/admin/apps", label: "Apps", icon: Layers },
  { href: "/admin/apps-gratis", label: "Apps Grátis", icon: BookOpen },
  { href: "/admin/apps-uteis", label: "Apps do dia a dia", icon: Wallet },
  { href: "/admin/cursos", label: "Cursos", icon: GraduationCap },
  { href: "/admin/topicos-estudo", label: "Tópicos de estudo", icon: BookOpen },
  { href: "/admin/por-que-nos", label: "Por que nós", icon: ShieldCheck },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/admin/contato", label: "Contato", icon: Contact },
  { href: "/admin/imagens", label: "Imagens", icon: ImageIcon },
  { href: "/admin/atualizacoes", label: "Atualizações", icon: Newspaper },
  { href: "/admin/protocolos", label: "Protocolos", icon: ClipboardList },
  { href: "/admin/videoaulas", label: "Videoaulas", icon: PlayCircle },
  { href: "/admin/colaboradores", label: "Colaboradores", icon: Users },
  { href: "/admin/podcast", label: "Podcast", icon: Mic },
  { href: "/admin/config", label: "Configurações", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoginPage = false; // handled by not protecting /admin/login

  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const expected = getExpectedToken();

  if (token !== expected) {
    redirect("/admin-login");
  }

  return (
    <div className="min-h-screen bg-[#07090f] text-foreground flex">
      <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-black/40 flex-col lg:flex">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Admin</p>
          <p className="mt-1 text-sm font-semibold text-white">Dr. Sandro</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <form action={adminLogout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between border-b border-white/10 bg-black/40 px-5 py-4">
          <p className="text-sm font-semibold text-white">Admin · Dr. Sandro</p>
          <form action={adminLogout}>
            <button type="submit" className="text-xs text-white/50 hover:text-white transition">
              Sair
            </button>
          </form>
        </header>

        <main className="flex-1 px-6 py-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
