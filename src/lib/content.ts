import { list, put } from "@vercel/blob";
import { HOME_SECTION_IDS, DEFAULT_HOME_ORDER, CARD_COL_SECTIONS, DEFAULT_CARD_COLS, SECOES_OCULTAS_HOME } from "./home-sections";
import { NAV_GROUPS, applyNavOverride, type NavGroup, type NavOverride } from "./nav-structure";
import { finalidadeEfetiva, type Finalidade } from "./finalidades";
import { unstable_cache, revalidateTag } from "next/cache";
import fs from "fs/promises";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventoData = {
  slug: string;
  titulo: string;
  descricao: string;
  investimento: string;
  data: string; // YYYY-MM-DD
  tipo?: string; // ex: Curso, Workshop, Imersão, Congresso, Webinar, Aula
  horario?: string; // ex: "08h às 17h"
  local?: string; // ex: "Online (Zoom)" ou "São Paulo - SP"
  cargaHoraria?: string; // ex: "8 horas"
  publicoAlvo?: string; // ex: "Médicos e residentes"
  programacao?: string; // conteúdo detalhado / o que será abordado (várias linhas)
  inscricaoUrl?: string; // link externo de inscrição (opcional)
  folderUrl?: string; // imagem do folder/cartaz do evento
};

export type AppData = {
  title: string;
  subtitle: string;
  text: string;
  icon: string;
  glow: string;
  highlights: string[];
  link: string;
  thumbnailUrl?: string;
  thumbnailSize?: number; // tamanho da miniatura/logo em px (default 48)
  finalidade?: "decisao" | "estudo" | "gestao" | "utilidade"; // pra que serve (agrupa na home); default = inferido do texto
  area?: "emergencias" | "ti" | "anestesiologia" | "geral"; // área no site (p/ hubs/filtro); default "geral"
  areas?: ("emergencias" | "ti" | "anestesiologia")[]; // também aparece nestes hubs, além da área principal
};

export type FreeAppData = {
  title: string;
  desc: string; // pode conter HTML simples (cores/tamanhos) — sanitizado ao renderizar
  icon: string;
  link: string;
  imageUrl?: string; // logo/imagem própria do app (substitui o ícone)
  imageSize?: number; // tamanho do logo em px (default 28)
  finalidade?: "decisao" | "estudo" | "gestao" | "utilidade"; // pra que serve (agrupa na home); default = inferido do texto
  area?: "emergencias" | "ti" | "anestesiologia" | "geral"; // área no site (p/ hubs/filtro); default "geral"
  areas?: ("emergencias" | "ti" | "anestesiologia")[]; // também aparece nestes hubs, além da área principal
};

// Apps genéricos do dia a dia (finanças, organização, produtividade — podem ser
// fora do tema médico). Mesmo padrão premium, com badge de categoria.
export type UtilAppData = {
  title: string;
  categoria: string; // badge: "Finanças", "Organização", "Produtividade"...
  desc: string; // rich text (HTML simples, sanitizado ao renderizar)
  icon: string;
  link: string;
  imageUrl?: string; // logo/ícone do app
  imageSize?: number; // tamanho do logo em px (default 48)
};

export type ContentItemData = {
  title: string;
  subtitle: string;
  link: string;
};

export type CourseData = {
  id: string;
  title: string;
  link: string;
};

export type WhyUsData = {
  icon: string;
  title: string;
  text: string;
};

export type SiteConfig = {
  marqueeItems: string[];
  footerName: string;
  footerTagline: string;
};

export type ContatoData = {
  email: string;
  whatsapp: string;
  whatsappLink: string;
  telefone: string;
  telefoneLink: string;
  instagram: string;
  instagramLink: string;
  // VÁRIOS QR codes (um por canal: WhatsApp, Instagram, PIX, vCard...).
  qrs?: { label: string; url: string; legenda?: string }[];
  // QR code legado (1 só) — mantido p/ compatibilidade; migrado para `qrs` no editor.
  qrUrl?: string;     // imagem do QR (servida via /api/img)
  qrLabel?: string;   // título acima do QR, ex.: "Fale no WhatsApp"
  qrLegenda?: string; // texto pequeno abaixo, ex.: "Aponte a câmera do celular"
  // Canais sociais extras e flexíveis (YouTube, TikTok, Telegram, LinkedIn, ...).
  // Admin adiciona quantos quiser sem mudar código.
  canais?: { label: string; valor: string; url: string }[];
};

export type HeroData = {
  badge: string;
  title: string;
  subtitle: string;
};

export type HeaderData = {
  name: string;
  cremesp: string; // legado — mantido p/ compatibilidade; substituído por subtitleLines
  rqe1: string;
  rqe2: string;
  subtitleLines?: string[]; // linhas livres abaixo do nome (CRM, RQEs, etc.)
  logoUrl: string;
  // Aparência do logo (tudo opcional; vazio = visual padrão). Tamanhos em px
  // referem-se ao logo grande da home; nas páginas internas são reduzidos pela metade.
  logoSize?: number; // tamanho da moldura (largura/altura)
  logoOffsetX?: number; // deslocamento horizontal da moldura
  logoOffsetY?: number; // deslocamento vertical da moldura
  logoScale?: number; // tamanho do desenho DENTRO da moldura (1 = normal)
  logoPadding?: number; // espaçamento interno da moldura
  logoRadius?: number; // arredondamento dos cantos
  logoBg?: string; // cor de fundo da moldura ("transparent" ou hex)
  logoBorder?: boolean; // mostrar borda (default: sim)
  logoShadow?: boolean; // mostrar brilho/sombra (default: sim)
  // Filtros de cor da imagem (%). hue em graus.
  logoBrightness?: number;
  logoContrast?: number;
  logoSaturate?: number;
  logoGrayscale?: number;
  logoInvert?: number;
  logoHue?: number;
};

// Tamanho de fonte por seção do site. Definidos em arquivo separado (sem `fs`)
// para poderem ser usados em componentes client sem quebrar o bundle.
import type { TypographyData } from "./typography-sections";
export type { TypographyData, SectionStyle } from "./typography-sections";
export { TYPOGRAPHY_SECTIONS } from "./typography-sections";

