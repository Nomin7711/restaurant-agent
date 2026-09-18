import Fastify from "fastify";
import prismaPlugin from "./plugins/prisma.js";
import sessionPlugin from "./plugins/session.js";
import healthRoutes from "./routes/health.js";
import chatRoutes from "./routes/chat.js";

export async function buildApp() {
  const app = Fastify({
    logger: { level: "info" },
    requestTimeout: 0,
  });

  await app.register(prismaPlugin);
  await app.register(sessionPlugin);
  await app.register(healthRoutes);
  await app.register(chatRoutes);

  return app;
}
