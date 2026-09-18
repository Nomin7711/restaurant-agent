import path from "node:path";
import { defineConfig } from "prisma/config";

process.loadEnvFile(path.join(import.meta.dirname, "../../.env"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
