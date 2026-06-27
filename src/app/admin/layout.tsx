import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createHash } from "crypto";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Contact,
  GraduationCap,
  ImageIcon,
  LayoutDashboard,
  Layers,
  Library,
  LogOut,
  Mic,
  Newspaper,
  PlayCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Heading,
  Pilcrow,
  Type,
  UserCircle,
  Users,
  Wallet,
  ListOrdered,
} from "lucide-react";
import { adminLogout } from "@/app/admin-login/actions";

function getExpectedToken() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHash("sha256").update(pw).digest("hex");
}

const navGroups = [
  {
    title: "Painel",
    items: [
      { href: "/admin", label: "Início do admin", icon: LayoutDashboard, hint: "Visão geral e atalhos do painel." },
      { href: "/admin/analytics", label: "Acessos", icon: BarChart3, hint: "Quantas pessoas acessaram o site, com gráfico de visitas." },
      { href: "/admin/conteudo-automatico", label: "Conteúdo automático (IA)", icon: Sparkles, hint: "Agentes de IA: atualizações clínicas semanais e eventos científicos. Status e executar agora." },
    ],
  },
  {
    title: "Aparência do site",
    items: [
      { href: "/admin/header", label: "Cabeçalho e logo", icon: UserCircle, hint: "Nome, CRM/RQE e o logo que aparecem no topo do site." },
      { href: "/admin/titulos", label: "Títulos das seções", icon: Heading, hint: "Rótulo e título de cada seção da home (ex: 'Apps médicos para decisão clínica')." },
      { href: "/admin/textos-botoes", label: "Textos e botões", icon: Pilcrow, hint: "Frases e botões soltos: 'Explorar plataforma', 'Ver todos', rodapé, curso pago." },
      { href: "/admin/tipografia", label: "Fontes e cores do texto", icon: Type, hint: "Tamanho, fonte, cor e peso das letras de cada seção." },
      { href: "/admin/hero", label: "Destaque da home", icon: Sparkles, hint: "Título e subtítulo do grande bloco no topo da página inicial." },
      { href: "/admin/ordem-home", label: "Ordem das seções (home)", icon: ListOrdered, hint: "Em que ordem as seções aparecem ao rolar a página inicial." },
      { href: "/admin/config", label: "Rodapé e faixa rolante", icon: Settings, hint: "Frases da faixa que rola e os textos do rodapé." },
      { href: "/admin/imagens", label: "Imagens", icon: ImageIcon, hint: "Enviar imagens e copiar o link para usar no site." },
    ],
  },
  {
    title: "Apps",
    items: [
      { href: "/admin/apps", label: "Apps por assinatura", icon: Layers, hint: "Apps médicos pagos / por assinatura." },
      { href: "/admin/apps-gratis", label: "Apps grátis", icon: BookOpen, hint: "Apps médicos de acesso gratuito." },
      { href: "/admin/apps-uteis", label: "Apps do dia a dia", icon: Wallet, hint: "Apps genéricos: finanças, organização, produtividade." },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { href: "/admin/cursos", label: "Cursos", icon: GraduationCap, hint: "Cursos completos com aulas, vídeos, slides e PDF." },
      { href: "/admin/topicos-estudo", label: "Tópicos de estudo (home)", icon: BookOpen, hint: "Lista simples de tópicos exibida na home (não é o curso completo)." },
      { href: "/admin/atualizacoes", label: "Atualizações clínicas", icon: Newspaper, hint: "Novidades por área: emergências, TI, anestesiologia." },
      { href: "/admin/protocolos", label: "Protocolos", icon: ClipboardList, hint: "Protocolos clínicos com PDF e infográfico." },
      { href: "/admin/procedimentos", label: "Procedimentos médicos", icon: Stethoscope, hint: "Procedimentos e técnicas com vídeo, PDF, passo a passo e imagem, por especialidade." },
      { href: "/admin/videoaulas", label: "Videoaulas", icon: PlayCircle, hint: "Videoaulas (link do YouTube ou vídeo enviado)." },
      { href: "/admin/podcast", label: "Podcast", icon: Mic, hint: "Episódios em áudio: suas gravações e/ou links (Spotify, YouTube)." },
      { href: "/admin/colaboradores", label: "Parceiros (material cedido)", icon: Users, hint: "Materiais cedidos por outros profissionais — crédito, mini-bio e contatos deles." },
      { href: "/admin/acervo", label: "Outros assuntos", icon: Library, hint: "Qualquer assunto (inclusive não-médico): textos, fotos, vídeos e arquivos para baixar (PDFs, livros)." },
    ],
  },
  {
    title: "Mais",
    items: [
      { href: "/admin/por-que-nos", label: "Por que nós", icon: ShieldCheck, hint: "Cards de diferenciais exibidos na home." },
      { href: "/admin/eventos", label: "Eventos", icon: CalendarDays, hint: "Eventos do calendário e a página de inscrição." },
      { href: "/admin/contato", label: "Contato", icon: Contact, hint: "E-mail, WhatsApp, telefone e redes sociais." },
    ],
  },
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
        <nav className="flex-1 overflow-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon, hint }) => (
                  <Link
                    key={href}
                    href={href}
                    title={hint}
                    className="group/nav flex items-start gap-2.5 rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/50 group-hover/nav:text-accent" />
                    <span className="min-w-0">
                      <span className="block leading-tight">{label}</span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-white/35">{hint}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
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
