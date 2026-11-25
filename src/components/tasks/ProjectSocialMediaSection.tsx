import { useState } from "react";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { Checkbox } from "@/components/admin/ui/checkbox";
import { Input } from "@/components/admin/ui/input";
import { Share2, ExternalLink } from "lucide-react";

export const PROJECT_SOCIAL_PLATFORMS = [
  "YouTube",
  "Facebook",
  "X",
  "Liberty Social",
  "Rumble",
  "Tik Tok",
  "Instagram",
  "Threads",
] as const;

export type ProjectSocialPlatform = (typeof PROJECT_SOCIAL_PLATFORMS)[number];

export interface ProjectSocialMediaItem {
  platform: string;
  enabled?: boolean;
  handle?: string;
  url?: string;
}

interface ProjectSocialMediaSectionProps {
  value: ProjectSocialMediaItem[];
  onChange: (next: ProjectSocialMediaItem[]) => void;
}

export function ProjectSocialMediaSection({ value, onChange }: ProjectSocialMediaSectionProps) {
  const [expandedDetails, setExpandedDetails] = useState(false);

  const selectedMap = new Map<string, ProjectSocialMediaItem>();
  (value || []).forEach((item) => {
    const key = String(item?.platform || "").trim().toLowerCase();
    if (key && item.enabled !== false) {
      selectedMap.set(key, item);
    }
  });

  const togglePlatform = (platform: string, checked: boolean) => {
    const key = platform.toLowerCase();
    const rest = (value || []).filter((item) => String(item.platform || "").trim().toLowerCase() !== key);
    if (checked) {
      const existing = selectedMap.get(key);
      onChange([
        ...rest,
        {
          platform,
          enabled: true,
          handle: existing?.handle || "",
          url: existing?.url || "",
        },
      ]);
    } else {
      onChange(rest);
    }
  };

  const updateField = (platform: string, field: "handle" | "url", fieldValue: string) => {
    const key = platform.toLowerCase();
    onChange(
      (value || []).map((item) =>
        String(item.platform || "").trim().toLowerCase() === key
          ? { ...item, [field]: fieldValue }
          : item
      )
    );
  };

  const selectedCount = selectedMap.size;

  return (
    <div className="sm:col-span-2 space-y-2 rounded-lg border border-border/80 bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Share2 className="h-4 w-4 text-primary" />
          Social Media
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {selectedCount} selected
            </Badge>
          )}
        </label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() =>
              onChange(
                PROJECT_SOCIAL_PLATFORMS.map((platform) => {
                  const existing = selectedMap.get(platform.toLowerCase());
                  return {
                    platform,
                    enabled: true,
                    handle: existing?.handle || "",
                    url: existing?.url || "",
                  };
                })
              )
            }
          >
            Select All
          </Button>
          {selectedCount > 0 && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setExpandedDetails((prev) => !prev)}
              >
                {expandedDetails ? "Hide Handles/URLs" : "Add Handles/URLs"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => onChange([])}
              >
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PROJECT_SOCIAL_PLATFORMS.map((platform) => {
          const entry = selectedMap.get(platform.toLowerCase());
          const isChecked = Boolean(entry);
          return (
            <label
              key={platform}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
                isChecked
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border bg-background/80 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => togglePlatform(platform, checked === true)}
              />
              <span className="truncate">{platform}</span>
            </label>
          );
        })}
      </div>

      {expandedDetails && selectedCount > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/60">
          {PROJECT_SOCIAL_PLATFORMS.filter((p) => selectedMap.has(p.toLowerCase())).map((platform) => {
            const entry = selectedMap.get(platform.toLowerCase())!;
            return (
              <div key={platform} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                <span className="text-xs font-semibold sm:col-span-1 truncate">{platform}</span>
                <Input
                  placeholder="@handle"
                  value={entry.handle || ""}
                  onChange={(e) => updateField(platform, "handle", e.target.value)}
                  className="h-8 text-xs sm:col-span-2"
                />
                <Input
                  placeholder="https://..."
                  value={entry.url || ""}
                  onChange={(e) => updateField(platform, "url", e.target.value)}
                  className="h-8 text-xs sm:col-span-2"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProjectSocialMediaBadges({
  socialMedia,
  compact = false,
}: {
  socialMedia?: ProjectSocialMediaItem[];
  compact?: boolean;
}) {
  const active = (socialMedia || []).filter((item) => item?.platform && item.enabled !== false);
  if (active.length === 0) return null;

  const visible = compact ? active.slice(0, 4) : active;
  const remaining = compact ? active.length - visible.length : 0;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((item) => {
        const label = item.handle ? `${item.platform} (${item.handle})` : item.platform;
        if (!compact && item.url) {
          return (
            <a
              key={item.platform}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20"
            >
              <span>{label}</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          );
        }
        return (
          <Badge
            key={item.platform}
            variant="outline"
            className="text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/25 px-1.5 py-0"
          >
            {label}
          </Badge>
        );
      })}
      {remaining > 0 && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
          +{remaining} social
        </Badge>
      )}
    </div>
  );
}
