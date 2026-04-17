import { useTaskBlasterContext } from "@/contexts/TaskBlasterContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Volume2, Play, Zap, Target } from "lucide-react";

export function TaskBlasterSettings() {
  const { settings, updateSettings } = useTaskBlasterContext();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>Task Blaster</CardTitle>
        </div>
        <CardDescription>
          Customize your task completion celebration animations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="blaster-enabled" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Enable Task Blaster
            </Label>
            <p className="text-xs text-muted-foreground">
              Show celebration animations when completing tasks
            </p>
          </div>
          <Switch
            id="blaster-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSettings({ enabled: checked })}
          />
        </div>

        {settings.enabled && (
          <div className="space-y-4 pt-2 border-t">
            {/* Sound Setting */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="blaster-sound" className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Enable Sound
                </Label>
                <p className="text-xs text-muted-foreground">
                  Play sound effect on task completion
                </p>
              </div>
              <Switch
                id="blaster-sound"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
              />
            </div>

            {/* Animation Setting */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="blaster-animation" className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Enable Animation
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show floating target animation
                </p>
              </div>
              <Switch
                id="blaster-animation"
                checked={settings.animationEnabled}
                onCheckedChange={(checked) => updateSettings({ animationEnabled: checked })}
              />
            </div>

            {/* Auto Mode Setting */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="blaster-auto" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Auto-pop Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically dismiss animation without clicking
                </p>
              </div>
              <Switch
                id="blaster-auto"
                checked={settings.autoMode}
                onCheckedChange={(checked) => updateSettings({ autoMode: checked })}
              />
            </div>

            {/* Priority Only Setting */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="blaster-priority" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Priority Tasks Only
                </Label>
                <p className="text-xs text-muted-foreground">
                  Only show for high/top priority tasks and streaks
                </p>
              </div>
              <Switch
                id="blaster-priority"
                checked={settings.priorityOnly}
                onCheckedChange={(checked) => updateSettings({ priorityOnly: checked })}
              />
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Task Blaster triggers for:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Top Priority & Red Priority tasks</li>
            <li>High Priority tasks</li>
            <li>Streak milestones (3rd, 5th, 10th task)</li>
          </ul>
          <p className="mt-2 text-[10px]">
            Maximum 1 animation per 20 seconds
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
