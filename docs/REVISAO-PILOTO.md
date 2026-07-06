# Revisão do slice vertical — Arquiteto de Protocolos (portão)

> Revisão-portão do piloto (rascunho → público). Só após passar é que plugamos os
> providers reais e replicamos o padrão. Data: 2026-07-06. Branch `feature/editora-medica`.
> Todas as provas rodaram contra o banco real / dev local; dados de QA inseridos e apagados.

## Checklist (pass/fail)

| # | Item | Resultado | Como foi provado |
|---|---|---|---|
| 1a | Segurança — **rota** (middleware) | ✅ PASS | `curl` dev `GET /admin/editora/arquiteto-protocolos` sem cookie → **307 → /admin-login**; cookie inválido → 307. Públicas (`/`, `/protocolos`) → 200. |
| 1b | Segurança — **server action** | ✅ PASS | 11 actions exportadas × 11 `requireAdmin()` como 1ª linha (grep). Lógica: sem cookie / cookie errado → lança "Não autorizado"; correto → passa. |
| 1c | Segurança — **RLS** | ✅ PASS | Ver item 2. |
| 2 | RLS: nenhum draft vaza (anon key) | ✅ PASS | `curl` REST anon: `protocols`(draft), `protocol_versions`(is_published=false), `ai_generations`, `protocol_sources` → todos **`[]`**. |
| 3 | Imutabilidade: UPDATE/DELETE em version publicada | ✅ PASS | Trigger: `UPDATE` → **BLOQUEADO ✓**; `DELETE` → **BLOQUEADO ✓**. (Também: cascade delete do protocolo com versão publicada é bloqueado — ver nota.) |
| 4 | Tipagem estrita / componentização / design system | ✅ PASS | 0 `any` solto no slice (grep). Reusa chrome do site, `RichTextEditor`, `AdminHelp`, `.card-grid`/`colStyle`, tokens do `globals.css` — sem componente duplicado. `tsc --noEmit` = 0. |
| 5 | Build e lint limpos | ✅ PASS | `next build` compila; `tsc` 0 erros; `eslint` do slice sem findings (exceto `no-html-link-for-pages`, convenção pré-existente do projeto em todos os cabeçalhos — as páginas novas já usam `<Link>`). |
| 6 | Consistência do banco | ✅ PASS | FK `fk_protocols_current_version` **existe**; `current_version_id` órfãos = **0**; `UNIQUE(protocol_id, version_number)` **existe**; `version_number` = max+1 no app; append-only (app só INSERT; publicadas imutáveis). |
| 7 | Anti-alucinação: confidence detecta sem-fonte + UI ⚠ | ✅ PASS | Mock 6 blocos/24 seções → `confidence` **74,1%** (clínicas 20/27 validadas, 6 sem-fonte, 1 âncora inválida detectada). UI (editor) e página pública renderizam **"⚠ sem fonte"**. |
| 8 | Revalidação de cache (publicar → público atualiza) | ✅ PASS | Publicado via SQL → `GET /protocolos/[slug]` = **200** com título + dose + aviso; aparece na listagem. Despublicado → **404** e some da listagem. Páginas `force-dynamic`; `revalidatePath("/protocolos")` + `/protocolos/[slug]` em publicar/despublicar/arquivar. |
| 9 | Regressão OpenAI (features existentes) | ✅ PASS | Chamada real via `getOpenAI()` (a camada extraída no Comando 2 que assistente/agentes/banco-questoes/embeddings usam): `chat` (gpt-4o-mini) → "OK"; `embeddings` (text-embedding-3-small) → **1536 dims**. Layer intacta → features intactas. |

**Veredito: PASSA.** Pode plugar os providers reais (Comando 7.5) e replicar o padrão.

## Correções feitas nesta revisão

1. **`src/lib/ai/openai.ts` — `chatJSON()` blindado.** A OpenAI exige a palavra "json" nas
   mensagens quando `response_format: json_object`. `chatJSON` agora sempre injeta um system
   baseline ("Responda estritamente em JSON válido."), evitando um `400` caso um futuro
   chamador esqueça de mencionar JSON no prompt. (Uso atual — `gerarArtigoIA` — já dizia
   "JSON", então não havia bug ativo; é hardening preventivo achado no teste de regressão.)

## Notas / achados (não são bugs — comportamento correto)

- **Apagar um protocolo com versão publicada é BLOQUEADO** pela trigger de imutabilidade
  (o `DELETE` em cascata atinge a versão publicada). É imutabilidade real. Operacional:
  para remover, **despublicar/arquivar antes** (a função controlada `unpublish_protocol_version`
  libera a versão). Não há ação "excluir protocolo" no app hoje, então sem impacto.
- **Previews da Vercel têm proteção SSO** (302 → sso-api), então itens que dependem do app
  rodando (rota, cache) foram provados no **dev local**; itens de banco (RLS, imutabilidade,
  consistência) via `execute_sql`/anon key; regressão OpenAI via chamada real (chave local).

## Não removido

Nenhuma funcionalidade existente foi removida. Refatoração do Comando 2 (camada
`src/lib/ai/openai.ts`) confirmada sem regressão (item 9).
