"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/hooks/useAgentStream";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { TypingIndicator } from "./TypingIndicator";

export function MessageList({ messages, streaming }: { messages: ChatMessage[]; streaming: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  return (
    <div className="flex flex-col gap-5 px-[22px]">
      {messages.length === 0 && (
        <div className="rise pt-2">
          <div className="kicker mb-3">Margot · Late bistro</div>
          <h1 className="hero">
            Kitchen&apos;s hot.
            <br />
            What are you in the mood for?
          </h1>
          <p className="sub">
            Ask about the menu, the chef, what&apos;s good for a first visit — or just tell me your vibe.
          </p>
        </div>
      )}
      {messages.map((message, i) =>
        message.role === "user" ? (
          <div key={i} className="flex justify-end rise">
            <div className="bubble">{message.text}</div>
          </div>
        ) : (
          <div key={i} className="flex flex-col gap-4 rise">
            <div className="kicker">Concierge</div>
            {message.segments.map((segment, j) => {
              if (segment.kind === "text") {
                return (
                  <p key={j} className="concierge-line m-0">
                    {segment.text}
                  </p>
                );
              }
              if (segment.kind === "block") {
                return <BlockRenderer key={j} block={segment.block} />;
              }
              return (
                <div key={j} className="warnrow !m-0 rounded-[14px] border border-neon">
                  <span className="warn-dot" />
                  <span className="warn-text">{segment.message}</span>
                </div>
              );
            })}
          </div>
        )
      )}
      {streaming && (
        <div className="px-1">
          <TypingIndicator />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
