import { toast } from "sonner";

// Types matching the engineering specification
export type PollStatus = 'Draft' | 'Scheduled' | 'Active' | 'Closed' | 'Implemented' | 'Rejected';

export type PollType =
  | 'YesNo'
  | 'MultipleChoice'
  | 'RankedChoice'
  | 'Rating10'
  | 'StarRating'
  | 'ImageVoting'
  | 'DesignComparison'
  | 'BudgetApproval'
  | 'OpenFeedback'
  | 'Hybrid';

export interface PollOption {
  id: string;
  pollId: string;
  optionText: string;
  imageUrl?: string;
  displayOrder: number;
}

export interface PollAudience {
  targetType: 'Company' | 'Department' | 'Location' | 'Role' | 'Team' | 'UserList' | 'All';
  targetValue: string; // e.g., "Engineering", "New York", "Admin", etc.
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  status: PollStatus;
  pollType: PollType;
  startTime: string;
  endTime: string;
  allowCommentAttachments: boolean;
  allowVoteEditing: boolean;
  createdAt: string;
  updatedAt: string;
  options: PollOption[];
  audiences: PollAudience[];
  decisionText?: string;
  decisionBy?: string;
  decisionStatus?: 'Pending' | 'InProgress' | 'Implemented' | 'Cancelled';
  decidedAt?: string;
}

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  userName: string;
  userDepartment: string;
  userLocation: string;
  optionId?: string; // MCQs/YesNo/DesignComparison
  ratingValue?: number; // Ratings/Stars
  rankedOrder?: string[]; // RankedChoice option IDs in order
  votedAt: string;
}

export interface PollCommentAttachment {
  name: string;
  url: string;
  type: string;
}

export interface PollComment {
  id: string;
  pollId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  commentText: string;
  attachments?: PollCommentAttachment[];
  createdAt: string;
}

export interface PollAuditLog {
  id: string;
  pollId: string;
  pollTitle: string;
  action: string; // e.g., "Create Poll", "Cast Vote", "Close Poll", "Add Comment"
  performedBy: string;
  timestamp: string;
}

export interface AISummary {
  summaryText: string;
  sentimentTrends: { positive: number; neutral: number; negative: number };
  recurringThemes: { theme: string; frequency: number; type: 'concern' | 'consensus' | 'recommendation' }[];
}

// Free client-side NLP / Keyword matching dictionary
const POSITIVE_WORDS = new Set([
  'great', 'good', 'agree', 'support', 'excellent', 'love', 'perfect', 'yes', 'fantastic',
  'beneficial', 'like', 'awesome', 'improve', 'helpful', 'forward', 'excite', 'healthy', 'productive',
  'better', 'definitely', 'absolutely', 'pleased', 'happy', 'needed', 'clean', 'fair', 'reasonable'
]);

const NEGATIVE_WORDS = new Set([
  'disagree', 'oppose', 'bad', 'no', 'hate', 'terrible', 'poor', 'waste', 'unhelpful',
  'concern', 'worry', 'risk', 'expensive', 'fail', 'flawed', 'difficult', 'negative', 'worse',
  'uncomfortable', 'costly', 'hard', 'unhappy', 'annoyed', 'restrict', 'burden', 'unfair'
]);

const THEME_KEYWORDS: { theme: string; words: string[]; type: 'concern' | 'consensus' | 'recommendation' }[] = [
  { theme: 'Work-Life Balance', words: ['burnout', 'balance', 'family', 'stress', 'personal', 'flexibility', 'hours', 'commute'], type: 'consensus' },
  { theme: 'Cost/Budget Concerns', words: ['expensive', 'cost', 'budget', 'price', 'waste', 'pay', 'financial', 'funding'], type: 'concern' },
  { theme: 'Implementation Timeline', words: ['slow', 'fast', 'deadline', 'hurry', 'time', 'delay', 'schedule', 'planning'], type: 'concern' },
  { theme: 'Collaboration & Sync', words: ['meet', 'colleague', 'team', 'talk', 'together', 'coordinate', 'office', 'zoom'], type: 'consensus' },
  { theme: 'Modern Design Preferences', words: ['modern', 'logo', 'clean', 'branding', 'sleek', 'colors', 'fresh', 'aesthetic'], type: 'recommendation' },
  { theme: 'Remote Setup Quality', words: ['internet', 'desk', 'laptop', 'home', 'remotely', 'setup', 'workplace', 'chair'], type: 'recommendation' }
];

