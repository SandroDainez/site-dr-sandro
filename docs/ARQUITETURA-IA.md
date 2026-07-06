# Arquitetura da camada de IA nativa — Editora Médica

> **Projeto/documentação apenas. Nada implementado.** Ler antes: `docs/DIAGNOSTICO.md`
> e `docs/PLANO-EDITORA.md`. Este documento desenha a camada de IA **nativa** da Editora
> Médica (projetada do zero neste projeto, sem integração/referência a sistemas externos).

## Decisões travadas (não reabrir)

- **Módulos de IA 100% nativos** do MedCampus.
- **Providers definitivos:** DeepSeek (geração) + OpenAI/GPT-4o (revisão). A OpenAI **já está
  integrada** e será reutilizada; DeepSeek será adicionado. **Anthropic:** só previsto na
  interface (plugável no futuro sem refatoração), **sem implementação**.
- **Pipeline de 2 estágios:** DeepSeek gera (barato e competente em texto científico denso) →
  GPT-4o audita. A revisão **aponta problemas e produz versão corrigida rastreável — nunca
  reescreve silenciosamente.**

> **Nota de estado:** o risco "OpenAI espalhada" do Diagnóstico §7/§Riscos-4 **já foi
> resolvido** (Comando 2): o client foi extraído para **`src/lib/ai/openai.ts`**
> (`getOpenAI()`, `AI_MODELS`, `chatJSON()`). O `OpenAIProvider` desta arquitetura
> **reutiliza esse módulo** — não é preciso nova refatoração.

---

## 1. Camada de serviço

Tudo vive em **`src/lib/ai/`** (server-only). A Editora nunca fala com um SDK direto;
fala com a **interface `AIProvider`**. Trocar/plugar modelo = trocar a implementação,
sem tocar nos módulos.

### 1.1 Interface única `AIProvider`

Contrato (esboço de tipos — **não é implementação**):

```ts
// src/lib/ai/types.ts
export type Source = {
  id: string;            // source_id estável (ex.: "S1", uuid, pmid)
  titulo?: string;
  texto: string;         // conteúdo textual REAL contra o qual as citações são verificadas
  url?: string;
  meta?: Record<string, unknown>;
};

export type Usage = { promptTokens: number; completionTokens: number };

// Cada afirmação da saída fica ligada a um source + âncora (ver §4)
export type Afirmacao = {
  texto: string;
  source_id: string | null;   // null = "sem fonte"
  ancora: string | null;      // trecho verbatim do source que sustenta (null se sem fonte)
  tipo?: "clinica" | "dose" | "geral";
};

export type GenerateInput = {
  modulo: string;             // qual módulo (define prompt)
  sources: Source[];          // material de entrada (obrigatório p/ módulos de geração)
  instrucoes?: string;        // parâmetros do usuário (tema, formato, público-alvo...)
  maxTokens?: number;
  temperature?: number;
  model?: string;             // override opcional
};

export type GenerateResult = {
  provider: string;
  model: string;
  afirmacoes: Afirmacao[];    // corpo estruturado (parseável — ver §4)
  textoBruto?: string;        // fallback livre quando o módulo não exige estrutura
  usage: Usage;
};

export type Issue = {
  ref: string;                // aponta a afirmação/trecho (índice ou id)
  tipo: "citacao_invalida" | "sem_fonte" | "impreciso" | "dose_suspeita" | "estilo";
  severidade: "alta" | "media" | "baixa";
  descricao: string;          // o QUE está errado (auditoria, rastreável)
  sugestao?: string;          // como corrigir
};

export type ReviewInput = {
  modulo: string;
  draft: GenerateResult;      // saída do estágio de geração
  sources: Source[];
};

export type ReviewResult = {
  provider: string;
  model: string;
  issues: Issue[];            // problemas apontados (nunca some em silêncio)
  corrigido: GenerateResult;  // versão corrigida SEPARADA (o draft original é preservado)
  confidence: number;         // 0..1 (ver §4)
  usage: Usage;
};

export interface AIProvider {
  readonly nome: string;
  generate(input: GenerateInput): Promise<GenerateResult>;
  review(input: ReviewInput): Promise<ReviewResult>;
}
```

Princípios: o **draft original é imutável**; `review` devolve `issues` + um `corrigido`
**à parte**. A UI mostra os dois lado a lado (o editor humano decide). Rastreabilidade total.

### 1.2 Implementações

