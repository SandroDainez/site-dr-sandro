# Smoke test final — Editora Médica (portão antes do merge)

> Executado na branch `feature/editora-medica` (HEAD `73a60a4`) contra o banco real / dev local.
> Todos os dados de QA foram inseridos e **apagados** ao final (0 sobras). `main` intocada em `f8af487`.
> Os 9 módulos da Editora estão implementados e ativos.

## FASE 1 — Regressão (o que existia ANTES da Editora)

| # | Item | Resultado | Como foi provado |
|---|---|---|---|
| 1 | Rotas públicas respondem | ✅ PASS | 15 páginas públicas pré-Editora → **200**; gated (`/assistente`,`/estudar`,`/desempenho`,`/minha-area`,`/conteudo`) → **307** (login), nenhum 500. 12 API routes existentes intactas; `/api/atualizacoes` → 200. |
| 2 | Auth (login/logout/usuário comum) | ✅ PASS¹ | `/entrar` → 200; rotas protegidas redirecionam a login quando deslogado; a Editora **não tocou** em `auth-server.ts`/`proxy.ts`. ¹Login/logout com credencial real → recomendado na verificação humana pós-merge. |
| 3 | Features OpenAI pré-Editora | ✅ PASS | Camada `getOpenAI()` (usada por assistente RAG, agentes, embeddings, banco-questões): `chat` (gpt-4o-mini) → "OK"; `embeddings` (text-embedding-3-small) → **1536 dims**. Layer intacta. |
| 4 | Área de assinantes/paga | ✅ PASS | `/conteudo` e `/assistente` seguem gated (307 quando deslogado); gate por `profiles.liberado` inalterado. |
| 5 | Migrations não alteraram schema pré-existente | ✅ PASS | `questoes` mantém as 11 colunas originais + **só** `editora_doc_id` (aditiva). Nenhuma tabela/coluna pré-existente removida ou alterada — todas as migrations 004–009 são **aditivas** (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`). |

## FASE 2 — Editora (o que foi construído)

| # | Item | Resultado | Como foi provado |
|---|---|---|---|
| 6 | Segurança 3 camadas em TODOS os módulos | ✅ PASS | (a) middleware: os **9** admins `/admin/editora/*` sem cookie → **307 → /admin-login**; (b) `requireAdmin()` na **1ª linha de 100% das actions** (99/99 nas 9 actions.ts); (c) RLS (ver item 7). |
| 7 | RLS público (anon key) | ✅ PASS | Com **anon key**: `sci_docs` mostra só o publicado; rascunho → `[]`; `sci_versions` `is_published=false` → `[]`; `sci_sources` → `[]`; `ai_generations` → `[]`; `retrieval_cache` → `[]`; `research_docs` só publicado. |
| 8 | Imutabilidade da versão publicada | ✅ PASS | `UPDATE` em `protocol_version` publicada → **bloqueado pela trigger**; conteúdo permaneceu intacto. |
| 9 | Fluxo completo (geração + retrieval) | ✅ PASS | **Geração** (sci): publicar → `/biblioteca-cientifica/<slug>` **200** e aparece na lista; editar → **v2 rascunho** criada e **v1 publicada intacta** (append-only); despublicar → **404**. **Retrieval** (research): publicar → `/comparativos/<slug>` **200**. Páginas `force-dynamic` + `revalidatePath` → sempre frescas. |
| 10 | Env vars documentadas + Vercel | ✅ PASS | Criado **`.env.example`** com as 17 vars. **Todas as obrigatórias da Editora já estão no Vercel produção**: `AI_PROVIDER=real`, `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`, `PUBMED_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`. Opcionais (`DEEPSEEK_MODEL`, `OPENAI_REVIEW_MODEL`) têm default no código. **Nada falta — deploy não quebra.** |
| 11 | Build + lint | ✅ PASS² | `next build` compila. Lint: **0 erros nos arquivos da Editora**. ²Os 194 erros de lint são **pré-existentes** (`no-explicit-any` em `lib/assistente`, `lib/agents`, `lib/search` etc., anteriores à branch) — fora do escopo da Editora. |
| 12 | Sem segredos commitados | ✅ PASS | Varredura do diff `main...HEAD`: nenhuma key/token/URL sensível. `.env.local` ignorado; nenhum `.env` versionado (só `.env.example`, sem valores). |

## Correções feitas durante o smoke test
- **`.env.example` criado** (não existia) com as 17 variáveis do projeto, incluindo as da Editora (`AI_PROVIDER`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `OPENAI_REVIEW_MODEL`, `PUBMED_API_KEY`).

## Notas
- **Lint pré-existente (194 erros):** não introduzidos pela Editora. Corrigir seria um refactor amplo em código legado — sugestão: tarefa separada, depois do merge.
- **Verificação humana pós-merge (recomendada):** login/logout real (item 2) e repetir manualmente itens 1, 6 e 9 em produção.

## Veredito
**TODOS OS ITENS PASSARAM.** A branch está pronta para merge na `main` mediante confirmação explícita do dono.
