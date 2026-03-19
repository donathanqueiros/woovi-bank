# AGENTS.md — apps/web

## Escopo

Frontend em React 19, Vite e Relay.

- App raiz: `apps/web`
- Páginas: `src/pages/`
- Componentes locais: `src/components/`
- Integração Relay: `src/lib/relay/`, `schema.graphql`, `src/pages/**/__generated__/`
- Scripts locais: `pnpm dev`, `pnpm lint`, `pnpm check-types`, `pnpm relay`

---

## Responsabilidades

- Consumir o schema GraphQL exposto pelo backend.
- Centralizar queries e fragments Relay próximos das rotas e componentes que usam os dados.
- Manter a UI e o estado de apresentação no frontend; não duplicar regra de negócio do backend sem necessidade.
- Atualizar artefatos Relay sempre que o contrato GraphQL mudar.

---

## Convenções

- TDD não é obrigatório neste app; use quando fizer sentido para reduzir risco em mudanças críticas.
- Preferir App Router e Server Components por padrão; use Client Components apenas quando houver necessidade real.
- Preferir componentes do shadcn/ui e estilização com Tailwind CSS para construir e evoluir interfaces, mantendo consistência visual com o app.
- Manter queries Relay co-localizadas com a tela ou componente consumidor.
- Tratar estados de carregamento, erro e vazio nas telas que dependem de dados.
- Reaproveitar componentes compartilhados de `@repo/ui` quando fizer sentido, sem forçar abstrações precoces.
- Preservar o padrão já adotado de TypeScript, aliases e organização por rota.

---

## Relay

- Se alterar queries, fragments ou o schema consumido, rode `pnpm relay` a partir da raiz do monorepo ou `pnpm relay` neste app.
- Não edite arquivos em `__generated__/` manualmente; eles devem ser gerados.
- Mantenha `schema.graphql` sincronizado com o backend antes de compilar os artefatos.

---

## Storybook

- Storybook v10 está configurado em `.storybook/` e usa `@storybook/react-vite` + Tailwind CSS.
- Crie stories sempre que um componente de UI for adicionado ou modificado em `src/components/`.
- Coloque o arquivo de story ao lado do componente: `foo.stories.tsx` junto de `foo.tsx`.
- Use `Meta` e `StoryObj` do `@storybook/react`; importe utilitários de teste (ex.: `fn`) de `storybook/test`.
- Inclua ao menos: uma story `Playground` (controles livres), uma story por variante ou estado relevante, e uma story `Interactive` com `useState` quando o componente receber handlers.
- Para componentes de layout/página, use `parameters: { layout: "fullscreen" }` e um decorator que simule o contexto necessário.
- Não commite `storybook-static/` — está no `.gitignore`.
- Rode `pnpm --dir apps/web build-storybook` para validar antes de concluir.

---

## O que Não Fazer

- Não mover lógica específica do app para `packages/*` sem reuso comprovado.
- Não criar Client Component por padrão quando Server Component resolver.
- Não manter artefatos Relay desatualizados após mudanças no GraphQL.
- Não acoplar componentes de UI a detalhes de transporte além do necessário.