import React, { useState, useEffect } from "react";
import { getPollsData, updatePollStatusAction, type Poll, type PollVote } from "@/lib/pollsStore";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  BellRing, 
  ArrowUpRight, 
  PieChart, 
  Building,
  Target
} from "lucide-react";
import { toast } from "sonner";

// Mock list of employees per department for tracking response rates
const DEPARTMENT_ROSTER: Record<string, { id: string; name: string; email: string }[]> = {
  Engineering: [
    { id: "emp-1", name: "Alice Smith", email: "alice@se7eninc.com" },
    { id: "emp-2", name: "Bob Jones", email: "bob@se7eninc.com" },
    { id: "emp-7", name: "Grace Kelly", email: "grace@se7eninc.com" },
    { id: "emp-8", name: "Henry Ford", email: "henry@se7eninc.com" }
  ],
  Design: [
    { id: "emp-3", name: "Charlie Miller", email: "charlie@se7eninc.com" },
    { id: "emp-9", name: "Isla Fisher", email: "isla@se7eninc.com" }
  ],
  Marketing: [
    { id: "emp-4", name: "Diana Rose", email: "diana@se7eninc.com" },
    { id: "emp-10", name: "Jack Ryan", email: "jack@se7eninc.com" }
  ],
  Sales: [
    { id: "emp-5", name: "Ethan Hunt", email: "ethan@se7eninc.com" },
    { id: "emp-11", name: "Kate Winslet", email: "kate@se7eninc.com" }
  ],
  Operations: [
    { id: "emp-6", name: "Fiona Gallagher", email: "fiona@se7eninc.com" },
    { id: "emp-12", name: "Leo DiCaprio", email: "leo@se7eninc.com" }
  ]
};

