FROM node:22-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile --filter ./apps/web...

FROM deps AS build

ARG VITE_GRAPHQL_URL=http://localhost:4000/graphql
ARG VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql

ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
ENV VITE_GRAPHQL_WS_URL=$VITE_GRAPHQL_WS_URL

COPY apps/web apps/web

RUN pnpm --dir apps/web build

FROM deps AS runtime

WORKDIR /app/apps/web

COPY --from=build /app/apps/web/dist dist

EXPOSE 4173

CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "4173"]
