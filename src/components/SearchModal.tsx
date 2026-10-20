import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Folder, BookOpen, HelpCircle, ArrowRight } from 'lucide-react';
import { Subject, ViewState } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSelectResult: (view: ViewState) => void;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'subject' | 'subcategory' | 'topic' | 'quiz' | 'note';
  viewState: ViewState;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Flatten and filter items
  const results: SearchResultItem[] = [];
  const cleanQuery = query.toLowerCase().trim();

  if (cleanQuery.length > 0) {
    subjects.forEach((subj) => {
      // Match Subject
      if (
        subj.name.toLowerCase().includes(cleanQuery) ||
        subj.description.toLowerCase().includes(cleanQuery)
      ) {
        results.push({
          id: `subj-${subj.id}`,
          title: subj.name,
          subtitle: `Main Subject · ${subj.subCategories.length} Categories`,
          type: 'subject',
          viewState: { mode: 'subject', subjectId: subj.id },
        });
      }

      // Match Subcategories
      subj.subCategories.forEach((subCat) => {
        if (
          subCat.name.toLowerCase().includes(cleanQuery) ||
          subCat.description.toLowerCase().includes(cleanQuery)
        ) {
          results.push({
            id: `subcat-${subCat.id}`,
            title: subCat.name,
            subtitle: `${subj.shortName} · Dedicated Exam Folder`,
            type: 'subcategory',
            viewState: { mode: 'subCategory', subjectId: subj.id, subCategoryId: subCat.id },
          });
        }

        // Match Topics & Questions
        subCat.topics.forEach((topic) => {
          const matchTopic =
            topic.name.toLowerCase().includes(cleanQuery) ||
            topic.description.toLowerCase().includes(cleanQuery);

          if (matchTopic) {
            results.push({
              id: `topic-${topic.id}`,
              title: topic.name,
              subtitle: `${subCat.name} · Study Notes & Quiz`,
              type: 'topic',
              viewState: {
                mode: 'topic',
                subjectId: subj.id,
                subCategoryId: subCat.id,
                topicId: topic.id,
                activeTab: 'notes',
              },
            });
          }

          // Match questions inside topic
          topic.questions.forEach((q) => {
            if (
              q.question.toLowerCase().includes(cleanQuery) ||
              q.explanation.toLowerCase().includes(cleanQuery)
            ) {
              results.push({
                id: `q-${q.id}`,
                title: q.question,
                subtitle: `MCQ in ${topic.name} (${subCat.name})`,
                type: 'quiz',
                viewState: {
                  mode: 'topic',
                  subjectId: subj.id,
                  subCategoryId: subCat.id,
                  topicId: topic.id,
                  activeTab: 'quiz',
                },
              });
            }
          });
        });
      });
    });
  }

  const handleSelect = (item: SearchResultItem) => {
    onSelectResult(item.viewState);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Header */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, questions, formulas, articles..."
            className="w-full text-slate-900 text-sm sm:text-base outline-none bg-transparent placeholder-slate-400"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              ESC
            </kbd>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-3 space-y-1.5 flex-1">
          {query.trim().length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs sm:text-sm">
              <p>Type keywords like "Polity", "Fundamental Rights", "Profit Loss", "Syllogism", etc.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No results found for "<span className="font-medium text-slate-800">{query}</span>"
            </div>
          ) : (
            results.slice(0, 15).map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-left transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    {item.type === 'subject' && <Folder className="w-4 h-4" />}
                    {item.type === 'subcategory' && <Folder className="w-4 h-4" />}
                    {item.type === 'topic' && <BookOpen className="w-4 h-4" />}
                    {item.type === 'quiz' && <HelpCircle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 shrink-0 transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