// Perform free local AI Summary & Sentiment Analysis based on real comments
export function analyzeCommentsLocally(comments: PollComment[], pollTitle: string): AISummary {
  if (comments.length === 0) {
    return {
      summaryText: "No feedback comments have been posted yet to generate an AI summary.",
      sentimentTrends: { positive: 0, neutral: 100, negative: 0 },
      recurringThemes: []
    };
  }

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  const themesCount: Record<string, number> = {};

  comments.forEach(c => {
    const textLower = c.commentText.toLowerCase();
    const words = textLower.match(/\b\w+\b/g) || [];

    // Analyze Sentiment
    let score = 0;
    words.forEach(w => {
      if (POSITIVE_WORDS.has(w)) score++;
      if (NEGATIVE_WORDS.has(w)) score--;
    });

    if (score > 0) positiveCount++;
    else if (score < 0) negativeCount++;
    else neutralCount++;

    // Track Themes
    THEME_KEYWORDS.forEach(tk => {
      const matches = tk.words.some(keyword => textLower.includes(keyword));
      if (matches) {
        themesCount[tk.theme] = (themesCount[tk.theme] || 0) + 1;
      }
    });
  });

  const total = comments.length;
  const sentimentTrends = {
    positive: Math.round((positiveCount / total) * 100),
    neutral: Math.round((neutralCount / total) * 100),
    negative: Math.round((negativeCount / total) * 100)
  };

  // Convert themes to sorted format
  const recurringThemes = Object.keys(themesCount).map(themeName => {
    const matchingSpec = THEME_KEYWORDS.find(tk => tk.theme === themeName)!;
    return {
      theme: themeName,
      frequency: themesCount[themeName],
      type: matchingSpec.type
    };
  }).sort((a, b) => b.frequency - a.frequency);

  // Dynamic summary text generation
  let summaryText = "";
  if (sentimentTrends.positive > sentimentTrends.negative) {
    summaryText = `Overall employee feedback for "${pollTitle}" leans **positive** (${sentimentTrends.positive}% favorable). `;
  } else if (sentimentTrends.negative > sentimentTrends.positive) {
    summaryText = `Overall employee feedback for "${pollTitle}" highlights **critical concerns** (${sentimentTrends.negative}% unfavorable). `;
  } else {
    summaryText = `Feedback for "${pollTitle}" shows a **balanced/neutral split** in employee sentiment. `;
  }

  if (recurringThemes.length > 0) {
    const topThemes = recurringThemes.slice(0, 2).map(t => `"${t.theme}" (${t.frequency} discussions)`);
    summaryText += `The core themes center around ${topThemes.join(" and ")}. `;
  }

  summaryText += "Employees recommend prioritizing clear schedules, safety measures, and equitable logistics to guarantee success.";

  return {
    summaryText,
    sentimentTrends,
    recurringThemes
  };
}

