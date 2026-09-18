import { z } from "zod";
import { uiBlockSchema } from "./ui-blocks";

export const sseEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text_delta"), text: z.string() }),
  z.object({ type: z.literal("ui_block"), block: uiBlockSchema }),
  z.object({ type: z.literal("done") }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export type SseEvent = z.infer<typeof sseEventSchema>;
