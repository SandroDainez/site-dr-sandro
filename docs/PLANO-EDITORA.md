# Plano técnico — Área "Editora Médica"

> Proposta de arquitetura para a nova área, priorizando **reaproveitar** o que já
> existe no MedCampus (ver `docs/DIAGNOSTICO.md`). **Nada aqui está implementado.**
> Os pontos de **auth, role e banco** estão marcados como **⛔ DECISÃO NECESSÁRIA** —
> não serão implementados sem sua aprovação explícita.

---

## 0. Escopo assumido (⛔ CONFIRMAR antes de tudo)

O termo "Editora Médica" ainda não foi especificado em detalhe. **Premissa de trabalho**
(me corrija se estiver errada): uma área **editorial assistida por IA** onde um ou mais
**editores** produzem conteúdo médico (ex.: artigos/matérias, e-books, material de curso),
com **rascunho → geração/edição com IA → revisão → publicação** no site, reusando a
integração OpenAI e o RAG existentes.

**Perguntas que preciso responder antes de desenhar o resto:**
1. O que a Editora **publica**? (artigos/blog? e-books? capítulos de curso? boletins editoriais?) Isso define as tabelas e as telas.
2. **Quem** usa? Só você, ou uma **equipe de editores** com contas próprias? (define o modelo de permissão)
3. A IA **gera do zero**, **reescreve/edita** texto do editor, ou ambos? Usa o RAG (biblioteca `kb_chunks`) como fonte?
4. Precisa de **fluxo de aprovação** (rascunho → revisão → publicado) e histórico de versões?
5. O conteúdo publicado aparece **onde** no site (nova rota pública? dentro de uma seção existente?).

---

## 1. Reaproveitamento (onde NÃO criar do zero)

| Necessidade da Editora | Reusar o que já existe |
|---|---|
| Chamar a IA | `OPENAI_API_KEY` + padrão `gpt-4o` com `response_format: json_object` já usado nos agentes |
| Qualidade do texto gerado | Pipeline dos boletins: síntese → **revisão adversarial** (`revisarTopicos`) → **saneamento de fontes** (`sanearTopicos`) → **revisão de português** (`revisarPortugues`) em `src/app/api/agents/updates/route.ts` |
| Fundamentar em fontes reais | RAG existente: `kb_chunks` + `hybrid_search`/`match_kb` (`src/lib/assistente/search-library.ts`), embeddings `text-embedding-3-small` (`src/lib/agents/embeddings.ts`) |
| Proteção de rota admin | `admin/layout.tsx` (cookie `admin_token`) + `requireAdmin()` nas actions |
| Persistência de conteúdo simples | Vercel Blob (`readBlob`/`writeBlob`, `content/*.json`) — bom para configs/textos; **não** para dados relacionais/versão |
| Persistência relacional/estado | Supabase (padrão de 2 clientes: anon com RLS + service-role) |
| UI | Tokens do `globals.css`, `.card-grid`/`colStyle`, `RichTextEditor` do admin, lucide-react |
| Editor de texto rico | `src/components/admin/RichTextEditor.tsx` + `sanitizeRichText` (`src/lib/rich-text.ts`) |

**Ação recomendada nº 1 (baixo risco, alto valor):** antes de a Editora virar o 8º ponto
com `new OpenAI()` inline, **extrair `src/lib/ai/openai.ts`** com um `getOpenAI()` único e
helpers (`chatJSON()`, `embed()`). Refatoração mecânica, sem mudar comportamento, que
centraliza a integração que "a Editora vai reutilizar". *(Isso é refatoração, não decisão
de arquitetura — mas confirmo antes de mexer nos 7 arquivos atuais.)*

## 2. ⛔ DECISÃO NECESSÁRIA — Auth / role / permissões

Hoje **não há role** (ver Diagnóstico §4). Se a Editora tiver **mais de um editor**, precisamos de um modelo de permissão. Opções (escolha sua):

- **Opção A — Continuar com a senha única de admin** (`ADMIN_PASSWORD`). Zero mudança de auth. Serve se **só você** edita. Limitação: sem distinção de autor, sem auditoria.
- **Opção B — Role no banco (`profiles.role`)** com valores tipo `admin | editor | user`, checado **no servidor** (Server Component/action lendo `profiles.role` via service-role). É o padrão correto e seguro. Exige: migration para a coluna, ajuste do gate, e uma tela para você promover editores.
- **Opção C — Role em `app_metadata`** (setado só via service-role/admin API). Também seguro (não é editável pelo cliente, diferente de `user_metadata`).

**Regra inviolável:** **NUNCA** guardar role em `user_metadata` (editável pelo próprio usuário no client). **Recomendação:** Opção B se houver equipe; Opção A se for só você por enquanto (e migrar para B depois). **Não vou implementar nenhuma até você escolher.**

## 3. ⛔ DECISÃO NECESSÁRIA — Modelo de dados

Depende do §0. Esboço **provável** (a validar após as respostas), como **novas migrations versionadas** (`002_editora.sql`, ...):

- `editora_artigos` — `id, titulo, slug, resumo, corpo (rich text), status ('rascunho'|'revisao'|'publicado'), autor_id (fk profiles), especialidade, capa_url, criado_em, atualizado_em, publicado_em`.
- (se houver versões) `editora_versoes` — histórico por artigo.
- **RLS:** leitura pública só de `status='publicado'`; escrita só por editor/admin (via role ou service-role) — mesmo padrão do `001_medical_content.sql`.

**Antes de criar qualquer tabela:** decidir (§ Riscos do Diagnóstico) se adotamos migrations
versionadas de verdade e capturamos um baseline do schema atual. **Não altero o banco de
produção sem seu ok** (regra do `CLAUDE.md`).

## 4. Superfícies / rotas (proposta, sem implementar)

- **Admin:** `/admin/editora` (lista de artigos: criar, editar, gerar com IA, mudar status). Registrar o editor **na grade E na barra lateral** do admin.
- **Público (se aplicável):** rota nova (ex.: `/artigos` e `/artigos/[slug]`) reusando `.card-grid`/tokens, ou encaixe numa seção existente — a definir no §0.
- **IA:** um endpoint/Server Action que recebe o rascunho/tema e devolve o texto, reusando a camada `lib/ai` (§1) e, se fizer sentido, o RAG.

## 5. Cache / revalidação

Seguir o padrão do projeto: páginas dinâmicas + `revalidatePath("/artigos")` (e a rota do
item) nas actions de publicar/editar. Sem ISR por tempo. Conteúdo relacional no Supabase
(não no Blob).

## 6. Sequência sugerida (cada etapa = 1 commit na branch `feature/editora-medica`)

0. **(feito)** Diagnóstico + plano.
1. Responder o §0 e as decisões §2/§3 (você) → eu ajusto este plano.
2. Refatorar OpenAI para `src/lib/ai/` (se aprovado).
3. Migration + RLS do modelo escolhido (com seu aval no schema).
4. Admin `/admin/editora` (CRUD + status) — sem IA ainda.
5. Geração/edição com IA (reusando pipeline de qualidade + RAG).
6. Superfície pública + revalidação.
7. Permissões finais (se Opção B/C).

---

## Decisões abertas (bloqueiam a implementação)

- [ ] **§0** — escopo real da Editora (o que publica, quem usa, IA gera/edita, aprovação, onde aparece).
- [ ] **§2** — modelo de permissão (A senha única / B `profiles.role` / C `app_metadata`).
- [ ] **§3** — adotar migrations versionadas + schema das tabelas novas + RLS.
- [ ] **§1** — autorizar a extração da camada `src/lib/ai/` (refatoração dos 7 pontos atuais).
