# Diagnóstico técnico — MedCampus (site-dr-sandro)

> Levantamento read-only do estado atual do projeto, para embasar a construção da
> área **Editora Médica**. Nenhum código foi alterado na produção deste diagnóstico.
> Repositório: `github.com/SandroDainez/site-dr-sandro`. Data do levantamento: 2026-07-06.

---

## 1. Framework, versão e estrutura

- **Next.js `16.2.6`** — versão com *breaking changes* (ver `AGENTS.md`: "This is NOT the Next.js you know"; ler `node_modules/next/dist/docs/` antes de codar).
- **React `19.2.4`**, **TypeScript**, **Tailwind CSS v4**.
- **App Router puro** — só existe `src/app/`; **não há `pages/`**.
- Middleware: o antigo `middleware` virou **`src/proxy.ts`** (nome novo do Next 16). Só renova a sessão Supabase; **não bloqueia rota nenhuma**.
- Config (`next.config.ts`): mínima — apenas `experimental.serverActions.bodySizeLimit = "16mb"` (para receber texto de livros inteiros na Biblioteca da IA). Sem config custom de imagem/cache.
- Deploy: **Vercel, automático no push da `main`** (`main` = produção).

## 2. Autenticação

- **Provider: Supabase Auth** (e-mail/senha + magic link). `@clerk/nextjs` está no `package.json` mas **NÃO é usado** (nenhum `ClerkProvider`/`clerkMiddleware`/`auth()` no código) — dependência morta.
- Leitura de sessão no servidor: **`src/lib/supabase/auth-server.ts`**
  - `createAuthClient()` → `createServerClient` do `@supabase/ssr` com cookies (`next/headers`).
  - `getUsuario()` → usa **`supabase.auth.getUser()`** (validado no servidor, seguro) e retorna `user | null`.
- `src/proxy.ts` (matcher amplo, exclui `api`/estáticos): chama `supabase.auth.getUser()` a cada request só para **renovar o token/cookies** — proteção de rota é feita **nas próprias páginas**, não no middleware.
- Padrão de rota protegida (usuário logado): no topo do Server Component, `const user = await getUsuario(); if (!user) redirect("/")` (ex.: `/minha-area`, `/estudar`, `/assistente`, `/desempenho`, `/certificado`).
- Gate de **assinante**: campo **`profiles.liberado`** (boolean, tabela no banco) — checado no servidor (ex.: rota do assistente: `if (!perfil?.liberado) 403`).

## 3. Banco (Supabase)

- **Migrations:** `supabase/migrations/` — **só existe `001_medical_content.sql`** (cria `medical_updates` e `medical_events`, com **RLS habilitado**: leitura pública do publicado, escrita só service-role).
- ⚠️ **A pasta de migrations está INCOMPLETA.** O código referencia ~16 tabelas, mas só 2 estão nas migrations. As demais foram criadas **fora do versionamento** (dashboard/MCP direto). Tabelas referenciadas no código:
  `medical_events`, `medical_updates`, `questoes`, `profiles`, `srs_cards`, `kb_referencias`, `kb_chunks`, `course_progress`, `push_subscriptions`, `search_queries`, `quiz_attempts`, `assistant_queries`, `videoaula_quiz_attempts`, `improvement_reports`, `study_log`.
- **RLS:** confirmado ativo em `medical_updates`/`medical_events` (na migration). O status de RLS das demais tabelas **não está no repositório** — precisa ser auditado no painel do Supabase (ver Riscos).
- Padrão de nomenclatura de migration: `NNN_nome.sql` (sequencial com prefixo numérico). Só há um exemplo (`001_`).
- Dois clientes no servidor (`src/lib/supabase/server.ts`): cliente público (anon, respeita RLS) e **service-role** (uso EXCLUSIVO server-side em agentes/cron, ignora RLS para escrever).

## 4. Role / admin — onde mora hoje

- **NÃO existe conceito de `role` de usuário.** Grep por role em contexto de profile/admin/metadata = **vazio**. `profiles` tem só `id, nome, especialidade, crm, liberado`.
- **Admin ≠ role.** A área `/admin` é protegida por uma **senha compartilhada** (`process.env.ADMIN_PASSWORD`): o login (`src/app/admin-login/actions.ts`) grava um cookie **`admin_token` = `sha256(ADMIN_PASSWORD)`**; o `admin/layout.tsx` e o `requireAdmin()` das actions comparam o hash. É um **segredo único**, não um usuário/role.
- ✅ **Sobre a vulnerabilidade de `user_metadata`: NÃO se aplica hoje.** O gate de assinante usa `profiles.liberado` (tabela no banco, checada no servidor) — **não** `user_metadata`. Portanto não há a falha clássica de "role editável pelo cliente". *Porém*, a ausência total de um modelo de role é um **gap** para a Editora Médica (ver Plano): senha compartilhada não distingue editores, não tem auditoria nem permissões por pessoa.

## 5. Área /admin e rotas protegidas

- Existe **`/admin`** completo (~30 editores de conteúdo): dashboard em `admin/page.tsx` (grade de cards) + **barra lateral** em `admin/layout.tsx` (grupos: Painel, Aparência, Apps, Conteúdo, Mais). **Atenção: ao adicionar um editor novo, registrar nos DOIS** (grade e barra lateral).
- Proteção: `admin/layout.tsx` faz `if (token !== sha256(ADMIN_PASSWORD)) redirect("/admin-login")`. Server Actions do admin repetem o check via `requireAdmin()`. Não há middleware bloqueando — a proteção é no layout + em cada action.

