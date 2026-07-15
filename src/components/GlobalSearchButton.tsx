import { useState } from "react";
import { Search } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";

interface GlobalSearchButtonProps {
  /** true => employee search index (pages + own tasks); false => admin/manager index. */
  isEmployee?: boolean;
  /** Styling for the trigger button so it matches the surrounding toolbar icons. */
  className?: string;
  /** Styling for the search icon. */
  iconClassName?: string;
  title?: string;
  /** Optional extra node rendered inside the button (e.g. a metallic overlay). */
  children?: React.ReactNode;
}

/**
 * Self-contained Global Search trigger: renders the search icon button and owns
 * the open/close state for the GlobalSearch modal. Drop it next to the logout
 * icon in any panel header (admin, manager, employee) — no state plumbing needed.
 */
export function GlobalSearchButton({
  isEmployee = false,
  className,
  iconClassName = "h-5 w-5",
  title = "Search",
  children,
}: GlobalSearchButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} title={title}>
        {children}
        <Search className={iconClassName} />
      </button>
      <GlobalSearch open={open} onOpenChange={setOpen} isEmployee={isEmployee} />
    </>
  );
}
