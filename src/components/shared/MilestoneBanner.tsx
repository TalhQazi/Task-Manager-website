import React, { useState } from "react";
import { PartyPopper, X, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import MilestoneBadge from "./MilestoneBadge";

interface MilestoneItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  milestoneLevel: string;
  milestoneLabel: string;
  triggeredAt: string;
  acknowledged: boolean;
}

interface MilestoneBannerProps {
  milestones: MilestoneItem[];
  onSendMessage?: (employeeId: string, message: string) => void;
}

const quickMessages = [
  "Congrats on your milestone 🎉",
  "Great work — glad you're here!",
  "Amazing achievement!",
];

export default function MilestoneBanner({ milestones, onSendMessage }: MilestoneBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");

  if (dismissed || milestones.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4 mb-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="bg-purple-500/20 rounded-full p-2">
            <PartyPopper className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm sm:text-base text-purple-100 mb-1">
              🎉 Work Anniversaries Today
            </h3>
            <div className="space-y-2">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between gap-2 bg-black/20 rounded-lg p-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-100">{milestone.employeeName}</span>
                    <MilestoneBadge level={milestone.milestoneLevel} label={milestone.milestoneLabel} size="sm" />
                  </div>
                  {!selectedMessage && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20"
                      onClick={() => setSelectedMessage(milestone.employeeId)}
                    >
                      <MessageCircle className="w-3 h-3" />
                      Congratulate
                    </Button>
                  )}
                  {selectedMessage === milestone.employeeId && (
                    <div className="flex items-center gap-2">
                      {quickMessages.map((msg) => (
                        <Button
                          key={msg}
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-100"
                          onClick={() => {
                            onSendMessage?.(milestone.employeeId, msg);
                            setSelectedMessage(null);
                          }}
                        >
                          {msg}
                        </Button>
                      ))}
                      <input
                        type="text"
                        placeholder="Custom message..."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className="h-7 text-xs bg-black/30 border border-purple-500/30 rounded px-2 w-32"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customMessage.trim()) {
                            onSendMessage?.(milestone.employeeId, customMessage);
                            setCustomMessage("");
                            setSelectedMessage(null);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-purple-500 hover:bg-purple-600"
                        onClick={() => {
                          if (customMessage.trim()) {
                            onSendMessage?.(milestone.employeeId, customMessage);
                            setCustomMessage("");
                            setSelectedMessage(null);
                          }
                        }}
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/10"
          onClick={() => setDismissed(true)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
