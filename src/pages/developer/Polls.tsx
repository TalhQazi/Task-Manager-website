import React, { useState, useEffect } from "react";
import { 
  getPollsData, 
  savePollsStore, 
  type Poll, 
  type PollVote, 
  type PollComment, 
  type PollAuditLog 
} from "@/lib/pollsStore";
import { 
  Database, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  Clock, 
  Terminal, 
  Bug,
  HelpCircle,
  FileJson
} from "lucide-react";
import { toast } from "sonner";

const MOCK_NAMES = [
  "Walter White", "Jesse Pinkman", "Skyler White", "Hank Schrader", "Marie Schrader",
  "Saul Goodman", "Mike Ehrmantraut", "Gus Fring", "Kim Wexler", "Howard Hamlin",
  "Chuck McGill", "Lalo Salamanca", "Nacho Varga", "Hector Salamanca", "Tuco Salamanca"
];

const MOCK_DEPTS = ["Engineering", "Design", "Marketing", "Sales", "Operations"];
const MOCK_LOCATIONS = ["New York Office", "Chicago Office", "Los Angeles Office", "Miami Office"];

const MOCK_POSITIVE_COMMENTS = [
  "This is a great idea! I fully support this schedule.",
  "Excellent proposal, it will be very helpful and improve productivity.",
  "Perfect timing, we definitely needed this adjustment.",
  "Awesome plan! Absolutely pleased with this solution."
];

const MOCK_NEGATIVE_COMMENTS = [
  "I disagree with this plan. It creates a difficult burden.",
  "Concerned about the costs and risks involved. Very concerned.",
  "oppose this decision. It feels unfair and unhelpful.",
  "Worry about the implementation schedule. It feels terrible."
];

