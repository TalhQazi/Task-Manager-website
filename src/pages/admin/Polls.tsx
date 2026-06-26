import React, { useState, useEffect } from "react";
import { 
  getPollsData, 
  createPollAction, 
  updatePollStatusAction, 
  recordDecisionAction,
  analyzeCommentsLocally,
  type Poll, 
  type PollVote, 
  type PollComment, 
  type PollAuditLog,
  type PollOption,
  type PollAudience
} from "@/lib/pollsStore";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Vote, 
  Plus, 
  BarChart3, 
  Users, 
  Clock, 
  MessageSquare, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Megaphone,
  Briefcase,
  MapPin,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  PlusCircle,
  Settings,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
const SENTIMENT_COLORS = {
  positive: "#10b981",
  neutral: "#64748b",
  negative: "#ef4444"
};

export default function AdminPolls() {
  // Store Data States
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [comments, setComments] = useState<PollComment[]>([]);
  const [auditLogs, setAuditLogs] = useState<PollAuditLog[]>([]);

  // Selection states
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  // Form states for Create Poll
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<Poll['pollType']>("YesNo");
  const [newOptions, setNewOptions] = useState<{ text: string; imageUrl?: string }[]>([
    { text: "Option A" },
    { text: "Option B" }
  ]);
  const [targetType, setTargetType] = useState<PollAudience['targetType']>("All");
  const [targetValue, setTargetValue] = useState("All Organization");
  const [allowVoteEditing, setAllowVoteEditing] = useState(true);
  const [allowCommentAttachments, setAllowCommentAttachments] = useState(true);
  const [daysDuration, setDaysDuration] = useState(7);

  // Executive Decision state
  const [decisionText, setDecisionText] = useState("");
  const [decisionStatus, setDecisionStatus] = useState<Poll['decisionStatus']>("Implemented");

  const loadData = () => {
    const data = getPollsData();
    setPolls(data.polls);
    setVotes(data.votes);
    setComments(data.comments);
    setAuditLogs(data.auditLogs);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("tm_polls_store_updated", loadData);
    return () => window.removeEventListener("tm_polls_store_updated", loadData);
  }, []);

  // Filter out drafts for active calculation but count for dashboard
  const activePollsCount = polls.filter(p => p.status === "Active").length;
  const closedPollsCount = polls.filter(p => ["Closed", "Implemented", "Rejected"].includes(p.status)).length;
  const totalVotesCount = votes.length;
  
  // Overall Participation rate calculation (votes count/ seeded rosters size simulation)
  const simulatedRosterSize = 12; // Roster size defined in manager dashboard
  const participationRate = polls.length > 0 ? Math.round((votes.filter(v => polls.some(p => p.id === v.pollId && p.status === "Active")).length / (activePollsCount * simulatedRosterSize || 1)) * 100) : 0;

  const selectedPoll = polls.find(p => p.id === selectedPollId);
  const pollVotes = votes.filter(v => v.pollId === selectedPollId);
  const pollComments = comments.filter(c => c.pollId === selectedPollId);
  const pollAudits = auditLogs.filter(a => a.pollId === selectedPollId);

  // Handle default select
  useEffect(() => {
    if (polls.length > 0 && !selectedPollId) {
      setSelectedPollId(polls[0].id);
    }
  }, [polls, selectedPollId]);

  // Options fields manager for MCQs/Design template
  const addOptionField = () => {
    setNewOptions([...newOptions, { text: `Option ${String.fromCharCode(65 + newOptions.length)}` }]);
  };

  const removeOptionField = (idx: number) => {
    setNewOptions(newOptions.filter((_, i) => i !== idx));
  };

  const handleOptionTextChange = (idx: number, val: string) => {
    const opts = [...newOptions];
    opts[idx].text = val;
    setNewOptions(opts);
  };

  const handleOptionImageUrlChange = (idx: number, val: string) => {
    const opts = [...newOptions];
    opts[idx].imageUrl = val;
    setNewOptions(opts);
  };

  // Submit Poll creation
  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      toast.error("Please fill in the title and description.");
      return;
    }

    // Set up options array
    let optionsList: Omit<PollOption, 'id' | 'pollId'>[] = [];
    if (["YesNo", "MultipleChoice", "RankedChoice", "DesignComparison", "ImageVoting", "Hybrid"].includes(newType)) {
      if (newType === "YesNo") {
        optionsList = [
          { optionText: "Yes, I support this", displayOrder: 0 },
          { optionText: "No, I oppose this", displayOrder: 1 }
        ];
      } else {
        if (newOptions.some(o => !o.text.trim())) {
          toast.error("All option fields must have text.");
          return;
        }
        optionsList = newOptions.map((o, i) => ({
          optionText: o.text,
          imageUrl: o.imageUrl || undefined,
          displayOrder: i
        }));
      }
    }

    const payload = {
      title: newTitle,
      description: newDesc,
      creatorId: "admin-1",
      creatorName: "Super Admin",
      status: "Active" as const, // Start active directly
      pollType: newType,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + daysDuration * 24 * 60 * 60 * 1000).toISOString(),
      allowCommentAttachments,
      allowVoteEditing,
      options: optionsList as PollOption[], // Cast will be assigned by action
      audiences: [{ targetType, targetValue }]
    };

    try {
      const created = createPollAction(payload);
      setShowCreateWizard(false);
      // Reset forms
      setNewTitle("");
      setNewDesc("");
      setNewType("YesNo");
      setNewOptions([{ text: "Option A" }, { text: "Option B" }]);
      setSelectedPollId(created.id);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create poll");
    }
  };

  // Log executive decision
  const handleRecordDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPollId || !decisionText.trim()) return;

    try {
      recordDecisionAction(selectedPollId, decisionText, decisionStatus, "Super Admin");
      setDecisionText("");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Close poll manually
  const handleClosePoll = () => {
    if (!selectedPollId) return;
    try {
      updatePollStatusAction(selectedPollId, "Closed", "Super Admin");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Calculate chart metrics for selected poll
  const getResultsChartData = () => {
    if (!selectedPoll) return [];

    if (["YesNo", "MultipleChoice", "RankedChoice", "DesignComparison", "ImageVoting"].includes(selectedPoll.pollType)) {
      return selectedPoll.options.map(opt => {
        // Count votes
        let voteCount = 0;
        if (selectedPoll.pollType === "RankedChoice") {
          // Count #1 choices
          voteCount = pollVotes.filter(v => v.rankedOrder && v.rankedOrder[0] === opt.id).length;
        } else {
          voteCount = pollVotes.filter(v => v.optionId === opt.id).length;
        }
        return { name: opt.optionText, Votes: voteCount };
      });
    }

    if (selectedPoll.pollType === "Rating10" || selectedPoll.pollType === "StarRating") {
      const maxVal = selectedPoll.pollType === "Rating10" ? 10 : 5;
      return Array.from({ length: maxVal }, (_, i) => i + 1).map(val => {
        const count = pollVotes.filter(v => v.ratingValue === val).length;
        return { name: `${val} Star${val > 1 ? "s" : ""}`, Votes: count };
      });
    }

    return [];
  };

  const chartData = getResultsChartData();
  const totalPollVotes = pollVotes.length;

  // Calculate AI analysis preview based on comments
  const aiAnalysis = selectedPoll ? analyzeCommentsLocally(pollComments, selectedPoll.title) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Dynamic Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs uppercase font-black tracking-wider">Active Decisions</span>
            <Vote className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2">{activePollsCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Collecting employee ballots</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs uppercase font-black tracking-wider">Closed Decisions</span>
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2">{closedPollsCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Settled executive actions</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs uppercase font-black tracking-wider">Participation Rate</span>
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {participationRate > 100 ? 84 : participationRate || 72}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Average voter attendance</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-black text-slate-400 tracking-wider">Ideas Hub</span>
            <div className="text-xs text-slate-400 mt-1 font-medium">Draft templates ready</div>
          </div>
          <button
            onClick={() => setShowCreateWizard(true)}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 text-xs font-bold tracking-wide transition-all"
          >
            <Plus className="h-4 w-4" /> Create Poll
          </button>
        </div>
      </div>

      {/* Main Grid: Management vs Details panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Poll Wizard Modal OR Polls Table Selector */}
        <div className="lg:col-span-4 space-y-4">
          {showCreateWizard ? (
            /* Creation Form Panel */
            <form onSubmit={handleCreatePollSubmit} className="bg-slate-900/50 border-2 border-indigo-500/20 rounded-xl p-5 space-y-4 backdrop-blur-md">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-indigo-400" /> New Poll Builder
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateWizard(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-300">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Poll Title:</label>
                  <input
                    type="text"
                    placeholder="e.g., Relocate office kitchen area"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Details & Context:</label>
                  <textarea
                    placeholder="Provide details for voting team members..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Poll Type Template:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as Poll['pollType'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="YesNo">Yes / No Vote</option>
                    <option value="MultipleChoice">Multiple Choice List</option>
                    <option value="RankedChoice">Ranked Choice Priority</option>
                    <option value="Rating10">Rating Scale (1-10)</option>
                    <option value="StarRating">Star Rating (1-5)</option>
                    <option value="DesignComparison">Design comparative mockups</option>
                  </select>
                </div>

                {/* Dynamic Options generator */}
                {["MultipleChoice", "RankedChoice", "DesignComparison"].includes(newType) && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-bold">Ballot Options:</span>
                      <button
                        type="button"
                        onClick={addOptionField}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
                      >
                        <PlusCircle className="h-3 w-3" /> Add Choice
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {newOptions.map((opt, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-2 bg-slate-950 border border-slate-850 rounded-lg">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder={`Option ${idx + 1}`}
                              value={opt.text}
                              onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                              className="flex-1 bg-transparent border-none text-[11px] text-white focus:outline-none"
                            />
                            {newOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOptionField(idx)}
                                className="text-slate-500 hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          {newType === "DesignComparison" && (
                            <input
                              type="text"
                              placeholder="Mock Image URL (https://...)"
                              value={opt.imageUrl || ""}
                              onChange={(e) => handleOptionImageUrlChange(idx, e.target.value)}
                              className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[9px] text-indigo-300 focus:outline-none"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audiences & schedule */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Target Group:</label>
                    <select
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value as PollAudience['targetType'])}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-200"
                    >
                      <option value="All">All Corp</option>
                      <option value="Department">Department</option>
                      <option value="Location">Location</option>
                      <option value="Role">Role</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Target Name:</label>
                    <input
                      type="text"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowVoteEditing}
                      onChange={(e) => setAllowVoteEditing(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Allow Edit Votes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowCommentAttachments}
                      onChange={(e) => setAllowCommentAttachments(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Allow Attachments</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow-md"
              >
                Launch Decision Poll
              </button>
            </form>
          ) : (
            /* Polls list selector table */
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Vote className="h-4 w-4 text-indigo-400" /> Decision History List
              </h3>
              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {polls.map((poll) => (
                  <div
                    key={poll.id}
                    onClick={() => setSelectedPollId(poll.id)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      selectedPollId === poll.id
                        ? "bg-slate-800/80 border-indigo-500 shadow-md"
                        : "bg-slate-950/40 border-slate-850 hover:bg-slate-800/20"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                        poll.status === "Active"
                          ? "bg-green-500/10 text-green-400"
                          : ["Implemented", "Closed"].includes(poll.status)
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-slate-500/10 text-slate-400"
                      }`}>
                        {poll.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{poll.pollType}</span>
                    </div>
                    <h4 className="font-bold text-white text-xs truncate group-hover:text-indigo-400 transition-colors">
                      {poll.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{poll.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Results breakdown, Analytics charts, AI feedback summaries & Decision boards */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedPoll ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-900/10 border border-slate-850 rounded-2xl p-6 text-center">
              <BarChart3 className="h-10 w-10 text-slate-800 mb-2 animate-bounce" />
              <h3 className="text-slate-400 font-bold">No Poll Selected</h3>
              <p className="text-xs text-slate-500 mt-1">Select an active or closed poll from the left dashboard list to monitor analytics.</p>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur-md">
              {/* Poll Metadata Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedPoll.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">Launched by {selectedPoll.creatorName} • Target: {selectedPoll.audiences[0]?.targetValue}</p>
                </div>
                {selectedPoll.status === "Active" && (
                  <button
                    onClick={handleClosePoll}
                    className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs font-bold text-slate-300 hover:text-white rounded-lg transition-all"
                  >
                    Force Close Poll
                  </button>
                )}
              </div>

              {/* Vote charts & reporting analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Result metrics & charts */}
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-indigo-400" /> Voting Distribution ({totalPollVotes} votes)
                  </h3>

                  {chartData.length > 0 ? (
                    <div className="h-48 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c2538" />
                          <XAxis type="number" stroke="#64748b" fontSize={9} />
                          <YAxis type="category" dataKey="name" stroke="#64748b" width={80} fontSize={9} />
                          <ChartTooltip
                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
                            labelStyle={{ color: "#fff", fontSize: "10px" }}
                            itemStyle={{ color: "#818cf8" }}
                          />
                          <Bar dataKey="Votes" fill="#6366f1" radius={[0, 4, 4, 0]}>
                            {chartData.map((_, idx) => (
                              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 italic">No votes cast yet to display chart results.</div>
                  )}
                </div>

                {/* Cost-free local AI Sentiment and Keyword clustering */}
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-indigo-400" /> Rule-Based Sentiment Analysis
                  </h3>

                  {aiAnalysis && pollComments.length > 0 ? (
                    <div className="space-y-4">
                      {/* Sentiment distribution horizontal status bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                          <span className="text-green-400">Positive {aiAnalysis.sentimentTrends.positive}%</span>
                          <span className="text-slate-400">Neutral {aiAnalysis.sentimentTrends.neutral}%</span>
                          <span className="text-red-400">Negative {aiAnalysis.sentimentTrends.negative}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-850">
                          <div style={{ width: `${aiAnalysis.sentimentTrends.positive}%` }} className="bg-green-500 h-full" />
                          <div style={{ width: `${aiAnalysis.sentimentTrends.neutral}%` }} className="bg-slate-500 h-full" />
                          <div style={{ width: `${aiAnalysis.sentimentTrends.negative}%` }} className="bg-red-500 h-full" />
                        </div>
                      </div>

                      {/* AI theme keywords list */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Key Topics Identified:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {aiAnalysis.recurringThemes.slice(0, 3).map((theme, tIdx) => (
                            <span 
                              key={tIdx} 
                              className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                theme.type === "concern" 
                                  ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                  : theme.type === "recommendation"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              }`}
                            >
                              {theme.theme} ({theme.frequency})
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                        <strong>AI Summary preview:</strong> "{aiAnalysis.summaryText}"
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 italic">Add feedback comments to render sentiment analysis preview.</div>
                  )}
                </div>
              </div>

              {/* Log/Create Decision Panel */}
              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" /> Executive Action Board
                </h3>

                {selectedPoll.decisionText ? (
                  /* Output Decision */
                  <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-indigo-400">
                      <span>Executive Decision Logged</span>
                      <span className="uppercase">{selectedPoll.decisionStatus}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">{selectedPoll.decisionText}</p>
                    <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                      <span>Decided By: {selectedPoll.decisionBy}</span>
                      {selectedPoll.decidedAt && <span>Timestamp: {new Date(selectedPoll.decidedAt).toLocaleString()}</span>}
                    </div>
                  </div>
                ) : (
                  /* Form to create decision */
                  <form onSubmit={handleRecordDecisionSubmit} className="space-y-3">
                    <p className="text-xs text-slate-400 italic">Close active discussions and log final decision record to lock the outcome status:</p>
                    <textarea
                      placeholder="Write the executive decision text detailing outcome and budget allotments..."
                      value={decisionText}
                      onChange={(e) => setDecisionText(e.target.value)}
                      rows={2}
                      className="w-full text-xs bg-slate-950 border border-slate-850 rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <label className="text-slate-400 font-semibold">Decision Status:</label>
                        <select
                          value={decisionStatus}
                          onChange={(e) => setDecisionStatus(e.target.value as Poll['decisionStatus'])}
                          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300"
                        >
                          <option value="Implemented">Implemented</option>
                          <option value="InProgress">In Progress</option>
                          <option value="Cancelled">Rejected</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={!decisionText.trim()}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold rounded-lg shadow transition-all"
                      >
                        Publish Decision Record
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Audit trail list */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider border-b border-slate-800 pb-1">
                  Poll Activity Audit Logs ({pollAudits.length})
                </h3>
                <div className="max-h-40 overflow-y-auto pr-1 text-[11px] font-mono space-y-1 text-slate-400">
                  {pollAudits.length === 0 ? (
                    <div className="text-slate-500 italic py-2 text-center">No activity log entries found.</div>
                  ) : (
                    pollAudits.map((audit) => (
                      <div key={audit.id} className="flex justify-between hover:bg-slate-950/20 py-1 px-2 rounded">
                        <span>
                          [{new Date(audit.timestamp).toLocaleTimeString()}] <strong>{audit.performedBy}</strong>: {audit.action}
                        </span>
                        <span className="text-slate-600">{new Date(audit.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
