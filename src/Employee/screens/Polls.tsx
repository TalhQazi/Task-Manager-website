import React, { useState, useEffect } from "react";
import { getEmployeeAuth } from "../lib/auth";
import {
  getPollsData,
  castVoteAction,
  addCommentAction,
  analyzeCommentsLocally,
  type Poll,
  type PollVote,
  type PollComment,
  type PollOption
} from "@/lib/pollsStore";
import { 
  Vote, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  Paperclip, 
  FileText,
  Star,
  ArrowUp,
  ArrowDown,
  Building,
  MapPin,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function EmployeePolls() {
  const auth = getEmployeeAuth();
  
  // Simulated employee metadata if not fully populated in storage
  const employeeUser = {
    userId: auth?.username || "emp-alice",
    userName: auth?.name || "Alice Smith",
    userDepartment: "Engineering",
    userLocation: "New York Office"
  };

  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [comments, setComments] = useState<PollComment[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);

  // Voting inputs state
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [ratingVal, setRatingVal] = useState<number>(0);
  const [rankedOrder, setRankedOrder] = useState<string[]>([]);
  
  // Comment input state
  const [commentText, setCommentText] = useState("");
  const [mockFiles, setMockFiles] = useState<{ name: string; url: string; type: string }[]>([]);

  // Load store data
  const loadData = () => {
    const data = getPollsData();
    setPolls(data.polls);
    setVotes(data.votes);
    setComments(data.comments);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("tm_polls_store_updated", loadData);
    return () => window.removeEventListener("tm_polls_store_updated", loadData);
  }, []);

  // Filter polls
  const filteredPolls = polls.filter(p => {
    const isPast = ["Closed", "Implemented", "Rejected"].includes(p.status);
    return activeTab === "active" ? !isPast && p.status !== "Draft" : isPast;
  });

  const selectedPoll = polls.find(p => p.id === selectedPollId);
  const pollComments = comments.filter(c => c.pollId === selectedPollId);
  const userVote = votes.find(v => v.pollId === selectedPollId && v.userId === employeeUser.userId);

  // Initialize inputs when selecting a poll
  useEffect(() => {
    if (selectedPoll) {
      if (userVote) {
        setSelectedOptionId(userVote.optionId || "");
        setRatingVal(userVote.ratingValue || 0);
        setRankedOrder(userVote.rankedOrder || selectedPoll.options.map(o => o.id));
      } else {
        setSelectedOptionId("");
        setRatingVal(0);
        setRankedOrder(selectedPoll.options.map(o => o.id));
      }
    }
  }, [selectedPollId, userVote]);

  // Vote submit handler
  const handleVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPollId) return;

    try {
      castVoteAction({
        pollId: selectedPollId,
        userId: employeeUser.userId,
        userName: employeeUser.userName,
        userDepartment: employeeUser.userDepartment,
        userLocation: employeeUser.userLocation,
        optionId: selectedOptionId || undefined,
        ratingValue: ratingVal || undefined,
        rankedOrder: selectedPoll?.pollType === "RankedChoice" ? rankedOrder : undefined
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit vote");
    }
  };

  // Comment submit handler
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPollId || !commentText.trim()) return;

    try {
      addCommentAction(
        selectedPollId,
        employeeUser.userId,
        employeeUser.userName,
        commentText,
        mockFiles.length > 0 ? mockFiles : undefined
      );
      setCommentText("");
      setMockFiles([]);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle mock file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newMockFile = {
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      };
      setMockFiles([...mockFiles, newMockFile]);
      toast.success(`Attached ${file.name}`);
    }
  };

  // Reorder ranked-choice options
  const moveRankedOption = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...rankedOrder];
    if (direction === 'up' && index > 0) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[index - 1];
      newOrder[index - 1] = temp;
    } else if (direction === 'down' && index < newOrder.length - 1) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[index + 1];
      newOrder[index + 1] = temp;
    }
    setRankedOrder(newOrder);
  };

  // Compute AI Summary for preview
  const aiAnalysis = selectedPoll ? analyzeCommentsLocally(pollComments, selectedPoll.title) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Profile Summary */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Vote className="h-8 w-8 text-indigo-500" />
            Company Ideas & Polls Portal
          </h1>
          <p className="text-slate-400 mt-1">
            Express your thoughts, participate in strategic discussions, and review executive decisions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:self-center">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium">
            <Building className="h-3.5 w-3.5 text-indigo-400" />
            {employeeUser.userDepartment}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium">
            <MapPin className="h-3.5 w-3.5 text-indigo-400" />
            {employeeUser.userLocation}
          </span>
        </div>
      </div>

      {/* Main Grid split: Poll Feed vs. Active Workpanel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Poll Lists */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2 flex gap-1 shadow-xl">
            <button
              onClick={() => { setActiveTab("active"); setSelectedPollId(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "active" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Active Decisions
            </button>
            <button
              onClick={() => { setActiveTab("past"); setSelectedPollId(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "past" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Archive & Results
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
            {filteredPolls.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-xl">
                <AlertCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No polls found in this category.</p>
              </div>
            ) : (
              filteredPolls.map((poll) => {
                const voted = votes.some(v => v.pollId === poll.id && v.userId === employeeUser.userId);
                
                return (
                  <div
                    key={poll.id}
                    onClick={() => setSelectedPollId(poll.id)}
                    className={`group cursor-pointer p-5 rounded-xl border transition-all ${
                      selectedPollId === poll.id
                        ? "bg-slate-800/60 border-indigo-500/80 shadow-lg shadow-indigo-500/5"
                        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        poll.status === "Active"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : poll.status === "Implemented"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {poll.status}
                      </span>
                      {voted && (
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Voted
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm">
                      {poll.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {poll.description}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Type: {poll.pollType}
                      </span>
                      {poll.endTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Ends: {new Date(poll.endTime).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Action Panel */}
        <div className="lg:col-span-7 space-y-6">
          {!selectedPoll ? (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
              <Vote className="h-12 w-12 text-slate-700 mb-3 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-400">Select a Poll</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose a poll from the sidebar layout list to participate in voting, cast options, read discussions, and view executive decisions.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur-md">
              {/* Poll Summary */}
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedPoll.title}</h2>
                <p className="text-sm text-slate-300 mt-2">{selectedPoll.description}</p>
              </div>

              {/* Voting widget if Active */}
              {selectedPoll.status === "Active" ? (
                <form onSubmit={handleVoteSubmit} className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 space-y-5">
                  <h3 className="text-sm font-semibold text-white tracking-wide border-b border-slate-800 pb-2 flex items-center gap-2">
                    <Vote className="h-4 w-4 text-indigo-400" /> Cast Your Ballot
                  </h3>

                  {/* MCQ & YES/NO */}
                  {(selectedPoll.pollType === "YesNo" || selectedPoll.pollType === "MultipleChoice") && (
                    <div className="space-y-2">
                      {selectedPoll.options.map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedOptionId === opt.id
                              ? "bg-indigo-600/15 border-indigo-500/80 text-white"
                              : "bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="poll_option"
                            value={opt.id}
                            checked={selectedOptionId === opt.id}
                            onChange={() => setSelectedOptionId(opt.id)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium">{opt.optionText}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* DESIGN COMPARISON / IMAGE VOTING */}
                  {(selectedPoll.pollType === "ImageVoting" || selectedPoll.pollType === "DesignComparison") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedPoll.options.map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedOptionId(opt.id)}
                          className={`cursor-pointer rounded-xl overflow-hidden border transition-all ${
                            selectedOptionId === opt.id
                              ? "border-indigo-500 bg-indigo-600/15"
                              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                          }`}
                        >
                          {opt.imageUrl && (
                            <img
                              src={opt.imageUrl}
                              alt={opt.optionText}
                              className="w-full h-40 object-cover"
                            />
                          )}
                          <div className="p-3 flex items-center gap-2">
                            <input
                              type="radio"
                              name="poll_option"
                              checked={selectedOptionId === opt.id}
                              onChange={() => setSelectedOptionId(opt.id)}
                              className="text-indigo-600"
                            />
                            <span className="text-xs font-semibold text-slate-200">{opt.optionText}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 1-10 RATING */}
                  {selectedPoll.pollType === "Rating10" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-10 gap-1.5">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setRatingVal(val)}
                            className={`py-2 rounded-lg font-bold text-xs border transition-all ${
                              ratingVal === val
                                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-1">
                        <span>Highly Dislike</span>
                        <span>Highly Support</span>
                      </div>
                    </div>
                  )}

                  {/* STAR RATING */}
                  {selectedPoll.pollType === "StarRating" && (
                    <div className="flex justify-center gap-3 py-4">
                      {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingVal(star)}
                          className="focus:outline-none transition-transform active:scale-95"
                        >
                          <Star
                            className={`h-10 w-10 ${
                              ratingVal >= star ? "fill-amber-400 text-amber-400" : "text-slate-600 hover:text-slate-400"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* RANKED CHOICE */}
                  {selectedPoll.pollType === "RankedChoice" && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400 italic">Reorder list using the arrow buttons to reflect your preference hierarchy (Top is highest):</p>
                      <div className="space-y-2">
                        {rankedOrder.map((optId, idx) => {
                          const option = selectedPoll.options.find(o => o.id === optId);
                          if (!option) return null;
                          return (
                            <div key={optId} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-850">
                              <div className="flex items-center gap-2.5">
                                <span className="flex items-center justify-center h-5 w-5 rounded bg-indigo-900/60 border border-indigo-500/25 text-[10px] font-bold text-indigo-300">
                                  #{idx + 1}
                                </span>
                                <span className="text-xs text-slate-200 font-medium">{option.optionText}</span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveRankedOption(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveRankedOption(idx, 'down')}
                                  disabled={idx === rankedOrder.length - 1}
                                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-850">
                    <span className="text-[11px] text-slate-500 italic">
                      {userVote ? "You have already voted. Submitting updates your choice." : "Ballot is open until schedule deadline."}
                    </span>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      {userVote ? "Update My Vote" : "Cast Ballot"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Closed / Decision record card */
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Executive Decision Outcome
                    </h3>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300">
                      {selectedPoll.decisionStatus || "Settled"}
                    </span>
                  </div>
                  {selectedPoll.decisionText ? (
                    <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 border border-slate-850 p-3 rounded-lg">
                      {selectedPoll.decisionText}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No decision summary has been recorded by executives for this poll yet.</p>
                  )}
                  {selectedPoll.decisionBy && (
                    <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                      <span>Logged By: <strong>{selectedPoll.decisionBy}</strong></span>
                      {selectedPoll.decidedAt && <span>Date: {new Date(selectedPoll.decidedAt).toLocaleDateString()}</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Local AI sentiment analysis summary panel (Costs $0.00) */}
              {aiAnalysis && pollComments.length > 0 && (
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                    AI Sentiment Preview (Cost-Free)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{aiAnalysis.summaryText}"
                  </p>
                  <div className="flex gap-2 text-[10px] font-semibold">
                    <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Positive: {aiAnalysis.sentimentTrends.positive}%</span>
                    <span className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">Neutral: {aiAnalysis.sentimentTrends.neutral}%</span>
                    <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Negative: {aiAnalysis.sentimentTrends.negative}%</span>
                  </div>
                </div>
              )}

              {/* Discussion Thread & attachment uploading */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                  Feedback Discussions ({pollComments.length})
                </h3>

                {/* Comment lists */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {pollComments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">No comments or questions recorded. Be the first to provide feedback.</p>
                  ) : (
                    pollComments.map((c) => (
                      <div key={c.id} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-bold text-indigo-300">{c.userName}</span>
                          <span>{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">{c.commentText}</p>
                        
                        {/* Attachments rendering */}
                        {c.attachments && c.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1.5 border-t border-slate-900">
                            {c.attachments.map((file, fidx) => (
                              <a
                                key={fidx}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                <Paperclip className="h-2.5 w-2.5" />
                                {file.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Comment box form */}
                {selectedPoll.status === "Active" && (
                  <form onSubmit={handleCommentSubmit} className="space-y-2.5 pt-2">
                    <textarea
                      placeholder="Write your feedback, questions, or concerns here..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                      className="w-full text-xs bg-slate-950 border border-slate-850 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />

                    {/* File Attachment Controls */}
                    {selectedPoll.allowCommentAttachments && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-950 border border-slate-850 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer">
                            <Paperclip className="h-3 w-3" /> Attach File
                            <input
                              type="file"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          {mockFiles.map((f, i) => (
                            <span key={i} className="text-[10px] text-indigo-300 flex items-center gap-0.5">
                              <FileText className="h-3 w-3" /> {f.name}
                            </span>
                          ))}
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1 transition-all"
                        >
                          <Send className="h-3 w-3" /> Submit
                        </button>
                      </div>
                    )}

                    {!selectedPoll.allowCommentAttachments && (
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1 transition-all"
                        >
                          <Send className="h-3 w-3" /> Submit Comment
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