// Initial seed mock data
const SEED_POLLS: Poll[] = [
  {
    id: "poll-hybrid-work",
    title: "Transition to 3-Day Hybrid Office Schedule",
    description: "Proposal to request team members to work from the corporate office Tuesday through Thursday, with Monday and Friday remaining optional remote days.",
    creatorId: "admin-1",
    creatorName: "Super Admin",
    status: "Active",
    pollType: "YesNo",
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    allowCommentAttachments: true,
    allowVoteEditing: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { id: "opt-hybrid-yes", pollId: "poll-hybrid-work", optionText: "Yes, I support this schedule", displayOrder: 0 },
      { id: "opt-hybrid-no", pollId: "poll-hybrid-work", optionText: "No, I prefer full remote/different days", displayOrder: 1 }
    ],
    audiences: [{ targetType: "All", targetValue: "All Organization" }]
  },
  {
    id: "poll-logo-design",
    title: "New Task Blaster Logo Identity Selection",
    description: "Choose the design template for the upcoming redesign of our internal Task Blaster gamification tool.",
    creatorId: "admin-1",
    creatorName: "Super Admin",
    status: "Active",
    pollType: "DesignComparison",
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    allowCommentAttachments: false,
    allowVoteEditing: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { 
        id: "opt-logo-a", 
        pollId: "poll-logo-design", 
        optionText: "Option A: Retro Cyberpunk Neon Logo", 
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=300&q=80", 
        displayOrder: 0 
      },
      { 
        id: "opt-logo-b", 
        pollId: "poll-logo-design", 
        optionText: "Option B: Minimalist Clean Monochrome Logo", 
        imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=400&h=300&q=80", 
        displayOrder: 1 
      }
    ],
    audiences: [{ targetType: "Department", targetValue: "Engineering" }, { targetType: "Department", targetValue: "Design" }]
  },
  {
    id: "poll-q1-kickoff",
    title: "Q1 Company Kickoff Planning & Budget",
    description: "Rate the proposed budget allotment and location itinerary schedule for the Q1 annual team building summit.",
    creatorId: "admin-1",
    creatorName: "Super Admin",
    status: "Implemented",
    pollType: "Rating10",
    startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    allowCommentAttachments: true,
    allowVoteEditing: false,
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    options: [],
    audiences: [{ targetType: "All", targetValue: "All Organization" }],
    decisionText: "Approved Q1 Summit funding of $25,000 for Denver, Colorado location due to overwhelming 8.8/10 average approval rating.",
    decisionBy: "CEO - Executive Board",
    decisionStatus: "Implemented",
    decidedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "poll-kitchen-snacks",
    title: "Office Pantry Snack Stocking Preferences",
    description: "Ranked choice polling to select the top snack configurations for office layouts.",
    creatorId: "manager-1",
    creatorName: "Office Manager",
    status: "Active",
    pollType: "RankedChoice",
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    allowCommentAttachments: false,
    allowVoteEditing: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { id: "opt-snack-fruit", pollId: "poll-kitchen-snacks", optionText: "Fresh Fruit & Organic Bars", displayOrder: 0 },
      { id: "opt-snack-chips", pollId: "poll-kitchen-snacks", optionText: "Salty Chips & Pretzels", displayOrder: 1 },
      { id: "opt-snack-sweet", pollId: "poll-kitchen-snacks", optionText: "Chocolates & Baked Cookies", displayOrder: 2 }
    ],
    audiences: [{ targetType: "Location", targetValue: "New York Office" }]
  },
  {
    id: "poll-laptop-brands",
    title: "Standard Issue Developer Laptop Upgrades",
    description: "Provide feedback on developer machine standardization for future upgrades.",
    creatorId: "admin-1",
    creatorName: "Super Admin",
    status: "Draft",
    pollType: "MultipleChoice",
    startTime: "",
    endTime: "",
    allowCommentAttachments: false,
    allowVoteEditing: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      { id: "opt-mac-pro", pollId: "poll-laptop-brands", optionText: "MacBook Pro 16\" (M3 Pro/36GB)", displayOrder: 0 },
      { id: "opt-thinkpad", pollId: "poll-laptop-brands", optionText: "Lenovo ThinkPad P1 (Gen 6)", displayOrder: 1 },
      { id: "opt-dell-xps", pollId: "poll-laptop-brands", optionText: "Dell XPS 15 (Intel i9/32GB)", displayOrder: 2 }
    ],
    audiences: [{ targetType: "Role", targetValue: "Developer" }]
  }
];

