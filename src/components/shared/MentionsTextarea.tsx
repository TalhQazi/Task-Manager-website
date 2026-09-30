import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface MentionUser {
  name: string;
  avatarUrl?: string;
  role?: string;
}

/**
 * Textarea with an @-mention picker. Typing "@" (optionally followed by a
 * partial name) opens a dropdown of users above the input; ↑/↓ navigate,
 * Enter/Tab insert "@Full Name ", Escape closes. Enter without an open
 * dropdown calls onSubmit (send-on-enter), Shift+Enter inserts a newline.
 */
const MentionsTextarea = forwardRef<HTMLTextAreaElement, {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  users: MentionUser[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}>(function MentionsTextarea({ value, onChange, onSubmit, users, placeholder, className, disabled }, ref) {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

  const [query, setQuery] = useState<string | null>(null); // null = dropdown closed
  const [anchorIndex, setAnchorIndex] = useState(0); // position of "@" in the text
  const [highlight, setHighlight] = useState(0);

  const matches = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return users
      .filter((u) => !q || u.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, users]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  // Look backwards from the caret for an active "@query" token.
  const detectMention = (text: string, caret: number) => {
    const before = text.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at === -1) return close();
    // "@" must be at the start or preceded by whitespace
    if (at > 0 && !/\s/.test(before[at - 1])) return close();
    const token = before.slice(at + 1);
    // Allow letters, digits, dots, dashes and single spaces while typing a name
    if (token.length > 40 || /[\n\t]/.test(token) || /\s{2,}$/.test(token)) return close();
    setAnchorIndex(at);
    setQuery(token);
  };

  const close = () => setQuery(null);

  const insertMention = (user: MentionUser) => {
    const el = innerRef.current;
    const caret = el ? el.selectionStart : value.length;
    const next = `${value.slice(0, anchorIndex)}@${user.name} ${value.slice(caret)}`;
    onChange(next);
    close();
    // Restore focus and place the caret right after the inserted mention
    requestAnimationFrame(() => {
      if (!el) return;
      const pos = anchorIndex + user.name.length + 2;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (query !== null && matches.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(matches[highlight]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div className="relative flex-1 min-w-0">
      {query !== null && matches.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 z-50 w-64 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg py-1">
          {matches.map((u, idx) => (
            <button
              key={u.name}
              type="button"
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm",
                idx === highlight ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}
              onMouseEnter={() => setHighlight(idx)}
              // onMouseDown so the textarea doesn't lose focus before insertion
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(u);
              }}
            >
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt={u.name} className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
              ) : (
                <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </span>
              )}
              <span className="truncate font-medium">{u.name}</span>
              {u.role && <span className="ml-auto text-[10px] text-muted-foreground capitalize flex-shrink-0">{u.role}</span>}
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={innerRef}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onChange={(e) => {
          onChange(e.target.value);
          detectMention(e.target.value, e.target.selectionStart);
        }}
        onKeyDown={handleKeyDown}
        onClick={(e) => detectMention(value, (e.target as HTMLTextAreaElement).selectionStart)}
        onBlur={() => setTimeout(close, 150)}
      />
    </div>
  );
});

export default MentionsTextarea;
