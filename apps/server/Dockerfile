FROM node:22-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json apps/server/package.json

RUN pnpm install --frozen-lockfile --filter ./apps/server...

FROM deps AS build

COPY apps/server apps/server

RUN pnpm --dir apps/server build

FROM base AS runtime

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json apps/server/package.json

RUN pnpm install --frozen-lockfile --prod --filter ./apps/server...

COPY --from=build /app/apps/server/dist apps/server/dist
COPY apps/server/.env.example apps/server/.env.example

WORKDIR /app/apps/server

EXPOSE 4000

CMD ["pnpm", "start"]
