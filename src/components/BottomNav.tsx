import React from 'react';
import { Home, HelpCircle, Bookmark, BookOpen } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  viewState: ViewState;
  onGoHome: () => void;
  onOpenDirectQuiz: () => void;
  onOpenSaved: () => void;
  onOpenMistakeNotebook?: () => void;
  savedCount: number;
  mistakesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  viewState,
  onGoHome,
  onOpenDirectQuiz,
  onOpenSaved,
  onOpenMistakeNotebook,
  savedCount,
  mistakesCount = 0,
}) => {
  const isHome = viewState.mode === 'home';
  const isQuiz =
    (viewState.mode === 'topic' && viewState.activeTab === 'quiz') ||
    (viewState.mode === 'batch' && viewState.activeTab === 'quiz');

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200">
      <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto px-2">
        {/* Tab 1: Home / All Subjects */}
        <button
          onClick={onGoHome}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
            isHome ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight tracking-tight">Subjects</span>
        </button>

        {/* Tab 2: Practice Quiz */}
        <button
          onClick={onOpenDirectQuiz}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
            isQuiz ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight tracking-tight">CBT Test</span>
        </button>

        {/* Tab 3: Mistake Notebook */}
        <button
          onClick={onOpenMistakeNotebook}
          className="flex flex-col items-center justify-center min-h-[48px] py-1 text-slate-500 hover:text-rose-700 transition-colors relative"
        >
          <div className="relative">
            <BookOpen className="w-5 h-5 mb-0.5 text-rose-600" />
            {mistakesCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 text-[9px] font-bold bg-rose-600 text-white rounded-full flex items-center justify-center px-1">
                {mistakesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight tracking-tight text-rose-700 font-medium">Mistakes</span>
        </button>

        {/* Tab 4: Saved / Bookmarks */}
        <button
          onClick={onOpenSaved}
          className="flex flex-col items-center justify-center min-h-[48px] py-1 text-slate-500 hover:text-slate-900 transition-colors relative"
        >
          <div className="relative">
            <Bookmark className="w-5 h-5 mb-0.5" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 text-[9px] font-bold bg-indigo-600 text-white rounded-full flex items-center justify-center px-1">
                {savedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight tracking-tight">Saved</span>
        </button>
      </div>
    </nav>
  );
};