| Provider | Estado | Usa | Papel padrão |
|---|---|---|---|
| **MockProvider** | 1º a implementar (piloto) | nada (determinístico, offline) | pilotar pipeline+UI+validação de citação sem gastar token |
| **OpenAIProvider** | reutiliza `src/lib/ai/openai.ts` | `getOpenAI()` + `AI_MODELS.chat` (gpt-4o) | **revisão** (auditor) |
| **DeepSeekProvider** | a adicionar | SDK `openai` com `baseURL: https://api.deepseek.com` + `DEEPSEEK_API_KEY`, modelo `deepseek-chat` | **geração** |
| **AnthropicProvider** | **só previsto** | — | placeholder que satisfaz a interface e lança "não implementado"; plugável depois |

- **DeepSeek** expõe API **compatível com OpenAI**, então o `DeepSeekProvider` reaproveita o
  mesmo pacote `openai` (só muda `baseURL` + key + modelo) — encaixa na camada `src/lib/ai/`
  sem dependência nova.
- **MockProvider** devolve saída estruturada canônica com citações **válidas e inválidas de
  propósito**, para exercitar §4 (validação) e a UI antes de gastar API.

### 1.3 Pipeline padrão (2 estágios, configurável por módulo)

```ts
// src/lib/ai/pipeline.ts (esboço)
type StageCfg = { provider: string; model?: string };
type ModuloCfg = { generation: StageCfg; review?: StageCfg }; // sem review = 1 estágio

async function runPipeline(cfg: ModuloCfg, input: GenerateInput): Promise<{
  draft: GenerateResult; review?: ReviewResult; final: GenerateResult; validacao: Validacao;
}>
```

- **2 estágios (padrão):** `generation` (DeepSeek) → `review` (GPT-4o).
- **1 estágio:** módulos simples podem omitir `review` (só geração + validação de citação por código).
- Config por módulo num registry (`src/lib/ai/modules.ts`), então trocar provider de um estágio
  é 1 linha. Piloto: apontar ambos para `mock`.
- **A validação de citações por CÓDIGO (§4) roda SEMPRE**, independente de ter revisão de IA —
  é a garantia determinística.

### 1.4 Segurança / env vars

- Chaves **só no servidor**: `OPENAI_API_KEY` (existente), `DEEPSEEK_API_KEY` (nova),
  `ANTHROPIC_API_KEY` (futura). Nunca expostas ao client.
- Toda chamada de IA acontece em **Server Action / route handler** (a Editora é admin-gated).

### 1.5 Rate limiting, erros e retry

- **Retry com backoff** (4 tentativas, mesma linha do `src/lib/agents/embeddings.ts` já existente),
  encapsulado na camada — os módulos não reimplementam.
- **Rate limiting** simples: fila/limite de concorrência por provider (evitar estourar limite da API);
  para geração em lote (ex.: muitos flashcards) processar em lotes.
- **Erros tipados** (`AIError` com `provider`, `stage`, `retryable`). Falha no estágio de revisão
  **não descarta o draft** — devolve o draft + aviso "revisão indisponível" (fail-safe).

### 1.6 Registro de custo por chamada (`ai_generations`)

Toda chamada de provider grava uma linha (design da tabela — **não aplicar ainda**):

```sql
-- migration futura (ex.: 003_ai_generations.sql)
CREATE TABLE IF NOT EXISTS ai_generations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo       TEXT NOT NULL,             -- editor_cientifico, flashcards, ...
  stage        TEXT NOT NULL CHECK (stage IN ('generation','review')),
  provider     TEXT NOT NULL,             -- deepseek | openai | mock | anthropic
  model        TEXT NOT NULL,
  tokens_in    INTEGER NOT NULL DEFAULT 0,
  tokens_out   INTEGER NOT NULL DEFAULT 0,
  custo_usd    NUMERIC(10,5),             -- calculado por tabela de preço/modelo (opcional)
  ref_tipo     TEXT,                      -- ex.: 'artigo'
  ref_id       UUID,                      -- id do artefato gerado (fk lógica)
  confidence   NUMERIC(4,3),             -- confidence da validação (§4), quando aplicável
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: leitura/escrita só service-role (padrão dos 001/002).
```

Toda a instrumentação fica na camada `src/lib/ai/` (o módulo não se preocupa com isso).

### 1.7 Ordem de implementação

1. **MockProvider + pipeline + validação de citação (§4)** — pilota tudo sem API.
2. **Providers reais** (`DeepSeekProvider`, `OpenAIProvider`) — **Comando 7.5**.
3. `ai_generations` + instrumentação de custo.
4. Ligar os módulos, um a um, ao pipeline.

---

## 2. Classificação dos 9 módulos

