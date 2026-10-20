import React, { useState } from 'react';
import { PYQuestion } from '../types';
import { CheckCircle2, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, FileText, Check } from 'lucide-react';

interface PyqViewProps {
  pyqs: PYQuestion[];
  topicTitle: string;
  onBookmarkQuestion?: (question: PYQuestion) => void;
  isBookmarked?: (questionId: string) => boolean;
}

export const PyqView: React.FC<PyqViewProps> = ({
  pyqs,
  topicTitle,
  onBookmarkQuestion,
  isBookmarked,
}) => {
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [examFilter, setExamFilter] = useState<string>('all');

  if (!pyqs || pyqs.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-600 font-medium">Previous Years' Questions database is being updated.</p>
        <p className="text-xs text-slate-400 mt-1">Check out the "Practice Quiz / MCQs" tab for curated drills.</p>
      </div>
    );
  }

  // Get unique exam names for filter
  const examNames = Array.from(new Set(pyqs.map((q) => q.examName.split(' ')[0])));
  const filteredPyqs =
    examFilter === 'all'
      ? pyqs
      : pyqs.filter((q) => q.examName.toLowerCase().includes(examFilter.toLowerCase()));

  const toggleSolution = (id: string) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelect = (qId: string, optIdx: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
    // Auto reveal solution
    setRevealedSolutions((prev) => ({
      ...prev,
      [qId]: true,
    }));
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Filter and Stats Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Real Past Exam Questions ({filteredPyqs.length})
          </h3>
          <p className="text-xs text-slate-500">
            Curated from official Tier-1 & Tier-2 examinations
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setExamFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              examFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Exams
          </button>
          {examNames.map((exam) => (
            <button
              key={exam}
              onClick={() => setExamFilter(exam)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                examFilter === exam
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {exam}
            </button>
          ))}
        </div>
      </div>

      {/* PYQ List */}
      <div className="space-y-4">
        {filteredPyqs.map((q, idx) => {
          const isRevealed = revealedSolutions[q.id];
          const selected = selectedOptions[q.id];
          const isBooked = isBookmarked ? isBookmarked(q.id) : false;

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
            >
              {/* Question Meta Strip */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Q{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {q.examName} ({q.year})
                  </span>
                  {q.shift && (
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {q.shift}
                    </span>
                  )}
                </div>

                {onBookmarkQuestion && (
                  <button
                    onClick={() => onBookmarkQuestion(q)}
                    className={`p-1 rounded-md border text-xs transition-colors ${
                      isBooked
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'text-slate-400 hover:text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                    title={isBooked ? 'Saved' : 'Bookmark question'}
                  >
                    {isBooked ? (
                      <BookmarkCheck className="w-3.5 h-3.5" />
                    ) : (
                      <Bookmark className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Question Text */}
              <p className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
                {q.question}
              </p>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = optIdx === q.correctAnswerIndex;
                  const isUserChoice = selected === optIdx;

                  let optClass =
                    'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800';
                  if (isRevealed) {
                    if (isCorrect) {
                      optClass =
                        'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium ring-1 ring-emerald-400';
                    } else if (isUserChoice && !isCorrect) {
                      optClass = 'border-rose-300 bg-rose-50 text-rose-800';
                    } else {
                      optClass = 'border-slate-200 bg-slate-50/50 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-3 transition-colors ${optClass}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-white border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {optionLabels[optIdx]}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isRevealed && isCorrect && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Toggle Solution Card */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSolution(q.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {isRevealed ? (
                    <>
                      <span>Hide Solution & Analysis</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Show Solution & Analysis</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {isRevealed && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm leading-relaxed text-slate-700">
                    <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                      <span className="text-emerald-700">
                        Correct Answer: Option {optionLabels[q.correctAnswerIndex]}
                      </span>
                    </div>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
