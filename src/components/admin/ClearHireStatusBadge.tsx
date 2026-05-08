/**
 * ClearHire® Status Badge Component
 * ──────────────────────────────────
 * Displays a color-coded badge for the ClearHire screening status.
 *   GREEN  → 🟢 Verified   (green)
 *   YELLOW → 🟡 Review     (amber)
 *   RED    → 🔴 Blocked    (red)
 *   PENDING→ ⏳ Checking... (gray with pulse)
 */

import { Badge } from "@/components/admin/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldX, Loader2 } from "lucide-react";

export type ClearHireStatusType = "GREEN" | "YELLOW" | "RED" | "PENDING" | null | undefined;

interface ClearHireStatusBadgeProps {
  status: ClearHireStatusType;
  size?: "sm" | "md";
  showIcon?: boolean;
  showLabel?: boolean;
}

const config: Record<
  string,
  { label: string; className: string; icon: typeof ShieldCheck }
> = {
  GREEN: {
    label: "Verified",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: ShieldCheck,
  },
  YELLOW: {
    label: "Review",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: ShieldAlert,
  },
  RED: {
    label: "Blocked",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: ShieldX,
  },
  PENDING: {
    label: "Checking...",
    className: "bg-gray-100 text-gray-500 border-gray-200 animate-pulse",
    icon: Loader2,
  },
};

export default function ClearHireStatusBadge({
  status,
  size = "sm",
  showIcon = true,
  showLabel = true,
}: ClearHireStatusBadgeProps) {
  if (!status) return null;

  const c = config[status];
  if (!c) return null;

  const Icon = c.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <Badge
      variant="outline"
      className={`${c.className} ${textSize} gap-1 font-medium border`}
    >
      {showIcon && (
        <Icon
          className={`${iconSize} ${status === "PENDING" ? "animate-spin" : ""}`}
        />
      )}
      {showLabel && c.label}
    </Badge>
  );
}
