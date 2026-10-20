import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Languages,
  PlusCircle,
  Layers,
  Clock,
  Pause,
  Play,
  Grid,
  X,
  Send,
  AlertTriangle,
  BookOpen,
  ArrowLeft,
  Check,
  Tag,
  ZoomIn,
  ZoomOut,
  FileText,
  Filter,
  BarChart3,
  Flame,
  Home,
  Save,
} from 'lucide-react';
import {
  Question,
  LanguageMode,
  QuestionStatus,
  MistakeCategory,
  MistakeItem,
  TestResult,
} from '../types';
import { MISTAKE_CATEGORY_LABELS } from './MistakeNotebookModal';

interface QuizViewProps {
  questions: Question[];
  topicTitle: string;
  onBookmarkQuestion?: (question: Question) => void;
  isBookmarked?: (questionId: string) => boolean;
  onOpenAddQuestion?: () => void;
  onSwitchToListMode?: () => void;
  activeSetName?: string;
  onExitTest?: () => void;
  onOpenMistakeNotebook?: () => void;
  onSaveMistakeToNotebook?: (item: MistakeItem) => void;
  savedMistakeQuestionIds?: string[];
}

export const QuizView: React.FC<QuizViewProps> = ({
  questions,
  topicTitle,
  onBookmarkQuestion,
  isBookmarked,
  onOpenAddQuestion,
  onSwitchToListMode,
  activeSetName,
  onExitTest,
  onOpenMistakeNotebook,
  onSaveMistakeToNotebook,
  savedMistakeQuestionIds = [],
}) => {
  // View Modes: 'test' (Active CBT Test) | 'scorecard' (Results & Analytics) | 'solutions' (Full Review & Solutions)
  const [examStage, setExamStage] = useState<'test' | 'scorecard' | 'solutions'>('test');

  // Active question index
  const [currentIndex, setCurrentIndex] = useState(0);

  // User chosen answers (questionId -> selected option index 0,1,2,3)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  // Question statuses tracking for palette: 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_marked_for_review'
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>(() => {
    const initial: Record<string, QuestionStatus> = {};
    if (questions && questions.length > 0) {
      questions.forEach((q, idx) => {
        initial[q.id] = idx === 0 ? 'not_answered' : 'not_visited';
      });
    }
    return initial;
  });

  // Visited questions tracker
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (questions && questions[0]) {
      initial[questions[0].id] = true;
    }
    return initial;
  });

  // Questions marked for review
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});

  // Countdown Timer: 60 seconds per question or minimum 10 minutes (600 seconds)
  const totalAllocatedSeconds = useMemo(() => {
    const qCount = questions.length || 10;
    return Math.max(qCount * 60, 600);
  }, [questions]);

  const [timeLeft, setTimeLeft] = useState<number>(totalAllocatedSeconds);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // Language display: 'bilingual' | 'kn' | 'en'
  const [langMode, setLangMode] = useState<LanguageMode>('bilingual');

  // Text zoom scale: 1 = normal, 1.15 = large, 1.3 = x-large
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Question Palette slide-out drawer state
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Submit confirmation modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Pause confirmation overlay
  const [isPauseOverlayOpen, setIsPauseOverlayOpen] = useState(false);

  // Exit confirmation modal state
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  // Solutions filter: 'all' | 'correct' | 'wrong' | 'unattempted'
  const [solutionsFilter, setSolutionsFilter] = useState<'all' | 'correct' | 'wrong' | 'unattempted'>('all');

  // Expanded explanations in solutions view
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  // Mistake Notebook save modal state in solutions view
  const [activeMistakeQuestion, setActiveMistakeQuestion] = useState<{
    question: Question;
    selectedIdx?: number;
  } | null>(null);
  const [mistakeCategory, setMistakeCategory] = useState<MistakeCategory>('concept_gap');
  const [mistakeNotes, setMistakeNotes] = useState('');
  const [localSavedMistakeIds, setLocalSavedMistakeIds] = useState<string[]>(savedMistakeQuestionIds);

  // Timer Countdown Effect
  useEffect(() => {
    if (examStage !== 'test' || isTimerPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit on timer expiry
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });

      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [examStage, isTimerPaused]);

  // Mark first question as visited on load
  useEffect(() => {
    if (questions && questions[currentIndex]) {
      const qId = questions[currentIndex].id;
      setVisitedQuestions((prev) => ({ ...prev, [qId]: true }));
      setQuestionStatuses((prev) => {
        const currentStatus = prev[qId];
        if (!currentStatus || currentStatus === 'not_visited') {
          return { ...prev, [qId]: 'not_answered' };
        }
        return prev;
      });
    }
  }, [currentIndex, questions]);

  // Sync saved mistakes from props
  useEffect(() => {
    setLocalSavedMistakeIds(savedMistakeQuestionIds);
  }, [savedMistakeQuestionIds]);

  // Reset entire test
  const handleReattempt = () => {
    setSelectedAnswers({});
    setMarkedForReview({});
    setCurrentIndex(0);
    setTimeLeft(totalAllocatedSeconds);
    setTimeSpentSeconds(0);
    setIsTimerPaused(false);
    setExamStage('test');
    setIsSubmitModalOpen(false);

    const initial: Record<string, QuestionStatus> = {};
    questions.forEach((q, idx) => {
      initial[q.id] = idx === 0 ? 'not_answered' : 'not_visited';
    });
    setQuestionStatuses(initial);
    setVisitedQuestions({ [questions[0]?.id]: true });
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
        <p className="text-slate-600 font-medium">No test questions available for this batch yet.</p>
        {onOpenAddQuestion && (
          <button
            onClick={onOpenAddQuestion}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Batch / Questions</span>
          </button>
        )}
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Question status derivation
  const getQuestionCurrentStatus = (qId: string): QuestionStatus => {
    const isAns = selectedAnswers[qId] !== undefined;
    const isRev = markedForReview[qId] === true;
    const isVis = visitedQuestions[qId] === true;

    if (isAns && isRev) return 'answered_marked_for_review';
    if (isAns) return 'answered';
    if (isRev) return 'marked_for_review';
    if (isVis) return 'not_answered';
    return 'not_visited';
  };

  // Status Counts
  const answeredCount = Object.keys(selectedAnswers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const notAnsweredCount = totalQuestions - answeredCount;

  // Format timer MM:SS
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Option selection (Temporary choice during test - NO instant green/red reveal)
  const handleSelectOption = (optIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optIndex,
    }));
  };

  // Clear chosen option
  const handleClearOption = () => {
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
  };

  // Mark / Unmark for Review
  const handleToggleReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));

    // Move to next question if not at the end
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Save & Next
  const handleSaveAndNext = () => {
    // If not at the end, advance to next question
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Reached the end, open submit confirmation
      setIsSubmitModalOpen(true);
    }
  };

  // Previous Question
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Jump directly to Question index from Palette
  const handleJumpToQuestion = (idx: number) => {
    setCurrentIndex(idx);
    setIsPaletteOpen(false);
  };

  // Pause / Resume Timer
  const handleTogglePause = () => {
    if (isTimerPaused) {
      setIsTimerPaused(false);
      setIsPauseOverlayOpen(false);
    } else {
      setIsTimerPaused(true);
      setIsPauseOverlayOpen(true);
    }
  };

  // Final Test Submission
  const handleFinalSubmit = () => {
    setIsSubmitModalOpen(false);
    setIsTimerPaused(true);
    setExamStage('scorecard');

    // Calculate and save test result to localStorage
    let correct = 0;
    let wrong = 0;

    questions.forEach((q) => {
      const chosen = selectedAnswers[q.id];
      if (chosen !== undefined) {
        if (chosen === q.correctAnswerIndex) {
          correct += 1;
        } else {
          wrong += 1;
        }
      }
    });

    const attempted = correct + wrong;
    const unattempted = totalQuestions - attempted;
    const score = Number((correct * 1.0 - wrong * 0.25).toFixed(2));
    const maxScore = totalQuestions * 1.0;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    const result: TestResult = {
      id: `result_${Date.now()}`,
      testTitle: activeSetName || topicTitle,
      timestamp: Date.now(),
      totalQuestions,
      attempted,
      correct,
      wrong,
      unattempted,
      score,
      maxScore,
      accuracy,
      timeSpentSeconds,
      userAnswers: selectedAnswers,
    };

    try {
      const existingRaw = localStorage.getItem('examprep_test_history');
      const existing: TestResult[] = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem('examprep_test_history', JSON.stringify([result, ...existing.slice(0, 49)]));
    } catch (e) {
      console.error(e);
    }
  };

  // Save question to Mistake Notebook
  const handleSaveMistake = () => {
    if (!activeMistakeQuestion) return;

    const q = activeMistakeQuestion.question;
    const newMistake: MistakeItem = {
      id: `mistake_${Date.now()}_${q.id}`,
      questionId: q.id,
      question: q,
      selectedOptionIndex:
        typeof activeMistakeQuestion.selectedIdx === 'number'
          ? activeMistakeQuestion.selectedIdx
          : -1,
      category: mistakeCategory,
      userNotes: mistakeNotes.trim() || '',
      savedAt: Date.now(),
      testTitle: activeSetName || topicTitle || 'Mock Test',
      folderId: q.subCategoryId || 'general',
    };

    // Save to localStorage
    try {
      const raw = localStorage.getItem('examprep_mistake_notebook');
      const existing: MistakeItem[] = raw ? JSON.parse(raw) : [];
      const updated = [newMistake, ...existing.filter((m) => m.questionId !== q.id)];
      localStorage.setItem('examprep_mistake_notebook', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    if (onSaveMistakeToNotebook) {
      onSaveMistakeToNotebook(newMistake);
    }

    setLocalSavedMistakeIds((prev) => Array.from(new Set([...prev, q.id])));
    setActiveMistakeQuestion(null);
    setMistakeNotes('');
  };

  // Score Calculation
  const scoreResults = useMemo(() => {
    let correct = 0;
    let wrong = 0;

    questions.forEach((q) => {
      const chosen = selectedAnswers[q.id];
      if (chosen !== undefined) {
        if (chosen === q.correctAnswerIndex) {
          correct += 1;
        } else {
          wrong += 1;
        }
      }
    });

    const attempted = correct + wrong;
    const unattempted = totalQuestions - attempted;
    const score = Number((correct * 1.0 - wrong * 0.25).toFixed(2));
    const maxScore = totalQuestions * 1.0;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const cutoffScore = Number((maxScore * 0.6).toFixed(2));
    const isCutoffCleared = score >= cutoffScore;

    return {
      correct,
      wrong,
      attempted,
      unattempted,
      score,
      maxScore,
      accuracy,
      cutoffScore,
      isCutoffCleared,
    };
  }, [questions, selectedAnswers, totalQuestions]);

  // Zoom Text Classes
  const getQuestionFontSize = () => {
    if (zoomLevel === 'large') return 'text-base sm:text-lg';
    if (zoomLevel === 'xlarge') return 'text-lg sm:text-xl';
    return 'text-sm sm:text-base';
  };

  const getOptionFontSize = () => {
    if (zoomLevel === 'large') return 'text-sm sm:text-base';
    if (zoomLevel === 'xlarge') return 'text-base sm:text-lg';
    return 'text-xs sm:text-sm';
  };

  // Render question status badge color in palette
  const getPaletteStatusStyle = (status: QuestionStatus) => {
    switch (status) {
      case 'answered':
        return 'bg-emerald-600 text-white font-bold border-emerald-600';
      case 'not_answered':
        return 'bg-rose-600 text-white font-bold border-rose-600';
      case 'marked_for_review':
        return 'bg-purple-600 text-white font-bold border-purple-600';
      case 'answered_marked_for_review':
        return 'bg-purple-600 text-white font-bold border-purple-600 ring-2 ring-emerald-400';
      case 'not_visited':
      default:
        return 'bg-slate-100 text-slate-700 font-medium border-slate-300';
    }
  };

  // =========================================================================
  // VIEW MODE A: ACTIVE CBT TEST MODE (Strictly NO Instant Feedback)
  // =========================================================================
  if (examStage === 'test') {
    const currentStatus = getQuestionCurrentStatus(currentQuestion.id);
    const chosenOption = selectedAnswers[currentQuestion.id];
    const isTimerUrgent = timeLeft < 300; // Under 5 minutes

    return (
      <div className="flex flex-col bg-slate-50 min-h-[calc(100vh-5rem)] pb-24 relative select-none">
        {/* 1. TOP EXAM HEADER BAR */}
        <div className="bg-slate-900 text-white px-3 sm:px-6 py-2.5 sm:py-3 shadow-md flex items-center justify-between gap-2 sticky top-16 z-30 border-b border-slate-800">
          {/* Left: Home/Exit + Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsExitConfirmOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Exit Test"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
                CBT Mock Test
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-[280px]">
                {activeSetName || topicTitle}
              </h2>
            </div>
          </div>

          {/* Center: Live Countdown Timer & Pause */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-bold font-mono tracking-tight transition-all ${
                isTimerUrgent
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'bg-slate-800 text-emerald-400 border border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            <button
              onClick={handleTogglePause}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isTimerPaused ? 'Resume Timer' : 'Pause Timer'}
            >
              {isTimerPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>

          {/* Right: Language Toggle & Section Palette Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Selector */}
            <div className="hidden xs:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setLangMode('bilingual')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  langMode === 'bilingual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dual
              </button>
              <button
                onClick={() => setLangMode('kn')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  langMode === 'kn' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ಕನ್ನಡ
              </button>
              <button
                onClick={() => setLangMode('en')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  langMode === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Eng
              </button>
            </div>

            {/* Grid Question Palette Button */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
              title="Open Question Palette Grid"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Palette</span>
              <span className="bg-white/20 px-1.5 py-0.2 rounded text-[10px] font-mono">
                {answeredCount}/{totalQuestions}
              </span>
            </button>
          </div>
        </div>

        {/* 2. SECTION SUB-BAR & MARKING SCHEME */}
        <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              Section: General Awareness (GK/GS)
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {answeredCount}/{totalQuestions} Answered
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Marking Scheme */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                +1.00
              </span>
              <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-bold">
                -0.25
              </span>
            </div>

            {/* Font Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setZoomLevel('normal')}
                className={`p-1 rounded text-[10px] font-bold ${
                  zoomLevel === 'normal' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
                title="Normal text size"
              >
                A
              </button>
              <button
                onClick={() => setZoomLevel('large')}
                className={`p-1 rounded text-[11px] font-bold ${
                  zoomLevel === 'large' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
                title="Large text size"
              >
                A+
              </button>
              <button
                onClick={() => setZoomLevel('xlarge')}
                className={`p-1 rounded text-xs font-bold ${
                  zoomLevel === 'xlarge' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
                title="Extra large text size"
              >
                A++
              </button>
            </div>

            {/* Bookmark Question */}
            {onBookmarkQuestion && (
              <button
                onClick={() => onBookmarkQuestion(currentQuestion)}
                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                title={isBookmarked?.(currentQuestion.id) ? 'Bookmarked' : 'Bookmark this question'}
              >
                {isBookmarked?.(currentQuestion.id) ? (
                  <BookmarkCheck className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* 3. QUESTION & OPTIONS CARD */}
        <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
          {/* Question Number & Status Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Status: {currentStatus === 'answered' ? 'Answered' : currentStatus === 'marked_for_review' ? 'Marked for Review' : 'Not Answered'}
            </span>
          </div>

          {/* Bilingual Stacked Question Text */}
          <div className="space-y-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
            {/* Kannada Text */}
            {(langMode === 'bilingual' || langMode === 'kn') && currentQuestion.questionKn && (
              <div className={`${getQuestionFontSize()} font-semibold text-slate-900 leading-relaxed`}>
                {currentQuestion.questionKn}
              </div>
            )}

            {/* English Text */}
            {(langMode === 'bilingual' || langMode === 'en') && currentQuestion.question && (
              <div
                className={`${getQuestionFontSize()} ${
                  langMode === 'bilingual'
                    ? 'text-slate-700 font-normal pt-2 border-t border-slate-100 leading-relaxed'
                    : 'text-slate-900 font-semibold leading-relaxed'
                }`}
              >
                {currentQuestion.question}
              </div>
            )}
          </div>

          {/* Radio Button Options (A, B, C, D) - NO Instant Feedback */}
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = chosenOption === optIdx;
              const optKn = currentQuestion.optionsKn?.[optIdx];

              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/30 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                  }`}
                >
                  {/* Circular Radio Indicator */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                  </div>

                  {/* Option Text Stacked */}
                  <div className={`min-w-0 space-y-1 ${getOptionFontSize()}`}>
                    {(langMode === 'bilingual' || langMode === 'kn') && optKn && (
                      <span className="block font-medium text-slate-900 leading-snug">
                        {optKn}
                      </span>
                    )}
                    {(langMode === 'bilingual' || langMode === 'en') && opt && (
                      <span
                        className={`block text-slate-700 leading-snug ${
                          langMode === 'bilingual' ? 'font-normal text-slate-600' : 'font-medium'
                        }`}
                      >
                        {opt}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. FIXED BOTTOM ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 sm:px-6 py-2.5 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
            {/* Left buttons: Prev & Clear */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3 sm:px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Prev</span>
              </button>

              <button
                onClick={handleClearOption}
                disabled={chosenOption === undefined}
                className="px-2.5 sm:px-3 py-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 font-semibold text-xs sm:text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none"
                title="Clear selected option"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Clear</span>
              </button>
            </div>

            {/* Middle: Mark for Review */}
            <button
              onClick={handleToggleReview}
              className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                markedForReview[currentQuestion.id]
                  ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-xs'
                  : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>{markedForReview[currentQuestion.id] ? 'Reviewed' : 'Review'}</span>
            </button>

            {/* Right buttons: Save & Next & Submit */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handleSaveAndNext}
                className="px-4 sm:px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1 active:scale-95"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Submit Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. SLIDE-OUT QUESTION PALETTE DRAWER */}
        {isPaletteOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
              {/* Palette Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    CBT
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Question Palette (ಪ್ರಶ್ನೆ ಫಲಕ)
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      General Awareness (GK/GS)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsPaletteOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Legend */}
              <div className="p-3 bg-slate-50/70 border-b border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold">
                    ✕
                  </span>
                  <span>Not Answered ({notAnsweredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold">
                    ★
                  </span>
                  <span>Marked for Review ({reviewCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center text-[9px] font-bold">
                    ○
                  </span>
                  <span>Not Visited</span>
                </div>
              </div>

              {/* Grid of Numbers */}
              <div className="p-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {questions.map((q, idx) => {
                    const status = getQuestionCurrentStatus(q.id);
                    const isCur = currentIndex === idx;

                    return (
                      <button
                        key={q.id}
                        onClick={() => handleJumpToQuestion(idx)}
                        className={`h-11 rounded-xl border flex flex-col items-center justify-center text-xs transition-all relative ${getPaletteStatusStyle(
                          status
                        )} ${isCur ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105 shadow-md' : 'shadow-xs'}`}
                      >
                        <span className="font-bold">{idx + 1}</span>
                        {status === 'answered_marked_for_review' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Palette Bottom Action: Submit Test Button */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
                <button
                  onClick={() => {
                    setIsPaletteOpen(false);
                    setIsSubmitModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Full Test ({answeredCount}/{totalQuestions} Answered)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. SUBMIT CONFIRMATION MODAL */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Send className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Submit Test Confirmation (ಪರೀಕ್ಷೆ ಸಲ್ಲಿಕೆ)
                  </h3>
                </div>
                <div className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-700">
                  Time Left: {formatTimer(timeLeft)}
                </div>
              </div>

              {/* Summary Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <div className="grid grid-cols-2 bg-slate-100 p-2.5 font-bold text-slate-800 border-b border-slate-200">
                  <span>Parameter</span>
                  <span className="text-right">Count</span>
                </div>
                <div className="p-2.5 space-y-2 divide-y divide-slate-100">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600">Total Questions:</span>
                    <span className="font-bold text-slate-900 font-mono">{totalQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-emerald-700 font-semibold">Answered:</span>
                    <span className="font-bold text-emerald-700 font-mono">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-rose-700 font-semibold">Not Answered:</span>
                    <span className="font-bold text-rose-700 font-mono">{notAnsweredCount}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-purple-700 font-semibold">Marked for Review:</span>
                    <span className="font-bold text-purple-700 font-mono">{reviewCount}</span>
                  </div>
                </div>
              </div>

              {/* Warning Banner */}
              {notAnsweredCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">You still have {notAnsweredCount} unattempted questions!</span>
                    <p className="mt-0.5 text-amber-800">
                      There is negative marking (-0.25) for wrong answers. Are you sure you want to finish and submit?
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ← Return to Test
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Yes, Submit & View Score</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. PAUSE OVERLAY */}
        {isPauseOverlayOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Pause className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Test Paused</h3>
                <p className="text-xs text-slate-500 mt-1">
                  The countdown timer has been paused. Click resume to continue your examination.
                </p>
              </div>
              <button
                onClick={handleTogglePause}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                <span>Resume Test ({formatTimer(timeLeft)} remaining)</span>
              </button>
            </div>
          </div>
        )}

        {/* 8. EXIT TEST CONFIRMATION MODAL */}
        {isExitConfirmOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Exit Test Without Submitting?
                  </h3>
                  <span className="text-xs text-slate-500">Your test progress will not be saved</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You are currently in an active examination. Are you sure you want to quit and return to the folder?
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExitConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Continue Test
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExitConfirmOpen(false);
                    if (onExitTest) onExitTest();
                  }}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
                >
                  Quit Examination
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE B: DETAILED SCORECARD & ANALYTICS SCREEN (After Submission)
  // =========================================================================
  if (examStage === 'scorecard') {
    const { correct, wrong, attempted, unattempted, score, maxScore, accuracy, cutoffScore, isCutoffCleared } = scoreResults;

    return (
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30">
                Official Scorecard & Evaluation
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date().toLocaleDateString()}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {activeSetName || topicTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Computer-Based Test (CBT) Performance Summary & Negative Marking Audit
              </p>
            </div>

            {/* Score & Accuracy Hero Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-xs text-slate-300 block mb-1">Total Score Earned</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                    {score.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400">/ {maxScore.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-xs text-slate-300 block mb-1">Accuracy Rate</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-indigo-300 font-mono">
                  {accuracy}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-xs text-slate-300 block mb-1">Cutoff Benchmark</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                      isCutoffCleared ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
                    }`}
                  >
                    {isCutoffCleared ? '✓ Target Qualified' : 'Needs Practice'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Cutoff: {cutoffScore}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Correct */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Correct Answers</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{correct}</div>
            <span className="text-[11px] font-bold text-emerald-700 block">
              +{(correct * 1.0).toFixed(2)} Marks
            </span>
          </div>

          {/* Incorrect */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Incorrect Answers</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{wrong}</div>
            <span className="text-[11px] font-bold text-rose-700 block">
              -{(wrong * 0.25).toFixed(2)} Marks (Penalty)
            </span>
          </div>

          {/* Unattempted */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Unattempted</span>
              <HelpCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{unattempted}</div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              0.00 Marks
            </span>
          </div>

          {/* Time Taken */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Time Spent</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {formatTimer(timeSpentSeconds)}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              Total {formatTimer(totalAllocatedSeconds)}
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Solutions & Explanations */}
            <button
              onClick={() => setExamStage('solutions')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>ಪರಿಹಾರಗಳು & ವಿವರಣೆಗಳು (View Solutions)</span>
            </button>

            {/* Mistake Notebook Button */}
            {onOpenMistakeNotebook && (
              <button
                onClick={onOpenMistakeNotebook}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-rose-600" />
                <span>ತಪ್ಪುಗಳ ನೋಟ್ಬುಕ್ (Mistake Notebook)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Re-attempt Test */}
            <button
              onClick={handleReattempt}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-attempt Test</span>
            </button>

            {/* Back to Home / Batches */}
            {onExitTest && (
              <button
                onClick={onExitTest}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Back to Batches</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE C: SOLUTIONS & FULL EXPLANATIONS WITH MISTAKE NOTEBOOK
  // =========================================================================
  const filteredSolutions = questions.filter((q) => {
    const chosen = selectedAnswers[q.id];
    const isCorrect = chosen !== undefined && chosen === q.correctAnswerIndex;
    const isWrong = chosen !== undefined && chosen !== q.correctAnswerIndex;
    const isSkipped = chosen === undefined;

    if (solutionsFilter === 'correct') return isCorrect;
    if (solutionsFilter === 'wrong') return isWrong;
    if (solutionsFilter === 'unattempted') return isSkipped;
    return true;
  });

  return (
    <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5 animate-in fade-in pb-20">
      {/* Top Solutions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExamStage('scorecard')}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200"
            title="Return to Scorecard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Solutions & Detailed Explanations
            </h2>
            <span className="text-xs text-slate-500">
              Score: {scoreResults.score} / {scoreResults.maxScore} ({scoreResults.accuracy}% Accuracy)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMistakeNotebook && (
            <button
              onClick={onOpenMistakeNotebook}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-colors"
            >
              <BookOpen className="w-4 h-4 text-rose-600" />
              <span>Open Mistake Notebook</span>
            </button>
          )}

          <button
            onClick={handleReattempt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Test</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs: All | Correct | Wrong | Unattempted */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSolutionsFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
            solutionsFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Questions ({totalQuestions})
        </button>
        <button
          onClick={() => setSolutionsFilter('correct')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
            solutionsFilter === 'correct'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          ✓ Correct ({scoreResults.correct})
        </button>
        <button
          onClick={() => setSolutionsFilter('wrong')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
            solutionsFilter === 'wrong'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          ✕ Incorrect ({scoreResults.wrong})
        </button>
        <button
          onClick={() => setSolutionsFilter('unattempted')}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
            solutionsFilter === 'unattempted'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          ○ Skipped ({scoreResults.unattempted})
        </button>
      </div>

      {/* Questions Solution List */}
      <div className="space-y-4">
        {filteredSolutions.map((q, idx) => {
          const originalIdx = questions.findIndex((item) => item.id === q.id);
          const chosen = selectedAnswers[q.id];
          const isCorrect = chosen !== undefined && chosen === q.correctAnswerIndex;
          const isWrong = chosen !== undefined && chosen !== q.correctAnswerIndex;
          const isSkipped = chosen === undefined;
          const isSavedInMistakes = localSavedMistakeIds.includes(q.id);
          const isExpExpanded = expandedSolutions[q.id] ?? true;

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition-all ${
                isCorrect
                  ? 'border-emerald-200/80 hover:border-emerald-300'
                  : isWrong
                  ? 'border-rose-200/80 hover:border-rose-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Question Header & Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    Q. {originalIdx + 1}
                  </span>

                  {isCorrect && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Correct (+1.00)</span>
                    </span>
                  )}

                  {isWrong && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Incorrect (-0.25)</span>
                    </span>
                  )}

                  {isSkipped && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      <span>Unattempted (0.00)</span>
                    </span>
                  )}
                </div>

                {/* Save to Mistake Notebook Button */}
                <button
                  onClick={() => setActiveMistakeQuestion({ question: q, selectedIdx: chosen })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                    isSavedInMistakes
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-50'
                  }`}
                  title="Categorize and save this question to your Mistake Notebook"
                >
                  <BookOpen className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isSavedInMistakes ? '✓ In Notebook' : '🔖 Save to Notebook'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="space-y-1.5">
                {q.questionKn && (
                  <p className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                    {q.questionKn}
                  </p>
                )}
                {q.question && (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    {q.question}
                  </p>
                )}
              </div>

              {/* 4 Options with Correct & Wrong Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt, optIdx) => {
                  const isAnswer = optIdx === q.correctAnswerIndex;
                  const wasChosen = optIdx === chosen;
                  const optKn = q.optionsKn?.[optIdx];

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                        isAnswer
                          ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-500/30'
                          : wasChosen && isWrong
                          ? 'bg-rose-50/80 border-rose-300 text-rose-950 font-medium ring-1 ring-rose-500/20'
                          : 'bg-slate-50/60 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isAnswer
                            ? 'bg-emerald-600 text-white'
                            : wasChosen && isWrong
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <div className="min-w-0">
                        {optKn && <span className="block leading-tight">{optKn}</span>}
                        <span className="block text-slate-600 font-normal leading-tight">
                          {opt}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expandable Explanation Card */}
              <div className="pt-1">
                <button
                  onClick={() =>
                    setExpandedSolutions((prev) => ({
                      ...prev,
                      [q.id]: !isExpExpanded,
                    }))
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                  {isExpExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{isExpExpanded ? 'ವಿವರಣೆ ಮರೆಮಾಡಿ (Hide Solution)' : 'ವಿವರಣೆ & ಪರಿಹಾರ (View Detailed Explanation)'}</span>
                </button>

                {isExpExpanded && (
                  <div className="mt-2.5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs leading-relaxed text-slate-800 animate-in fade-in">
                    {q.explanationKn && (
                      <div className="whitespace-pre-line text-slate-900 font-medium pb-2 border-b border-slate-200">
                        {q.explanationKn}
                      </div>
                    )}
                    <div className="whitespace-pre-line text-slate-700 font-normal">
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MISTAKE NOTEBOOK DIALOG */}
      {activeMistakeQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-700">
              <BookOpen className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">
                Save to Mistake Notebook (ತಪ್ಪುಗಳ ನೋಟ್ಬುಕ್)
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Select the mistake type and add a self-reflection note so you can revise and avoid this error in future tests.
            </p>

            {/* Categorization Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                Mistake Type / ಕಾರಣ:
              </label>
              <select
                value={mistakeCategory}
                onChange={(e) => setMistakeCategory(e.target.value as MistakeCategory)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium outline-none focus:ring-2 focus:ring-rose-500"
              >
                {Object.entries(MISTAKE_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.labelKn} ({v.label})
                  </option>
                ))}
              </select>
            </div>

            {/* Reflection Notes Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                Self-Reflection Note (ಸ್ವಯಂ ಟಿಪ್ಪಣಿ):
              </label>
              <textarea
                value={mistakeNotes}
                onChange={(e) => setMistakeNotes(e.target.value)}
                placeholder="ಉದಾ: ಪ್ರಶ್ನೆಯನ್ನು ಆತುರದಿಂದ ಓದಿದ್ದೆ / 324 ನೇ ವಿಧಿ ನೆನಪಿಗೆ ಬರಲಿಲ್ಲ..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white min-h-[70px] outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveMistakeQuestion(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMistake}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save to Notebook</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
