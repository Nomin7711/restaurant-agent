import type { FastifyInstance } from "fastify";
import { chatRequestSchema, type SseEvent } from "@solane/shared";
import { runAgentTurn } from "../agent/runner.js";

export default async function chatRoutes(app: FastifyInstance) {
  app.post("/api/chat", async (request, reply) => {
    const parsed = chatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "message must be a non-empty string (max 2000 chars)" });
    }

    reply.raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    reply.raw.write(":ok\n\n");
    reply.hijack();

    const emit = (event: SseEvent) => {
      reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    };
    const heartbeat = setInterval(() => reply.raw.write(":hb\n\n"), 15_000);
    const abort = new AbortController();
    reply.raw.on("close", () => {
      if (!reply.raw.writableEnded) abort.abort();
    });

    try {
      await runAgentTurn({
        prisma: app.prisma,
        sessionId: request.sessionId,
        userMessage: parsed.data.message,
        emit,
        log: request.log,
        signal: abort.signal,
      });
      emit({ type: "done" });
    } catch (err) {
      request.log.error(err, "agent turn failed");
      if (!abort.signal.aborted) {
        emit({ type: "error", message: "Something went wrong in the kitchen. Try again." });
      }
    } finally {
      clearInterval(heartbeat);
      reply.raw.end();
    }
  });
}
