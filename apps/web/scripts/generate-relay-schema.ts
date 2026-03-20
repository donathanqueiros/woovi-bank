import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GraphQLSchema, printSchema } from "graphql";
import * as serverSchemaModule from "../../server/src/schema/schema";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(currentDir, "../schema.graphql");
const schemaExport = (
  "schema" in serverSchemaModule
    ? serverSchemaModule.schema
    : "default" in serverSchemaModule &&
        serverSchemaModule.default &&
        typeof serverSchemaModule.default === "object" &&
        "schema" in serverSchemaModule.default
      ? serverSchemaModule.default.schema
      : serverSchemaModule.default
) as GraphQLSchema | undefined;

async function main() {
  if (!schemaExport) {
    throw new Error("Schema GraphQL nao encontrado no modulo do server");
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${printSchema(schemaExport)}\n`, "utf8");

  console.log(`Relay schema gerado em: ${outputPath}`);
}

main().catch((error) => {
  console.error("Falha ao gerar schema Relay:", error);
  process.exit(1);
});
