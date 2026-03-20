# AGENTS.md — apps/server

## Escopo

Backend em Koa com GraphQL programático e persistência em MongoDB via Mongoose.

- App raiz: `apps/server`
- Código principal: `src/`
- Testes: `src/__tests__/`
- Scripts locais: `pnpm dev`, `pnpm build`, `pnpm test`

---

## Criação de Schema GraphQL

### Estrutura de Pastas

```
src/
├── modules/
    ├──auth/
    │   ├── AuthQuery.ts        # Auth queries (me) — componível
    │   └── authorization.ts  # Helpers de autorização (requireAuth, requireAdmin, etc)
│   └── {domain}/                    # ex: accounts, transactions, notifications
│       ├── {Domain}Model.ts         # Mongoose schema + model + tipo IAccount
│       ├── {Domain}Type.ts          # GraphQLObjectType
│       ├── {Domain}Query.ts         # Índice: exporta todas queries do domínio
│       ├── mutations/
│       │   ├── {domain}Mutations.ts # Índice: exporta todas mutations do domínio
│       │   └── {Action}{Domain}Mutation.ts  # Uma mutation por arquivo
│       └── subscriptions/
│           ├── {domain}Subscriptions.ts     # Índice: exporta todas subscriptions do domínio
│           └── {Event}Subscription.ts       # Uma subscription por arquivo
├── schema/
│   ├── schema.ts           # GraphQLSchema principal
│   ├── QueryType.ts        # Root Query — spread de {domain}Queries
│   ├── MutationType.ts     # Root Mutation — spread de {domain}Mutations
│   └── SubscriptionType.ts # Root Subscription — spread de {domain}Subscriptions
├── server/
│   ├── app.ts              # Koa setup + GraphQL context
│   └── authorization.ts    # Centralized auth helpers (requireAuth, requireAdmin, etc)
└── database.ts
```

### Convenções Obrigatórias

| Item | Padrão |
|------|--------|
| Arquivos de módulo | PascalCase (`AccountType.ts`, `CreateAccountMutation.ts`) |
| Índice de mutations | camelCase plural (`accountMutations`) dentro de `{domain}Mutations.ts` |
| Índice de queries | camelCase plural (`accountsQueries`) dentro de `queries.ts` |
| Nomes de mutation no schema | PascalCase (`CreateAccount`, `Transfer`) |
| Nomes de query no schema | camelCase (`account`, `accounts`) |
| Campos obrigatórios | Sempre `new GraphQLNonNull(...)` |
| Listas não-nulas | `new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ItemType)))` |
| Resolvers com DB | Sempre `async/await` com Mongoose |

---

## Autorização e Segurança

Toda autorização é centralizada em `src/server/authorization.ts` com helpers reutilizáveis:

### Helpers Disponíveis

| Helper | Uso | Exceção |
|--------|-----|---------|
| `requireAuth(context)` | Valida autenticação; lança erro se não autenticado | `AuthorizationError` |
| `requireAdmin(context)` | Valida role admin; lança erro se não admin | `AuthorizationError` |
| `getAuthenticatedAccount(context)` | Carrega conta do usuário autenticado | Lança se conta não encontrada |
| `assertOwnerOrAdmin(userId, context)` | Valida ownership (userId) ou admin | Lança se não owner e não admin |
| `assertAccountOwnerOrAdmin(accountId, context)` | Valida ownership (accountId) ou admin | Lança se não owner e não admin |

### Padrões de Autorização

```typescript
// Pattern 1: Public query (sem auth)
export const accountsQueries = {
  account: {
    resolve: async (_source, { id }) => {
      return await Account.findById(id);
    },
  },
};

// Pattern 2: Optional auth (retorna null se não autenticado)
export const authQueries = {
  me: {
    resolve: async (_source, _args, context) => {
      if (!context.auth?.userId) return null;
      return await User.findById(context.auth.userId);
    },
  },
};

// Pattern 3: Admin only
export const usersQueries = {
  users: {
    resolve: async (_source, _args, context) => {
      requireAdmin(context);
      return await User.find({});
    },
  },
};

// Pattern 4: Owner or admin (single resource)
export const transactionsQueries = {
  transaction: {
    resolve: async (_source, { id }, context) => {
      requireAuth(context);
      const tx = await Transaction.findById(id);
      if (!transactionBelongsToAccount(tx, userAccountId)) {
        throw new AuthorizationError("Sem permissao");
      }
      return tx;
    },
  },
};

// Pattern 5: Owner or admin (account filter)
export const transactionsQueries = {
  transactions: {
    resolve: async (_source, args, context) => {
      const accountId = await assertAccountOwnerOrAdmin(
        args.accountId,
        context,
      );
      return await Transaction.find(query);
    },
  },
};
```

