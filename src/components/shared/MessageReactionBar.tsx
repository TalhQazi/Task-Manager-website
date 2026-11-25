import React, { useEffect, useRef, useState } from "react";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MessageReaction {
  emoji: string;
  username: string;
}

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/**
 * Reaction chips shown under a chat bubble plus a quick-reaction picker.
 * Clicking a chip or a picker emoji toggles the current user's reaction.
 */
export default function MessageReactionBar({
  reactions,
  currentUser,
  isMe,
  onToggle,
}: {
  reactions: MessageReaction[];
  currentUser: string;
  isMe: boolean;
  onToggle: (emoji: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const close = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [pickerOpen]);

  const grouped = new Map<string, string[]>();
  for (const r of reactions || []) {
    if (!grouped.has(r.emoji)) grouped.set(r.emoji, []);
    grouped.get(r.emoji)!.push(r.username);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
      {[...grouped.entries()].map(([emoji, users]) => {
        const mine = users.includes(currentUser);
        return (
          <button
            key={emoji}
            type="button"
            title={users.join(", ")}
            onClick={() => onToggle(emoji)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
              mine
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/60 text-foreground hover:bg-muted"
            )}
          >
            <span>{emoji}</span>
            {users.length > 1 && <span className="font-semibold">{users.length}</span>}
          </button>
        );
      })}

      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          title="Add reaction"
          onClick={() => setPickerOpen((v) => !v)}
          className="flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>
        {pickerOpen && (
          <div
            className={cn(
              "absolute bottom-full mb-1 z-50 flex gap-0.5 rounded-full border border-border bg-popover px-1.5 py-1 shadow-lg",
              isMe ? "right-0" : "left-0"
            )}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="text-base leading-none rounded-full p-1 hover:bg-muted hover:scale-125 transition-transform"
                onClick={() => {
                  onToggle(emoji);
                  setPickerOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
