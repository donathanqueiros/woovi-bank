export const POSTMAN_COLLECTION_SCHEMA =
	"https://schema.getpostman.com/json/collection/v2.1.0/collection.json";

export const DEFAULT_POSTMAN_BASE_URL = "http://localhost:4000";

import {
	getNamedType,
	isEnumType,
	isInputObjectType,
	isLeafType,
	isListType,
	isNonNullType,
	type GraphQLArgument,
	type GraphQLInputType,
	type GraphQLOutputType,
	type GraphQLType,
} from "graphql";
import { schema } from "../schema/schema";

type PostmanCollectionVariable = {
	key: string;
	value: string;
};

type PostmanGraphQLRequest = {
	name: string;
	request: {
		method: "POST";
		header: Array<{ key: string; value: string }>;
		body: {
			mode: "raw";
			raw: string;
		};
		url: {
			raw: string;
			host: string[];
			path: string[];
		};
		description: string;
	};
};

type PostmanCollectionItemGroup = {
	name: string;
	item: PostmanGraphQLRequest[];
};

export type PostmanCollection = {
	info: {
		_postman_id: string;
		name: string;
		schema: string;
		description: string;
	};
	item: PostmanCollectionItemGroup[];
	variable: PostmanCollectionVariable[];
};

type OperationKind = "query" | "mutation";

function buildGraphQLBody(query: string, variables: Record<string, unknown>): string {
	return JSON.stringify(
		{
			query,
			variables,
		},
		null,
		2,
	);
}

function typeToString(type: GraphQLType): string {
	if (isNonNullType(type)) {
		return `${typeToString(type.ofType)}!`;
	}

	if (isListType(type)) {
		return `[${typeToString(type.ofType)}]`;
	}

	return type.name;
}

function toPlaceholderValue(type: GraphQLInputType): unknown {
	if (isNonNullType(type)) {
		return toPlaceholderValue(type.ofType);
	}

	if (isListType(type)) {
		return [];
	}

	const namedType = getNamedType(type);

	if (isEnumType(namedType)) {
		const [firstValue] = namedType.getValues();
		return firstValue?.name ?? null;
	}

	if (isInputObjectType(namedType)) {
		const value: Record<string, unknown> = {};

		for (const [fieldName, field] of Object.entries(namedType.getFields())) {
			if (isNonNullType(field.type)) {
				value[fieldName] = toPlaceholderValue(field.type);
			}
		}

		return value;
	}

	switch (namedType.name) {
		case "String":
		case "ID":
			return "replace-me";
		case "Int":
			return 0;
		case "Float":
			return 0;
		case "Boolean":
			return false;
		default:
			return null;
	}
}

function buildSelectionSet(type: GraphQLOutputType): string {
	const namedType = getNamedType(type);

	if (isLeafType(namedType)) {
		return "";
	}

	return " {\n    __typename\n  }";
}

function buildOperationItem(
	kind: OperationKind,
	fieldName: string,
	field: {
		type: GraphQLOutputType;
		args: readonly GraphQLArgument[];
	},
): PostmanGraphQLRequest {
	const variableDefinitions = field.args.map(
		(argument) => `$${argument.name}: ${typeToString(argument.type)}`,
	);
	const operationArguments = field.args.map(
		(argument) => `${argument.name}: $${argument.name}`,
	);

	const operationName = `${kind} ${fieldName}`;
	const definitionSection = variableDefinitions.length
		? `(${variableDefinitions.join(", ")})`
		: "";
	const argumentSection = operationArguments.length
		? `(${operationArguments.join(", ")})`
		: "";
	const selectionSet = buildSelectionSet(field.type);

	const query = `${operationName}${definitionSection} {\n  ${fieldName}${argumentSection}${selectionSet}\n}`;
	const variables = field.args.reduce<Record<string, unknown>>((acc, argument) => {
		acc[argument.name] =
			argument.defaultValue !== undefined
				? argument.defaultValue
				: toPlaceholderValue(argument.type);
		return acc;
	}, {});

	const requestLabel =
		kind === "query" ? `Query - ${fieldName}` : `Mutation - ${fieldName}`;

	return {
		name: requestLabel,
		request: {
			method: "POST",
			header: [{ key: "Content-Type", value: "application/json" }],
			body: {
				mode: "raw",
				raw: buildGraphQLBody(query, variables),
			},
			url: {
				raw: "{{baseUrl}}/graphql",
				host: ["{{baseUrl}}"],
				path: ["graphql"],
			},
			description:
				kind === "query"
					? `Query ${fieldName} gerada automaticamente a partir do schema.`
					: `Mutation ${fieldName} gerada automaticamente a partir do schema.`,
		},
	};
}

function buildSchemaOperationItems(): {
	queries: PostmanGraphQLRequest[];
	mutations: PostmanGraphQLRequest[];
} {
	const queries: PostmanGraphQLRequest[] = [];
	const mutations: PostmanGraphQLRequest[] = [];
	const queryFields = schema.getQueryType()?.getFields() ?? {};
	const mutationFields = schema.getMutationType()?.getFields() ?? {};

	for (const fieldName of Object.keys(queryFields).sort()) {
		const field = queryFields[fieldName];

		if (!field) {
			continue;
		}

		queries.push(buildOperationItem("query", fieldName, field));
	}

	for (const fieldName of Object.keys(mutationFields).sort()) {
		const field = mutationFields[fieldName];

		if (!field) {
			continue;
		}

		mutations.push(buildOperationItem("mutation", fieldName, field));
	}

	return {
		queries,
		mutations,
	};
}

export function createPostmanCollection(
	baseUrl = DEFAULT_POSTMAN_BASE_URL,
): PostmanCollection {
	const schemaItems = buildSchemaOperationItems();

	return {
		info: {
			_postman_id: "2f1cf5df-4f7f-4fef-90cf-2d4d8f6b8d31",
			name: "Subli Bank GraphQL API",
			schema: POSTMAN_COLLECTION_SCHEMA,
			description: "Collection para chamadas GraphQL do backend (/graphql).",
		},
		item: [
			{
				name: "Queries",
				item: schemaItems.queries,
			},
			{
				name: "Mutations",
				item: schemaItems.mutations,
			},
		],
		variable: [{ key: "baseUrl", value: baseUrl }],
	};
}
