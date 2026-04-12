"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

type CategoryScores = {
  content: number;
  clarity: number;
  relevance: number;
  structure: number;
  confidence: number;
};

type Feedback = {
  overall_score: number;
  category_scores: CategoryScores;
  strengths: string[];
  improvements: string[];
  improved_answer: string;
  error?: string;
};

type ResultItem = {
  question: string;
  answer: string;
  feedback: Feedback;
};

type InterviewSummary = {
  overall_score: number;
  hire_signal: "Weak" | "Moderate" | "Strong";
  top_strengths: string[];
  top_improvements: string[];
  final_recommendation: string;
  next_steps: string[];
  error?: string;
};

type SavedSession = {
  id: string;
  date: string;
  role: string;
  totalQuestions: number;
  overallScore: number;
  hireSignal: string;
};

export default function Home() {
  const [role, setRole] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  const [questionLoading, setQuestionLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);

  const totalQuestions = 5;
  const currentQuestionNumber = results.length + 1;

  const recognitionRef = useRef<any>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("aim_sessions");
    if (stored) {
      try {
        setSavedSessions(JSON.parse(stored));
      } catch {
        setSavedSessions([]);
      }
    }

    if (typeof window !== "undefined") {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        setVoiceSupported(true);
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-GB";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setAnswer(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const averageQuestionScore = useMemo(() => {
    if (results.length === 0) return 0;
    const total = results.reduce(
      (sum, item) => sum + (item.feedback?.overall_score || 0),
      0
    );
    return Math.round((total / results.length) * 10) / 10;
  }, [results]);

  const saveSession = (sessionSummary: InterviewSummary) => {
    const newSession: SavedSession = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString(),
      role,
      totalQuestions,
      overallScore: sessionSummary.overall_score,
      hireSignal: sessionSummary.hire_signal,
    };

    const nextSessions = [newSession, ...savedSessions].slice(0, 8);
    setSavedSessions(nextSessions);
    localStorage.setItem("aim_sessions", JSON.stringify(nextSessions));
  };

  const startVoiceInput = () => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopVoiceInput = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const resetInterview = () => {
    setQuestion("");
    setAnswer("");
    setFeedback(null);
    setResults([]);
    setSummary(null);
    setInterviewStarted(false);
    setInterviewFinished(false);
    setQuestionLoading(false);
    setFeedbackLoading(false);
    setSummaryLoading(false);
    stopVoiceInput();
  };

  const fetchQuestion = async (questionNumber: number, history: ResultItem[]) => {
    try {
      setQuestionLoading(true);
      setQuestion("");
      setAnswer("");
      setFeedback(null);

      const res = await fetch("/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          questionNumber,
          totalQuestions,
          history: history.map((item) => ({
            question: item.question,
            answer: item.answer,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setQuestion(data.error || "Failed to generate interview question.");
        return;
      }

      setQuestion(data.question || "Tell me about yourself.");
    } catch {
      setQuestion("Something went wrong while generating the question.");
    } finally {
      setQuestionLoading(false);
    }
  };

  const startInterview = async () => {
    setInterviewStarted(true);
    setInterviewFinished(false);
    setResults([]);
    setSummary(null);
    await fetchQuestion(1, []);
  };

  const getFeedback = async () => {
    try {
      setFeedbackLoading(true);
      setFeedback(null);

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          answer,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setFeedback({
          overall_score: 0,
          category_scores: {
            content: 0,
            clarity: 0,
            relevance: 0,
            structure: 0,
            confidence: 0,
          },
          strengths: [],
          improvements: [],
          improved_answer: "",
          error: data.error || "Failed to evaluate answer.",
        });
        return;
      }

      setFeedback(data);
    } catch {
      setFeedback({
        overall_score: 0,
        category_scores: {
          content: 0,
          clarity: 0,
          relevance: 0,
          structure: 0,
          confidence: 0,
        },
        strengths: [],
        improvements: [],
        improved_answer: "",
        error: "Something went wrong while getting feedback.",
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const nextStep = async () => {
    if (!feedback) return;

    const updatedResults = [...results, { question, answer, feedback }];
    setResults(updatedResults);

    if (updatedResults.length >= totalQuestions) {
      setInterviewFinished(true);
      setSummaryLoading(true);

      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            results: updatedResults,
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          const fallbackSummary: InterviewSummary = {
            overall_score: Math.round(
              updatedResults.reduce(
                (sum, item) => sum + (item.feedback?.overall_score || 0),
                0
              ) / updatedResults.length
            ),
            hire_signal: "Moderate",
            top_strengths: ["Good effort across the interview"],
            top_improvements: ["Add more structure to answers"],
            final_recommendation: "Keep practicing with clearer examples.",
            next_steps: [
              "Practice STAR-format answers",
              "Use more specific examples",
              "Improve concise delivery",
            ],
            error: "Summary generation partially failed.",
          };
          setSummary(fallbackSummary);
          saveSession(fallbackSummary);
        } else {
          setSummary(data);
          saveSession(data);
        }
      } catch {
        const fallbackSummary: InterviewSummary = {
          overall_score: Math.round(
            updatedResults.reduce(
              (sum, item) => sum + (item.feedback?.overall_score || 0),
              0
            ) / updatedResults.length
          ),
          hire_signal: "Moderate",
          top_strengths: ["Good effort across the interview"],
          top_improvements: ["Add more structure to answers"],
          final_recommendation: "Keep practicing with clearer examples.",
          next_steps: [
            "Practice STAR-format answers",
            "Use more specific examples",
            "Improve concise delivery",
          ],
          error: "Summary generation partially failed.",
        };
        setSummary(fallbackSummary);
        saveSession(fallbackSummary);
      } finally {
        setSummaryLoading(false);
        setQuestion("");
        setAnswer("");
        setFeedback(null);
      }

      return;
    }

    await fetchQuestion(updatedResults.length + 1, updatedResults);
  };

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-950 p-6">
          <div>
            <h1 className="mb-3 text-4xl font-bold md:text-5xl">
              AIM – AI Mentor 🚀
            </h1>
            <p className="max-w-2xl text-gray-400">
              Multi-question interview practice with AI coaching, detailed scoring,
              session history, voice answers, and authentication.
            </p>
          </div>

          <div className="ml-6 flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-700">
                  Sign In
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            {!interviewStarted && (
              <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Enter your profile or target role
                </label>

                <input
                  className="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-400 outline-none"
                  placeholder="Example: Graduate looking for software engineering placement"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />

                <button
                  onClick={startInterview}
                  disabled={!role || questionLoading}
                  className="w-full rounded-lg bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {questionLoading ? "Starting..." : "Start 5-Question Interview"}
                </button>
              </div>
            )}

            {interviewStarted && !interviewFinished && (
              <>
                <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-purple-300">
                      Question {currentQuestionNumber} of {totalQuestions}
                    </h2>
                    <span className="text-sm text-gray-400">
                      Average score so far: {averageQuestionScore}/10
                    </span>
                  </div>

                  <p className="leading-7 text-gray-100">
                    {questionLoading ? "Generating question..." : question}
                  </p>
                </div>

                {question && (
                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Your answer
                    </label>

                    <textarea
                      className="mb-4 min-h-[180px] w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-400 outline-none"
                      placeholder="Write or dictate your answer here..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />

                    {voiceSupported && (
                      <div className="mb-4 flex gap-3">
                        {!isListening ? (
                          <button
                            onClick={startVoiceInput}
                            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700"
                          >
                            Start Voice Answer
                          </button>
                        ) : (
                          <button
                            onClick={stopVoiceInput}
                            className="rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-700"
                          >
                            Stop Voice Answer
                          </button>
                        )}

                        <span className="self-center text-sm text-gray-400">
                          {isListening ? "Listening..." : "Voice input ready"}
                        </span>
                      </div>
                    )}

                    {!feedback && (
                      <button
                        onClick={getFeedback}
                        disabled={!answer || feedbackLoading}
                        className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {feedbackLoading ? "Evaluating..." : "Get AI Feedback"}
                      </button>
                    )}
                  </div>
                )}

                {feedback && (
                  <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
                    <h2 className="mb-4 text-2xl font-semibold text-green-300">
                      AI Feedback
                    </h2>

                    {feedback.error ? (
                      <p className="text-red-400">{feedback.error}</p>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-lg font-semibold">
                          Overall score:{" "}
                          <span className="text-yellow-300">
                            {feedback.overall_score}/10
                          </span>
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                          <ScoreCard label="Content" value={feedback.category_scores.content} />
                          <ScoreCard label="Clarity" value={feedback.category_scores.clarity} />
                          <ScoreCard label="Relevance" value={feedback.category_scores.relevance} />
                          <ScoreCard label="Structure" value={feedback.category_scores.structure} />
                          <ScoreCard label="Confidence" value={feedback.category_scores.confidence} />
                        </div>

                        <div>
                          <h3 className="mb-2 text-lg font-semibold text-blue-300">
                            Strengths
                          </h3>
                          <ul className="list-disc space-y-1 pl-5 text-gray-200">
                            {feedback.strengths?.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="mb-2 text-lg font-semibold text-orange-300">
                            Improvements
                          </h3>
                          <ul className="list-disc space-y-1 pl-5 text-gray-200">
                            {feedback.improvements?.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="mb-2 text-lg font-semibold text-purple-300">
                            Improved Answer
                          </h3>
                          <div className="rounded-lg border border-gray-700 bg-gray-950 p-4 leading-7 text-gray-100">
                            {feedback.improved_answer}
                          </div>
                        </div>

                        <button
                          onClick={nextStep}
                          className="w-full rounded-lg bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-700"
                        >
                          {currentQuestionNumber === totalQuestions
                            ? "Finish Interview"
                            : "Next Question"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {interviewFinished && (
              <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
                <h2 className="mb-4 text-3xl font-semibold text-purple-300">
                  Final Interview Summary
                </h2>

                {summaryLoading && <p className="text-gray-400">Generating summary...</p>}

                {summary && (
                  <div className="space-y-6">
                    <p className="text-lg">
                      Final score:{" "}
                      <span className="font-semibold text-yellow-300">
                        {summary.overall_score}/10
                      </span>
                    </p>

                    <p className="text-lg">
                      Hire signal:{" "}
                      <span className="font-semibold text-green-300">
                        {summary.hire_signal}
                      </span>
                    </p>

                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-blue-300">
                        Top Strengths
                      </h3>
                      <ul className="list-disc space-y-1 pl-5 text-gray-200">
                        {summary.top_strengths?.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-orange-300">
                        Top Improvements
                      </h3>
                      <ul className="list-disc space-y-1 pl-5 text-gray-200">
                        {summary.top_improvements?.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-purple-300">
                        Final Recommendation
                      </h3>
                      <p className="text-gray-100">{summary.final_recommendation}</p>
                    </div>

                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-cyan-300">
                        Next Steps
                      </h3>
                      <ul className="list-disc space-y-1 pl-5 text-gray-200">
                        {summary.next_steps?.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={resetInterview}
                      className="w-full rounded-lg bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700"
                    >
                      Start New Interview
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-100">
                Account
              </h2>

              <Show when="signed-out">
                <p className="mb-4 text-sm text-gray-400">
                  Sign in to make AIM feel more like a real product and prepare for saved accounts.
                </p>
                <SignInButton mode="modal">
                  <button className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-700">
                    Sign In
                  </button>
                </SignInButton>
              </Show>

              <Show when="signed-in">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300">You are signed in.</p>
                  <UserButton />
                </div>
              </Show>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-100">
                What’s included now
              </h2>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ 5-question interview flow</p>
                <p>✓ Detailed category scoring</p>
                <p>✓ Improved answer rewrite</p>
                <p>✓ Final interview summary</p>
                <p>✓ Voice answer input</p>
                <p>✓ Local session history</p>
                <p>✓ Sign-in with Clerk</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-100">
                Session History
              </h2>

              {savedSessions.length === 0 ? (
                <p className="text-sm text-gray-400">No saved sessions yet.</p>
              ) : (
                <div className="space-y-3">
                  {savedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-lg border border-gray-800 bg-gray-900 p-4"
                    >
                      <p className="font-semibold text-white">{session.role}</p>
                      <p className="text-sm text-gray-400">{session.date}</p>
                      <p className="mt-2 text-sm text-yellow-300">
                        Score: {session.overallScore}/10
                      </p>
                      <p className="text-sm text-green-300">
                        Hire Signal: {session.hireSignal}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-center">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}/10</p>
    </div>
  );
}