**Tipo:** GERAÇÃO (a partir de sources) · RETRIEVAL (busca externa) · HÍBRIDO.
**Núcleo comum a todos:** interface `AIProvider`, pipeline, **bloco anti-alucinação (§3)**,
**formato + validação de citações (§4)**, registro de custo, modelo de `Source`.

| Módulo | Tipo | Pipeline | Específico (além do núcleo) |
|---|---|---|---|
| **Editor Científico** | Geração | 2 estágios | prompt de redação científica; sources = referências fornecidas |
| **Arquiteto de Protocolos** | Geração | 2 estágios | saída estruturada (fluxo/etapas do protocolo); sources = diretrizes |
| **Editor Premium** | Geração/edição | 2 estágios | recebe rascunho + sources e refina; foco em densidade e forma |
| **Criador de Aulas** | Geração | 2 estágios | saída em seções/slides; público-alvo como parâmetro |
| **Criador de Flashcards** | Geração | 1 ou 2 estágios | saída em pares frente/verso; simples → pode ser 1 estágio (validação de citação ainda roda) |
| **Criador de Questões** | Geração | 2 estágios | saída MCQ (enunciado/alternativas/gabarito/justificativa); correção é crítica → sempre 2 estágios |
| **Atualizador de Protocolos** | Híbrido | 2 estágios | retrieval de novidades + geração do *delta* sobre um protocolo existente |
| **Comparador de Guidelines** | **Retrieval** | 2 estágios | busca + tabela comparativa entre diretrizes |
| **Pesquisador Científico** | **Retrieval** | 2 estágios | busca + síntese com fontes |

**Fontes de busca dos módulos de retrieval** (só indicadas, sem detalhar implementação agora):
- **Pesquisador Científico** e **Comparador de Guidelines**: **PubMed** (já há base em
  `src/lib/assistente/search-pubmed.ts`), **RAG interno** (`kb_chunks` + `hybrid_search`,
  já existente) e sites/portais de diretrizes. **Atualizador de Protocolos** também usa esses.
- Nos módulos de retrieval, o resultado da busca **vira o conjunto de `Source[]`** — a partir daí
  o pipeline e a validação de citações (§4) são os mesmos dos módulos de geração.

---

## 3. Estrutura de prompts

- Pasta **`src/lib/ai/prompts/`**, **um arquivo por módulo** (`editor-cientifico.ts`,
  `flashcards.ts`, ...), **versionados no Git** (rastrear evolução do prompt).
- Cada prompt de módulo = **bloco anti-alucinação COMUM** + instruções específicas +
  os `sources` (com seus `source_id`) + **especificação do formato de saída (§4)**.
- Bloco comum em **`src/lib/ai/prompts/anti-alucinacao.ts`**, reutilizado por todos:

> **REGRAS INVIOLÁVEIS (bloco comum anti-alucinação)**
> (a) Use **EXCLUSIVAMENTE** o conteúdo dos *sources* fornecidos. Nada de conhecimento externo.
> (b) **Nunca invente** dose, achado, etiologia ou conduta.
> (c) Toda afirmação clínica relevante **cita qual source a sustenta**, em formato estruturado
>     e **parseável pelo código** (`source_id` + `ancora` verbatim — ver §4).
> (d) O que **não** tiver respaldo nos sources é marcado **"sem fonte"** (`source_id: null`).
> (e) **Doses e medicamentos** são **transcritos fielmente** do source (com a `ancora` exata),
>     **nunca "de memória"**.

Esse bloco é a mesma filosofia já validada no assistente clínico e nos boletins (não fabricar
referência, transcrever dose com fonte) — agora formalizada e reutilizável.

---

## 4. Validação de citações (o coração do sistema)

Duas camadas: **determinística (código, sempre)** + **semântica (auditor GPT-4o, no estágio de revisão)**.

### 4.1 Formato estruturado de saída

A IA **não** devolve texto solto: devolve **lista de afirmações** (`Afirmacao[]`, §1.1), cada uma com:
- `texto` — a afirmação;
- `source_id` — qual source a sustenta (ou `null` = "sem fonte");
- `ancora` — **trecho verbatim** do texto daquele source que sustenta a afirmação;
- `tipo` — `clinica` | `dose` | `geral` (afirmações `clinica`/`dose` **exigem** fonte).

O corpo final (HTML/markdown) é **montado pelo código** a partir dessas afirmações, já com os
marcadores de citação e de "sem fonte" — o código controla a renderização, não a IA.

### 4.2 Verificação determinística (código)

Para cada `Afirmacao` com `source_id != null`:
1. **`source_id` existe** no conjunto de `sources` fornecido? Se não → **CITAÇÃO INVÁLIDA**
   (fonte fabricada).
