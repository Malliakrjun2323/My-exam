import React, { useState } from 'react';
import { BookOpen, Clock, Lightbulb, Bookmark, BookmarkCheck, CheckCircle, ArrowRight } from 'lucide-react';
import { TopicStudyNote } from '../types';

interface StudyNotesViewProps {
  notes: TopicStudyNote;
  topicTitle: string;
  onTakeQuiz: () => void;
  onBookmarkNote?: (note: TopicStudyNote) => void;
  isBookmarked?: boolean;
}

export const StudyNotesView: React.FC<StudyNotesViewProps> = ({
  notes,
  topicTitle,
  onTakeQuiz,
  onBookmarkNote,
  isBookmarked = false,
}) => {
  const [markedAsRead, setMarkedAsRead] = useState(false);

  if (!notes) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">Study notes are being compiled for this topic.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Note Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{notes.readTime}</span>
              <span aria-hidden="true">·</span>
              <span>High-Yield Revision</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {notes.title}
            </h2>
          </div>

          {onBookmarkNote && (
            <button
              onClick={() => onBookmarkNote(notes)}
              className={`p-2 rounded-xl border transition-colors shrink-0 ${
                isBookmarked
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'text-slate-400 hover:text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={isBookmarked ? 'Bookmarked' : 'Save Note'}
              aria-label="Save note for quick revision"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          {notes.summary}
        </p>
      </div>

      {/* Note Sections */}
      <div className="space-y-4">
        {notes.sections.map((sec, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
              {sec.title}
            </h3>
            <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 leading-relaxed">
              {sec.bullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex items-start gap-2.5">
                  <span className="text-indigo-500 font-bold mt-1 text-xs">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            {sec.keyHighlight && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold block">Key Exam Takeaway:</span>
                  <span>{sec.keyHighlight}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Mnemonics / Memory Tricks (if present) */}
      {notes.quickMnemonics && notes.quickMnemonics.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-indigo-900 font-bold text-base">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
            <span>Mnemonics & Memory Hacks</span>
          </div>
          <div className="space-y-2 text-sm text-slate-800">
            {notes.quickMnemonics.map((mnem, mIdx) => (
              <div
                key={mIdx}
                className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-indigo-100/80 font-mono text-xs sm:text-sm text-indigo-950"
              >
                {mnem}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <button
          onClick={() => setMarkedAsRead(!markedAsRead)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
            markedAsRead
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckCircle className={`w-4 h-4 ${markedAsRead ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>{markedAsRead ? 'Marked as Completed' : 'Mark as Read'}</span>
        </button>

        <button
          onClick={onTakeQuiz}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs text-xs sm:text-sm transition-all active:scale-95"
        >
          <span>Test Knowledge with MCQs</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
