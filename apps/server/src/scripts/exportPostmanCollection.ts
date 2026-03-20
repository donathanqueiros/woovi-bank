import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
	DEFAULT_POSTMAN_BASE_URL,
	createPostmanCollection,
} from "./postmanCollection";

const DEFAULT_OUTPUT_PATH = "postman/subli-bank-graphql.collection.json";

export async function exportPostmanCollection(
	outputPath = DEFAULT_OUTPUT_PATH,
	baseUrl = process.env.POSTMAN_BASE_URL ?? DEFAULT_POSTMAN_BASE_URL,
): Promise<string> {
	const resolvedOutputPath = resolve(process.cwd(), outputPath);
	const collection = createPostmanCollection(baseUrl);

	await mkdir(dirname(resolvedOutputPath), { recursive: true });
	await writeFile(
		resolvedOutputPath,
		`${JSON.stringify(collection, null, 2)}\n`,
		"utf8",
	);

	return resolvedOutputPath;
}

export async function main(): Promise<void> {
	const outputPathArg = process.argv[2] ?? DEFAULT_OUTPUT_PATH;
	const baseUrlArg = process.argv[3] ?? process.env.POSTMAN_BASE_URL;
	const outputPath = await exportPostmanCollection(outputPathArg, baseUrlArg);
	console.log(`Postman collection exported to ${outputPath}`);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	main().catch((error: unknown) => {
		console.error("Failed to export Postman collection", error);
		process.exitCode = 1;
	});
}
