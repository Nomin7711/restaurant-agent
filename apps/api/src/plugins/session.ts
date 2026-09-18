import cookie from "@fastify/cookie";
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyRequest {
    sessionId: string;
  }
}

export default fp(async (app: FastifyInstance) => {
  await app.register(cookie);
  app.decorateRequest("sessionId", "");
  app.addHook("onRequest", async (request, reply) => {
    let sid = request.cookies.sid;
    if (!sid) {
      sid = randomUUID();
      reply.setCookie("sid", sid, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    request.sessionId = sid;
  });
});
