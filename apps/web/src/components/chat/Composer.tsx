"use client";

import { useState } from "react";

const QUICK_CHIPS = ["I'm new here", "Show me the pastas", "Something light"];

export function Composer({
  onSend,
  streaming,
  showChips,
}: {
  onSend: (message: string) => void;
  streaming: boolean;
  showChips: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || streaming) return;
    onSend(value);
    setValue("");
  };

  return (
    <div className="flex flex-col">
      {showChips && (
        <div className="chips px-[16px] pb-3">
          {QUICK_CHIPS.map((chip) => (
            <button key={chip} className="chip" onClick={() => onSend(chip)} disabled={streaming}>
              {chip}
            </button>
          ))}
        </div>
      )}
      <div className="composer">
        <input
          className="composer-input"
          placeholder="Ask MARGOT anything…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button className="composer-send" onClick={submit} disabled={streaming || !value.trim()} aria-label="Send">
          ↑
        </button>
      </div>
    </div>
  );
}
