import React from 'react';
import { Bookmark, X, Trash2, ArrowRight, BookOpen, HelpCircle } from 'lucide-react';
import { BookmarkItem, ViewState } from '../types';

interface SavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  onRemoveBookmark: (id: string) => void;
  onNavigateToBookmark: (viewState: ViewState) => void;
}

export const SavedModal: React.FC<SavedModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
  onNavigateToBookmark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Saved & Bookmarked</h2>
              <p className="text-xs text-slate-500">{bookmarks.length} saved revision items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close saved modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {bookmarks.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No saved items yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Tap the bookmark icon while reading study notes or attempting quiz questions to save them here for quick revision!
              </p>
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all flex items-start justify-between gap-3 group"
              >
                <div
                  className="flex items-start gap-3 flex-1 cursor-pointer"
                  onClick={() => {
                    if (bm.payload?.viewState) {
                      onNavigateToBookmark(bm.payload.viewState);
                      onClose();
                    }
                  }}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                    {bm.type === 'note' ? (
                      <BookOpen className="w-3.5 h-3.5" />
                    ) : (
                      <HelpCircle className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-600">
                      {bm.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {bm.subjectName} · {bm.subCategoryName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onRemoveBookmark(bm.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (bm.payload?.viewState) {
                        onNavigateToBookmark(bm.payload.viewState);
                        onClose();
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 group-hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Open item"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