export type NavItemData = {
  label: string;
  href: string; // ex: "#cursos", "/atualizacoes", "https://..."
};

// Aparência da barra de menu (tudo opcional; vazio = padrão).
export type NavStyleData = {
  fontScale?: number; // multiplicador da fonte (1 = normal)
  paddingX?: number; // px — espaço interno horizontal da barra
  paddingY?: number; // px — altura/espaço interno vertical da barra
  gap?: number; // px — espaço entre os itens
  itemPaddingX?: number; // px — espaço interno horizontal de cada item
};

export type AtualizacaoData = {
  id: string;
  titulo: string;
  conteudo: string;
  area: "emergencias" | "ti" | "anestesiologia";
  imageUrl: string;
  imageCaption: string;
  imageSize?: number; // tamanho da imagem em px
  link: string;
  data: string; // YYYY-MM-DD
  areas?: ("emergencias" | "ti" | "anestesiologia")[]; // também aparece nestes hubs, além da área principal
  // Formato "boletim": atualização manual com a MESMA estrutura do boletim da IA
  // (resumo + tópicos com fonte/URL + referências). Renderiza igual ao da IA.
  // Ausente ou "simples" = card tradicional (conteúdo livre + logo).
  formato?: "simples" | "boletim";
  resumo?: string;
  topicos?: AtualizacaoTopico[];
  fontes?: AtualizacaoFonte[];
};

export type AtualizacaoTopico = {
  titulo: string;
  descricao: string;
  relevancia_clinica?: string;
  fonte_tipo?: string; // guideline | posicionamento | alerta | estudo ...
  fonte_nome?: string; // ex: "N Engl J Med", "SBA"
  fonte_url?: string;  // link clicável da fonte
  pmid?: string;       // opcional, gera link PubMed
};

export type AtualizacaoFonte = {
  titulo: string;
  url: string;
  journal?: string;
  ano?: string;
  origem?: string; // pubmed | rss | sociedade | regulatorio ...
};

export type ProtocoloData = {
  id: string;           // unique slug
  titulo: string;
  descricao: string;    // short description shown on card
  conteudo: string;     // full text content
  area: "emergencias" | "ti" | "anestesiologia";
  imageUrl: string;     // optional illustrative image
  imageCaption: string;
  imageSize?: number; // tamanho da imagem em px // caption below image
  arquivoUrl: string;   // optional PDF or external material link
  arquivoLabel: string; // button label, e.g. "Baixar PDF" or "Ver protocolo"
  data: string;         // YYYY-MM-DD (last updated)
  areas?: ("emergencias" | "ti" | "anestesiologia")[]; // também aparece nestes hubs, além da área principal
};

export type VideoaulaData = {
  id: string;
  titulo: string;
  descricao: string;
  area: "emergencias" | "ti" | "anestesiologia" | "geral";
  videoUrl: string;     // YouTube URL, proxied blob URL, or any direct link
  imageUrl: string;     // thumbnail (optional)
  imageCaption: string;
  imageSize?: number; // tamanho da imagem em px
  duracao: string;      // e.g. "45 min"
  nivel: "basico" | "intermediario" | "avancado" | "";
  gratuita: boolean;
  enquadramento?: number; // posição horizontal do vídeo no card (object-position X%, 0=esq, 50=centro, 100=dir). default 50
  enquadramentoY?: number; // posição vertical do vídeo no card (object-position Y%, 0=topo, 50=centro, 100=baixo). default 50
  zoom?: number; // aproximação do vídeo no card (%, 100=normal). >100 cria folga p/ enquadrar na vertical
  areas?: ("emergencias" | "ti" | "anestesiologia")[]; // também aparece nestes hubs, além da área principal
  mostrarInteiro?: boolean; // true = object-fit contain (mostra o vídeo inteiro, sem cortar — p/ vídeo vertical com legendas)
  pdfUrl?: string;      // material de apoio em PDF (admin sobe; servido via /api/img)
  pdfLabel?: string;    // rótulo do botão do PDF (default "Material da aula (PDF)")
  // Prova pré/pós aula (opcional). MESMAS perguntas antes e depois do vídeo;
  // mede a evolução do conhecimento. IA rascunha, admin edita.
  quiz?: { enunciado: string; opcoes: string[]; correta: number; justificativa?: string }[];
  quizInstrucoes?: string; // orientação do admin p/ a IA gerar a prova (assuntos, pontos-chave)
  data: string;         // YYYY-MM-DD
};

// ─── Cursos (pilar) ───────────────────────────────────────────────────────────
// Curso > Aulas sequenciais > Materiais (vídeo, slides, pdf, ebook).
// Acesso: "gratis" abre pra todos; "pago" fica bloqueado (🔒 em breve) até a
// Fase 2 do pagamento (compra avulsa por curso + assinatura única do site).

export type CursoMaterial = {
  id: string;
  tipo: "video" | "slides" | "pdf" | "ebook";
  titulo: string;
  url: string; // URL do YouTube (vídeo) ou /api/img de blob privado (vídeo/slides/pdf)
};

export type CursoAula = {
  id: string;
  titulo: string;
  descricao: string; // rich text (HTML)
  materiais: CursoMaterial[];
};

export type CursoData = {
  id: string; // slug único (ex: ventilacao-mecanica)
  titulo: string;
  resumo: string; // frase curta no card
  descricao: string; // rich text (sobre o curso)
  area: "emergencias" | "ti" | "anestesiologia" | "geral";
  nivel: "basico" | "intermediario" | "avancado" | "";
  professor: string;
  capaUrl: string; // imagem de capa
  acesso: "gratis" | "pago";
  preco: string; // ex "R$ 297" (guardado p/ Fase 2; vazio = sem preço)
  destaque: boolean;
  aulas: CursoAula[];
  quiz?: CursoQuestao[]; // avaliação (casos clínicos / múltipla escolha) — opcional
  notaMinima?: number;   // % para aprovação (padrão 70)
  data: string; // YYYY-MM-DD
  areas?: ("emergencias" | "ti" | "anestesiologia")[]; // também aparece nestes hubs, além da área principal
};