const SEED_VOTES: PollVote[] = [
  // Hybrid work votes
  { id: "v1", pollId: "poll-hybrid-work", userId: "emp-1", userName: "Alice Smith", userDepartment: "Engineering", userLocation: "New York", optionId: "opt-hybrid-yes", votedAt: new Date().toISOString() },
  { id: "v2", pollId: "poll-hybrid-work", userId: "emp-2", userName: "Bob Jones", userDepartment: "Engineering", userLocation: "Chicago", optionId: "opt-hybrid-yes", votedAt: new Date().toISOString() },
  { id: "v3", pollId: "poll-hybrid-work", userId: "emp-3", userName: "Charlie Miller", userDepartment: "Design", userLocation: "New York", optionId: "opt-hybrid-no", votedAt: new Date().toISOString() },
  { id: "v4", pollId: "poll-hybrid-work", userId: "emp-4", userName: "Diana Rose", userDepartment: "Marketing", userLocation: "Miami", optionId: "opt-hybrid-yes", votedAt: new Date().toISOString() },
  { id: "v5", pollId: "poll-hybrid-work", userId: "emp-5", userName: "Ethan Hunt", userDepartment: "Sales", userLocation: "Los Angeles", optionId: "opt-hybrid-no", votedAt: new Date().toISOString() },
  { id: "v6", pollId: "poll-hybrid-work", userId: "emp-6", userName: "Fiona Gallagher", userDepartment: "Operations", userLocation: "Chicago", optionId: "opt-hybrid-no", votedAt: new Date().toISOString() },
  
  // Design Comparison votes
  { id: "v10", pollId: "poll-logo-design", userId: "emp-1", userName: "Alice Smith", userDepartment: "Engineering", userLocation: "New York", optionId: "opt-logo-a", votedAt: new Date().toISOString() },
  { id: "v11", pollId: "poll-logo-design", userId: "emp-3", userName: "Charlie Miller", userDepartment: "Design", userLocation: "New York", optionId: "opt-logo-a", votedAt: new Date().toISOString() },
  { id: "v12", pollId: "poll-logo-design", userId: "emp-10", userName: "Grace Kelly", userDepartment: "Design", userLocation: "New York", optionId: "opt-logo-b", votedAt: new Date().toISOString() },

  // Rating Summit votes
  { id: "v20", pollId: "poll-q1-kickoff", userId: "emp-1", userName: "Alice Smith", userDepartment: "Engineering", userLocation: "New York", ratingValue: 9, votedAt: new Date().toISOString() },
  { id: "v21", pollId: "poll-q1-kickoff", userId: "emp-2", userName: "Bob Jones", userDepartment: "Engineering", userLocation: "Chicago", ratingValue: 8, votedAt: new Date().toISOString() },
  { id: "v22", pollId: "poll-q1-kickoff", userId: "emp-3", userName: "Charlie Miller", userDepartment: "Design", userLocation: "New York", ratingValue: 10, votedAt: new Date().toISOString() },
  { id: "v23", pollId: "poll-q1-kickoff", userId: "emp-4", userName: "Diana Rose", userDepartment: "Marketing", userLocation: "Miami", ratingValue: 8, votedAt: new Date().toISOString() },
  { id: "v24", pollId: "poll-q1-kickoff", userId: "emp-5", userName: "Ethan Hunt", userDepartment: "Sales", userLocation: "Los Angeles", ratingValue: 9, votedAt: new Date().toISOString() }
];

