# MedCampus

Plataforma de ensino médico (medcampus.com.br) — anestesiologia, terapia intensiva e emergência.
Modelo: apps gratuitos + assinatura + cursos.

## Stack
Next.js (App Router) + Supabase + Vercel. Deploy automático via push na main.

## Regras de negócio
- Modelo freemium/B2B: verificar sempre `user.tier` / permissões antes de liberar conteúdo pago
- Assistente de IA usa consumo por sessão — nunca alterar lógica de billing/quota sem confirmar comigo antes
- Conteúdo clínico deve referenciar a guideline de origem (SBA / AMIB / ASA / DAS etc.) no schema do banco
- Se uma informação clínica parecer desatualizada, sinalizar explicitamente em vez de assumir

## Comandos
- `npm run dev` — ambiente local
- `npm run test` — rodar antes de qualquer PR
- `npm run lint` — antes de commit
- Deploy: automático via Vercel no push para main

## O que NUNCA fazer sem perguntar primeiro
- Alterar schema do Supabase em produção
- Mexer na lógica do revisor DeepSeek do RAG sem explicar o motivo da mudança
- Alterar lógica de billing/consumo por sessão
- Fazer `git push --force` ou reescrever histórico

## Contexto do dono do projeto
Dr. Sandro Dainez — anestesiologista/intensivista, não é desenvolvedor de formação.
Todo código é feito com auxílio de IA. Pode assumir conhecimento avançado em medicina
e básico em Next.js/Supabase/Vercel. Explicações técnicas podem ser diretas, sem
simplificação excessiva, mas evite jargão de infra sem contexto.

## Comunicação esperada do Claude
- Direto, tecnicamente preciso, pode ser descontraído quando fizer sentido
- Não precisa explicar o óbvio, mas pare e explique quando a decisão técnica for não-trivial
- Sempre em português do Brasil

## Resumo técnico do estado atual (2026-07-06)
- **Stack:** Next.js 16.2.6 (App Router puro, sem `pages/`; middleware = `src/proxy.ts`), React 19, TypeScript, Tailwind v4 (CSS-first, tokens em `src/app/globals.css` via `@theme` — NÃO há `tailwind.config.js`). Ícones: lucide-react. Deploy: Vercel automático no push da `main`.
- **Auth:** 100% Supabase (`@supabase/ssr`); Clerk está instalado mas NÃO é usado. Sessão no servidor via `src/lib/supabase/auth-server.ts` (`getUsuario()` usa `getUser()`, seguro). Rota protegida = `if (!user) redirect` no topo do Server Component. Gate de assinante = `profiles.liberado`.
- **Role:** NÃO existe role de usuário. `/admin` é protegido por **senha única** (`ADMIN_PASSWORD` → cookie `admin_token = sha256`), checada em `admin/layout.tsx` + `requireAdmin()`. Se precisar de role, guardar em `profiles.role` ou `app_metadata` — **NUNCA em `user_metadata`** (editável pelo cliente).
- **Banco:** Supabase. Migrations em `supabase/migrations/` (`NNN_nome.sql`), mas só `001_` está versionado — ~14 tabelas foram criadas fora do repo. RLS ativo em `medical_updates`/`medical_events`. Dois clientes: anon (RLS) e service-role (server-only).
- **Design:** tokens `--accent:#2ce6b8`, `--background:#0f1420`; cards `.card-grid` + `colStyle` (`src/lib/card-grid.ts`); conteúdo editável em Vercel Blob (`content/*.json`, lido com `noStore`).
- **OpenAI:** `OPENAI_API_KEY` (única env), `new OpenAI()` **inline em 7 arquivos** (espalhado, sem camada de serviço). Modelos: gpt-4o, gpt-4o-mini, gpt-4o-search-preview, text-embedding-3-small. Sem streaming. Usado no assistente RAG (`lib/assistente/*`), agentes/cron e admin.
- **Cache:** dinâmico (`force-dynamic` em ~31 rotas) + `revalidatePath` nas actions; sem ISR por tempo.

> **REGRA:** antes de qualquer trabalho na **Editora Médica**, LER `docs/DIAGNOSTICO.md` e `docs/PLANO-EDITORA.md`. Trabalhar sempre na branch `feature/editora-medica`, nunca na `main`. Decisões de auth/role/banco/arquitetura: PARAR e perguntar (não decidir sozinho).
