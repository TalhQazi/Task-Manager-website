import { Loader2, Inbox } from "lucide-react";

export function ViewLoading() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading tasks…
    </div>
  );
}

export function ViewEmpty({ label = "No tasks match your filters." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Inbox className="h-10 w-10 mb-2 opacity-40" />
      <p>{label}</p>
    </div>
  );
}

const DAY = 24 * 60 * 60 * 1000;
export function dueLabel(due?: string | null): { text: string; className: string } {
  if (!due) return { text: "No due date", className: "text-muted-foreground" };
  const d = new Date(due);
  const diff = Math.ceil((d.getTime() - Date.now()) / DAY);
  const text = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (diff < 0) return { text: `${text} · overdue`, className: "text-red-500" };
  if (diff === 0) return { text: `${text} · today`, className: "text-amber-500" };
  if (diff <= 2) return { text: `${text} · soon`, className: "text-amber-500" };
  return { text, className: "text-muted-foreground" };
}

export function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
