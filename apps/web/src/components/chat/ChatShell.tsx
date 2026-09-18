"use client";

import { useEffect, useState } from "react";
import { useAgentStream } from "@/hooks/useAgentStream";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";

export function ChatShell() {
  const { messages, streaming, sendMessage } = useAgentStream();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("solane-theme");
    if (saved === "light") setTheme("light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("solane-theme", next);
  };

  return (
    <div className="stage">
      <header className="topbar">
        <div>
          <div className="brand">SOLANE</div>
          <div className="brand-sub">Concierge · MARGOT</div>
        </div>
        <button className="pillbtn" onClick={toggleTheme}>
          {theme === "dark" ? "Daylight" : "Night"}
        </button>
      </header>
      <div className="frame">
        <div className="statusbar">
          <div className="flex items-center gap-2">
            <span className="livedot" />
            <span className="status-label">Margot · Live</span>
          </div>
          <span className="status-label">Booth 4</span>
        </div>
        <div className="scroll">
          <MessageList messages={messages} streaming={streaming} />
        </div>
        <Composer onSend={sendMessage} streaming={streaming} showChips={messages.length === 0} />
      </div>
    </div>
  );
}
