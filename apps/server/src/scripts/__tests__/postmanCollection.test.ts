import { createPostmanCollection } from "../postmanCollection";

describe("createPostmanCollection", () => {
	it("builds a Postman v2.1 collection targeting the GraphQL endpoint", () => {
		const collection = createPostmanCollection("http://localhost:4000");

		expect(collection.info.name).toBe("Subli Bank GraphQL API");
		expect(collection.info.schema).toBe(
			"https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		);
		expect(collection.item.length).toBe(2);

		const groupNames = collection.item.map((item) => item.name);
		expect(groupNames).toContain("Queries");
		expect(groupNames).toContain("Mutations");

		const queriesGroup = collection.item.find((item) => item.name === "Queries");
		const mutationsGroup = collection.item.find(
			(item) => item.name === "Mutations",
		);

		expect(queriesGroup).toBeDefined();
		expect(mutationsGroup).toBeDefined();

		if (!queriesGroup || !mutationsGroup) {
			throw new Error("Expected Queries and Mutations groups");
		}

		expect(queriesGroup.item.length).toBeGreaterThan(4);
		expect(mutationsGroup.item.length).toBeGreaterThan(4);

		const queryNames = queriesGroup.item.map((item) => item.name);
		expect(queryNames).toContain("Query - accounts");
		expect(queryNames).toContain("Query - transactions");

		const mutationNames = mutationsGroup.item.map((item) => item.name);
		expect(mutationNames).toContain("Mutation - Transfer");

		const accountsQuery = queriesGroup.item.find(
			(item) => item.name === "Query - accounts",
		);
		expect(accountsQuery?.request.url.raw).toBe("{{baseUrl}}/graphql");
		expect(accountsQuery?.request.body.raw).toContain("query accounts");
		expect(collection.variable).toContainEqual({
			key: "baseUrl",
			value: "http://localhost:4000",
		});
	});
});
