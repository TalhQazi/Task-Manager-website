import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import { Card } from "@/components/admin/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/admin/ui/radio-group";
import { Label } from "@/components/admin/ui/label";
import { CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "short-answer";
  options?: string[];
  correctAnswer: string;
}

interface AnnouncementQuizProps {
  announcementId: string;
  announcementTitle: string;
  questions: QuizQuestion[];
  onComplete: (results: { passed: boolean; score: number }) => void;
  onCancel: () => void;
}

export default function AnnouncementQuiz({
  announcementId,
  announcementTitle,
  questions,
  onComplete,
  onCancel,
}: AnnouncementQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const question = questions[currentQuestion];
  const selectedAnswer = answers[question.id] || "";
  const isAnswered = selectedAnswer.length > 0;

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      let correctCount = 0;
      questions.forEach((q) => {
        if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
          correctCount++;
        }
      });

      const percentage = (correctCount / questions.length) * 100;
      setScore(percentage);
      setShowResults(true);
    }
  };

  const handleAnswer = (value: string) => {
    setAnswers({
      ...answers,
      [question.id]: value,
    });
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const handleComplete = () => {
    onComplete({
      passed: score >= 70,
      score,
    });
  };

  if (showResults) {
    const passed = score >= 70;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-2xl rounded-lg overflow-hidden shadow-2xl bg-gradient-to-b from-gray-900 to-black border border-white/10"
        >
          {/* Results Header */}
          <div
            className={`p-8 text-center ${
              passed
                ? "bg-gradient-to-r from-green-600 to-green-700"
                : "bg-gradient-to-r from-red-600 to-red-700"
            }`}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4"
            >
              {passed ? (
                <CheckCircle2 className="h-16 w-16 text-white mx-auto" />
              ) : (
                <AlertCircle className="h-16 w-16 text-white mx-auto" />
              )}
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {passed ? "✓ Quiz Passed!" : "Quiz Not Passed"}
            </h2>
            <p className="text-white/90">
              {passed
                ? "You have successfully completed the acknowledgement quiz"
                : "You need to score 70% or higher to pass"}
            </p>
          </div>

          {/* Results Content */}
          <div className="p-8 space-y-6">
            {/* Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="text-6xl font-bold text-white mb-2">{Math.round(score)}%</div>
              <p className="text-white/60">
                {Object.values(answers).filter(
                  (ans, idx) =>
                    ans.toLowerCase().trim() ===
                    questions[idx].correctAnswer.toLowerCase().trim()
                ).length}{" "}
                out of {questions.length} questions correct
              </p>
            </motion.div>

            {/* Feedback */}
            <Card className="border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-blue-200">
                {passed
                  ? "Your acknowledgement of this policy/training material has been recorded. Thank you for your attention."
                  : "Please retake the quiz to ensure you understand the policy. You must score 70% or higher to complete this acknowledgement."}
              </p>
            </Card>

            {/* Question Review */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold">Question Review:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {questions.map((q, idx) => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-3 rounded-lg border ${
                        isCorrect
                          ? "border-green-500/30 bg-green-500/10"
                          : "border-red-500/30 bg-red-500/10"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">Q{idx + 1}: {q.question}</p>
                          <p className={`text-xs mt-1 ${isCorrect ? "text-green-300" : "text-red-300"}`}>
                            Your answer: {userAnswer}
                          </p>
                        </div>
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 ml-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-8 py-6 flex justify-between items-center bg-white/[0.02]">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2 border-white/20"
            >
              <RotateCcw className="h-4 w-4" />
              Retake Quiz
            </Button>
            <div className="flex gap-3">
              {!passed && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="border-white/20"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleComplete}
                disabled={!passed}
                className={
                  passed
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg hover:shadow-green-600/20"
                    : "bg-gray-600 cursor-not-allowed"
                }
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl rounded-lg overflow-hidden shadow-2xl bg-gradient-to-b from-gray-900 to-black border border-white/10"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">{announcementTitle}</h2>
          <p className="text-blue-100">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          {/* Progress bar */}
          <motion.div
            className="h-2 bg-blue-900/50 rounded-full mt-4 overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-300"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 min-h-80">
          {/* Question */}
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-xl font-semibold text-white mb-6">{question.question}</h3>

            {/* Options */}
            {question.type === "multiple-choice" && question.options ? (
              <RadioGroup value={selectedAnswer} onValueChange={handleAnswer}>
                <div className="space-y-3">
                  {question.options.map((option, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <Label
                        htmlFor={`option-${idx}`}
                        className="flex-1 cursor-pointer text-white"
                      >
                        {option}
                      </Label>
                    </motion.div>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <input
                type="text"
                value={selectedAnswer}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-blue-500 focus:outline-none transition-all"
              />
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-8 py-6 flex justify-between items-center bg-white/[0.02]">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-white/20"
          >
            Cancel Quiz
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isAnswered}
            className={
              isAnswered
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                : "bg-gray-600 cursor-not-allowed"
            }
          >
            {currentQuestion === questions.length - 1 ? "Submit Quiz" : "Next Question"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