export default function ManagerPolls() {
  const [selectedDept, setSelectedDept] = useState("Engineering");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);

  const loadData = () => {
    const data = getPollsData();
    setPolls(data.polls);
    setVotes(data.votes);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("tm_polls_store_updated", loadData);
    return () => window.removeEventListener("tm_polls_store_updated", loadData);
  }, []);

  // Filter out drafts for manager dashboard
  const activeAndClosedPolls = polls.filter(p => p.status !== "Draft");

  // Default select first poll if none selected
  useEffect(() => {
    if (activeAndClosedPolls.length > 0 && !selectedPollId) {
      setSelectedPollId(activeAndClosedPolls[0].id);
    }
  }, [activeAndClosedPolls, selectedPollId]);

  const selectedPoll = polls.find(p => p.id === selectedPollId);
  const roster = DEPARTMENT_ROSTER[selectedDept] || [];

  // Calculate participation rate metrics for department roster
  const pollVotes = votes.filter(v => v.pollId === selectedPollId);
  const deptVotersCount = roster.filter(member => pollVotes.some(v => v.userId === member.id)).length;
  const participationPercentage = roster.length > 0 ? Math.round((deptVotersCount / roster.length) * 100) : 0;

  // Department comparative metrics bar chart data
  const chartData = Object.keys(DEPARTMENT_ROSTER).map(dept => {
    const deptRoster = DEPARTMENT_ROSTER[dept];
    const votesForDept = deptRoster.filter(member => pollVotes.some(v => v.userId === member.id)).length;
    const pct = deptRoster.length > 0 ? Math.round((votesForDept / deptRoster.length) * 100) : 0;
    return { name: dept, Participation: pct, Voters: votesForDept, Total: deptRoster.length };
  });

  const triggerNudge = (employeeName: string, email: string) => {
    // Send a local mockup reminder
    toast.success(`Nudge dispatched! Email reminder and push alert sent to ${employeeName} (${email}).`, {
      description: "Reminder subject: 'Urgent: Your vote is required for: " + (selectedPoll?.title || "Active Poll") + "'"
    });
  };

  const triggerDepartmentNudge = () => {
    const missingMembers = roster.filter(member => !pollVotes.some(v => v.userId === member.id));
    if (missingMembers.length === 0) {
      toast.info("Everyone in this department has already voted!");
      return;
    }
    missingMembers.forEach(m => {
      // Simulate multiple nudges
    });
    toast.success(`Dispatched department-wide reminder nudges to all ${missingMembers.length} remaining team members.`);
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-500" />
            Manager Engagement & Polling Control
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Analyze participation, monitor department trends, and nudge pending team responses to drive data-driven decision outcomes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">My Dept:</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-indigo-300 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {Object.keys(DEPARTMENT_ROSTER).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster & Analytics layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Poll list selector & stats */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <PieChart className="h-3.5 w-3.5 text-indigo-400" /> Choose Poll to Track
            </h3>
            <div className="space-y-2">
              {activeAndClosedPolls.map(poll => (
                <button
                  key={poll.id}
                  onClick={() => setSelectedPollId(poll.id)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all text-xs flex justify-between items-center ${
                    selectedPollId === poll.id
                      ? "bg-slate-800 border-indigo-500 text-indigo-300"
                      : "bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                  }`}
                >
                  <span className="font-semibold truncate pr-2">{poll.title}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    poll.status === "Active" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {poll.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          {selectedPoll && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                {selectedDept} Engagement Summary
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black block">Response Rate</span>
                  <span className="text-2xl font-black text-white mt-1 block">{participationPercentage}%</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black block">Votes Cast</span>
                  <span className="text-2xl font-black text-white mt-1 block">{deptVotersCount} / {roster.length}</span>
                </div>
              </div>

              {/* Graphical Circular Progress simulation */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg">
                <div className="flex justify-between text-xs text-slate-400 font-semibold mb-1">
                  <span>Target Rate</span>
                  <span>100% Attendance goal</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 rounded-full h-2 shadow-[0_0_6px_#6366f1] transition-all duration-500" 
                    style={{ width: `${participationPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Roster Tracker & Bar Charts */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPoll ? (
            <>
              {/* Department voter breakdown roster table */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-400" />
                      {selectedDept} Roster Voting Status
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Track individual vote status and send prompt reminders.</p>
                  </div>
                  <button
                    onClick={triggerDepartmentNudge}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 shadow-md transition-all self-start sm:self-center"
                  >
                    <BellRing className="h-3.5 w-3.5" /> Nudge Remaining Team
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <th className="py-2.5 px-3">Team Member</th>
                        <th className="py-2.5 px-3">Email Address</th>
                        <th className="py-2.5 px-3">Vote Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-xs">
                      {roster.map(member => {
                        const voted = pollVotes.some(v => v.userId === member.id);
                        return (
                          <tr key={member.id} className="hover:bg-slate-850/20 text-slate-300">
                            <td className="py-3 px-3 font-semibold text-white">{member.name}</td>
                            <td className="py-3 px-3 text-slate-400">{member.email}</td>
                            <td className="py-3 px-3">
                              {voted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-bold text-[10px]">
                                  <CheckCircle className="h-3 w-3" /> Voted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-bold text-[10px]">
                                  <Clock className="h-3 w-3" /> Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {!voted && (
                                <button
                                  onClick={() => triggerNudge(member.name, member.email)}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600/35 border border-slate-700 hover:border-indigo-500 text-[10px] text-slate-300 hover:text-white font-bold transition-all inline-flex items-center gap-1"
                                >
                                  <BellRing className="h-2.5 w-2.5" /> Nudge
                                </button>
                              )}
                              {voted && (
                                <span className="text-[10px] text-slate-500 italic">No action needed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Department Comparative Analytics charts */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-indigo-400" />
                  Comparative Department Participation Rates (%)
                </h3>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                      <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                      <ChartTooltip
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                        labelClassName="text-white text-xs font-bold"
                        itemStyle={{ color: "#818cf8", fontSize: "11px" }}
                      />
                      <Bar dataKey="Participation" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.name === selectedDept ? "#6366f1" : "#1e293b"} 
                            stroke={entry.name === selectedDept ? "#818cf8" : "#475569"}
                            strokeWidth={1.5}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-slate-900/20 border border-slate-800 rounded-xl">
              <Users className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading department statistics...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
