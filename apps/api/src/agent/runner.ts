import { Agent, Runner, type AgentInputItem } from "@openai/agents";
import type { PrismaClient } from "@prisma/client";
import type { FastifyBaseLogger } from "fastify";
import { env } from "../env.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { buildTools, type Emit } from "./tools.js";
import { loadHistory, saveHistory, sessionContextItem } from "./history.js";

const runner = new Runner({ tracingDisabled: true, workflowName: "solane-concierge" });

export async function runAgentTurn({
  prisma,
  sessionId,
  userMessage,
  emit,
  log,
  signal,
}: {
  prisma: PrismaClient;
  sessionId: string;
  userMessage: string;
  emit: Emit;
  log: FastifyBaseLogger;
  signal: AbortSignal;
}) {
  const history = await loadHistory(prisma, sessionId);
  const items: AgentInputItem[] = history.length > 0 ? history : [sessionContextItem()];
  items.push({ role: "user", content: userMessage });

  const agent = new Agent({
    name: "MARGOT",
    model: env.OPENAI_MODEL,
    instructions: SYSTEM_PROMPT,
    tools: buildTools({ prisma, emit }),
  });

  const result = await runner.run(agent, items, { stream: true, maxTurns: 8, signal });

  for await (const event of result) {
    if (event.type === "raw_model_stream_event" && event.data.type === "output_text_delta") {
      emit({ type: "text_delta", text: event.data.delta });
    }
  }
  await result.completed;

  for (const response of result.rawResponses) {
    log.info(
      {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        inputTokensDetails: response.usage.inputTokensDetails,
      },
      "model turn usage"
    );
  }

  await saveHistory(prisma, sessionId, result.history);
}