// Questão da avaliação do curso (múltipla escolha; o enunciado pode ser uma vinheta clínica).
export type CursoQuestao = {
  id: string;
  enunciado: string;   // pergunta ou caso clínico + pergunta
  opcoes: string[];    // alternativas
  correta: number;     // índice (0-based) da alternativa correta
  explicacao?: string; // comentário mostrado após responder
};

// Podcast: episódios com gravação enviada (áudio do PC) e/ou link externo
// (Spotify, YouTube, Apple Podcasts). Capa + descrição.
export type PodcastData = {
  id: string;
  titulo: string;
  descricao: string; // rich text (HTML, sanitizado ao renderizar)
  area?: "emergencias" | "ti" | "anestesiologia" | "geral"; // área no site (p/ hubs/filtro); default "geral"
  areas?: ("emergencias" | "ti" | "anestesiologia")[]; // também aparece nestes hubs, além da área principal
  imageUrl: string; // capa do episódio
  audioUrl: string; // gravação enviada (proxied /api/img) ou link direto de áudio (.mp3)
  embedUrl: string; // link externo: Spotify / YouTube / Apple Podcasts
  duracao: string; // ex: "32 min"
  data: string; // YYYY-MM-DD
};

// Vídeos de colaboradores: vídeos de outros médicos que autorizaram a publicação,
// com crédito (nome + especialidade).
export type ColaboradorLink = {
  id: string;
  label: string; // ex: "Instagram", "Site", "WhatsApp"
  url: string; // link (https://..., mailto:, https://wa.me/...)
};

export type ColaboradorData = {
  id: string;
  titulo: string;
  descricao: string; // rich text
  medico: string; // nome do profissional que cedeu o material
  especialidade: string; // credencial do profissional (texto livre) — ex: "Cardiologia"
  area?: "emergencias" | "ti" | "anestesiologia" | "geral"; // área no site (p/ hubs/filtro); default "geral"
  areas?: ("emergencias" | "ti" | "anestesiologia")[]; // também aparece nestes hubs, além da área principal
  assunto?: string; // agrupa aulas do mesmo tema (ex.: "Raquianestesia") num card-playlist
  videoUrl: string; // YouTube ou /api/img de blob
  imageUrl: string; // thumbnail (opcional)
  duracao: string;
  data: string; // YYYY-MM-DD
  bio?: string; // mini-bio do profissional (opcional, p/ marketing/contato)
  links?: ColaboradorLink[]; // contatos/redes/site do profissional (opcional)
  bioCor?: string; // cor de destaque da caixa "Sobre o profissional" (ver bio-cor.ts)
  qrLink?: string; // número/URL do QR (o tipo abaixo decide como é montado)
  qrTipo?: string; // "whatsapp" | "tel" | "url" (ver qr-link.ts) — default whatsapp
};

// Acervo: conteúdos gerais / curiosidades, com texto rico, capa, vídeo e
// arquivos para download (PDFs, livros, imagens...).
export type AcervoArquivo = {
  id: string;
  tipo: "pdf" | "livro" | "video" | "imagem" | "arquivo";
  titulo: string;
  url: string;
};
export type AcervoItemData = {
  id: string;
  titulo: string;
  area?: "emergencias" | "ti" | "anestesiologia" | "geral"; // especialidade (p/ hubs); default "geral"
  categoria: string; // badge livre (ex: Curiosidades, Saúde, Geral)
  descricao: string; // rich text (HTML)
  capaUrl: string; // imagem de capa
  capaAltura?: number; // altura da capa no site em px (default 200) — imagem inteira, sem cortar
  videoUrl: string; // YouTube ou vídeo enviado (destaque, opcional)
  arquivos: AcervoArquivo[]; // downloads (PDF, livro, imagem, etc.)
  data: string; // YYYY-MM-DD
  areas?: ("emergencias" | "ti" | "anestesiologia")[]; // também aparece nestes hubs, além da área principal
};