export default function DeveloperPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [comments, setComments] = useState<PollComment[]>([]);
  const [auditLogs, setAuditLogs] = useState<PollAuditLog[]>([]);
  const [selectedPollId, setSelectedPollId] = useState<string>("");
  const [seedCount, setSeedCount] = useState<number>(20);
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(-24);

  const loadData = async () => {
    const data = await getPollsData();
    setPolls(data.polls);
    setVotes(data.votes);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("tm_polls_store_updated", loadData);
    return () => window.removeEventListener("tm_polls_store_updated", loadData);
  }, []);

  useEffect(() => {
    if (polls.length > 0 && !selectedPollId) {
      setSelectedPollId(polls[0].id);
    }
  }, [polls, selectedPollId]);

  const selectedPoll = polls.find(p => p.id === selectedPollId);

  // Clear all data and reset to seeds
  const handleResetData = () => {
    localStorage.removeItem("tm_polls_store_data");
    localStorage.removeItem("tm_polls_store_votes");
    localStorage.removeItem("tm_polls_store_comments");
    localStorage.removeItem("tm_polls_store_audit");
    loadData();
    toast.success("Polls store has been reset to default seed data.");
  };

  // Seed random votes on the selected poll
  const handleSeedVotes = () => {
    if (!selectedPoll) {
      toast.error("Please select a poll first.");
      return;
    }

    const currentVotes = [...votes];
    const currentComments = [...comments];
    const currentAudit = [...auditLogs];

    let seededVotesCount = 0;
    let seededCommentsCount = 0;

    for (let i = 0; i < seedCount; i++) {
      const randomUserId = `seed-user-${Math.random().toString(36).substr(2, 9)}`;
      const randomName = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)] + ` (Seed #${i + 1})`;
      const randomDept = MOCK_DEPTS[Math.floor(Math.random() * MOCK_DEPTS.length)];
      const randomLoc = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];

      // Check if user already voted
      if (currentVotes.some(v => v.pollId === selectedPoll.id && v.userId === randomUserId)) continue;

      let optionId: string | undefined = undefined;
      let ratingValue: number | undefined = undefined;
      let rankedOrder: string[] | undefined = undefined;

      // Calculate vote choices based on poll type
      if (selectedPoll.options && selectedPoll.options.length > 0) {
        if (selectedPoll.pollType === "RankedChoice") {
          // Shuffle options
          rankedOrder = [...selectedPoll.options].map(o => o.id).sort(() => Math.random() - 0.5);
        } else {
          // YesNo, MultipleChoice, DesignComparison, ImageVoting
          const randOpt = selectedPoll.options[Math.floor(Math.random() * selectedPoll.options.length)];
          optionId = randOpt.id;
        }
      }

      if (selectedPoll.pollType === "Rating10") {
        ratingValue = Math.floor(Math.random() * 6) + 5; // 5-10
      } else if (selectedPoll.pollType === "StarRating") {
        ratingValue = Math.floor(Math.random() * 3) + 3; // 3-5 stars
      }

      const voteRecord: PollVote = {
        id: `v-seed-${Math.random().toString(36).substr(2, 9)}`,
        pollId: selectedPoll.id,
        userId: randomUserId,
        userName: randomName,
        userDepartment: randomDept,
        userLocation: randomLoc,
        optionId,
        ratingValue,
        rankedOrder,
        votedAt: new Date().toISOString()
      };

      currentVotes.push(voteRecord);
      seededVotesCount++;

      // Seed occasional comment (30% chance)
      if (Math.random() < 0.3) {
        const isPositive = Math.random() > 0.4; // 60% positive bias
        const pool = isPositive ? MOCK_POSITIVE_COMMENTS : MOCK_NEGATIVE_COMMENTS;
        const text = pool[Math.floor(Math.random() * pool.length)];

        currentComments.push({
          id: `c-seed-${Math.random().toString(36).substr(2, 9)}`,
          pollId: selectedPoll.id,
          userId: randomUserId,
          userName: randomName,
          commentText: text,
          createdAt: new Date().toISOString()
        });
        seededCommentsCount++;
      }
    }

    currentAudit.unshift({
      id: `al-seed-${Math.random().toString(36).substr(2, 9)}`,
      pollId: selectedPoll.id,
      pollTitle: selectedPoll.title,
      action: `Seeded ${seededVotesCount} Mock Votes`,
      performedBy: "Developer Tool Suite",
      timestamp: new Date().toISOString()
    });

    savePollsStore(polls, currentVotes, currentComments, currentAudit);
    toast.success(`Seeded ${seededVotesCount} votes and ${seededCommentsCount} comments!`);
    loadData();
  };

  // Clear all votes on the selected poll
  const handleClearPollVotes = () => {
    if (!selectedPoll) return;
    const filteredVotes = votes.filter(v => v.pollId !== selectedPoll.id);
    const filteredComments = comments.filter(c => c.pollId !== selectedPoll.id);
    const updatedAudit = [
      {
        id: `al-dev-${Math.random().toString(36).substr(2, 9)}`,
        pollId: selectedPoll.id,
        pollTitle: selectedPoll.title,
        action: "Clear Votes & Comments",
        performedBy: "Developer Tool Suite",
        timestamp: new Date().toISOString()
      },
      ...auditLogs
    ];
    savePollsStore(polls, filteredVotes, filteredComments, updatedAudit);
    toast.info("Cleared all votes and comments for selected poll.");
    loadData();
  };

  // Shift Poll end-date to mock deadline expirations
  const handleOverrideDeadline = () => {
    if (!selectedPoll) return;
    const offsetMs = timeOffsetHours * 60 * 60 * 1000;
    const newEndTime = new Date(Date.now() + offsetMs).toISOString();

    const updatedPolls = polls.map(p => {
      if (p.id === selectedPoll.id) {
        return { 
          ...p, 
          endTime: newEndTime, 
          status: offsetMs < 0 ? "Closed" as const : p.status 
        };
      }
      return p;
    });

    const updatedAudit = [
      {
        id: `al-dev-${Math.random().toString(36).substr(2, 9)}`,
        pollId: selectedPoll.id,
        pollTitle: selectedPoll.title,
        action: `Override Deadline (Offset: ${timeOffsetHours}h)`,
        performedBy: "Developer Tool Suite",
        timestamp: new Date().toISOString()
      },
      ...auditLogs
    ];

    savePollsStore(updatedPolls, votes, comments, updatedAudit);
    toast.success(`Deadline shifted successfully! Expire status evaluated.`);
    loadData();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Dev Header */}
      <div className="bg-slate-900 border-2 border-indigo-500/20 rounded-xl p-5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/35 text-indigo-400">
            <Bug className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Developer Sandbox Suite <span className="text-[10px] bg-indigo-600/20 text-indigo-400 px-2 py-0.5 border border-indigo-500/30 rounded uppercase font-black tracking-widest">Local Mode</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1">Stress-test and simulate edge case voting conditions, AI charts, and schedules without backend deployments.</p>
          </div>
        </div>
        <button
          onClick={handleResetData}
          className="px-3.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/30 hover:border-red-500 text-xs font-bold text-red-200 rounded-lg flex items-center gap-1.5 transition-all"
        >
          <Trash2 className="h-4 w-4" /> Reset Local Store
        </button>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mock Seeding Toolset */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Sparkles className="h-4 w-4 text-indigo-400" /> State Seeder Control
          </h2>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Target Poll:</label>
              <select
                value={selectedPollId}
                onChange={(e) => setSelectedPollId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {polls.map(p => (
                  <option key={p.id} value={p.id}>{p.title} ({p.pollType} - {p.status})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Number of Voters to Seed:</label>
              <div className="flex gap-2">
                {[10, 20, 50, 100].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setSeedCount(cnt)}
                    className={`flex-1 py-1.5 rounded font-semibold border ${
                      seedCount === cnt
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleSeedVotes}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-1 shadow-md transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Seed Mock Data
              </button>
              <button
                onClick={handleClearPollVotes}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 font-semibold rounded-lg transition-all"
              >
                Clear Votes
              </button>
            </div>
          </div>
        </div>

        {/* Schedule & Timing Overrides */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Clock className="h-4 w-4 text-indigo-400" /> Deadline Expiry Simulator
          </h2>

          <div className="space-y-3.5 text-xs">
            {selectedPoll ? (
              <>
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                  <div className="text-slate-400">Current Expiry Timestamp:</div>
                  <div className="font-mono text-white text-[11px]">
                    {selectedPoll.endTime ? new Date(selectedPoll.endTime).toLocaleString() : "No Deadline Set"}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Time Offset (Hours from now):</label>
                  <div className="flex gap-2">
                    {[
                      { label: "Expired (-24h)", val: -24 },
                      { label: "Expiring soon (+1h)", val: 1 },
                      { label: "Active (+72h)", val: 72 }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setTimeOffsetHours(opt.val)}
                        className={`flex-1 py-2 px-1 rounded font-semibold border text-[10px] ${
                          timeOffsetHours === opt.val
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleOverrideDeadline}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-200 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Terminal className="h-3.5 w-3.5" /> Shift Deadline Timestamp
                </button>
              </>
            ) : (
              <p className="text-slate-500 italic">Select a poll on the seeder form to modify dates.</p>
            )}
          </div>
        </div>
      </div>

      {/* Raw Local Storage inspector */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <FileJson className="h-4 w-4 text-indigo-400" /> Local State Inspector (Live JSON)
        </h2>
        <div className="max-h-60 overflow-y-auto p-4 bg-slate-950 border border-slate-900 rounded-lg text-[10px] font-mono text-green-400 space-y-2">
          <div>// Local Database status metrics:</div>
          <div>Total Polls: {polls.length}</div>
          <div>Total Votes: {votes.length}</div>
          <div>Total Comments: {comments.length}</div>
          <div>Total Audit Log Entries: {auditLogs.length}</div>
          <details className="mt-2 group">
            <summary className="cursor-pointer text-indigo-400 hover:underline select-none">Show Raw JSON Store</summary>
            <pre className="mt-2 text-slate-300 bg-black/40 p-2.5 rounded border border-slate-900 overflow-x-auto text-[9px] leading-relaxed">
              {JSON.stringify({ polls, votes, comments, auditLogs }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
