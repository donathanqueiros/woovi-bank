# AGENTS.md — Subli Bank

## Escopo

Monorepo com Turborepo.

- `apps/server`: backend Koa + GraphQL programático + Mongoose/MongoDB. Consulte `apps/server/AGENTS.md`.
- `apps/web`: frontend principal em Next.js 16 + React 19 + Relay. Consulte `apps/web/AGENTS.md`.
- `apps/docs`: app de documentação em Next.js. Consulte `apps/docs/AGENTS.md`.
- `packages/*`: código compartilhado do monorepo. Na ausência de um `AGENTS.md` mais específico, siga este arquivo e preserve APIs estáveis.

Se existir um `AGENTS.md` mais específico dentro da pasta em que a mudança será feita, ele prevalece sobre este.

---

## Regras do Monorepo

- Descubra primeiro qual app ou package é o dono da responsabilidade antes de editar.
- Mantenha regras de negócio dentro do app dono; não espalhe lógica específica entre `apps/*` sem necessidade.
- Ao alterar contratos entre backend e frontend, atualize os dois lados e regenere artefatos necessários.
- Use os scripts do workspace via `pnpm` e `turbo` quando a tarefa afetar múltiplos apps.
- Prefira mudanças pequenas e locais; só mova algo para `packages/*` quando houver reuso real.
- Não quebre convenções já estabelecidas por um app específico para atender outro app.

---

## Padrão de Engenharia (Sênior)

- Atue como engenheiro(a) sênior: priorize clareza de arquitetura, legibilidade, previsibilidade e manutenção de longo prazo.
- Aplique práticas de produção por padrão: validação de entradas, tratamento explícito de erros, logs úteis e contratos estáveis.
- Evite complexidade acidental: prefira soluções simples, testáveis e com baixo acoplamento.
- Preserve compatibilidade e minimize risco de regressão; quando necessário, faça mudanças incrementais e bem justificadas.
- Garanta qualidade antes de concluir: rode lint, typecheck e testes relevantes ao escopo alterado.

---

## Scripts Úteis

- `pnpm dev`: sobe os apps em modo desenvolvimento via Turborepo.
- `pnpm build`: executa build do monorepo.
- `pnpm lint`: roda lint nos projetos configurados.
- `pnpm check-types`: roda checagem de tipos nos projetos configurados.
- `pnpm relay`: atualiza schema e artefatos Relay do frontend.
