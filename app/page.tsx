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

type SectionFeedbackItem = {
  score: number;
  feedback: string;
  improvement: string;
};

type Feedback = {
  overall_score: number;
  category_scores: CategoryScores;
  pace_score?: number;
  section_feedback?: {
    content: SectionFeedbackItem;
    clarity: SectionFeedbackItem;
    relevance: SectionFeedbackItem;
    structure: SectionFeedbackItem;
    confidence: SectionFeedbackItem;
    pace: SectionFeedbackItem;
  };
  strengths: string[];
  improvements: string[];
  improved_answer: string;
  error?: string;
};

type AudioMetrics = {
  averageVolume: number;
  peakVolume: number;
  volumeVariation: number;
  silenceRatio: number;
  lowVolumeRatio: number;
  estimatedPauseCount: number;
  longPauseCount: number;
  voicedFrameRatio: number;
};

type VoiceAnalysis = {
  paceScore: number;
  fillerScore: number;
  confidenceScore: number;
  energyScore: number;
  clarityScore?: number;
  structureScore?: number;
  overallVoiceScore: number;
  metrics: {
    wordCount: number;
    sentenceCount: number;
    fillerCount: number;
    fillerRate: number;
    hedgeCount: number;
    hedgeRate?: number;
    repetitionCount: number;
    structureMarkerCount: number;
    exampleMarkerCount: number;
    estimatedWPM: number;
    averageSentenceLength: number;
    averageVolume: number;
    peakVolume: number;
    volumeVariation: number;
    silenceRatio: number;
    lowVolumeRatio: number;
    estimatedPauseCount: number;
    longPauseCount: number;
    voicedFrameRatio: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
  };
  evidence: {
    fillersDetected: string[];
    hedgesDetected: string[];
  };
  error?: string;
};

