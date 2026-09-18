import type { PrismaClient } from "@prisma/client";
import type { AgentInputItem } from "@openai/agents";

export const MAX_HISTORY_ITEMS = 120;

// First item of every session — persisted so the prompt prefix stays byte-stable.
export function sessionContextItem(): AgentInputItem {
  return {
    role: "user",
    content: "<session_context>Anonymous guest on the in-app concierge. Identity and saved preferences arrive in a later release.</session_context>",
  };
}

export async function loadHistory(prisma: PrismaClient, sessionId: string): Promise<AgentInputItem[]> {
  const turns = await prisma.conversationTurn.findMany({
    where: { sessionId },
    orderBy: { index: "asc" },
  });
  return turns.map((t) => t.content as unknown as AgentInputItem);
}

export async function saveHistory(prisma: PrismaClient, sessionId: string, items: AgentInputItem[]) {
  const capped = items.slice(-MAX_HISTORY_ITEMS);
  await prisma.$transaction([
    prisma.conversationTurn.deleteMany({ where: { sessionId } }),
    prisma.conversationTurn.createMany({
      data: capped.map((item, index) => ({
        sessionId,
        index,
        role: "role" in item && item.role === "user" ? "USER" : "ASSISTANT",
        content: item as object,
      })),
    }),
  ]);
}