const SEED_COMMENTS: PollComment[] = [
  {
    id: "c1",
    pollId: "poll-hybrid-work",
    userId: "emp-1",
    userName: "Alice Smith",
    commentText: "I agree with this support plan. Having Tuesday to Thursday in office creates strong collaboration, while Monday/Friday is great for deep focus without commutes.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "c2",
    pollId: "poll-hybrid-work",
    userId: "emp-3",
    userName: "Charlie Miller",
    commentText: "Concerned about commute expenses and time lost. Some of us moved further out during the remote setup, so 3 days feels a bit of a burden on scheduling.",
    createdAt: new Date().toISOString()
  },
  {
    id: "c3",
    pollId: "poll-q1-kickoff",
    userId: "emp-2",
    userName: "Bob Jones",
    commentText: "The budget looks reasonable and Denver is an awesome destination. It will be helpful to establish travel guidelines early.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_AUDIT_LOGS: PollAuditLog[] = [
  { id: "al1", pollId: "poll-hybrid-work", pollTitle: "Transition to 3-Day Hybrid Office Schedule", action: "Create Poll", performedBy: "Super Admin", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "al2", pollId: "poll-q1-kickoff", pollTitle: "Q1 Company Kickoff Planning & Budget", action: "Close Poll & Implemented Decision", performedBy: "CEO - Executive Board", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
];

// Helper functions for localized State storage
const STORE_POLLS_KEY = "tm_polls_store_data";
const STORE_VOTES_KEY = "tm_polls_store_votes";
const STORE_COMMENTS_KEY = "tm_polls_store_comments";
const STORE_AUDIT_KEY = "tm_polls_store_audit";

export const getPollsData = (): {
  polls: Poll[];
  votes: PollVote[];
  comments: PollComment[];
  auditLogs: PollAuditLog[];
} => {
  const p = localStorage.getItem(STORE_POLLS_KEY);
  const v = localStorage.getItem(STORE_VOTES_KEY);
  const c = localStorage.getItem(STORE_COMMENTS_KEY);
  const a = localStorage.getItem(STORE_AUDIT_KEY);

  if (!p) {
    // Seed initial values
    localStorage.setItem(STORE_POLLS_KEY, JSON.stringify(SEED_POLLS));
    localStorage.setItem(STORE_VOTES_KEY, JSON.stringify(SEED_VOTES));
    localStorage.setItem(STORE_COMMENTS_KEY, JSON.stringify(SEED_COMMENTS));
    localStorage.setItem(STORE_AUDIT_KEY, JSON.stringify(SEED_AUDIT_LOGS));
    return { polls: SEED_POLLS, votes: SEED_VOTES, comments: SEED_COMMENTS, auditLogs: SEED_AUDIT_LOGS };
  }

  return {
    polls: JSON.parse(p),
    votes: v ? JSON.parse(v) : [],
    comments: c ? JSON.parse(c) : [],
    auditLogs: a ? JSON.parse(a) : []
  };
};

export const savePollsStore = (
  polls: Poll[],
  votes: PollVote[],
  comments: PollComment[],
  auditLogs: PollAuditLog[]
) => {
  localStorage.setItem(STORE_POLLS_KEY, JSON.stringify(polls));
  localStorage.setItem(STORE_VOTES_KEY, JSON.stringify(votes));
  localStorage.setItem(STORE_COMMENTS_KEY, JSON.stringify(comments));
  localStorage.setItem(STORE_AUDIT_KEY, JSON.stringify(auditLogs));

  // Trigger custom window event so that other components on same window reload immediately
  window.dispatchEvent(new Event("tm_polls_store_updated"));
};

// Main state manipulation actions
export const castVoteAction = (vote: Omit<PollVote, 'id' | 'votedAt'>) => {
  const { polls, votes, comments, auditLogs } = getPollsData();

  const targetPoll = polls.find(p => p.id === vote.pollId);
  if (!targetPoll) throw new Error("Poll not found.");
  if (targetPoll.status !== "Active") throw new Error("This poll is closed or not active.");

  // Check if vote editing is disabled
  const existingVoteIndex = votes.findIndex(v => v.pollId === vote.pollId && v.userId === vote.userId);
  if (existingVoteIndex !== -1 && !targetPoll.allowVoteEditing) {
    throw new Error("Editing your vote is disabled for this poll.");
  }

  const newVote: PollVote = {
    id: `v-${Math.random().toString(36).substr(2, 9)}`,
    ...vote,
    votedAt: new Date().toISOString()
  };

  const updatedVotes = [...votes];
  if (existingVoteIndex !== -1) {
    updatedVotes[existingVoteIndex] = newVote;
  } else {
    updatedVotes.push(newVote);
  }

  const updatedAudit = [
    {
      id: `al-${Math.random().toString(36).substr(2, 9)}`,
      pollId: vote.pollId,
      pollTitle: targetPoll.title,
      action: existingVoteIndex !== -1 ? "Change Vote" : "Cast Vote",
      performedBy: vote.userName,
      timestamp: new Date().toISOString()
    },
    ...auditLogs
  ];

  savePollsStore(polls, updatedVotes, comments, updatedAudit);
  toast.success("Vote recorded successfully!");
};

export const addCommentAction = (
  pollId: string,
  userId: string,
  userName: string,
  commentText: string,
  attachments?: PollCommentAttachment[]
) => {
  const { polls, votes, comments, auditLogs } = getPollsData();
  const targetPoll = polls.find(p => p.id === pollId);
  if (!targetPoll) throw new Error("Poll not found");

  const newComment: PollComment = {
    id: `c-${Math.random().toString(36).substr(2, 9)}`,
    pollId,
    userId,
    userName,
    commentText,
    attachments,
    createdAt: new Date().toISOString()
  };

  const updatedComments = [...comments, newComment];
  const updatedAudit = [
    {
      id: `al-${Math.random().toString(36).substr(2, 9)}`,
      pollId,
      pollTitle: targetPoll.title,
      action: "Add Comment",
      performedBy: userName,
      timestamp: new Date().toISOString()
    },
    ...auditLogs
  ];

  savePollsStore(polls, votes, updatedComments, updatedAudit);
  toast.success("Comment added!");
  return newComment;
};

export const createPollAction = (poll: Omit<Poll, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { polls, votes, comments, auditLogs } = getPollsData();
  
  const newPoll: Poll = {
    ...poll,
    id: `poll-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedPolls = [newPoll, ...polls];
  const updatedAudit = [
    {
      id: `al-${Math.random().toString(36).substr(2, 9)}`,
      pollId: newPoll.id,
      pollTitle: newPoll.title,
      action: "Create Poll",
      performedBy: poll.creatorName,
      timestamp: new Date().toISOString()
    },
    ...auditLogs
  ];

  savePollsStore(updatedPolls, votes, comments, updatedAudit);
  toast.success(`Poll "${newPoll.title}" created successfully!`);
  return newPoll;
};

export const updatePollStatusAction = (pollId: string, status: PollStatus, performedBy: string) => {
  const { polls, votes, comments, auditLogs } = getPollsData();
  const targetIndex = polls.findIndex(p => p.id === pollId);
  if (targetIndex === -1) throw new Error("Poll not found");

  const updatedPolls = [...polls];
  const oldPoll = updatedPolls[targetIndex];
  updatedPolls[targetIndex] = {
    ...oldPoll,
    status,
    updatedAt: new Date().toISOString()
  };

  const updatedAudit = [
    {
      id: `al-${Math.random().toString(36).substr(2, 9)}`,
      pollId,
      pollTitle: oldPoll.title,
      action: `Update Status: ${status}`,
      performedBy,
      timestamp: new Date().toISOString()
    },
    ...auditLogs
  ];

  savePollsStore(updatedPolls, votes, comments, updatedAudit);
  toast.info(`Poll status updated to ${status}`);
};

export const recordDecisionAction = (
  pollId: string,
  decisionText: string,
  decisionStatus: Poll['decisionStatus'],
  performedBy: string
) => {
  const { polls, votes, comments, auditLogs } = getPollsData();
  const targetIndex = polls.findIndex(p => p.id === pollId);
  if (targetIndex === -1) throw new Error("Poll not found");

  const updatedPolls = [...polls];
  const oldPoll = updatedPolls[targetIndex];
  updatedPolls[targetIndex] = {
    ...oldPoll,
    decisionText,
    decisionBy: performedBy,
    decisionStatus,
    decidedAt: new Date().toISOString(),
    status: decisionStatus === "Implemented" ? "Implemented" : oldPoll.status,
    updatedAt: new Date().toISOString()
  };

  const updatedAudit = [
    {
      id: `al-${Math.random().toString(36).substr(2, 9)}`,
      pollId,
      pollTitle: oldPoll.title,
      action: `Record Decision: ${decisionStatus}`,
      performedBy,
      timestamp: new Date().toISOString()
    },
    ...auditLogs
  ];

  savePollsStore(updatedPolls, votes, comments, updatedAudit);
  toast.success("Executive decision recorded!");
};
