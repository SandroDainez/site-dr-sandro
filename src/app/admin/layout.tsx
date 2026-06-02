import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  CalendarDays,
  Contact,
  LayoutDashboard,
  Layers,
  Sparkles,
} from "lucide-react";

const ALLOWED_EMAIL = process.env.ADMIN_EMAIL;

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/admin/apps", label: "Apps", icon: Layers },
  { href: "/admin/contato", label: "Contato", icon: Contact },
  { href: "/admin/hero", label: "Hero", icon: Sparkles },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  const userEmail = user.emailAddresses?.[0]?.emailAddress ?? "";
  if (ALLOWED_EMAIL && userEmail !== ALLOWED_EMAIL) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground px-6">
        <div className="rounded-3xl border border-white/10 bg-panel p-10 text-center max-w-md">
          <p className="text-lg font-semibold text-white">Acesso negado</p>
          <p className="mt-2 text-sm text-muted">
            Este email ({userEmail}) não tem permissão de acesso ao painel admin.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Voltar ao site
          </Link>
        </div>
      </main>
    );
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
        <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3">
          <UserButton />
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{user.firstName}</p>
            <p className="text-[10px] text-muted truncate">{userEmail}</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between border-b border-white/10 bg-black/40 px-5 py-4">
          <p className="text-sm font-semibold text-white">Admin · Dr. Sandro</p>
          <div className="flex items-center gap-3">
            <UserButton />
          </div>
        </header>

        <main className="flex-1 px-6 py-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
