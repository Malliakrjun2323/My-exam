import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Filter,
  ArrowRight,
  Sparkles,
  Edit3,
  Save,
} from 'lucide-react';
import { MistakeItem, MistakeCategory, Question } from '../types';

interface MistakeNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  mistakes: MistakeItem[];
  onRemoveMistake: (mistakeId: string) => void;
  onUpdateMistakeNote?: (mistakeId: string, newNotes: string, newCategory: MistakeCategory) => void;
  onStartReTest?: (questions: Question[]) => void;
}

export const MISTAKE_CATEGORY_LABELS: Record<MistakeCategory, { label: string; labelKn: string; color: string; bg: string; border: string }> = {
  concept_gap: {
    label: 'Concept Gap',
    labelKn: 'ತಿಳುವಳಿಕೆ ಕೊರತೆ',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  silly_mistake: {
    label: 'Silly Mistake',
    labelKn: 'ಚಿಕ್ಕ ತಪ್ಪು',
    color: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  formula_forgot: {
    label: 'Formula Forgot',
    labelKn: 'ಸೂತ್ರ ಮರೆತದ್ದು',
    color: 'text-purple-800',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  time_pressure: {
    label: 'Time Pressure',
    labelKn: 'ಸಮಯ ಕೊರತೆ',
    color: 'text-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  calculation: {
    label: 'Calculation Error',
    labelKn: 'ಲೆಕ್ಕದ ತಪ್ಪು',
    color: 'text-orange-800',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  general_revision: {
    label: 'General Revision',
    labelKn: 'ಪುನರಾವರ್ತನೆ',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
};

export const MistakeNotebookModal: React.FC<MistakeNotebookModalProps> = ({
  isOpen,
  onClose,
  mistakes = [],
  onRemoveMistake,
  onUpdateMistakeNote,
  onStartReTest,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editCat, setEditCat] = useState<MistakeCategory>('concept_gap');

  if (!isOpen) return null;

  const safeMistakes = Array.isArray(mistakes) ? mistakes.filter(Boolean) : [];
  const filteredMistakes = safeMistakes.filter((m) => {
    if (!m) return false;
    if (selectedFilter === 'all') return true;
    return m.category === selectedFilter;
  });

  const toggleExplanation = (id: string) => {
    setExpandedExplanation((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStartEdit = (m: MistakeItem) => {
    setEditingId(m.id);
    setEditNotes(m.userNotes || '');
    setEditCat(m.category);
  };

  const handleSaveEdit = (mId: string) => {
    if (onUpdateMistakeNote) {
      onUpdateMistakeNote(mId, editNotes, editCat);
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-rose-50 via-white to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  ತಪ್ಪುಗಳ ನೋಟ್ಬುಕ್ (Mistake Notebook)
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {safeMistakes.length} Saved
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and revise questions marked with learning gaps, calculation errors, or silly mistakes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Badges & Quick Action */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 ${
                selectedFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({safeMistakes.length})
            </button>
            {Object.entries(MISTAKE_CATEGORY_LABELS || {}).map(([catKey, catVal]) => {
              const count = safeMistakes.filter((m) => m && m.category === catKey).length;
              if (count === 0) return null;
              const isSelected = selectedFilter === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedFilter(catKey)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {catVal.labelKn} ({count})
                </button>
              );
            })}
          </div>

          {onStartReTest && filteredMistakes.length > 0 && (
            <button
              onClick={() => {
                const normalizedQuestions: Question[] = filteredMistakes.map((m, mIdx) => {
                  const raw = m.question;
                  const isObj = raw && typeof raw === 'object';
                  const rawOpts = isObj ? raw.options : (m as any).options;
                  const opts = Array.isArray(rawOpts) && rawOpts.length ? rawOpts : ['Option A', 'Option B', 'Option C', 'Option D'];

                  return {
                    id: m.questionId || (isObj ? raw.id : undefined) || `mistake_q_${m.id}_${mIdx}`,
                    subjectId: (isObj ? raw.subjectId : undefined) || (m as any).subjectId || 'pyq',
                    subCategoryId: (isObj ? raw.subCategoryId : undefined) || (m as any).subCategoryId || 'pyq-2025-exams',
                    topicId: (isObj ? raw.topicId : undefined) || (m as any).topicId || 'general',
                    question: isObj ? raw.question : (typeof raw === 'string' ? raw : (m as any).question || 'Question'),
                    questionKn: isObj ? raw.questionKn : (m as any).questionKn,
                    options: opts,
                    optionsKn: (isObj ? raw.optionsKn : undefined) || (m as any).optionsKn,
                    correctAnswerIndex: isObj && typeof raw.correctAnswerIndex === 'number'
                      ? raw.correctAnswerIndex
                      : (typeof (m as any).correctAnswerIndex === 'number' ? (m as any).correctAnswerIndex : 0),
                    explanation: isObj ? raw.explanation : (m as any).explanation || 'Solution provided.',
                    explanationKn: isObj ? raw.explanationKn : (m as any).explanationKn,
                    difficulty: isObj ? raw.difficulty : (m as any).difficulty || 'Medium',
                    examTag: isObj ? raw.examTag : (m as any).examTag || 'Mistake Practice',
                    year: isObj ? raw.year : (m as any).year || 2025,
                  };
                });
                onStartReTest(normalizedQuestions);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Practice These ({filteredMistakes.length})</span>
            </button>
          )}
        </div>

        {/* Mistakes List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {filteredMistakes.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                No mistake questions found for this filter.
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When you submit a CBT Mock Test, click "[ 🔖 Save to Notebook ]" under any incorrect question to categorize and review it here.
              </p>
            </div>
          ) : (
            filteredMistakes.map((item, idx) => {
              if (!item) return null;
              const catMeta = (item.category && MISTAKE_CATEGORY_LABELS[item.category]) || MISTAKE_CATEGORY_LABELS.concept_gap || {
                label: 'Concept Gap',
                labelKn: 'ಪರಿಕಲ್ಪನಾ ದೋಷ',
                color: 'text-rose-700',
                bg: 'bg-rose-50',
                border: 'border-rose-200',
              };
              const rawQ = item.question;
              const isObj = rawQ && typeof rawQ === 'object';

              // Robust extraction handling both nested Question object and flat Firestore item
              const qKn = isObj ? rawQ.questionKn : (item as any).questionKn;
              const qEn = isObj ? rawQ.question : (typeof rawQ === 'string' ? rawQ : (item as any).question);
              const rawOpts = isObj ? rawQ.options : (item as any).options;
              const options: string[] = Array.isArray(rawOpts) && rawOpts.length ? rawOpts : ['Option A', 'Option B', 'Option C', 'Option D'];
              const rawOptsKn = isObj ? rawQ.optionsKn : (item as any).optionsKn;
              const optionsKn: string[] | undefined = Array.isArray(rawOptsKn) ? rawOptsKn : undefined;

              const correctAnsIdx = isObj && typeof rawQ.correctAnswerIndex === 'number'
                ? rawQ.correctAnswerIndex
                : typeof (item as any).correctAnswerIndex === 'number'
                ? (item as any).correctAnswerIndex
                : 0;

              const explanationEn = isObj ? rawQ.explanation : (item as any).explanation;
              const explanationKn = isObj ? rawQ.explanationKn : (item as any).explanationKn;

              const isExpOpen = expandedExplanation[item.id] ?? false;
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500 font-mono">
                        #{idx + 1}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}
                      >
                        {catMeta.labelKn} · {catMeta.label}
                      </span>
                      {item.testTitle && (
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium truncate max-w-[200px]">
                          {item.testTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit learning reflection note"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveMistake(item.id)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Mark as Mastered (Remove from Notebook)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1.5">
                    {qKn && (
                      <p className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        {qKn}
                      </p>
                    )}
                    {qEn && (
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {qEn}
                      </p>
                    )}
                  </div>

                  {/* Options & Answers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {options.map((opt, optIdx) => {
                      const isCorrect = optIdx === correctAnsIdx;
                      const wasSelected = optIdx === item.selectedOptionIndex;
                      const optKn = optionsKn?.[optIdx];

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 font-semibold'
                              : wasSelected
                              ? 'bg-rose-50/70 border-rose-300 text-rose-950 font-medium'
                              : 'bg-slate-50/60 border-slate-200 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : wasSelected
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

                  {/* Reflection Note & Category Editor */}
                  {isEditing ? (
                    <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900">
                          Edit Reflection / Learning Note:
                        </span>
                        <select
                          value={editCat}
                          onChange={(e) => setEditCat(e.target.value as MistakeCategory)}
                          className="text-xs p-1 rounded border border-indigo-200 bg-white"
                        >
                          {Object.entries(MISTAKE_CATEGORY_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.labelKn} ({v.label})
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Write self-reflection notes (e.g., misread question, need to revise Article 324 vs 326)..."
                        className="w-full text-xs p-2 rounded-lg border border-indigo-200 bg-white min-h-[60px] outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Note</span>
                        </button>
                      </div>
                    </div>
                  ) : item.userNotes ? (
                    <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                      <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-900">Self-Reflection Note: </span>
                        <span>{item.userNotes}</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Toggle Explanation Accordion */}
                  <div className="pt-1">
                    <button
                      onClick={() => toggleExplanation(item.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
                    >
                      {isExpOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{isExpOpen ? 'ವಿವರಣೆ ಮರೆಮಾಡಿ (Hide Solution)' : 'ವಿವರಣೆ ಮತ್ತು ಪರಿಹಾರ ನೋಡಿ (View Full Solution)'}</span>
                    </button>

                    {isExpOpen && (
                      <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs leading-relaxed text-slate-800 animate-in fade-in">
                        {explanationKn && (
                          <div className="whitespace-pre-line text-slate-900 font-medium pb-2 border-b border-slate-200">
                            {explanationKn}
                          </div>
                        )}
                        {explanationEn && (
                          <div className="whitespace-pre-line text-slate-700 font-normal">
                            {explanationEn}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            {mistakes.length} Questions saved in localStorage
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors"
          >
            Close Notebook
          </button>
        </div>
      </div>
    </div>
  );
};
