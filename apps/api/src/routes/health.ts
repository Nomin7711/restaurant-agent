import type { FastifyInstance } from "fastify";

export default async function healthRoutes(app: FastifyInstance) {
  app.get("/healthz", async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { db: "ok" };
  });
}