type ResultItem = {
  question: string;
  answer: string;
  feedback: Feedback;
  voiceAnalysis?: VoiceAnalysis | null;
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

const defaultAudioMetrics: AudioMetrics = {
  averageVolume: 0,
  peakVolume: 0,
  volumeVariation: 0,
  silenceRatio: 1,
  lowVolumeRatio: 1,
  estimatedPauseCount: 0,
  longPauseCount: 0,
  voicedFrameRatio: 0,
};

export default function Home() {
  const [role, setRole] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysis | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  const [questionLoading, setQuestionLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [voiceAnalysisLoading, setVoiceAnalysisLoading] = useState(false);

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);

  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cleaningTranscript, setCleaningTranscript] = useState(false);

  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const lastSpokenQuestionRef = useRef("");
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const autoStartListeningAfterSpeechRef = useRef(false);

  const recordingStartRef = useRef<number | null>(null);
  const answerDurationSecondsRef = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const audioSamplesRef = useRef<number[]>([]);

  const totalQuestions = 5;
  const currentQuestionNumber = results.length + 1;

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
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        setVoiceSupported(true);
        const recognition = new SpeechRecognitionClass();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-GB";

        recognition.onresult = (event: any) => {
          let newFinalText = "";
          let newInterimText = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              newFinalText += transcriptPart + " ";
            } else {
              newInterimText += transcriptPart;
            }
          }

          if (newFinalText) {
            finalTranscriptRef.current =
              (finalTranscriptRef.current + " " + newFinalText).trim();
          }

          interimTranscriptRef.current = newInterimText.trim();

          const combined = [
            finalTranscriptRef.current,
            interimTranscriptRef.current,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

          setAnswer(combined);
        };

        recognition.onend = () => {
          setIsListening(false);

          const combined = [
            finalTranscriptRef.current,
            interimTranscriptRef.current,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

          if (combined) {
            setAnswer(combined);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }

      const loadVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      cleanupAudioMonitoring();

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    if (
      !question ||
      !speakerEnabled ||
      !hasUserInteracted ||
      question === lastSpokenQuestionRef.current
    ) {
      return;
    }

    speakQuestion(question, true);
    lastSpokenQuestionRef.current = question;
  }, [question, speakerEnabled, hasUserInteracted]);

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

  const cleanupAudioMonitoring = () => {
    if (audioIntervalRef.current) {
      window.clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }

    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch {}
      audioSourceRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {}
      analyserRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
  };

  const startAudioMonitoring = async () => {
    cleanupAudioMonitoring();
    audioSamplesRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioStreamRef.current = stream;

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("AudioContext is not supported.");
    }

    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    audioSourceRef.current = source;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.35;
    analyserRef.current = analyser;

    source.connect(analyser);

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    audioIntervalRef.current = window.setInterval(() => {
      analyser.getByteTimeDomainData(dataArray);

      let sumSquares = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const centred = (dataArray[i] - 128) / 128;
        sumSquares += centred * centred;
      }

      const rms = Math.sqrt(sumSquares / dataArray.length);
      const scaledVolume = rms * 100;
      audioSamplesRef.current.push(scaledVolume);
    }, 100);
  };

  const calculateAudioMetrics = (): AudioMetrics => {
    const samples = audioSamplesRef.current;

    if (!samples.length) {
      return { ...defaultAudioMetrics };
    }

    const averageVolume =
      samples.reduce((sum, value) => sum + value, 0) / samples.length;

    const peakVolume = Math.max(...samples);

    const variance =
      samples.reduce(
        (sum, value) => sum + Math.pow(value - averageVolume, 2),
        0
      ) / samples.length;

    const volumeVariation = Math.sqrt(variance);

    const silenceThreshold = 6;
    const lowVolumeThreshold = 12;

    let silenceFrames = 0;
    let lowVolumeFrames = 0;
    let voicedFrames = 0;
    let estimatedPauseCount = 0;
    let longPauseCount = 0;
    let currentSilentRun = 0;

    for (const sample of samples) {
      if (sample < silenceThreshold) {
        silenceFrames += 1;
        currentSilentRun += 1;
      } else {
        voicedFrames += 1;

        if (currentSilentRun >= 3) {
          estimatedPauseCount += 1;
        }

        if (currentSilentRun >= 8) {
          longPauseCount += 1;
        }

        currentSilentRun = 0;
      }

      if (sample >= silenceThreshold && sample < lowVolumeThreshold) {
        lowVolumeFrames += 1;
      }
    }

    if (currentSilentRun >= 3) estimatedPauseCount += 1;
    if (currentSilentRun >= 8) longPauseCount += 1;

    return {
      averageVolume: Number(averageVolume.toFixed(2)),
      peakVolume: Number(peakVolume.toFixed(2)),
      volumeVariation: Number(volumeVariation.toFixed(2)),
      silenceRatio: Number((silenceFrames / samples.length).toFixed(3)),
      lowVolumeRatio: Number((lowVolumeFrames / samples.length).toFixed(3)),
      estimatedPauseCount,
      longPauseCount,
      voicedFrameRatio: Number((voicedFrames / samples.length).toFixed(3)),
    };
  };

  const runVoiceAnalysis = async (
    transcript: string,
    durationSeconds: number | null,
    audioMetrics: AudioMetrics
  ) => {
    if (!transcript.trim()) return null;

    try {
      setVoiceAnalysisLoading(true);

      const res = await fetch("/api/voice-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          durationSeconds,
          audioMetrics,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const fallback: VoiceAnalysis = {
          paceScore: 0,
          fillerScore: 0,
          confidenceScore: 0,
          energyScore: 0,
          clarityScore: 0,
          structureScore: 0,
          overallVoiceScore: 0,
          metrics: {
            wordCount: 0,
            sentenceCount: 0,
            fillerCount: 0,
            fillerRate: 0,
            hedgeCount: 0,
            hedgeRate: 0,
            repetitionCount: 0,
            structureMarkerCount: 0,
            exampleMarkerCount: 0,
            estimatedWPM: 0,
            averageSentenceLength: 0,
            averageVolume: audioMetrics.averageVolume,
            peakVolume: audioMetrics.peakVolume,
            volumeVariation: audioMetrics.volumeVariation,
            silenceRatio: audioMetrics.silenceRatio,
            lowVolumeRatio: audioMetrics.lowVolumeRatio,
            estimatedPauseCount: audioMetrics.estimatedPauseCount,
            longPauseCount: audioMetrics.longPauseCount,
            voicedFrameRatio: audioMetrics.voicedFrameRatio,
          },
          feedback: {
            strengths: [],
            improvements: [],
          },
          evidence: {
            fillersDetected: [],
            hedgesDetected: [],
          },
          error: data.error || "Voice analysis failed.",
        };

        setVoiceAnalysis(fallback);
        return fallback;
      }

      setVoiceAnalysis(data);
      return data as VoiceAnalysis;
    } catch {
      const fallback: VoiceAnalysis = {
        paceScore: 0,
        fillerScore: 0,
        confidenceScore: 0,
        energyScore: 0,
        clarityScore: 0,
        structureScore: 0,
        overallVoiceScore: 0,
        metrics: {
          wordCount: 0,
          sentenceCount: 0,
          fillerCount: 0,
          fillerRate: 0,
          hedgeCount: 0,
          hedgeRate: 0,
          repetitionCount: 0,
          structureMarkerCount: 0,
          exampleMarkerCount: 0,
          estimatedWPM: 0,
          averageSentenceLength: 0,
          averageVolume: audioMetrics.averageVolume,
          peakVolume: audioMetrics.peakVolume,
          volumeVariation: audioMetrics.volumeVariation,
          silenceRatio: audioMetrics.silenceRatio,
          lowVolumeRatio: audioMetrics.lowVolumeRatio,
          estimatedPauseCount: audioMetrics.estimatedPauseCount,
          longPauseCount: audioMetrics.longPauseCount,
          voicedFrameRatio: audioMetrics.voicedFrameRatio,
        },
        feedback: {
          strengths: [],
          improvements: [],
        },
        evidence: {
          fillersDetected: [],
          hedgesDetected: [],
        },
        error: "Something went wrong while analysing voice delivery.",
      };

      setVoiceAnalysis(fallback);
      return fallback;
    } finally {
      setVoiceAnalysisLoading(false);
    }
  };

  const getPreferredFemaleVoice = () => {
    const voices = voicesRef.current;

    const preferredNames = [
      "Sonia",
      "Libby",
      "Olivia",
      "Aria",
      "Serena",
      "Samantha",
      "Karen",
      "Moira",
      "Natasha",
      "Victoria",
      "Emma",
      "Amy",
      "Zira",
    ];

    for (const name of preferredNames) {
      const match = voices.find(
        (voice) =>
          voice.name.toLowerCase().includes(name.toLowerCase()) &&
          voice.lang.toLowerCase().startsWith("en")
      );
      if (match) return match;
    }

    const englishFemaleHint = voices.find(
      (voice) =>
        voice.lang.toLowerCase().startsWith("en") &&
        /female|woman|girl|aria|serena|samantha|karen|zira|natasha|olivia|amy|emma|sonia|libby/i.test(
          voice.name
        )
    );
    if (englishFemaleHint) return englishFemaleHint;

    const britishEnglish = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en-gb")
    );
    if (britishEnglish) return britishEnglish;

    const anyEnglish = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en")
    );
    if (anyEnglish) return anyEnglish;

    return voices[0];
  };

  const stopQuestionSpeech = () => {
    autoStartListeningAfterSpeechRef.current = false;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsSpeakingQuestion(false);
  };

  const startVoiceInput = async () => {
    if (!recognitionRef.current) return;

    try {
      interimTranscriptRef.current = "";
      audioSamplesRef.current = [];
      recordingStartRef.current = Date.now();
      setVoiceAnalysis(null);

      await startAudioMonitoring();

      setIsListening(true);
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
      recordingStartRef.current = null;
      cleanupAudioMonitoring();
    }
  };

  const speakQuestion = (text: string, autoStartListening: boolean) => {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis ||
      !text.trim()
    ) {
      if (autoStartListening) {
        void startVoiceInput();
      }
      return;
    }

    stopQuestionSpeech();
    autoStartListeningAfterSpeechRef.current = autoStartListening;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = "en-GB";

    const preferredVoice = getPreferredFemaleVoice();
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    }

    utterance.onstart = () => {
      setIsSpeakingQuestion(true);
    };

    utterance.onend = () => {
      setIsSpeakingQuestion(false);

      if (autoStartListeningAfterSpeechRef.current) {
        autoStartListeningAfterSpeechRef.current = false;
        void startVoiceInput();
      }
    };

    utterance.onerror = () => {
      setIsSpeakingQuestion(false);

      if (autoStartListeningAfterSpeechRef.current) {
        autoStartListeningAfterSpeechRef.current = false;
        void startVoiceInput();
      }
    };

    setIsSpeakingQuestion(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopVoiceInput = async () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);

    const durationSeconds = recordingStartRef.current
      ? Math.max(1, Math.round((Date.now() - recordingStartRef.current) / 1000))
      : null;

    answerDurationSecondsRef.current = durationSeconds;
    recordingStartRef.current = null;

    const audioMetrics = calculateAudioMetrics();
    cleanupAudioMonitoring();

    const combined = [finalTranscriptRef.current, interimTranscriptRef.current]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (combined) {
      setAnswer(combined);
      const cleaned = await cleanTranscript(combined);
      await runVoiceAnalysis(cleaned || combined, durationSeconds, audioMetrics);
    }
  };

  const clearVoiceAnswer = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    cleanupAudioMonitoring();

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    recordingStartRef.current = null;
    answerDurationSecondsRef.current = null;
    setIsListening(false);
    setAnswer("");
    setVoiceAnalysis(null);
  };

  const cleanTranscript = async (rawTranscript: string) => {
    if (!rawTranscript.trim()) return rawTranscript;

    try {
      setCleaningTranscript(true);

      const res = await fetch("/api/clean-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: rawTranscript,
        }),
      });

      const data = await res.json();

      if (res.ok && data.cleanedTranscript) {
        const cleaned = data.cleanedTranscript.trim();
        finalTranscriptRef.current = cleaned;
        interimTranscriptRef.current = "";
        setAnswer(cleaned);
        return cleaned;
      }

      return rawTranscript;
    } catch (error) {
      console.error("Transcript cleanup failed:", error);
      return rawTranscript;
    } finally {
      setCleaningTranscript(false);
    }
  };

  const resetInterview = () => {
    setQuestion("");
    setAnswer("");
    setFeedback(null);
    setVoiceAnalysis(null);
    setResults([]);
    setSummary(null);
    setInterviewStarted(false);
    setInterviewFinished(false);
    setQuestionLoading(false);
    setFeedbackLoading(false);
    setSummaryLoading(false);
    setCleaningTranscript(false);
    setVoiceAnalysisLoading(false);

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    cleanupAudioMonitoring();
    stopQuestionSpeech();

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    lastSpokenQuestionRef.current = "";
    recordingStartRef.current = null;
    answerDurationSecondsRef.current = null;
    setIsListening(false);
  };

  const fetchQuestion = async (questionNumber: number, history: ResultItem[]) => {
    try {
      setQuestionLoading(true);
      setQuestion("");
      setAnswer("");
      setFeedback(null);
      setVoiceAnalysis(null);
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      recordingStartRef.current = null;
      answerDurationSecondsRef.current = null;
      audioSamplesRef.current = [];

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
    setHasUserInteracted(true);
    setInterviewStarted(true);
    setInterviewFinished(false);
    setResults([]);
    setSummary(null);
    setVoiceAnalysis(null);
    lastSpokenQuestionRef.current = "";
    await fetchQuestion(1, []);
  };

  const getFeedback = async () => {
    try {
      setHasUserInteracted(true);
      setFeedbackLoading(true);
      setFeedback(null);

      let latestVoiceAnalysis = voiceAnalysis;

      if (!latestVoiceAnalysis && answer.trim() && answerDurationSecondsRef.current) {
        latestVoiceAnalysis = await runVoiceAnalysis(
          answer,
          answerDurationSecondsRef.current,
          audioSamplesRef.current.length
            ? calculateAudioMetrics()
            : defaultAudioMetrics
        );
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          answer,
          voiceAnalysis: latestVoiceAnalysis,
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
          pace_score: 0,
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
        pace_score: 0,
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

    setHasUserInteracted(true);

    const updatedResults = [
      ...results,
      { question, answer, feedback, voiceAnalysis },
    ];
    setResults(updatedResults);

    if (updatedResults.length >= totalQuestions) {
      setInterviewFinished(true);
      setSummaryLoading(true);
      stopQuestionSpeech();

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
        setVoiceAnalysis(null);
        finalTranscriptRef.current = "";
        interimTranscriptRef.current = "";
      }

      return;
    }

    lastSpokenQuestionRef.current = "";
    await fetchQuestion(updatedResults.length + 1, updatedResults);
  };

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-950 p-6">
          <div>
            <h1 className="mb-3 text-4xl font-bold md:text-5xl">
              AI Career Mentor
            </h1>
            <p className="max-w-2xl text-gray-400">
              Multi-question interview practice with AI coaching, detailed
              content feedback, stricter voice analysis, session history, and
              optional question playback.
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

                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <div className="text-sm text-gray-300">Question delivery:</div>

                  <button
                    type="button"
                    onClick={() => {
                      setHasUserInteracted(true);
                      setSpeakerEnabled(false);
                      stopQuestionSpeech();
                    }}
                    className={`rounded-lg px-4 py-2 font-semibold transition ${
                      !speakerEnabled
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    Text Only
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHasUserInteracted(true);
                      setSpeakerEnabled(true);
                    }}
                    className={`rounded-lg px-4 py-2 font-semibold transition ${
                      speakerEnabled
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    Speaker + Text
                  </button>
                </div>

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
                <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-950 p-6">
                  <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-purple-300">
                        Question {currentQuestionNumber} of {totalQuestions}
                      </h2>
                      <span className="text-sm text-gray-400">
                        Average score so far: {averageQuestionScore}/10
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setHasUserInteracted(true);
                          setSpeakerEnabled(false);
                          stopQuestionSpeech();
                        }}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          !speakerEnabled
                            ? "bg-purple-600 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        Text Only
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setHasUserInteracted(true);
                          setSpeakerEnabled(true);
                          if (question) {
                            speakQuestion(question, true);
                          }
                        }}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          speakerEnabled
                            ? "bg-purple-600 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        Speaker + Text
                      </button>

                      {speakerEnabled && question && (
                        <button
                          type="button"
                          onClick={() => {
                            setHasUserInteracted(true);
                            if (isSpeakingQuestion) {
                              stopQuestionSpeech();
                            } else {
                              speakQuestion(question, true);
                            }
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                        >
                          {isSpeakingQuestion ? "Stop Voice" : "Play Question"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-5 rounded-2xl border border-gray-800 bg-gray-900 p-5">
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400">
                        <div
                          className={`absolute inset-0 rounded-full ${
                            isSpeakingQuestion
                              ? "animate-ping bg-purple-400/30"
                              : ""
                          }`}
                        />
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gray-950 text-2xl font-bold text-white">
                          AI
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="text-lg font-semibold text-white">
                          AI Career Coach
                        </p>
                        <p className="text-sm text-gray-400">
                          {speakerEnabled
                            ? isSpeakingQuestion
                              ? "Speaking the interview question..."
                              : isListening
                              ? "Listening for your answer..."
                              : "Speaker mode is enabled."
                            : "Text-only mode is enabled."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                    <p className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-400">
                      Interview Question
                    </p>
                    <p className="leading-7 text-gray-100">
                      {questionLoading ? "Generating question..." : question}
                    </p>
                  </div>
                </div>

                {question && (
                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Your answer
                    </label>

                    <textarea
                      className="mb-4 min-h-[180px] w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-400 outline-none"
                      placeholder={
                        speakerEnabled
                          ? "Once the question finishes, start speaking. Click Stop Voice Answer when you’re done."
                          : "Write your answer here..."
                      }
                      value={answer}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAnswer(value);
                        finalTranscriptRef.current = value;
                        interimTranscriptRef.current = "";
                        setVoiceAnalysis(null);
                      }}
                    />

                    {voiceSupported && (
                      <div className="mb-4 flex flex-wrap gap-3">
                        {isListening ? (
                          <button
                            onClick={stopVoiceInput}
                            className="rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-700"
                          >
                            Stop Voice Answer
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setHasUserInteracted(true);
                              void startVoiceInput();
                            }}
                            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700"
                          >
                            Start Voice Answer
                          </button>
                        )}

                        <button
                          onClick={clearVoiceAnswer}
                          className="rounded-lg bg-gray-700 px-4 py-2 font-semibold hover:bg-gray-600"
                        >
                          Clear Voice Answer
                        </button>

                        <span className="self-center text-sm text-gray-400">
                          {isSpeakingQuestion
                            ? "Question is being read aloud..."
                            : isListening
                            ? "Listening and measuring voice delivery..."
                            : cleaningTranscript
                            ? "Tidying punctuation..."
                            : voiceAnalysisLoading
                            ? "Analysing voice delivery..."
                            : speakerEnabled
                            ? "Question voice will auto-start transcription when it finishes."
                            : "Voice input ready"}
                        </span>
                      </div>
                    )}

                    {voiceAnalysis && !voiceAnalysis.error && (
                      <div className="mb-4 rounded-xl border border-cyan-900 bg-cyan-950/30 p-4">
                        <h3 className="mb-3 text-lg font-semibold text-cyan-300">
                          Voice Analysis
                        </h3>

                        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                          <ScoreCard
                            label="Voice"
                            value={voiceAnalysis.overallVoiceScore}
                          />
                          <ScoreCard label="Pace" value={voiceAnalysis.paceScore} />
                          <ScoreCard
                            label="Fillers"
                            value={voiceAnalysis.fillerScore}
                          />
                          <ScoreCard
                            label="Confidence"
                            value={voiceAnalysis.confidenceScore}
                          />
                          <ScoreCard
                            label="Energy"
                            value={voiceAnalysis.energyScore}
                          />
                          <ScoreCard
                            label="Structure"
                            value={voiceAnalysis.structureScore ?? 0}
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <MetricCard
                            label="Words"
                            value={String(voiceAnalysis.metrics.wordCount)}
                          />
                          <MetricCard
                            label="WPM"
                            value={String(voiceAnalysis.metrics.estimatedWPM)}
                          />
                          <MetricCard
                            label="Fillers"
                            value={String(voiceAnalysis.metrics.fillerCount)}
                          />
                          <MetricCard
                            label="Long pauses"
                            value={String(voiceAnalysis.metrics.longPauseCount)}
                          />
                        </div>

                        {voiceAnalysis.feedback.improvements.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-2 font-semibold text-orange-300">
                              Voice improvements
                            </p>
                            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-200">
                              {voiceAnalysis.feedback.improvements.map(
                                (item, index) => (
                                  <li key={index}>{item}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {!feedback && (
                      <button
                        onClick={getFeedback}
                        disabled={
                          !answer ||
                          feedbackLoading ||
                          cleaningTranscript ||
                          isSpeakingQuestion ||
                          voiceAnalysisLoading
                        }
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

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                          <ScoreCard
                            label="Content"
                            value={feedback.category_scores.content}
                          />
                          <ScoreCard
                            label="Clarity"
                            value={feedback.category_scores.clarity}
                          />
                          <ScoreCard
                            label="Relevance"
                            value={feedback.category_scores.relevance}
                          />
                          <ScoreCard
                            label="Structure"
                            value={feedback.category_scores.structure}
                          />
                          <ScoreCard
                            label="Confidence"
                            value={feedback.category_scores.confidence}
                          />
                          <ScoreCard
                            label="Pace"
                            value={feedback.pace_score ?? voiceAnalysis?.paceScore ?? 0}
                          />
                        </div>

                        {feedback.section_feedback && (
                          <div>
                            <h3 className="mb-3 text-lg font-semibold text-cyan-300">
                              Section-by-section feedback
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                              <SectionFeedbackCard
                                title="Content"
                                item={feedback.section_feedback.content}
                              />
                              <SectionFeedbackCard
                                title="Clarity"
                                item={feedback.section_feedback.clarity}
                              />
                              <SectionFeedbackCard
                                title="Relevance"
                                item={feedback.section_feedback.relevance}
                              />
                              <SectionFeedbackCard
                                title="Structure"
                                item={feedback.section_feedback.structure}
                              />
                              <SectionFeedbackCard
                                title="Confidence"
                                item={feedback.section_feedback.confidence}
                              />
                              <SectionFeedbackCard
                                title="Pace"
                                item={feedback.section_feedback.pace}
                              />
                            </div>
                          </div>
                        )}

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
                            Model Answer — 8+/10 Standard
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

                {summaryLoading && (
                  <p className="text-gray-400">Generating summary...</p>
                )}

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
                      <p className="text-gray-100">
                        {summary.final_recommendation}
                      </p>
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
                  Sign in to make AI Career Mentor feel more like a real product
                  and prepare for saved accounts.
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
                <p>✓ Section-by-section content feedback</p>
                <p>✓ Stricter voice delivery scoring</p>
                <p>✓ Pace, fillers, confidence, energy</p>
                <p>✓ Stronger 8+/10 model answer</p>
                <p>✓ Final interview summary</p>
                <p>✓ Voice answer input</p>
                <p>✓ Voice transcript cleanup</p>
                <p>✓ Auto-listen after question playback</p>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-center">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function SectionFeedbackCard({
  title,
  item,
}: {
  title: string;
  item: SectionFeedbackItem;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="font-semibold text-white">{title}</h4>
        <span className="rounded-full bg-purple-600/20 px-3 py-1 text-sm font-semibold text-purple-200">
          {item.score}/10
        </span>
      </div>
      <p className="mb-3 text-sm leading-6 text-gray-300">{item.feedback}</p>
      <p className="text-sm leading-6 text-orange-200">
        <span className="font-semibold">Improve: </span>
        {item.improvement}
      </p>
    </div>
  );
}