export type ContentMap = {
  eventos: EventoData[];
  apps: AppData[];
  contato: ContatoData;
  hero: HeroData;
  header: HeaderData;
  freeApps: FreeAppData[];
  utilApps: UtilAppData[];
  contentItems: ContentItemData[];
  courses: CourseData[];
  whyUs: WhyUsData[];
  siteConfig: SiteConfig;
  atualizacoes: AtualizacaoData[];
  protocolos: ProtocoloData[];
  videoaulas: VideoaulaData[];
  cursos: CursoData[];
  podcasts: PodcastData[];
  colaboradores: ColaboradorData[];
  acervo: AcervoItemData[];
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const defaultEventos: EventoData[] = [
  {
    slug: "manejo-via-aerea-critico",
    titulo: "Manejo de via aérea no paciente crítico",
    descricao:
      "Treinamento com foco em preparação, escolha de estratégia e execução segura no cenário crítico.",
    investimento: "R$ 890,00",
    data: "2026-05-24",
    tipo: "Workshop prático",
    horario: "08h às 17h",
    local: "São Paulo - SP",
    cargaHoraria: "8 horas",
    publicoAlvo: "Médicos, residentes e estudantes de medicina",
    programacao:
      "Avaliação e predição de via aérea difícil\nPreparação e pré-oxigenação\nSequência rápida de intubação\nDispositivos de resgate e algoritmo de falha\nPrática em simuladores",
    inscricaoUrl: "",
    folderUrl: "",
  },
  {
    slug: "via-aerea-dificil-no-critico",
    titulo: "Via aérea difícil no crítico",
    descricao:
      "Imersão prática em predição, dispositivos de resgate e algoritmo para falha de intubação.",
    investimento: "R$ 990,00",
    data: "2026-05-28",
  },
  {
    slug: "acls-guiado-por-voz",
    titulo: "ACLS guiado por voz na prática",
    descricao:
      "Atualização prática em PCR intra-hospitalar com simulação de comando e coordenação de equipe.",
    investimento: "R$ 790,00",
    data: "2026-06-03",
  },
  {
    slug: "emergencias-medicas-plantao",
    titulo: "Emergências médicas no plantão",
    descricao:
      "Abordagem dos principais cenários críticos com tomada de decisão rápida e estruturada.",
    investimento: "R$ 840,00",
    data: "2026-06-11",
  },
];

export const defaultApps: AppData[] = [
  {
    title: "AnesMap",
    subtitle: "Preparação estruturada para residência, especialização e título",
    text: "Banco de questões, flashcards SM-2 e protocolos por área, com foco em retenção e tomada de decisão.",
    icon: "Layers",
    glow: "from-emerald-400/30 to-emerald-600/5",
    highlights: ["Questões comentadas por tema", "Revisão espaçada com SM-2"],
    link: "",
  },
  {
    title: "MedEscala",
    subtitle: "Organização de plantões e equipe médica",
    text: "Escalas com previsibilidade, registro de trocas e visão operacional da cobertura assistencial.",
    icon: "CalendarClock",
    glow: "from-blue-400/30 to-blue-600/5",
    highlights: ["Distribuição mais equilibrada", "Visão da cobertura por equipe"],
    link: "",
  },
  {
    title: "Ficha de Anestesia",
    subtitle: "Registro digital intraoperatório",
    text: "Registro padronizado do pré, intra e pós-operatório, incluindo avaliação pré-anestésica e sala de recuperação anestésica.",
    icon: "FileText",
    glow: "from-violet-400/30 to-violet-600/5",
    highlights: ["Pré, intra e pós-operatório", "SRPA e avaliação pré-anestésica"],
    link: "",
  },
  {
    title: "Emergências Médicas",
    subtitle: "Resposta inicial em cenários críticos",
    text: "Algoritmos rápidos, doses e condutas críticas para plantão.",
    icon: "Zap",
    glow: "from-cyan-400/30 to-cyan-600/5",
    highlights: ["Acesso rápido em cenário crítico", "Condutas com foco em tempo-resposta"],
    link: "",
  },
  {
    title: "ACLS Guiado",
    subtitle: "Roteiro prático para PCR intra-hospitalar guiado por voz",
    text: "Cronometria de ciclos, condutas e checkpoints para alinhamento da equipe de reanimação.",
    icon: "HeartPulse",
    glow: "from-amber-400/30 to-amber-600/5",
    highlights: ["Comandos guiados por voz", "Sequência prática para equipe"],
    link: "",
  },
];

export const defaultContato: ContatoData = {
  email: "contato@drsandro.com.br",
  whatsapp: "+55 (11) 99999-9999",
  whatsappLink: "https://wa.me/5511999999999",
  telefone: "+55 (11) 4000-0000",
  telefoneLink: "tel:+551140000000",
  instagram: "Instagram e Telegram",
  instagramLink: "https://instagram.com/",
};

export const defaultHero: HeroData = {
  badge: "Conteúdo técnico e prática clínica",
  title: "Atualização médica digital com alto padrão",
  subtitle:
    "Plataforma de apoio à decisão em medicina de urgência e emergência, terapia intensiva e anestesiologia.",
};

export const defaultHeader: HeaderData = {
  name: "Dr. Sandro Dainez",
  cremesp: "CREMESP 76.907",
  rqe1: "Anestesiologia RQE 58.201",
  rqe2: "Medicina Intensiva RQE 58.202",
  logoUrl: "/logo-medicina.png",
};

export const defaultFreeApps: FreeAppData[] = [
  {
    title: "Aplicativos gratuitos",
    desc: "Ferramentas abertas para consulta rápida e suporte à conduta no plantão.",
    icon: "BookOpen",
    link: "",
  },
  {
    title: "Podcast",
    desc: "Episódios em áudio com discussão de casos e condutas, sem necessidade de login.",
    icon: "AudioLines",
    link: "",
  },
];

export const defaultUtilApps: UtilAppData[] = [
  {
    title: "Controle de Gastos",
    categoria: "Finanças",
    desc: "Acompanhe receitas e despesas, categorize e visualize para onde vai o seu dinheiro.",
    icon: "Wallet",
    link: "",
  },
  {
    title: "Organização Pessoal",
    categoria: "Organização",
    desc: "Listas, tarefas e rotinas para manter o dia a dia sob controle.",
    icon: "ListChecks",
    link: "",
  },
  {
    title: "Planejamento Financeiro",
    categoria: "Finanças",
    desc: "Metas, reserva de emergência e simulações para planejar o futuro com tranquilidade.",
    icon: "PiggyBank",
    link: "",
  },
];

export const defaultContentItems: ContentItemData[] = [
  { title: "Aulas abertas", subtitle: "Acesso livre para revisão rápida", link: "" },
  { title: "Podcasts clínicos", subtitle: "Discussão de casos e condutas", link: "" },
  { title: "Atualizações semanais", subtitle: "Evidência recente aplicada", link: "" },
  { title: "Protocolos guiados", subtitle: "Fluxos de conduta passo a passo", link: "" },
];

export const defaultCourses: CourseData[] = [
  { id: "manejo-via-aerea", title: "Manejo de via aérea no paciente crítico", link: "" },
  { id: "via-aerea-dificil", title: "Via aérea difícil no crítico", link: "" },
];

export const defaultWhyUs: WhyUsData[] = [
  {
    icon: "ShieldCheck",
    title: "Segurança clínica",
    text: "Condutas estruturadas para reduzir variabilidade assistencial.",
  },
  {
    icon: "BrainCircuit",
    title: "Decisão baseada em evidência",
    text: "Síntese objetiva da literatura para suporte à conduta.",
  },
  {
    icon: "Sparkles",
    title: "Usabilidade orientada ao plantão",
    text: "Acesso rápido à informação crítica em momentos de decisão.",
  },
];

export const defaultAtualizacoes: AtualizacaoData[] = [
  {
    id: "acls-2026",
    titulo: "Atualização ACLS 2026 — principais mudanças",
    conteudo:
      "A AHA publicou as novas diretrizes de ressuscitação cardiopulmonar com ênfase em qualidade de compressão e integração de dispositivos de feedback em tempo real.",
    area: "emergencias",
    imageUrl: "",
    imageCaption: "",
    link: "",
    data: "2026-06-01",
  },
  {
    id: "vm-protetora-uti",
    titulo: "Ventilação protetora na UTI — evidências recentes",
    conteudo:
      "Revisão das evidências sobre volume corrente baixo, PEEP titulado e driving pressure como alvos primários na ventilação mecânica do paciente crítico.",
    area: "ti",
    imageUrl: "",
    imageCaption: "",
    link: "",
    data: "2026-05-20",
  },
  {
    id: "bloqueio-neuroaxial-anticoagulados",
    titulo: "Bloqueio neuroaxial em pacientes anticoagulados",
    conteudo:
      "Atualização dos intervalos de segurança para anticoagulantes orais diretos e heparinas de baixo peso molecular antes de procedimentos neuraxiais.",
    area: "anestesiologia",
    imageUrl: "",
    imageCaption: "",
    link: "",
    data: "2026-05-10",
  },
];

export const defaultProtocolos: ProtocoloData[] = [
  {
    id: "manejo-via-aerea-critico",
    titulo: "Manejo de Via Aérea no Paciente Crítico",
    descricao: "Algoritmo passo a passo para abordagem da via aérea em cenário de emergência, incluindo pré-oxigenação, sequência rápida e dispositivos de resgate.",
    conteudo: "1. Avaliação preditiva da via aérea\n2. Pré-oxigenação (VNI ou O2 de alto fluxo)\n3. Posicionamento: elevação de cabeceira 20-30°\n4. Sequência rápida de intubação (SRI)\n5. Plano B: máscara laríngea\n6. Plano C: via aérea cirúrgica",
    area: "emergencias",
    imageUrl: "",
    imageCaption: "",
    arquivoUrl: "",
    arquivoLabel: "Baixar PDF",
    data: "2026-06-01",
  },
  {
    id: "sedoanalgesia-uti",
    titulo: "Sedoanalgesia na UTI",
    descricao: "Protocolo de sedação e analgesia baseado na escala CPOT/RASS, priorizando analgesia antes de sedação e minimizando benzodiazepínicos.",
    conteudo: "Avaliação: RASS alvo -1 a 0 / CPOT < 3\nAnalgesia: Fentanil ou morfina IV\nSedação leve: Propofol ou dexmedetomidina\nSedação profunda (indicações específicas): midazolam\nProtocolo de despertar diário obrigatório",
    area: "ti",
    imageUrl: "",
    imageCaption: "",
    arquivoUrl: "",
    arquivoLabel: "Ver protocolo",
    data: "2026-05-15",
  },
  {
    id: "avaliacao-pre-anestesica",
    titulo: "Avaliação Pré-Anestésica",
    descricao: "Checklist estruturado para avaliação pré-operatória, estratificação de risco e planejamento anestésico individualizado.",
    conteudo: "Anamnese dirigida: alergias, cirurgias prévias, anestesias anteriores\nExame físico: via aérea (Mallampati, abertura bucal, DTM)\nExames complementares por risco cirúrgico\nEscala ASA e estratificação de risco cardíaco\nConsentimento informado",
    area: "anestesiologia",
    imageUrl: "",
    imageCaption: "",
    arquivoUrl: "",
    arquivoLabel: "Baixar checklist",
    data: "2026-05-01",
  },
];

export const defaultVideoaulas: VideoaulaData[] = [
  {
    id: "via-aerea-avancada",
    titulo: "Via Aérea Avançada — SRI passo a passo",
    descricao: "Sequência rápida de intubação completa: pré-oxigenação, fármacos, laringoscopia e manejo da via aérea difícil imprevista.",
    area: "emergencias",
    videoUrl: "",
    imageUrl: "",
    imageCaption: "",
    duracao: "52 min",
    nivel: "intermediario",
    gratuita: false,
    data: "2026-06-01",
  },
  {
    id: "sdra-ventilacao",
    titulo: "SDRA — Ventilação Protetora na UTI",
    descricao: "Volume corrente, driving pressure, PEEP ideal e posição prona.",
    area: "ti",
    videoUrl: "",
    imageUrl: "",
    imageCaption: "",
    duracao: "38 min",
    nivel: "avancado",
    gratuita: false,
    data: "2026-05-20",
  },
  {
    id: "raquianestesia-basico",
    titulo: "Raquianestesia — Técnica e Segurança",
    descricao: "Anatomia aplicada, posicionamento, anestésico local e complicações.",
    area: "anestesiologia",
    videoUrl: "",
    imageUrl: "",
    imageCaption: "",
    duracao: "41 min",
    nivel: "basico",
    gratuita: true,
    data: "2026-05-10",
  },
];

export const defaultNavItems: NavItemData[] = [
  { label: "Início", href: "/" },
  { label: "Emergências", href: "/especialidade/emergencias" },
  { label: "Terapia Intensiva", href: "/especialidade/ti" },
  { label: "Anestesiologia", href: "/especialidade/anestesiologia" },
  { label: "Cursos", href: "/cursos" },
  { label: "Colaboradores", href: "/colaboradores" },
  { label: "Outros assuntos", href: "/acervo" },
  { label: "Apps", href: "#apps-assinatura" },
  { label: "Dia a dia", href: "#apps-uteis" },
  { label: "Podcast", href: "/podcast" },
  { label: "Eventos", href: "#eventos" },
  { label: "Contato", href: "#contato" },
];

export const defaultTypography: TypographyData = {};

export const defaultSiteConfig: SiteConfig = {
  marqueeItems: [
    "Protocolos revisados semanalmente",
    "Ferramentas para decisão à beira-leito",
    "Conteúdo aberto sem login",
    "Cursos presenciais, híbridos e online",
    "Atualização científica contínua",
    "Material orientado à prática assistencial",
  ],
  footerName: "Dr. Sandro • Portal de Anestesiologia e Medicina Intensiva",
  footerTagline: "© 2026 Todos os direitos reservados.",
};

// ─── Storage helpers (local files em dev, Vercel Blob em produção) ────────────

const DATA_DIR = path.join(process.cwd(), "src", "data");
const BLOB_PREFIX = "content/";

async function readLocal<T>(key: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(path.join(DATA_DIR, `${key}.json`), "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeLocal<T>(key: string, data: T): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, `${key}.json`),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}

// Tag única que invalida TODO o cache de conteúdo. É religada em writeBlob() a
// cada edição do admin (via revalidateTag). Assim o "frescor" das edições NÃO
// muda — a diferença é que, ENTRE edições, as leituras vêm do Data Cache da
// Vercel em vez de rebaixar o JSON do Blob a cada page view. Esse re-download a
// cada request era a causa do Blob Data Transfer alto na fatura.
export const CONTENT_CACHE_TAG = "site-content";

// Busca o JSON de um blob por chave, cacheado no Data Cache da Vercel.
// - Sem cache-buster e sem no-store: o mesmo conteúdo deixa de ser re-baixado do
//   Blob a cada page view (essa repetição era o custo de egress).
// - Invalidado na hora por revalidateTag(CONTENT_CACHE_TAG) quando o admin salva;
//   o revalidate de 1h é apenas uma rede de segurança de auto-recuperação.
// A chave dinâmica entra em keyParts para garantir uma entrada de cache por chave.
// Retorna undefined quando o blob não existe (o chamador aplica o fallback).
function fetchBlobJson(key: string): Promise<unknown | undefined> {
  return unstable_cache(
    async (): Promise<unknown | undefined> => {
      const token = process.env.BLOB_READ_WRITE_TOKEN as string;
      const pathname = `${BLOB_PREFIX}${key}.json`;
      try {
        const { blobs } = await list({ prefix: pathname });
        const blob = blobs.find((b) => b.pathname === pathname);
        if (!blob) return undefined;
        // store is private: pass token as Bearer to authorize the fetch
        const res = await fetch(blob.url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return undefined;
        return await res.json();
      } catch {
        return undefined;
      }
    },
    ["content-blob-json", key],
    { tags: [CONTENT_CACHE_TAG], revalidate: 3600 }
  )();
}

async function readBlob<T>(key: string, fallback: T): Promise<T> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return readLocal(key, fallback);
  const data = await fetchBlobJson(key);
  return (data === undefined ? fallback : data) as T;
}

export async function writeBlob<T>(key: string, data: T): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    if (process.env.NODE_ENV === "development") {
      await writeLocal(key, data);
      return;
    }
    throw new Error(
      "BLOB_READ_WRITE_TOKEN não configurado. Adicione o Vercel Blob ao projeto no painel da Vercel (Storage → Blob) e faça Redeploy."
    );
  }
  await put(`${BLOB_PREFIX}${key}.json`, JSON.stringify(data, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  // Invalida o Data Cache na hora para a edição do admin aparecer imediatamente.
  // (As actions já chamam revalidatePath; isto cobre o novo cache por tag.)
  try {
    // Next 16: revalidateTag(tag, profile) — "max" purga a entrada na hora.
    revalidateTag(CONTENT_CACHE_TAG, "max");
  } catch {
    // Fora de um contexto de request (ex.: script/seed) revalidateTag não se aplica.
  }
}

// ─── Public read functions ────────────────────────────────────────────────────

export async function getEventos(): Promise<EventoData[]> {
  return readBlob("eventos", defaultEventos);
}

export async function getApps(): Promise<AppData[]> {
  return readBlob("apps", defaultApps);
}

export async function getContato(): Promise<ContatoData> {
  return readBlob("contato", defaultContato);
}

export async function getHero(): Promise<HeroData> {
  return readBlob("hero", defaultHero);
}

export async function getHeader(): Promise<HeaderData> {
  return readBlob("header", defaultHeader);
}

// Linhas efetivas abaixo do nome: usa subtitleLines se existir, senão cai nos
// campos legados (cremesp/rqe1/rqe2). Sempre sem linhas vazias.
export function headerSubtitleLines(h: HeaderData): string[] {
  const lines = h.subtitleLines ?? [h.cremesp, h.rqe1, h.rqe2];
  return lines.map((l) => (l ?? "").trim()).filter(Boolean);
}

export async function getFreeApps(): Promise<FreeAppData[]> {
  return readBlob("freeApps", defaultFreeApps);
}

export async function getUtilApps(): Promise<UtilAppData[]> {
  return readBlob("utilApps", defaultUtilApps);
}

// ── Aplicativos (UNIFICADO) ──────────────────────────────────────────────────
// Fonte única de apps. Cada app carrega o próprio "acesso" (grátis/assinatura) e a
// "finalidade" (grupo na home) — em vez de estar espalhado em 3 blobs (apps/freeApps/
// utilApps). Migração automática e SEM gravar: enquanto o blob "aplicativos" não existir,
// getAplicativos junta os 3 legados na forma nova. No primeiro Salvar do admin, "aplicativos"
// passa a existir e vira a fonte de verdade.
export type AplicativoData = {
  id: string;
  title: string;
  subtitle?: string;   // linha de destaque (opcional)
  text: string;        // descrição (rich text)
  icon?: string;       // ícone de reserva quando não há logo
  glow?: string;       // cor do brilho do card (opcional)
  imageUrl?: string;   // logo do app
  imageSize?: number;
  highlights?: string[];
  link: string;
  acesso: "gratis" | "assinatura";
  finalidade: Finalidade;
  rotulo?: string;     // rótulo livre p/ utilidades (ex.: "Finanças", "Organização")
  area?: "emergencias" | "ti" | "anestesiologia" | "geral";
  areas?: ("emergencias" | "ti" | "anestesiologia")[];
};

function slugId(s: string): string {
  return (s || "app").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function getAplicativos(): Promise<AplicativoData[]> {
  const existente = await readBlob<AplicativoData[]>("aplicativos", []);
  if (existente.length > 0) return existente;
  // Ainda não migrado → monta a partir dos 3 legados (sem gravar).
  const [apps, free, util] = await Promise.all([getApps(), getFreeApps(), getUtilApps()]);
  const a: AplicativoData[] = apps.map((x) => ({
    id: `a-${slugId(x.title)}`, title: x.title, subtitle: x.subtitle, text: x.text, icon: x.icon,
    glow: x.glow, imageUrl: x.thumbnailUrl, imageSize: x.thumbnailSize, highlights: x.highlights,
    link: x.link, acesso: "assinatura", finalidade: finalidadeEfetiva(x.finalidade, x.title, x.subtitle, x.text),
    area: x.area, areas: x.areas,
  }));
  const f: AplicativoData[] = free.map((x) => ({
    id: `f-${slugId(x.title)}`, title: x.title, text: x.desc, icon: x.icon, imageUrl: x.imageUrl,
    imageSize: x.imageSize, link: x.link, acesso: "gratis",
    finalidade: finalidadeEfetiva(x.finalidade, x.title, x.desc), area: x.area, areas: x.areas,
  }));
  const u: AplicativoData[] = util.map((x) => ({
    id: `u-${slugId(x.title)}`, title: x.title, text: x.desc, icon: x.icon, imageUrl: x.imageUrl,
    imageSize: x.imageSize, link: x.link, acesso: "gratis", finalidade: "utilidade", rotulo: x.categoria,
  }));
  return [...a, ...f, ...u];
}

export async function getContentItems(): Promise<ContentItemData[]> {
  return readBlob("contentItems", defaultContentItems);
}

export async function getCourses(): Promise<CourseData[]> {
  return readBlob("courses", defaultCourses);
}

export async function getWhyUs(): Promise<WhyUsData[]> {
  return readBlob("whyUs", defaultWhyUs);
}

export async function getSiteConfig(): Promise<SiteConfig> {
  return readBlob("siteConfig", defaultSiteConfig);
}

export async function getTypography(): Promise<TypographyData> {
  return readBlob("typography", defaultTypography);
}

// Estrutura EFETIVA do menu = estrutura fixa (NAV_GROUPS) + edições do admin (ordem/
// ocultar/renomear guardadas no blob "navOverride"). Os componentes de menu renderizam
// a partir daqui. (Nome mantido por compat — as 12 páginas já chamam getNavItems.)
export async function getNavItems(): Promise<NavGroup[]> {
  const [ov, esps] = await Promise.all([
    readBlob("navOverride", {} as NavOverride) as Promise<NavOverride>,
    getEspecialidades(),
  ]);
  const groups = applyNavOverride(NAV_GROUPS, ov);
  // Injeta o logo enviado no admin nos itens de especialidade do menu (casa a área
  // pelo href /especialidade/<area>). Um lugar só → vale em todos os menus/páginas.
  const logoByArea: Record<string, string | undefined> = {};
  for (const e of esps) if (e.area) logoByArea[e.area] = e.logoUrl;
  return groups.map((g) =>
    g.children
      ? {
          ...g,
          children: g.children.map((c) => {
            const m = c.href.match(/^\/especialidade\/([a-z]+)/i);
            const logo = m ? logoByArea[m[1].toLowerCase()] : undefined;
            return logo ? { ...c, logoUrl: logo } : c;
          }),
        }
      : g
  );
}

// Só a override crua (p/ o editor do admin carregar o estado atual).
export async function getNavOverride(): Promise<NavOverride> {
  return (await readBlob("navOverride", {} as NavOverride)) as NavOverride;
}

export async function getNavStyle(): Promise<NavStyleData> {
  return readBlob("navStyle", {});
}

// Ordem das seções da home (editável no admin). Constantes em ./home-sections
// (módulo puro, reusável no cliente). Padrão: clínico → mídia → comunidade → apps.
export { HOME_SECTION_IDS, DEFAULT_HOME_ORDER, CARD_COL_SECTIONS, DEFAULT_CARD_COLS };

// Aviso temporário no topo do site (ex.: "em construção") — editável no admin.
export type AvisoData = { ativo: boolean; texto: string };
const DEFAULT_AVISO: AvisoData = {
  ativo: true,
  texto: "🚧 Plataforma de ensino em construção — algumas coisas ainda podem falhar. Obrigado pela compreensão.",
};
export async function getAviso(): Promise<AvisoData> {
  const a = await readBlob<AvisoData>("aviso", DEFAULT_AVISO);
  return { ativo: !!a?.ativo, texto: typeof a?.texto === "string" ? a.texto : DEFAULT_AVISO.texto };
}

// Vídeo de boas-vindas flutuante (Dr. Sandro). `versao` muda a cada save → reaparece pra
// quem já tinha fechado (é um recado novo). Editável no admin.
export type VideoBoasVindasData = { ativo: boolean; videoUrl: string; titulo: string; subtitulo: string; versao: string };
const DEFAULT_VIDEO_BV: VideoBoasVindasData = { ativo: false, videoUrl: "", titulo: "Bem-vindo ao MedCampus 👋", subtitulo: "Em 1 minuto, o que tem aqui e como aproveitar.", versao: "0" };
export async function getVideoBoasVindas(): Promise<VideoBoasVindasData> {
  const v = await readBlob<VideoBoasVindasData>("videoBoasVindas", DEFAULT_VIDEO_BV);
  return {
    ativo: !!v?.ativo,
    videoUrl: typeof v?.videoUrl === "string" ? v.videoUrl : "",
    titulo: typeof v?.titulo === "string" && v.titulo.trim() ? v.titulo : DEFAULT_VIDEO_BV.titulo,
    subtitulo: typeof v?.subtitulo === "string" ? v.subtitulo : DEFAULT_VIDEO_BV.subtitulo,
    versao: typeof v?.versao === "string" ? v.versao : "0",
  };
}

// Cards por linha (colunas no desktop) por seção — editável no admin.
export async function getCardCols(): Promise<Record<string, number>> {
  const saved = await readBlob<Record<string, number>>("cardCols", {});
  const out: Record<string, number> = { ...DEFAULT_CARD_COLS };
  for (const s of CARD_COL_SECTIONS) {
    const v = Math.round(Number((saved as Record<string, unknown>)?.[s.key]));
    if (Number.isFinite(v) && v >= 1 && v <= 6) out[s.key] = v;
  }
  return out;
}

export async function getHomeOrder(): Promise<string[]> {
  const saved = await readBlob<string[]>("homeOrder", DEFAULT_HOME_ORDER);
  // saneamento: mantém só ids válidos, sem duplicar, e acrescenta os que faltarem
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const id of Array.isArray(saved) ? saved : []) {
    if ((HOME_SECTION_IDS as readonly string[]).includes(id) && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  for (const id of HOME_SECTION_IDS) if (!seen.has(id)) ordered.push(id);
  return ordered;
}

// Seções da home ESCONDIDAS (editável no admin /ordem-home). Default = as que a
// reestruturação tirou por já viverem nas zonas (SECOES_OCULTAS_HOME). Só ids válidos.
export async function getHomeHidden(): Promise<string[]> {
  const saved = await readBlob<string[]>("homeHidden", [...SECOES_OCULTAS_HOME]);
  const base = Array.isArray(saved) ? saved : [...SECOES_OCULTAS_HOME];
  return base.filter((id) => (HOME_SECTION_IDS as readonly string[]).includes(id));
}

// Fallback vazio: o site mostra apenas o que for cadastrado no admin.
// (os exemplos default ficam disponíveis só como referência, não vão ao ar)
export async function getAtualizacoes(): Promise<AtualizacaoData[]> {
  const todas = await readBlob<AtualizacaoData[]>("atualizacoes", []);
  // Deduplica por id: entradas repetidas (mesmo id) quebravam o React (key colidida →
  // só a 1ª abria) e apareciam em dobro. Mantém a primeira ocorrência.
  const vistos = new Set<string>();
  return todas.filter((a) => {
    const k = a.id ?? "";
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

export async function getProtocolos(): Promise<ProtocoloData[]> {
  return readBlob("protocolos", []);
}

export async function getVideoaulas(): Promise<VideoaulaData[]> {
  return readBlob("videoaulas", []);
}

export async function getCursos(): Promise<CursoData[]> {
  return readBlob("cursos", []);
}

export async function getCurso(slug: string): Promise<CursoData | null> {
  const cursos = await getCursos();
  return cursos.find((c) => c.id === slug) ?? null;
}

export async function getPodcasts(): Promise<PodcastData[]> {
  return readBlob("podcasts", []);
}

export async function getColaboradores(): Promise<ColaboradorData[]> {
  return readBlob("colaboradores", []);
}

// Cards da seção "Navegue por especialidade" (home). Editáveis no admin: cada card
// tem um logo (imagem enviada, com emoji de reserva), texto, destino e cor. O campo
// `area` (opcional) casa o card com a área das Atualizações p/ reaproveitar o logo.
export type EspecialidadeCardData = {
  id: string;
  label: string;
  desc: string;
  emoji: string;              // usado quando não há logoUrl
  logoUrl?: string;           // imagem enviada (/api/img?url=...)
  href: string;               // destino do card
  cor: string;                // token de cor: emerg | inten | anest | accent | blue | violet
  area?: "emergencias" | "ti" | "anestesiologia" | "";
};

export const DEFAULT_ESPECIALIDADES: EspecialidadeCardData[] = [
  { id: "emergencias", label: "Emergências", desc: "Urgência e emergência", emoji: "🚑", href: "/especialidade/emergencias", cor: "emerg", area: "emergencias" },
  { id: "ti", label: "Terapia Intensiva", desc: "Cuidados intensivos", emoji: "🏥", href: "/especialidade/ti", cor: "inten", area: "ti" },
  { id: "anestesiologia", label: "Anestesiologia", desc: "Anestesia e pré-operatório", emoji: "🩺", href: "/especialidade/anestesiologia", cor: "anest", area: "anestesiologia" },
];

export async function getEspecialidades(): Promise<EspecialidadeCardData[]> {
  return readBlob("especialidades", DEFAULT_ESPECIALIDADES);
}

export async function getAcervo(): Promise<AcervoItemData[]> {
  return readBlob("acervo", []);
}

// Procedimentos médicos: mesma estrutura do acervo (texto, vídeo, capa, arquivos,
// especialidade + multi-área), em blob próprio.
export async function getProcedimentos(): Promise<AcervoItemData[]> {
  return readBlob("procedimentos", []);
}

export async function getSectionTexts(): Promise<import("./section-texts").SectionTextsData> {
  return readBlob("sectionTexts", {});
}

export async function getUiTexts(): Promise<import("./ui-texts").UiTextsData> {
  return readBlob("uiTexts", {});
}

// Analytics de acessos: { "YYYY-MM-DD": { v: visualizações, u: visitantes únicos } }
export type AnalyticsData = Record<string, { v: number; u: number }>;

export async function getAnalytics(): Promise<AnalyticsData> {
  return readBlob<AnalyticsData>("analytics", {});
}

// Agregados detalhados (acumulados): páginas mais vistas, origem do tráfego e dispositivo.
export type AnalyticsDetail = {
  paths: Record<string, number>;
  refs: Record<string, number>;
  dev: Record<string, number>;
};
const defaultAnalyticsDetail: AnalyticsDetail = { paths: {}, refs: {}, dev: {} };

export async function getAnalyticsDetail(): Promise<AnalyticsDetail> {
  return readBlob<AnalyticsDetail>("analyticsDetail", defaultAnalyticsDetail);
}

export async function uploadImageToBlob(file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN não configurado.");
  }
  const { url } = await put(`images/${Date.now()}-${file.name}`, file, {
    access: "private",
    addRandomSuffix: false,
  });
  // Return a proxy URL so the private blob is accessible on the site
  return `/api/img?url=${encodeURIComponent(url)}`;
}

export async function uploadPublicImageToBlob(file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN não configurado.");
  }
  const { url } = await put(`public/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return url;
}
