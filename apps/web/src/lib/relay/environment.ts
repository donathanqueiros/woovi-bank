import {
  Environment,
  Network,
  Observable,
  RecordSource,
  Store,
  type FetchFunction,
  type GraphQLResponse,
  type SubscribeFunction,
} from "relay-runtime";
import { createClient } from "graphql-ws";

const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:4000/graphql";

const GRAPHQL_WS_URL =
  import.meta.env.VITE_GRAPHQL_WS_URL ??
  GRAPHQL_URL.replace("http://", "ws://").replace("https://", "wss://");

const wsClient = createClient({
  url: GRAPHQL_WS_URL,
  lazy: true,
});

const fetchGraphQL: FetchFunction = async (request, variables) => {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: request.text,
      variables,
    }),
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Falha ao conectar com o servidor GraphQL");
  }

  return await response.json();
};

const subscribeGraphQL: SubscribeFunction = (request, variables) => {
  return Observable.create((sink) => {
    const unsubscribe = wsClient.subscribe(
      {
        query: request.text ?? "",
        variables,
      },
      {
        next: (value) => sink.next(value as GraphQLResponse),
        error: (error) =>
          sink.error(
            error instanceof Error
              ? error
              : new Error("Falha na conexao de notificacoes"),
          ),
        complete: () => sink.complete(),
      },
    );

    return () => {
      unsubscribe();
    };
  });
};

export const relayEnvironment = new Environment({
  network: Network.create(fetchGraphQL, subscribeGraphQL),
  store: new Store(new RecordSource()),
});
