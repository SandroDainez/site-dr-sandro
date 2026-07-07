-- 010_editora_areas.sql
-- Multi-especialidade para o conteúdo da Editora Médica.
-- Cada documento pode ser marcado (seleção múltipla plana) com as especialidades/áreas
-- em que deve aparecer nos hubs (/especialidade/[area]). Valores usam os MESMOS códigos
-- de área do site: 'emergencias' | 'ti' | 'anestesiologia'. Aditivo e seguro: default '{}'
-- (nenhum documento existente passa a aparecer em hub nenhum até ser marcado).

alter table public.protocols             add column if not exists areas text[] not null default '{}';
alter table public.sci_docs              add column if not exists areas text[] not null default '{}';
alter table public.aula_docs             add column if not exists areas text[] not null default '{}';
alter table public.flashcard_docs        add column if not exists areas text[] not null default '{}';
alter table public.questao_docs          add column if not exists areas text[] not null default '{}';
alter table public.research_docs         add column if not exists areas text[] not null default '{}';
alter table public.protocol_update_docs  add column if not exists areas text[] not null default '{}';

-- Índices GIN para o filtro por área nos hubs (areas @> '{area}').
create index if not exists protocols_areas_gin            on public.protocols            using gin (areas);
create index if not exists sci_docs_areas_gin             on public.sci_docs             using gin (areas);
create index if not exists aula_docs_areas_gin            on public.aula_docs            using gin (areas);
create index if not exists flashcard_docs_areas_gin       on public.flashcard_docs       using gin (areas);
create index if not exists questao_docs_areas_gin         on public.questao_docs         using gin (areas);
create index if not exists research_docs_areas_gin        on public.research_docs        using gin (areas);
create index if not exists protocol_update_docs_areas_gin on public.protocol_update_docs using gin (areas);
