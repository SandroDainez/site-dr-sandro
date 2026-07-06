# Auth do admin — Editora Médica (proteção em 3 camadas)

> Ler antes: `docs/DIAGNOSTICO.md`. Este documento descreve **onde a "identidade de
> admin" mora, como é atribuída e como é checada em cada camada** da área
> administrativa da Editora Médica.

## Decisão de modelo (e por quê)

O admin do MedCampus usa hoje um **segredo compartilhado** (`ADMIN_PASSWORD`), não login
por conta. Ao projetar a Editora, avaliamos migrar para **role por usuário em
`app_metadata`** (padrão mais seguro/auditável). **O dono do projeto optou por manter o
login atual** (a senha) — então a Editora foi entregue com **as 3 camadas de proteção
apoiadas nesse modelo**, sem trocar como ele entra e **sem risco de lockout**. O modelo por
role fica documentado como **caminho de upgrade** (ver o fim deste doc).

## Onde a identidade de admin mora

- **Segredo:** variável de ambiente **`ADMIN_PASSWORD`** — **server-only**, nunca exposta
  ao client, **nunca em `user_metadata`** (que é editável pelo próprio usuário).
- **Prova de admin:** cookie **`admin_token` = `sha256(ADMIN_PASSWORD)`**, gravado no login.
- **Ponto único de verdade no código:** `src/lib/admin-auth.ts`
  (`adminTokenEsperado()`, `tokenAdminValido()`, `requireAdmin()`, `isAdmin()`).

## Como é atribuída

- Login em **`/admin-login`** (`src/app/admin-login/actions.ts`): valida a senha e grava o
  cookie `admin_token` (httpOnly). Logout apaga o cookie. Não há cadastro/usuário — é um
  segredo único do dono.

## Como é checada — as 3 camadas (independentes)

Defesa em profundidade: cada camada barra sozinha; nenhuma confia no client.

### (a) Middleware (edge) — `src/proxy.ts`
Toda requisição a `/admin*` (exceto `/admin-login`) passa pelo `proxy`. Se o cookie
`admin_token` não for válido (`tokenAdminValido`), **redireciona para `/admin-login`**
antes de a rota renderizar. É a barreira mais externa.

### (b) Servidor — `requireAdmin()` em toda action/route handler
`src/lib/admin-auth.ts` exporta **`requireAdmin()`**, chamado **na primeira linha de cada
Server Action** da Editora (`salvarArtigo`, `excluirArtigo`, `gerarArtigoIA` em
`src/app/admin/editora/actions.ts`). Se o cookie for inválido, **lança `Não autorizado`** e
a action não executa. O layout do admin (`src/app/admin/layout.tsx`) também revalida o
cookie ao renderizar qualquer página `/admin*`. Assim, mesmo que a camada (a) fosse
contornada, a ação no servidor recusa.

### (c) Banco (RLS no Supabase)
As tabelas editoriais têm **RLS** (migration `002_editora.sql`):
- `editora_artigos`: **SELECT público só de `status='publicado'`** → um não-admin (chave
  anon ou usuário comum logado) **nunca vê rascunhos** (retorna zero linhas).
- Escrita e leitura de rascunhos: só via **service-role** (server-only, chave nunca no
  client). Toda tabela nova da Editora seguirá o mesmo padrão.

Ou seja: mesmo que uma rota ou action vazasse, uma **query direta ao banco** com credencial
de não-admin não retorna dado editorial sensível.

## Não usar (regra inviolável)

- ❌ Role/flag de admin em **`user_metadata`** (o usuário edita pelo client) — **nunca**.
- ❌ Confiar em qualquer verificação feita **no client**.

## Caminho de upgrade — role por usuário (para quando houver equipe)

Quando a Editora tiver **mais de um editor**, migrar de "senha única" para **role por
usuário**, **sem tocar nos call sites** (todos passam por `src/lib/admin-auth.ts`):

1. **Role em `app_metadata`** do Supabase Auth (nunca `user_metadata`), ex.:
   `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'`
   para a conta escolhida. **Primeiro admin definido:** `sandrodainez@hotmail.com`.
2. O Supabase **já inclui `app_metadata` no JWT** → `requireAdmin()`/middleware passam a ler
   `user.app_metadata.role === 'admin'` (sem roundtrip ao banco). *(Opcional: Custom Access
   Token Hook para uma claim top-level dedicada — precisa ser habilitado no painel do
   Supabase, Auth → Hooks; não é ligável via API.)*
3. RLS das tabelas editoriais ganha policy adicional `using (auth.jwt()->'app_metadata'->>'role' = 'admin')`
   para leitura/escrita autenticada de admin (mantendo service-role no server).

Estado atual: **nenhuma role existe** em `profiles`/`app_metadata`/`user_metadata`
(campo limpo) — o upgrade é aditivo, sem migração de dado legado.