## 6. Design system

- **Tailwind v4 CSS-first** — **sem `tailwind.config.js`**. Tokens e tema vivem em `src/app/globals.css` via `@theme inline` + variáveis CSS em `:root`.
- Tokens de marca: `--background:#0f1420`, `--accent:#2ce6b8` (teal-menta), `--on-accent`, `--accent-blue`, `--accent-violet`; paleta por especialidade `--emerg`/`--inten`/`--anest`.
- Sem biblioteca de componentes externa. Ícones: **lucide-react**. Componentes próprios em `src/components/` e locais por rota.
- Padrão de card reutilizável: classe **`.card-grid`** (grade responsiva) + helper **`src/lib/card-grid.ts` (`colStyle`)**. Cards são `rounded-2xl border bg-white/[0.03] p-5`.
- Conteúdo editável do site fica em **Vercel Blob** (`content/*.json`, private, servido via `/api/img`), lido por `readBlob` com `noStore()` + `no-store` (sempre fresco).

## 7. Integração OpenAI (CRÍTICO — a Editora vai reutilizar)

- **NÃO há camada de serviço.** O client é instanciado **inline, `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })`, em 7 arquivos diferentes** (integração **espalhada**, não isolada):
  - `src/app/api/assistente/route.ts` (via `orchestrator`)
  - `src/lib/assistente/orchestrator.ts`
  - `src/lib/agents/embeddings.ts`
  - `src/app/api/agents/updates/route.ts` (`getOpenAI()`)
  - `src/app/api/agents/events/route.ts` (`getOpenAI()`)
  - `src/app/api/agents/melhoria/route.ts`
  - `src/app/admin/actions.ts` e `src/app/admin/banco-questoes/actions.ts`
- **Env var:** uma só — **`OPENAI_API_KEY`** (18 usos).
- **Modelos em uso:** `gpt-4o` (10×, síntese/revisão/resposta), `gpt-4o-mini` (3×, planejamento de busca), `gpt-4o-search-preview` (3×, busca web nos agentes), `text-embedding-3-small` (1×, embeddings do RAG, 1536 dims).
- **Streaming: NÃO.** Nenhum uso de `stream: true`/`ReadableStream`. O assistente responde via `NextResponse.json({ resposta, fontes })` (bloqueante).
- **Features que usam OpenAI hoje:**
  - **Assistente clínico RAG** (`/api/assistente` + `lib/assistente/*`): planeja busca (mini) → `hybrid_search`/`match_kb` no `kb_chunks` (pgvector) → responde (gpt-4o), com fontes. Gated por login + `profiles.liberado`.
  - **Agentes/cron:** boletins clínicos semanais (`updates`), eventos científicos (`events`), relatório de melhoria (`melhoria`), indexação da biblioteca/embeddings (`index-kb`).
  - **Admin:** geração de questões (`banco-questoes/actions.ts`) e outros utilitários em `admin/actions.ts`.
  - **Embeddings** (`lib/agents/embeddings.ts`) com retry/backoff.
- **Reaproveitamento para a Editora:** hoje daria para reusar `OPENAI_API_KEY`, o padrão de chamada gpt-4o com `response_format: json_object`, o pipeline de qualidade dos boletins (síntese → revisão adversarial → saneamento de fontes → revisão de português) e o RAG (`kb_chunks`/`hybrid_search`). **Recomendação: extrair uma camada `src/lib/ai/` antes** (ver Plano) para não espalhar ainda mais.

## 8. Cache / revalidação do Next

- **`export const dynamic = "force-dynamic"`** em **31** arquivos de rota — muitas páginas são dinâmicas (conteúdo sempre fresco do blob/Supabase).
- **`revalidatePath(...)`** — **49** chamadas, tipicamente nas Server Actions do admin após salvar (revalida `/` e a rota da seção).
- `noStore()` (`unstable_noStore`) usado no `readBlob` (1 ponto central) → leituras de conteúdo nunca servem versão velha.
- **Sem ISR por tempo** (`export const revalidate = N` não é usado). O modelo é: dinâmico + revalidatePath sob demanda.
- **Crons (Vercel, `vercel.json`):** `updates` seg 09h, `index-kb` seg 10h, `melhoria` seg 11h, `lembretes` diário 12h, `events` qua 09h.

---

## Riscos / pontos de atenção para a Editora Médica

1. **Sem modelo de role.** Admin é senha única compartilhada; não há como distinguir "editor" de "admin" nem auditar quem publicou. A Editora precisará de uma decisão de arquitetura de permissões (ver Plano) — **NÃO usar `user_metadata`** para isso.
2. **Migrations incompletas.** Só `001_` está versionado; ~14 tabelas existem só no banco. Antes de criar tabelas novas da Editora, decidir se adotamos migrations versionadas de verdade (recomendado) e, idealmente, "capturar" o schema atual num migration de baseline.
3. **RLS não auditável pelo repo.** Confirmar no painel do Supabase que `profiles` e demais tabelas sensíveis têm RLS adequado antes de expor qualquer escrita nova.
4. **OpenAI espalhado.** Extrair camada de serviço antes de a Editora adicionar o 8º ponto de uso.
5. **Admin com duas navegações** (grade + barra lateral) — registrar novos editores nos dois lugares.
