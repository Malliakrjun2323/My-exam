import React from 'react';
import { ArrowLeft, Search, Bookmark, BookOpen, Upload } from 'lucide-react';
import { ViewState } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  viewState: ViewState;
  onBack: () => void;
  onOpenSearch: () => void;
  onOpenSaved: () => void;
  onOpenAddQuestion?: () => void;
  onOpenBulkUpload?: () => void;
  onOpenMistakeNotebook?: () => void;
  savedCount: number;
  mistakesCount?: number;
  currentTitle?: string;
  parentTitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  viewState,
  onBack,
  onOpenSearch,
  onOpenSaved,
  onOpenAddQuestion,
  onOpenBulkUpload,
  onOpenMistakeNotebook,
  savedCount,
  mistakesCount = 0,
  currentTitle,
  parentTitle,
}) => {
  const isHome = viewState.mode === 'home';
  const isInsideFolder =
    viewState.mode === 'subCategory' ||
    viewState.mode === 'topic' ||
    viewState.mode === 'batch';

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Back button or Brand wordmark */}
        <div className="flex items-center gap-3 min-w-0">
          {!isHome ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 transition-all text-sm font-medium shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Go back to previous screen"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                {viewState.mode === 'subject'
                  ? 'Back to Subjects'
                  : viewState.mode === 'subCategory'
                  ? (viewState.subjectId === 'pyq' ? 'Back to PYQs' : 'Back to Subject')
                  : 'Back'}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-inner">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg sm:text-xl tracking-tight text-white block leading-none">
                  TestPrep Pro
                </span>
                <span className="text-[11px] text-indigo-300 font-medium block mt-0.5 tracking-wide">
                  Exam & Quiz Platform
                </span>
              </div>
            </div>
          )}

          {/* Breadcrumb or current title */}
          {!isHome && (
            <div className="min-w-0 flex items-center gap-1.5 text-sm">
              {parentTitle && (
                <>
                  <span className="text-slate-400 truncate max-w-[100px] sm:max-w-[140px] hidden xs:inline">
                    {parentTitle}
                  </span>
                  <span className="text-slate-500 hidden xs:inline">/</span>
                </>
              )}
              <h1 className="font-semibold text-white truncate max-w-[160px] sm:max-w-[280px]">
                {currentTitle || 'Topic'}
              </h1>
            </div>
          )}
        </div>

        {/* Right actions: Install App, Bulk Upload, Add Question, Search, Bookmarks */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Bulk Upload Questions via JSON Button */}
          {onOpenBulkUpload && (
            <button
              onClick={onOpenBulkUpload}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-indigo-200 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 rounded-lg transition-all shadow-xs active:scale-95"
              title="Upload 100+ questions in bulk via JSON file or raw text"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Upload JSON</span>
            </button>
          )}

          {/* Add Question Button (Shown ONLY when inside an active folder/topic) */}
          {isInsideFolder && onOpenAddQuestion && (
            <button
              onClick={onOpenAddQuestion}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-xs active:scale-95"
              title="Add a new bilingual question into this folder"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span className="hidden sm:inline">Add Question</span>
            </button>
          )}

          {/* Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 bg-slate-800/90 hover:bg-slate-800 hover:text-white rounded-lg transition-colors border border-slate-700/60"
            title="Search subjects, topics, and MCQs"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden xl:inline text-slate-300">Search</span>
          </button>

          {/* Mistake Notebook Button */}
          {onOpenMistakeNotebook && (
            <button
              onClick={onOpenMistakeNotebook}
              className="relative p-2 rounded-lg text-rose-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Open Mistake Notebook (ತಪ್ಪುಗಳ ನೋಟ್ಬುಕ್)"
              aria-label="Open Mistake Notebook"
            >
              <BookOpen className="w-5 h-5 text-rose-400" />
              {mistakesCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] text-[10px] font-bold bg-rose-600 text-white rounded-full flex items-center justify-center px-1">
                  {mistakesCount}
                </span>
              )}
            </button>
          )}

          {/* Bookmarks / Saved Button */}
          <button
            onClick={onOpenSaved}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="View saved bookmarks and notes"
          >
            <Bookmark className="w-5 h-5" />
            {savedCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] text-[10px] font-bold bg-indigo-500 text-white rounded-full flex items-center justify-center px-1">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