### Regra de Ouro

**Sempre teste autorização ANTES de queries/mutations ao banco:**
```typescript
// ❌ ERRADO: DTD before auth check
const data = await ExpensiveQuery.find();
if (user.role !== "ADMIN") throw Error();

// ✅ CORRETO: Auth check FIRST
requireAdmin(context);
const data = await ExpensiveQuery.find();
```

---

## Passo a Passo: Adicionar Novo Módulo

### 1. Criar o Mongoose Model — `src/modules/{domain}/{Domain}Model.ts`

```typescript
import { model, Schema } from "mongoose";

export type I{Domain} = {
  createdAt: Date;
};

const {domain}Schema = new Schema<I{Domain}>({
  createdAt: { type: Date, default: Date.now },
});

export const {Domain} = model("{Domain}", {domain}Schema);
```

### 2. Criar o GraphQL Type — `src/modules/{domain}/{Domain}Type.ts`

```typescript
import { GraphQLNonNull, GraphQLObjectType, GraphQLID, GraphQLString } from "graphql";

export const {Domain}Type = new GraphQLObjectType({
  name: "{Domain}",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  },
});
```

Tipos GraphQL disponíveis: `GraphQLString`, `GraphQLFloat`, `GraphQLInt`, `GraphQLBoolean`, `GraphQLID`

### 3. Criar cada Mutation individualmente — `src/modules/{domain}/mutations/{Action}{Domain}Mutation.ts`

```typescript
import { GraphQLNonNull, GraphQLString } from "graphql";
import { {Domain}Type } from "../{Domain}Type";
import { {Domain} } from "../{Domain}Model";

export const {Action}{Domain}Mutation = {
  type: new GraphQLNonNull({Domain}Type),
  args: {
    // argumentos obrigatórios com GraphQLNonNull
  },
  resolve: async (_, args: { /* tipos dos args */ }) => {
    const doc = new {Domain}({ ...args });
    await doc.save();
    return doc;
  },
};
```

### 4. Criar índice de mutations — `src/modules/{domain}/mutations/{domain}Mutations.ts`

```typescript
import { {Action}{Domain}Mutation } from "./{Action}{Domain}Mutation";

export const {domain}Mutations = {
  {Action}{Domain}: {Action}{Domain}Mutation,
};
```

### 5. Registrar mutations no Root — `src/schema/MutationType.ts`

```typescript
import { GraphQLObjectType } from "graphql";
import { accountMutations } from "../modules/accounts/mutations/accountMutationts";
import { {domain}Mutations } from "../modules/{domain}/mutations/{domain}Mutations";

export const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    ...accountMutations,
    ...{domain}Mutations,
  }),
});
```

Use `fields: () => ({})` como thunk para evitar dependências circulares.

### 5b. Adicionar uma Subscription — `src/modules/{domain}/subscriptions/{Event}Subscription.ts`

```typescript
import { GraphQLNonNull, GraphQLObjectType } from "graphql";
import type { GraphQLContext } from "../../../types/auth";

export const {Event}Subscription = {
  type: new GraphQLNonNull({Event}Type),
  args: {
    // argumentos necessários
  },
  subscribe: async function* (
    _source: unknown,
    args: { /* tipos dos args */ },
    context: GraphQLContext,
  ) {
    if (!context.auth) throw new Error("Usuario nao autenticado");
    // lógica de autorização e filtragem
    for await (const payload of someBus.subscribe()) {
      yield payload;
    }
  },
  resolve: (payload: unknown) => payload,
};
```

Criar o índice `src/modules/{domain}/subscriptions/{domain}Subscriptions.ts`:

```typescript
import { {Event}Subscription } from "./{Event}Subscription";

export const {domain}Subscriptions = {
  {event}: {Event}Subscription,
};
```

Registrar no Root — `src/schema/SubscriptionType.ts`:

```typescript
import { GraphQLObjectType } from "graphql";
import { notificationSubscriptions } from "../modules/notifications/subscriptions/notificationSubscriptions";

export const SubscriptionType = new GraphQLObjectType({
  name: "Subscription",
  fields: () => ({
    ...notificationSubscriptions,
  }),
});
```

O padrão é idêntico ao de mutations: um arquivo por subscription → índice do domínio → spread no root.

### 6. Criar índice de queries — `src/modules/{domain}/queries.ts`

Assim como mutations, queries de cada módulo são exportadas em um arquivo `queries.ts`:

