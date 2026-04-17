import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/manger/ui/dialog";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Textarea } from "@/components/manger/ui/textarea";
import { Trophy } from "lucide-react";

interface RewardEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: (rewardData: {
    rewardType: "points" | "bonus" | "recognition";
    rewardPoints: number;
    message: string;
    note: string;
  }) => void;
  taskTitle: string;
}

export function RewardEmployeeModal({
  isOpen,
  onClose,
  onReward,
  taskTitle,
}: RewardEmployeeModalProps) {
  const [rewardType, setRewardType] = useState<"points" | "bonus" | "recognition">("recognition");
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [message, setMessage] = useState("Well Done!");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onReward({
        rewardType,
        rewardPoints: Number.isFinite(rewardPoints) ? rewardPoints : 0,
        message,
        note,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-[20px] border-none shadow-xl bg-white">
        <div className="p-6">
          <DialogHeader className="space-y-1 relative">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#3b82f6]" strokeWidth={2.5} />
              <DialogTitle className="text-lg font-bold text-[#1e293b]">
                Reward Employee
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 text-[14px] leading-relaxed">
              Give recognition to the employee for completing{" "}
              <span className="text-slate-600 font-medium">"{taskTitle}"</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-5">
            <div className="space-y-2.5">
              <label className="text-[14px] font-semibold text-[#1e293b]">Reward Type</label>
              <select
                value={rewardType}
                onChange={(e) => setRewardType(e.target.value as "points" | "bonus" | "recognition")}
                className="w-full bg-[#f8fafc] border border-slate-100 rounded-xl h-11 text-[14px] font-medium px-4 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              >
                <option value="recognition">Recognition</option>
                <option value="points">Points</option>
                <option value="bonus">Bonus</option>
              </select>
            </div>

            <div className="space-y-2.5">
              <label className="text-[14px] font-semibold text-[#1e293b]">Reward Points</label>
              <Input
                type="number"
                min={0}
                value={rewardPoints}
                onChange={(e) => setRewardPoints(Number(e.target.value || 0))}
                placeholder="0"
                className="bg-[#f8fafc] border-slate-100 rounded-xl h-11 text-[14px] font-medium px-4 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-[14px] font-semibold text-[#1e293b]">
                Recognition Message
              </label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Well Done!"
                className="bg-[#f8fafc] border-slate-100 rounded-xl h-11 text-[14px] font-medium px-4 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-[14px] font-semibold text-[#1e293b]">
                Optional Note
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add optional note for this reward..."
                className="bg-[#f8fafc] border-slate-100 rounded-xl min-h-[100px] text-[14px] font-medium p-4 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-0 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2.5 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 h-10 rounded-xl text-slate-600 font-medium border-slate-100 hover:bg-slate-50 bg-[#f8fafc]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 h-10 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium transition-all shadow-sm"
            >
              {isSubmitting ? "Granting..." : "Grant Reward"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