2. A **`ancora` consta** no `texto` daquele source? Comparação **normalizada** (minúsculas, espaços
   colapsados, acentos/pontuação tolerados; casamento por substring/*fuzzy* com limiar).
   Se não constar → **CITAÇÃO INVÁLIDA** (âncora fabricada).
3. Se `source_id` e `ancora` conferem → **VÁLIDA**.

Afirmações com `source_id = null`:
- Se `tipo` ∈ {`clinica`,`dose`} → **violação** (afirmação clínica sem fonte) → vira `Issue`
  severidade alta e **não pode publicar** sem correção.
- Se `tipo = geral` → permitido, marcado visualmente como "sem fonte".

### 4.3 `confidence_level`

```
requer_fonte   = nº de afirmações com tipo clinica|dose (ou marcadas como relevantes)
validadas      = nº dessas com citação VÁLIDA (§4.2)
confidence     = requer_fonte === 0 ? 1 : validadas / requer_fonte
```

- Citação **inválida** (source inexistente ou âncora que não consta) conta como **não validada** →
  **derruba** o `confidence` na proporção.
- Faixas (proposta, ajustável): **≥ 0.90** alto (ok publicar) · **0.70–0.89** médio (revisar antes) ·
  **< 0.70** baixo (**bloqueia publicação**; exige revisão humana).
- O `confidence` é gravado junto ao artefato e em `ai_generations` (§1.6), e exibido no editor
  com as afirmações problemáticas destacadas.

### 4.4 Papel do estágio de revisão (GPT-4o)

O código pega **inconsistências objetivas** (fonte inexistente, âncora ausente). O **GPT-4o**
pega o que é **semântico**: afirmação que a âncora existe mas **não sustenta** de fato, dose
transcrita com número trocado, extrapolação além do source. Ele **aponta** cada um como `Issue`
e devolve a **versão corrigida à parte** — o editor humano aprova. Nunca reescreve em silêncio.

---

## 5. Modelo de dados (design — não aplicar ainda)

- **`ai_generations`** (§1.6) — custo/telemetria por chamada.
- Armazenamento das **afirmações + citações** por artefato: como JSONB no próprio registro do
  artefato (ex.: coluna `afirmacoes JSONB`, `confidence NUMERIC`) **ou** tabela `artigo_citacoes`
  dedicada. **Decisão a tomar** na fase de implementação (ver §6).
- Tudo em **migrations versionadas** (`003_...`) com RLS no padrão dos `001`/`002` (leitura pública
  só do publicado; escrita service-role).

---

## 6. Decisões abertas (para a fase de implementação, não agora)

- [ ] Preço/modelo do DeepSeek a usar (`deepseek-chat` vs `deepseek-reasoner`) e tabela de custo p/ `custo_usd`.
- [ ] Persistência das citações: JSONB no artefato **ou** tabela dedicada `artigo_citacoes`.
- [ ] Limiares exatos de `confidence` (0.90/0.70 são proposta).
- [ ] Algoritmo de casamento da `ancora` (substring normalizada vs *fuzzy*/similaridade) e limiar.
- [ ] `DEEPSEEK_API_KEY` a provisionar no ambiente (Vercel) quando chegar o Comando 7.5.

---

## 7. Resumo para aprovação

- **Camada única `src/lib/ai/`** com interface `AIProvider` (`generate`/`review`); implementações
  **Mock → OpenAI (reusa `src/lib/ai/openai.ts`) → DeepSeek**; **Anthropic só previsto**.
- **Pipeline 2 estágios** (DeepSeek gera → GPT-4o audita), **configurável por módulo** (simples = 1 estágio);
  revisão **aponta + corrige rastreável**, nunca em silêncio.
- **9 módulos** classificados (geração/retrieval/híbrido, 1–2 estágios), todos partilhando o núcleo
  comum; retrieval (Pesquisador, Comparador, Atualizador) usa **PubMed + RAG interno + portais**.
- **Prompts versionados** por módulo, com **bloco anti-alucinação comum** (a–e).
- **Validação de citações** determinística (source_id existe + âncora verbatim consta) + semântica (GPT-4o),
  calculando **`confidence`** e **bloqueando publicação** abaixo do limiar.
- **Custo** registrado em `ai_generations`. **Chaves só no servidor**, retry/rate-limit na camada.
- **Ordem:** MockProvider primeiro (piloto), providers reais no **Comando 7.5**.

> Nada disto está implementado — este documento é a proposta para sua **aprovação** antes de
> qualquer código.