```typescript
// src/modules/{domain}/queries.ts
import { GraphQLNonNull, GraphQLID } from "graphql";
import { {Domain}Type } from "./{Domain}Type";
import { {Domain} } from "./{Domain}Model";
import type { GraphQLContext } from "../../types/auth";

/**
 * {Domain} module — {Auth pattern} queries
 * Pattern: {queryName}
 */
export const {domain}Queries = {
  {queryName}: {
    type: {Domain}Type,
    args: {
      id: { type: new GraphQLNonNull(GraphQLID) },
    },
    resolve: async (_source: unknown, { id }: { id: string }) => {
      return await {Domain}.findById(id);
    },
  },
};
```

**Auth Patterns:**
- `Public query` — Sem `requireAuth()`, acessível sem autenticação
- `Optional auth` — Verifica `context.auth?.userId` com return null
- `Owner only` — Usa `getAuthenticatedAccount()` para validação
- `Owner or admin` — Usa `assertAccountOwnerOrAdmin()` ou `assertOwnerOrAdmin()`
- `Admin only` — Usa `requireAdmin()` para validação

### 7. Registrar queries no Root — `src/schema/QueryType.ts`

Compose queries de múltiplos módulos usando spread operator:

```typescript
import { GraphQLObjectType } from "graphql";
import { authQueries } from "./authQueries";
import { accountsQueries } from "../modules/accounts/queries";
import { transactionsQueries } from "../modules/transactions/queries";
import { {domain}Queries } from "../modules/{domain}/queries";

/**
 * Root Query Type — Composes queries from all modules
 */
export const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    ...authQueries,           // me (optional auth)
    ...accountsQueries,       // account, accounts, accountsCount (public)
    ...usersQueries,          // users (admin only)
    ...transactionsQueries,   // transaction, transactions, transactionsCount (owner/admin)
    ...{domain}Queries,       // Seu novo domínio
  },
});
```

**Convenção:** Ordem de spread segue padrão de segurança:
1. `authQueries` — Optional/Public
2. Queries públicas (ex: `accountsQueries`)
3. Queries restritas por módulo (transactions, deposits, kyc, etc)

{domain}s: {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull({Domain}Type))),
  resolve: async () => {
    return await {Domain}.find();
  },
},
```

---

## Regras de Validação nos Resolvers

Sempre nesta ordem dentro do `resolve`:

1. Validar valores dos argumentos (`amount > 0`, strings não-vazias, etc.)
2. Buscar documentos no banco e verificar existência
3. Verificar regras de negócio (saldo suficiente, conta ativa, etc.)
4. Executar a operação (`save`, `update`)
5. Retornar o documento

```typescript
if (amount <= 0) throw new Error("Valor deve ser maior que zero");

const account = await Account.findById(id);
if (!account) throw new Error("Conta não encontrada");
```

---

## Fluxo de TDD Recomendado

Use TDD quando a mudança alterar regra de negócio, contrato GraphQL, fluxo de erro ou integração entre resolver e model. Para mudanças puramente mecânicas, renomeações ou refactors sem alteração comportamental, comece pelo refactor pequeno e cubra o comportamento crítico se ainda não existir teste.

### Ordem recomendada

1. Criar ou ajustar o teste do domínio afetado primeiro
2. Rodar apenas a suíte alvo e confirmar falha
3. Implementar a menor mudança possível no resolver ou schema
4. Rodar a suíte alvo novamente
5. Refatorar mantendo o teste verde
6. Só então rodar a suíte completa

### Onde colocar os testes

```text
src/
├── __tests__/
│   ├── helpers/         # helpers de execução GraphQL e utilitários comuns
│   ├── factories/       # criação de documentos fake reutilizáveis
│   └── setup/           # setup global do Jest
├── modules/
│   └── {domain}/
│       └── mutations/
│           └── __tests__/ # testes da mutation do domínio
└── schema/
  └── __tests__/       # testes de wiring do root query/mutation
```

### Critério prático

- Teste em `modules/.../__tests__` quando quiser validar comportamento do domínio
- Teste em `schema/__tests__` quando quiser validar nome de campo GraphQL e wiring no root
- Prefira mocks dos models para unit tests do schema/resolver
- Não deixe testes genéricos de exemplo; cada teste deve proteger um comportamento real do backend

### Comandos úteis

- `pnpm test:ci`: execução determinística local/CI
- `pnpm test:watch`: loop de TDD
- `pnpm test:coverage`: validar lacunas antes de fechar uma mudança

Evite erros genéricos como `throw new Error("Erro")`.

---

## O que Não Fazer

- Não usar SDL (`buildSchema` ou template strings GraphQL); use apenas a API programática.
- Não colocar lógica de negócio no `schema.ts`; ela pertence aos resolvers dos módulos.
- Não misturar mutations de domínios diferentes no mesmo arquivo.
- Não usar `fields: {}` quando houver referências circulares; use thunk.
- Não omitir `GraphQLNonNull` em campos que nunca são nulos no banco.