import { describe, it, expect } from "vitest";
import { analyzeCommentsLocally, type PollComment } from "../lib/pollsStore";

describe("Ideas & Polls AI Sentiment Engine Tests", () => {
  it("should calculate positive sentiment dominance correctly", () => {
    const comments: PollComment[] = [
      {
        id: "c1",
        pollId: "p1",
        userId: "u1",
        userName: "Alice",
        commentText: "This is a great idea and support this great change!",
        createdAt: new Date().toISOString()
      },
      {
        id: "c2",
        pollId: "p1",
        userId: "u2",
        userName: "Bob",
        commentText: "I agree with this schedule, it looks helpful.",
        createdAt: new Date().toISOString()
      }
    ];

    const result = analyzeCommentsLocally(comments, "Test Poll Title");
    
    // Both comments are clearly positive based on keyword dict
    expect(result.sentimentTrends.positive).toBe(100);
    expect(result.sentimentTrends.negative).toBe(0);
    expect(result.sentimentTrends.neutral).toBe(0);
    expect(result.summaryText).toContain("leans **positive** (100% favorable)");
  });

  it("should calculate negative sentiment dominance correctly", () => {
    const comments: PollComment[] = [
      {
        id: "c1",
        pollId: "p1",
        userId: "u1",
        userName: "Alice",
        commentText: "I disagree. This is a bad waste of budget.",
        createdAt: new Date().toISOString()
      },
      {
        id: "c2",
        pollId: "p1",
        userId: "u2",
        userName: "Bob",
        commentText: "Concerned about risks and terrible commute schedule.",
        createdAt: new Date().toISOString()
      }
    ];

    const result = analyzeCommentsLocally(comments, "Test Poll Title");
    
    expect(result.sentimentTrends.negative).toBe(100);
    expect(result.sentimentTrends.positive).toBe(0);
    expect(result.summaryText).toContain("highlights **critical concerns** (100% unfavorable)");
  });

  it("should capture discussion themes correctly", () => {
    const comments: PollComment[] = [
      {
        id: "c1",
        pollId: "p1",
        userId: "u1",
        userName: "Alice",
        commentText: "The budget and cost are too high. Very expensive.",
        createdAt: new Date().toISOString()
      },
      {
        id: "c2",
        pollId: "p1",
        userId: "u2",
        userName: "Bob",
        commentText: "I want to discuss the implementation schedule and time delays.",
        createdAt: new Date().toISOString()
      }
    ];

    const result = analyzeCommentsLocally(comments, "Test Poll Title");
    
    const costTheme = result.recurringThemes.find(t => t.theme === "Cost/Budget Concerns");
    const timelineTheme = result.recurringThemes.find(t => t.theme === "Implementation Timeline");

    expect(costTheme).toBeDefined();
    expect(costTheme?.frequency).toBe(1);
    expect(costTheme?.type).toBe("concern");

    expect(timelineTheme).toBeDefined();
    expect(timelineTheme?.frequency).toBe(1);
    expect(timelineTheme?.type).toBe("concern");
  });

  it("should handle empty feedback list gracefully", () => {
    const result = analyzeCommentsLocally([], "Empty Test Poll");
    expect(result.sentimentTrends.neutral).toBe(100);
    expect(result.sentimentTrends.positive).toBe(0);
    expect(result.sentimentTrends.negative).toBe(0);
    expect(result.recurringThemes.length).toBe(0);
  });
});
