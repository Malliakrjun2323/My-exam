import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ArrowRight,
  Filter,
  Eye,
  EyeOff,
  Layers,
  Languages,
  Trash2,
  AlertTriangle,
  X,
  FolderOpen,
} from 'lucide-react';
import { Question, LanguageMode, QuestionSet } from '../types';

interface QuestionListViewProps {
  questions: Question[];
  topicTitle: string;
  onBookmarkQuestion?: (question: Question) => void;
  isBookmarked?: (questionId: string) => boolean;
  onSwitchToQuizMode: (targetIndex?: number) => void;
  onDeleteQuestion?: (questionId: string) => void;
  onDeleteSet?: (setId: string) => void;
  activeSetName?: string;
  activeSetId?: string;
  availableSets?: QuestionSet[];
  onSelectSet?: (setId?: string) => void;
}

export const QuestionListView: React.FC<QuestionListViewProps> = ({
  questions,
  topicTitle,
  onBookmarkQuestion,
  isBookmarked,
  onSwitchToQuizMode,
  onDeleteQuestion,
  onDeleteSet,
  activeSetName,
  activeSetId,
  availableSets = [],
  onSelectSet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpNumber, setJumpNumber] = useState('');
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [userChoices, setUserChoices] = useState<Record<string, number>>({});
  const [langMode, setLangMode] = useState<LanguageMode>('bilingual');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [pageSize, setPageSize] = useState<number>(30); // 30 per page for mobile responsiveness
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Deletion Confirmation States
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isDeletingSet, setIsDeletingSet] = useState(false);

  // Filtered list
  const filteredQuestions = useMemo(() => {
    let list = questions;
    if (filterDifficulty !== 'all') {
      list = list.filter((q) => q.difficulty.toLowerCase() === filterDifficulty.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          (item.questionKn && item.questionKn.toLowerCase().includes(q)) ||
          item.options.some((opt) => opt.toLowerCase().includes(q)) ||
          (item.optionsKn && item.optionsKn.some((opt) => opt.toLowerCase().includes(q))) ||
          (item.explanation && item.explanation.toLowerCase().includes(q)) ||
          (item.explanationKn && item.explanationKn.toLowerCase().includes(q))
      );
    }

    return list;
  }, [questions, filterDifficulty, searchQuery]);

  // Pagination calculation
  const totalQuestions = filteredQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / pageSize));
  const currentQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Jump bar handler
  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpNumber.trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= totalQuestions) {
      const targetPage = Math.ceil(num / pageSize);
      setCurrentPage(targetPage);
      setTimeout(() => {
        const el = document.getElementById(`question-card-${num}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-indigo-500');
          setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500'), 2000);
        }
      }, 100);
    }
  };

  // Toggle individual explanation
  const toggleExplanation = (id: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Expand / collapse all on current page
  const handleToggleAllExplanations = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    currentQuestions.forEach((q) => {
      next[q.id] = expand;
    });
    setExpandedExplanations(next);
  };

  // Select option in interactive practice mode
  const handleSelectChoice = (questionId: string, optionIndex: number) => {
    setUserChoices((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  // Confirm single question deletion
  const handleConfirmDeleteQuestion = () => {
    if (questionToDelete && onDeleteQuestion) {
      onDeleteQuestion(questionToDelete.id);
      setQuestionToDelete(null);
    }
  };

  // Confirm entire set deletion
  const handleConfirmDeleteSet = () => {
    if (activeSetId && onDeleteSet) {
      onDeleteSet(activeSetId);
      setIsDeletingSet(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Set Banner (if viewing a specific batch) */}
      {activeSetName && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Active Set:
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {activeSetName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                  {questions.length} MCQs
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Viewing questions belonging strictly to this batch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {availableSets.length > 1 && onSelectSet && (
              <select
                value={activeSetId || ''}
                onChange={(e) => onSelectSet(e.target.value || undefined)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Sets ({availableSets.reduce((acc, s) => acc + s.questionCount, 0)} MCQs)</option>
                {availableSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.questionCount} MCQs)
                  </option>
                ))}
              </select>
            )}

            {onDeleteSet && activeSetId && (
              <button
                type="button"
                onClick={() => setIsDeletingSet(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all shadow-xs"
                title="Delete this entire question set"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Set</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs space-y-3">
        {/* Top bar: Search & Jump Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in questions, options, or explanations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Direct Question Jump Bar */}
          <form onSubmit={handleJump} className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-semibold text-slate-600">Go to Q.No:</span>
            <input
              type="number"
              min={1}
              max={totalQuestions}
              placeholder={`1-${totalQuestions}`}
              value={jumpNumber}
              onChange={(e) => setJumpNumber(e.target.value)}
              className="w-20 text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
            >
              Jump
            </button>
          </form>
        </div>

        {/* Bottom bar: Filters, Language Toggle, and Bulk Expand */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bilingual Display Mode Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              <button
                onClick={() => setLangMode('bilingual')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  langMode === 'bilingual'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ಕನ್ನಡ + English
              </button>
              <button
                onClick={() => setLangMode('kn')}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  langMode === 'kn'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ಕನ್ನಡ
              </button>
              <button
                onClick={() => setLangMode('en')}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  langMode === 'en'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>

            {/* Difficulty Filter */}
            <select
              value={filterDifficulty}
              onChange={(e) => {
                setFilterDifficulty(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy (ಸುಲಭ)</option>
              <option value="medium">Medium (ಮಧ್ಯಮ)</option>
              <option value="hard">Hard (ಕಠಿಣ)</option>
            </select>
          </div>

          {/* Explanation Bulk Controls & Page Size */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleAllExplanations(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Expand All Explanations</span>
            </button>
            <button
              onClick={() => handleToggleAllExplanations(false)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Collapse All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Question Counter Header */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">
          Showing {totalQuestions > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
          {Math.min(currentPage * pageSize, totalQuestions)} of {totalQuestions} Questions
        </span>
        {totalPages > 1 && (
          <span className="font-medium text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Empty State */}
      {totalQuestions === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No questions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No questions match your current search or filter criteria. Try clearing filters or adding questions.
          </p>
        </div>
      )}

      {/* Scalable List of Questions (NO TRUNCATION, Unlimited Text) */}
      <div className="space-y-4">
        {currentQuestions.map((q, idx) => {
          const globalIndex = (currentPage - 1) * pageSize + idx + 1;
          const isExpanded = Boolean(expandedExplanations[q.id]);
          const chosenOption = userChoices[q.id];
          const isAnswered = chosenOption !== undefined;
          const isBooked = isBookmarked ? isBookmarked(q.id) : false;

          return (
            <div
              key={q.id}
              id={`question-card-${globalIndex}`}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 space-y-3.5"
            >
              {/* Question Header: Number, Exam Tag, Difficulty, Set Name & Action Buttons */}
              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0">
                    Q{globalIndex}
                  </span>
                  {q.setName && (
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                      {q.setName}
                    </span>
                  )}
                  {q.examTag && (
                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {q.examTag}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500">
                    Difficulty: {q.difficulty}
                  </span>
                  {q.isCustom && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Custom Batch
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSwitchToQuizMode(globalIndex - 1)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hidden sm:inline mr-1"
                    title="Practice this question in CBT Mock mode"
                  >
                    Attempt in CBT Test →
                  </button>

                  {/* Bookmark Button */}
                  {onBookmarkQuestion && (
                    <button
                      onClick={() => onBookmarkQuestion(q)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isBooked
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'text-slate-400 hover:text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                      title={isBooked ? 'Bookmarked' : 'Bookmark Question'}
                    >
                      {isBooked ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {/* Red Delete Question Button with prompt confirmation */}
                  {onDeleteQuestion && (
                    <button
                      onClick={() => setQuestionToDelete(q)}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                      title="Delete this question"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text (Full, un-truncated, bilingual) */}
              <div className="space-y-2.5">
                {(langMode === 'kn' || langMode === 'bilingual') && q.questionKn && (
                  <div className="text-base sm:text-lg font-semibold text-indigo-950 leading-relaxed border-l-3 border-indigo-500 pl-3.5 whitespace-pre-line break-words">
                    <span className="text-xs font-bold text-indigo-600 block mb-0.5 uppercase tracking-wide">
                      ಕನ್ನಡ:
                    </span>
                    {q.questionKn}
                  </div>
                )}

                {(langMode === 'en' || langMode === 'bilingual' || !q.questionKn) && (
                  <div className="text-sm sm:text-base font-normal text-slate-800 leading-relaxed border-l-3 border-slate-300 pl-3.5 whitespace-pre-line break-words">
                    <span className="text-[11px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wide">
                      English:
                    </span>
                    {q.question}
                  </div>
                )}
              </div>

              {/* 4 Options Grid (Full un-truncated option text) */}
              <div className="space-y-2.5 pt-1">
                {q.options.map((opt, optIdx) => {
                  const isSelected = chosenOption === optIdx;
                  const isCorrect = optIdx === q.correctAnswerIndex;
                  const optKn = q.optionsKn ? q.optionsKn[optIdx] : undefined;

                  let buttonClass =
                    'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800';
                  let badgeClass = 'bg-white border-slate-300 text-slate-700';

                  if (isAnswered) {
                    if (isCorrect) {
                      buttonClass =
                        'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500 font-medium';
                      badgeClass = 'bg-emerald-600 text-white border-emerald-600';
                    } else if (isSelected && !isCorrect) {
                      buttonClass =
                        'border-rose-500 bg-rose-50 text-rose-950 ring-1 ring-rose-500';
                      badgeClass = 'bg-rose-600 text-white border-rose-600';
                    } else {
                      buttonClass = 'border-slate-200 bg-slate-50/40 text-slate-500 opacity-70';
                      badgeClass = 'bg-slate-100 border-slate-200 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectChoice(q.id, optIdx)}
                      className={`w-full min-h-[48px] p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-3 text-sm ${buttonClass}`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-md border font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${badgeClass}`}
                        >
                          {optionLabels[optIdx]}
                        </span>
                        <div className="flex flex-col text-left whitespace-pre-line break-words">
                          {(langMode === 'kn' || langMode === 'bilingual') && optKn && (
                            <span className="font-semibold text-slate-900 leading-snug">
                              {optKn}
                            </span>
                          )}
                          {(langMode === 'en' || langMode === 'bilingual' || !optKn) && (
                            <span className="text-xs sm:text-sm text-slate-700 leading-snug">
                              {opt}
                            </span>
                          )}
                        </div>
                      </div>

                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Collapsible / Expandable Explanation (No length limit, supports multi-paragraphs) */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => toggleExplanation(q.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800 text-xs sm:text-sm font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    <span>View Detailed Explanation / ವಿವರಣೆ ನೋಡಿ</span>
                    {isAnswered && (
                      <span
                        className={`text-xs font-semibold ml-2 ${
                          chosenOption === q.correctAnswerIndex
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        (Correct: Option {optionLabels[q.correctAnswerIndex]})
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/70 text-slate-800 text-sm leading-relaxed space-y-3 whitespace-pre-line break-words">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Comprehensive Explanation & Analysis (ಪೂರ್ಣ ವಿವರಣೆ):</span>
                    </div>

                    {/* Kannada Detailed Explanation */}
                    {q.explanationKn && (langMode === 'kn' || langMode === 'bilingual') && (
                      <div className="p-3 rounded-lg bg-white/80 border border-indigo-100 text-slate-800 text-xs sm:text-sm leading-relaxed">
                        <span className="font-bold text-indigo-900 block mb-1">
                          ಕನ್ನಡ ವಿವರಣೆ:
                        </span>
                        <div className="whitespace-pre-line break-words font-sans">
                          {q.explanationKn}
                        </div>
                      </div>
                    )}

                    {/* English Detailed Explanation */}
                    {q.explanation && (langMode === 'en' || langMode === 'bilingual') && (
                      <div className="p-3 rounded-lg bg-white/80 border border-indigo-100 text-slate-800 text-xs sm:text-sm leading-relaxed">
                        <span className="font-bold text-slate-800 block mb-1">
                          English Explanation:
                        </span>
                        <div className="whitespace-pre-line break-words font-sans">
                          {q.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Questions per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 font-semibold"
            >
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                currentPage === 1
                  ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              ← Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pNum = currentPage - 2 + i;
                  if (pNum > totalPages) pNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors ${
                      currentPage === pNum
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                currentPage === totalPages
                  ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Next Page →
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Individual Question */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Question? (ಪ್ರಶ್ನೆ ಅಳಿಸಿ)
                </h3>
                <p className="text-xs text-slate-500">
                  This question will be removed immediately from this set and will not reappear.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 max-h-32 overflow-y-auto leading-relaxed">
              <p className="font-semibold text-slate-900 mb-1">Question preview:</p>
              <p className="line-clamp-3">
                {questionToDelete.questionKn || questionToDelete.question}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteQuestion}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Question</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Entire Set */}
      {isDeletingSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Entire Set? (ಸೆಟ್ ಅಳಿಸಿ)
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Are you sure you want to delete {activeSetName}?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              All {questions.length} questions inside this batch will be permanently removed. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeletingSet(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSet}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete This Set</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
