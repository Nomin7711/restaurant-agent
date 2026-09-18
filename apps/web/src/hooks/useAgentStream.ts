"use client";

import { useCallback, useRef, useState } from "react";
import { sseEventSchema, type UIBlock } from "@solane/shared";

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "block"; block: UIBlock }
  | { kind: "error"; message: string };

export type ChatMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; segments: Segment[] };

export function useAgentStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const appendToAssistant = useCallback((update: (segments: Segment[]) => Segment[]) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") {
        return [...prev, { role: "assistant", segments: update([]) }];
      }
      return [...prev.slice(0, -1), { role: "assistant", segments: update(last.segments) }];
    });
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || streaming) return;

      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
      setStreaming(true);
      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
          signal: abort.signal,
        });
        if (!res.ok || !res.body) throw new Error(`chat request failed: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          const frames = buf.split("\n\n");
          buf = frames.pop() ?? "";

          for (const frame of frames) {
            const dataLines = frame
              .split("\n")
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trim());
            if (dataLines.length === 0) continue;

            let raw: unknown;
            try {
              raw = JSON.parse(dataLines.join(""));
            } catch {
              continue;
            }
            const parsed = sseEventSchema.safeParse(raw);
            if (!parsed.success) continue;
            const event = parsed.data;

            if (event.type === "text_delta") {
              appendToAssistant((segments) => {
                const last = segments[segments.length - 1];
                if (last?.kind === "text") {
                  return [...segments.slice(0, -1), { kind: "text", text: last.text + event.text }];
                }
                return [...segments, { kind: "text", text: event.text }];
              });
            } else if (event.type === "ui_block") {
              appendToAssistant((segments) => [...segments, { kind: "block", block: event.block }]);
            } else if (event.type === "error") {
              appendToAssistant((segments) => [...segments, { kind: "error", message: event.message }]);
            }
          }
        }
      } catch (err) {
        if (!abort.signal.aborted) {
          appendToAssistant((segments) => [
            ...segments,
            { kind: "error", message: "Lost the connection to the kitchen. Try again." },
          ]);
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, appendToAssistant]
  );

  const abort = useCallback(() => abortRef.current?.abort(), []);

  return { messages, streaming, sendMessage, abort };
}
