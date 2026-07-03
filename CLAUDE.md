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
