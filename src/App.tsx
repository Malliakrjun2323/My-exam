/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Calculator,
  BrainCircuit,
  BookOpen,
  Scale,
  Landmark,
  Compass,
  TrendingUp,
  Atom,
  Sparkles,
  Flame,
  Divide,
  Percent,
  Shapes,
  Lightbulb,
  Maximize2,
  SpellCheck,
  BookmarkCheck,
  ChevronRight,
  ArrowLeft,
  FileText,
  HelpCircle,
  Award,
  Layers,
  GraduationCap,
  Clock,
  CheckCircle,
  PlusCircle,
  Languages,
  Upload,
  Trash2,
  FolderOpen,
  AlertTriangle,
  RotateCcw,
  Check,
  FolderPlus,
  PlayCircle,
  ListFilter,
  Eye,
  Cloud,
} from 'lucide-react';
import {
  saveBatchToFirestore,
  deleteBatchFromFirestore,
  saveMistakeToFirestore,
  deleteMistakeFromFirestore,
  subscribeToBatches,
  subscribeToMistakes,
  testFirestoreConnection,
} from './lib/firebase';
import { examSubjects } from './data/examData';
import {
  Subject,
  SubCategory,
  ViewState,
  BookmarkItem,
  Question,
  QuestionBatch,
  SubCategoryId,
  SubjectId,
  TopicStudyNote,
  PYQuestion,
  MistakeItem,
  MistakeCategory,
} from './types';
import { TopBar } from './components/TopBar';
import { QuizView } from './components/QuizView';
import { QuestionListView } from './components/QuestionListView';
import { SearchModal } from './components/SearchModal';
import { SavedModal } from './components/SavedModal';
import { BottomNav } from './components/BottomNav';
import { AddQuestionModal, BatchConfig } from './components/AddQuestionModal';
import { BulkUploadModal } from './components/BulkUploadModal';
import { MistakeNotebookModal } from './components/MistakeNotebookModal';

// Helper icon renderer
const RenderIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'Globe':
      return <Globe className={className} />;
    case 'Calculator':
      return <Calculator className={className} />;
    case 'BrainCircuit':
      return <BrainCircuit className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Scale':
      return <Scale className={className} />;
    case 'Landmark':
      return <Landmark className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    case 'Atom':
      return <Atom className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Divide':
      return <Divide className={className} />;
    case 'Percent':
      return <Percent className={className} />;
    case 'Shapes':
      return <Shapes className={className} />;
    case 'Lightbulb':
      return <Lightbulb className={className} />;
    case 'Maximize2':
      return <Maximize2 className={className} />;
    case 'SpellCheck':
      return <SpellCheck className={className} />;
    case 'BookmarkCheck':
      return <BookmarkCheck className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    default:
      return <Layers className={className} />;
  }
};

export default function App() {
  const [viewState, setViewState] = useState<ViewState>({ mode: 'home' });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isMistakeNotebookOpen, setIsMistakeNotebookOpen] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mistake Notebook state (localStorage persisted)
  const [mistakes, setMistakes] = useState<MistakeItem[]>(() => {
    try {
      const saved = localStorage.getItem('examprep_mistake_notebook');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Bookmarks state (localStorage persisted)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const saved = localStorage.getItem('examprep_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom user-added questions state (localStorage persisted)
  const [customQuestions, setCustomQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('examprep_custom_questions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User-created batches mapped strictly by folder ID (localStorage persisted under examprep_batches_${folderId})
  const [batchesByFolder, setBatchesByFolder] = useState<Record<string, QuestionBatch[]>>(() => {
    const map: Record<string, QuestionBatch[]> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('examprep_batches_')) {
          const folderId = key.replace('examprep_batches_', '');
          const raw = localStorage.getItem(key);
          if (raw) {
            map[folderId] = JSON.parse(raw);
          }
        }
      }
    } catch (e) {
      console.error('Error loading batches from localStorage', e);
    }
    return map;
  });

  // Modal confirmation states for batch and folder deletion
  const [batchToDelete, setBatchToDelete] = useState<{
    id: string;
    title: string;
    folderId: string;
    questionCount: number;
  } | null>(null);
  const [isConfirmClearFolderOpen, setIsConfirmClearFolderOpen] = useState(false);

  // Cloud Firestore Sync State
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  // Sync bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('examprep_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.error('Failed to save bookmarks', e);
    }
  }, [bookmarks]);

  // Cloud Firestore Real-Time Two-Way Sync
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setCloudSyncStatus(connected ? 'connected' : 'offline');
    });

    // 1. Subscribe to Cloud Batches from Firestore
    const unsubscribeBatches = subscribeToBatches((cloudBatchesByFolder, cloudQuestions) => {
      if (Object.keys(cloudBatchesByFolder).length > 0) {
        setBatchesByFolder((prev) => {
          const merged = { ...prev };
          Object.entries(cloudBatchesByFolder).forEach(([folderId, bList]) => {
            merged[folderId] = bList;
            try {
              localStorage.setItem(`examprep_batches_${folderId}`, JSON.stringify(bList));
            } catch (e) {
              console.error(e);
            }
          });
          return merged;
        });
      }

      if (cloudQuestions.length > 0) {
        setCustomQuestions((prev) => {
          const qMap = new Map<string, Question>();
          prev.forEach((q) => qMap.set(q.id, q));
          cloudQuestions.forEach((q) => qMap.set(q.id, q));
          const mergedList = Array.from(qMap.values());
          try {
            localStorage.setItem('examprep_custom_questions', JSON.stringify(mergedList));
          } catch (e) {
            console.error(e);
          }
          return mergedList;
        });
      }
      setCloudSyncStatus('connected');
    });

    // 2. Subscribe to Mistake Notebook from Firestore
    const unsubscribeMistakes = subscribeToMistakes((cloudMistakes) => {
      if (cloudMistakes && cloudMistakes.length > 0) {
        setMistakes(cloudMistakes);
        try {
          localStorage.setItem('examprep_mistake_notebook', JSON.stringify(cloudMistakes));
        } catch (e) {
          console.error(e);
        }
      }
    });

    return () => {
      unsubscribeBatches();
      unsubscribeMistakes();
    };
  }, []);

  // Auto-migrate any custom questions into batchesByFolder if not yet recorded
  useEffect(() => {
    setBatchesByFolder((prev) => {
      let changed = false;
      const next = { ...prev };

      customQuestions.forEach((q) => {
        if (!q.subCategoryId) return;
        const fId = q.subCategoryId;
        const bId = q.setId || `batch_${fId}_1`;
        const bTitle =
          q.setName ||
          (q as any).set?.name ||
          (q as any).set?.title ||
          (q as any).title ||
          (q as any).name ||
          'Batch 1';

        if (!next[fId]) {
          next[fId] = [];
        }

        const existingBatch = next[fId].find((b) => b.id === bId);
        if (!existingBatch) {
          changed = true;
          const qCount = customQuestions.filter(
            (item) => item.subCategoryId === fId && (item.setId === bId || (!item.setId && bId.includes('_1')))
          ).length;

          next[fId] = [
            ...next[fId],
            {
              id: bId,
              title: bTitle,
              name: bTitle,
              folderId: fId as SubCategoryId,
              subjectId: q.subjectId,
              createdAt: q.createdAt || Date.now(),
              questionCount: qCount,
            },
          ];
        } else if (!existingBatch.title || existingBatch.title === 'Question Batch' || existingBatch.title === 'Custom Question Batch') {
          if (bTitle && bTitle !== 'Batch 1' && bTitle !== 'Question Batch') {
            existingBatch.title = bTitle;
            existingBatch.name = bTitle;
            changed = true;
          }
        }
      });

      if (changed) {
        Object.entries(next).forEach(([fId, batches]) => {
          try {
            localStorage.setItem(`examprep_batches_${fId}`, JSON.stringify(batches));
          } catch (e) {
            console.error(e);
          }
        });
        return next;
      }
      return prev;
    });
  }, [customQuestions]);

  // Current Subject and SubCategory lookups
  const currentSubject = useMemo(() => {
    if (viewState.mode === 'home') return undefined;
    return examSubjects.find((s) => s.id === viewState.subjectId);
  }, [viewState]);

  const currentSubCategory = useMemo(() => {
    if (viewState.mode === 'subCategory' || viewState.mode === 'batch' || viewState.mode === 'topic') {
      return currentSubject?.subCategories.find((sc) => sc.id === viewState.subCategoryId);
    }
    return undefined;
  }, [viewState, currentSubject]);

  // Get live batches for any folder with accurate question counts
  const getFolderBatches = (folderId: string): Array<QuestionBatch & { questionCount: number }> => {
    const alternateFolderId = folderId.startsWith('pyq-')
      ? folderId.replace('pyq-', 'gk-')
      : folderId.startsWith('gk-')
      ? folderId.replace('gk-', 'pyq-')
      : null;

    const baseList = batchesByFolder[folderId] || [];
    const altList = alternateFolderId ? batchesByFolder[alternateFolderId] || [] : [];
    
    // Combine unique by id
    const allBatches = [...baseList];
    altList.forEach((ab) => {
      if (!allBatches.some((b) => b.id === ab.id)) {
        allBatches.push(ab);
      }
    });

    return allBatches.map((b, idx) => {
      const count = customQuestions.filter(
        (q) =>
          (q.subCategoryId === folderId || (alternateFolderId && q.subCategoryId === alternateFolderId)) &&
          (q.setId === b.id || (!q.setId && b.id.includes('_1')))
      ).length;

      // Extract custom batch title from batch properties or from questions in this batch (prioritizing custom setName/title)
      const matchingQ = customQuestions.find(
        (q) =>
          (q.subCategoryId === folderId || (alternateFolderId && q.subCategoryId === alternateFolderId)) &&
          (q.setId === b.id || (!q.setId && b.id.includes('_1'))) &&
          (q.setName || (q as any).set?.name || (q as any).set?.title || (q as any).name || (q as any).title)
      );

      const titleCandidates = [
        (b as any).setName,
        (b as any).set?.name,
        (b as any).set?.title,
        (b as any).batchTitle,
        matchingQ?.setName,
        (matchingQ as any)?.set?.name,
        (matchingQ as any)?.set?.title,
        (matchingQ as any)?.name,
        (matchingQ as any)?.title,
        b.title,
        b.name,
      ];
      const validCustomTitle = titleCandidates.find(
        (c) => typeof c === 'string' && c.trim() && c.trim() !== 'Question Batch' && c.trim() !== 'Custom Question Batch'
      );
      const fallbackTitle = (b.title && b.title.trim()) || (b.name && b.name.trim()) || `Batch ${idx + 1}`;
      const resolvedTitle = validCustomTitle ? validCustomTitle.trim() : fallbackTitle;

      return {
        ...b,
        title: resolvedTitle,
        name: resolvedTitle,
        questionCount: count,
      };
    });
  };

  // Get total question count in a folder
  const getFolderQuestionCount = (folderId: string): number => {
    const alternateFolderId = folderId.startsWith('pyq-')
      ? folderId.replace('pyq-', 'gk-')
      : folderId.startsWith('gk-')
      ? folderId.replace('gk-', 'pyq-')
      : null;

    return customQuestions.filter(
      (q) => q.subCategoryId === folderId || (alternateFolderId && q.subCategoryId === alternateFolderId)
    ).length;
  };

  // Batches for the currently active folder
  const activeFolderBatches = useMemo(() => {
    if (!currentSubCategory) return [];
    return getFolderBatches(currentSubCategory.id);
  }, [currentSubCategory, batchesByFolder, customQuestions]);

  // Questions for the currently active batch
  const activeBatchQuestions = useMemo(() => {
    if (viewState.mode !== 'batch') return [];
    const { subCategoryId, batchId } = viewState;
    return customQuestions.filter(
      (q) => q.subCategoryId === subCategoryId && (q.setId === batchId || (!q.setId && batchId.includes('_1')))
    );
  }, [viewState, customQuestions]);

  // Breadcrumb titles
  let currentTitle: string | undefined;
  let parentTitle: string | undefined;
  if (viewState.mode === 'subject') {
    currentTitle = currentSubject?.name;
    parentTitle = 'Dashboard';
  } else if (viewState.mode === 'subCategory') {
    currentTitle = currentSubCategory?.name;
    parentTitle = currentSubject?.shortName;
  } else if (viewState.mode === 'batch') {
    currentTitle = viewState.batchTitle;
    parentTitle = currentSubCategory?.name;
  }

  // Navigation: Back Button Handler
  const handleBack = () => {
    if (viewState.mode === 'batch') {
      setViewState({
        mode: 'subCategory',
        subjectId: viewState.subjectId,
        subCategoryId: viewState.subCategoryId,
      });
    } else if (viewState.mode === 'topic') {
      setViewState({
        mode: 'subCategory',
        subjectId: viewState.subjectId,
        subCategoryId: viewState.subCategoryId,
      });
    } else if (viewState.mode === 'subCategory') {
      setViewState({
        mode: 'subject',
        subjectId: viewState.subjectId,
      });
    } else if (viewState.mode === 'subject') {
      setViewState({ mode: 'home' });
    }
  };

  // ADD QUESTION: Single manual question addition
  const handleAddQuestion = (newQuestion: Question, batchConfig?: BatchConfig) => {
    const folderId = newQuestion.subCategoryId;
    const batchId = batchConfig?.setId || newQuestion.setId || `batch_${Date.now()}`;
    const batchTitle =
      batchConfig?.setName ||
      (batchConfig as any)?.title ||
      newQuestion.setName ||
      (newQuestion as any)?.set?.name ||
      (newQuestion as any)?.set?.title ||
      (newQuestion as any)?.title ||
      (newQuestion as any)?.name ||
      'Custom Question Batch';

    let updatedQuestions: Question[] = [];
    let updatedFolderBatches: QuestionBatch[] = [];

    if (batchConfig?.mode === 'replace') {
      // Clear existing questions in this folder
      const otherQuestions = customQuestions.filter((q) => q.subCategoryId !== folderId);
      updatedQuestions = [newQuestion, ...otherQuestions];

      // New single batch in folder
      const newBatch: QuestionBatch = {
        id: batchId,
        title: batchTitle,
        name: batchTitle,
        folderId,
        subjectId: newQuestion.subjectId,
        createdAt: Date.now(),
        questionCount: 1,
      };
      updatedFolderBatches = [newBatch];
    } else {
      // Append to questions
      updatedQuestions = [newQuestion, ...customQuestions];

      const currentList = batchesByFolder[folderId] || [];
      const existingBatch = currentList.find((b) => b.id === batchId);
      if (!existingBatch) {
        const newBatch: QuestionBatch = {
          id: batchId,
          title: batchTitle,
          name: batchTitle,
          folderId,
          subjectId: newQuestion.subjectId,
          createdAt: Date.now(),
          questionCount: 1,
        };
        updatedFolderBatches = [newBatch, ...currentList];
      } else {
        existingBatch.title = existingBatch.title || batchTitle;
        existingBatch.name = existingBatch.name || batchTitle;
        updatedFolderBatches = currentList;
      }
    }

    setCustomQuestions(updatedQuestions);
    setBatchesByFolder((prev) => ({
      ...prev,
      [folderId]: updatedFolderBatches,
    }));

    try {
      localStorage.setItem('examprep_custom_questions', JSON.stringify(updatedQuestions));
      localStorage.setItem(`examprep_batches_${folderId}`, JSON.stringify(updatedFolderBatches));
      localStorage.setItem(
        `examprep_questions_${folderId}_${batchId}`,
        JSON.stringify(updatedQuestions.filter((q) => q.subCategoryId === folderId && q.setId === batchId))
      );
    } catch (e) {
      console.error(e);
    }

    // Two-Way Cloud Firestore Persistence
    const currentBatchQuestions = updatedQuestions.filter(
      (q) => q.subCategoryId === folderId && q.setId === batchId
    );
    const targetBatch = updatedFolderBatches.find((b) => b.id === batchId);
    if (targetBatch) {
      saveBatchToFirestore(
        { ...targetBatch, questions: currentBatchQuestions, questionCount: currentBatchQuestions.length },
        folderId,
        newQuestion.subjectId
      ).catch((err) => {
        console.warn('Firestore batch save warning:', err);
      });
    }

    setToastMessage(`Question added to '${batchTitle}' successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // BULK IMPORT: Direct JSON import of 100+ questions
  const handleFolderBulkQuestionsAdded = (
    importedQuestions: Question[],
    folderName: string,
    batchConfig?: BatchConfig
  ) => {
    if (!importedQuestions.length) return;

    const firstQ = importedQuestions[0];
    const folderId = firstQ.subCategoryId;
    const subjectId = firstQ.subjectId;
    const batchId = batchConfig?.setId || firstQ.setId || `batch_${Date.now()}`;
    const batchTitle =
      batchConfig?.setName ||
      (batchConfig as any)?.title ||
      firstQ.setName ||
      (firstQ as any)?.set?.name ||
      (firstQ as any)?.set?.title ||
      (firstQ as any)?.name ||
      (firstQ as any)?.title ||
      `Batch - ${importedQuestions.length} Questions`;

    let updatedQuestions: Question[] = [];
    let updatedFolderBatches: QuestionBatch[] = [];

    const newBatch: QuestionBatch = {
      id: batchId,
      title: batchTitle,
      name: batchTitle,
      folderId,
      subjectId,
      createdAt: Date.now(),
      questionCount: importedQuestions.length,
      questions: importedQuestions,
    };

    if (batchConfig?.mode === 'replace') {
      const otherQuestions = customQuestions.filter((q) => q.subCategoryId !== folderId);
      updatedQuestions = [...importedQuestions, ...otherQuestions];
      updatedFolderBatches = [newBatch];
    } else {
      updatedQuestions = [...importedQuestions, ...customQuestions];
      const currentList = batchesByFolder[folderId] || [];
      updatedFolderBatches = [newBatch, ...currentList];
    }

    setCustomQuestions(updatedQuestions);
    setBatchesByFolder((prev) => ({
      ...prev,
      [folderId]: updatedFolderBatches,
    }));

    try {
      localStorage.setItem('examprep_custom_questions', JSON.stringify(updatedQuestions));
      localStorage.setItem(`examprep_batches_${folderId}`, JSON.stringify(updatedFolderBatches));
      localStorage.setItem(
        `examprep_questions_${folderId}_${batchId}`,
        JSON.stringify(importedQuestions)
      );
    } catch (e) {
      console.error(e);
    }

    // Two-Way Cloud Firestore Persistence
    saveBatchToFirestore(
      { ...newBatch, questions: importedQuestions },
      folderId,
      subjectId
    ).catch((err) => {
      console.warn('Firestore bulk import save warning:', err);
    });

    setToastMessage(`${importedQuestions.length} questions saved to Cloud Firestore in '${batchTitle}'!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // DELETE CONTROL 1: Delete an individual question
  const handleDeleteQuestion = (questionId: string) => {
    const updated = customQuestions.filter((q) => q.id !== questionId);
    setCustomQuestions(updated);

    try {
      localStorage.setItem('examprep_custom_questions', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setBookmarks((prev) => prev.filter((b) => b.id !== questionId));
    setToastMessage('Question deleted successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // DELETE CONTROL 2: Delete entire Batch
  const handleDeleteBatch = (folderId: string, batchId: string) => {
    const targetBatch = (batchesByFolder[folderId] || []).find((b) => b.id === batchId);
    const batchTitle = targetBatch?.title || 'Batch';

    // 1. Remove from batches list for this folder
    const remainingBatches = (batchesByFolder[folderId] || []).filter((b) => b.id !== batchId);
    setBatchesByFolder((prev) => ({
      ...prev,
      [folderId]: remainingBatches,
    }));

    // 2. Remove questions belonging to this batch
    const remainingQuestions = customQuestions.filter(
      (q) => !(q.subCategoryId === folderId && (q.setId === batchId || (!q.setId && batchId.includes('_1'))))
    );
    setCustomQuestions(remainingQuestions);

    // 3. Sync to localStorage
    try {
      localStorage.setItem(`examprep_batches_${folderId}`, JSON.stringify(remainingBatches));
      localStorage.setItem('examprep_custom_questions', JSON.stringify(remainingQuestions));
      localStorage.removeItem(`examprep_questions_${folderId}_${batchId}`);
    } catch (e) {
      console.error(e);
    }

    // 4. Delete from Cloud Firestore
    deleteBatchFromFirestore(batchId).catch((err) => {
      console.warn('Firestore batch deletion warning:', err);
    });

    // 5. Return to folder view if currently inside this batch
    if (viewState.mode === 'batch' && viewState.batchId === batchId) {
      setViewState({
        mode: 'subCategory',
        subjectId: viewState.subjectId,
        subCategoryId: viewState.subCategoryId,
      });
    }

    setBatchToDelete(null);
    setToastMessage(`Batch '${batchTitle}' deleted from Cloud Firestore.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // DELETE CONTROL 3: Clear all batches in current folder
  const handleClearAllBatchesInFolder = (folderId: string) => {
    const folderBatchesToDelete = batchesByFolder[folderId] || [];

    // 1. Empty folder batches
    setBatchesByFolder((prev) => ({
      ...prev,
      [folderId]: [],
    }));

    // 2. Remove all questions in this folder
    const remainingQuestions = customQuestions.filter((q) => q.subCategoryId !== folderId);
    setCustomQuestions(remainingQuestions);

    // 3. Clear localStorage for this folder
    try {
      localStorage.removeItem(`examprep_batches_${folderId}`);
      localStorage.setItem('examprep_custom_questions', JSON.stringify(remainingQuestions));
    } catch (e) {
      console.error(e);
    }

    // 4. Delete each batch from Cloud Firestore
    folderBatchesToDelete.forEach((b) => {
      deleteBatchFromFirestore(b.id).catch((err) => {
        console.warn('Firestore clear batch warning:', err);
      });
    });

    // Return to folder view if in batch
    if (viewState.mode === 'batch') {
      setViewState({
        mode: 'subCategory',
        subjectId: viewState.subjectId,
        subCategoryId: viewState.subCategoryId,
      });
    }

    setIsConfirmClearFolderOpen(false);
    setToastMessage('All batches in this folder cleared from Cloud Firestore.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Bookmark toggle
  const handleToggleQuestionBookmark = (q: Question | PYQuestion) => {
    const existing = bookmarks.find((b) => b.id === q.id);
    if (existing) {
      setBookmarks((prev) => prev.filter((b) => b.id !== q.id));
    } else {
      const newItem: BookmarkItem = {
        id: q.id,
        type: 'question',
        title: q.question,
        subjectName: currentSubject?.name || 'Subject',
        subCategoryName: currentSubCategory?.name || 'Category',
        savedAt: Date.now(),
        payload: {
          viewState: {
            mode: 'subCategory',
            subjectId: q.subjectId,
            subCategoryId: q.subCategoryId,
          },
        },
      };
      setBookmarks((prev) => [newItem, ...prev]);
    }
  };

  const isItemBookmarked = (id: string) => bookmarks.some((b) => b.id === id);
  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  // Mistake Notebook Handlers
  const handleRemoveMistake = (mistakeId: string) => {
    const updated = mistakes.filter((m) => m.id !== mistakeId);
    setMistakes(updated);
    try {
      localStorage.setItem('examprep_mistake_notebook', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    // Delete from Cloud Firestore
    deleteMistakeFromFirestore(mistakeId).catch((err) => {
      console.warn('Firestore mistake delete warning:', err);
    });
    setToastMessage('Question removed from Mistake Notebook.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateMistakeNote = (mistakeId: string, notes: string, category: MistakeCategory) => {
    const updated = mistakes.map((m) =>
      m.id === mistakeId ? { ...m, userNotes: notes, category } : m
    );
    setMistakes(updated);
    try {
      localStorage.setItem('examprep_mistake_notebook', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    const targetMistake = updated.find((m) => m.id === mistakeId);
    if (targetMistake) {
      saveMistakeToFirestore(targetMistake).catch((err) => {
        console.warn('Firestore mistake update warning:', err);
      });
    }
    setToastMessage('Reflection note updated in Cloud Firestore.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveMistakeToNotebook = (newItem: MistakeItem) => {
    const updated = [newItem, ...mistakes.filter((m) => m.questionId !== newItem.questionId)];
    setMistakes(updated);
    try {
      localStorage.setItem('examprep_mistake_notebook', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    // Save to Cloud Firestore
    saveMistakeToFirestore(newItem).catch((err) => {
      console.warn('Firestore mistake save warning:', err);
    });
    setToastMessage('Saved to Cloud Firestore Mistake Notebook (ತಪ್ಪುಗಳ ನೋಟ್ಬುಕ್)!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartMistakesReTest = (mistakeQuestions: Question[]) => {
    if (!mistakeQuestions.length) return;
    const drillBatchId = `drill_${Date.now()}`;
    const drillBatchTitle = `Mistake Notebook Practice Drill (${mistakeQuestions.length} MCQs)`;

    const targetFolderId = (currentSubCategory?.id || 'pyq-2025-exams') as SubCategoryId;

    // Attach drill batch metadata
    const prepared = mistakeQuestions.map((q) => ({
      ...q,
      subCategoryId: targetFolderId,
      setId: drillBatchId,
      setName: drillBatchTitle,
    }));

    setCustomQuestions((prev) => [...prepared, ...prev]);

    setViewState({
      mode: 'batch',
      subjectId: currentSubject?.id || 'pyq',
      subCategoryId: targetFolderId,
      batchId: drillBatchId,
      batchTitle: drillBatchTitle,
      activeTab: 'quiz',
    });
  };

  // Quick jump from mobile bottom nav to first available batch or 2025 folder
  const handleOpenDirectQuiz = () => {
    // Find first batch with questions if any
    for (const [fId, batches] of Object.entries(batchesByFolder)) {
      if (batches.length > 0) {
        const firstBatch = batches[0];
        setViewState({
          mode: 'batch',
          subjectId: firstBatch.subjectId || 'pyq',
          subCategoryId: fId as SubCategoryId,
          batchId: firstBatch.id,
          batchTitle: firstBatch.title,
          activeTab: 'quiz',
        });
        return;
      }
    }
    // Otherwise open 2025 exams folder inside PYQ
    setViewState({
      mode: 'subCategory',
      subjectId: 'pyq',
      subCategoryId: 'pyq-2025-exams',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20 sm:pb-8 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Bar with back button, breadcrumbs, search, saved bookmarks, mistake notebook and + Add Question */}
      <TopBar
        viewState={viewState}
        onBack={handleBack}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSaved={() => setIsSavedOpen(true)}
        onOpenAddQuestion={() => setIsAddQuestionOpen(true)}
        onOpenBulkUpload={() => setIsBulkUploadOpen(true)}
        onOpenMistakeNotebook={() => setIsMistakeNotebookOpen(true)}
        savedCount={bookmarks.length}
        mistakesCount={mistakes.length}
        currentTitle={currentTitle}
        parentTitle={parentTitle}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {/* VIEW 1: HOME SCREEN (Clean dashboard displaying ONLY the 5 Main Category Cards; all sub-folders hidden) */}
        {viewState.mode === 'home' && (
          <div className="space-y-6">
            {/* Clean Dashboard Top Bar with quick action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                  <span>Exam & Subject Folders</span>
                  <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    CBT Engine
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs">
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Firestore Cloud Synced</span>
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  ಪರೀಕ್ಷಾ ಮತ್ತು ವಿಷಯ ವಿಭಾಗಗಳು · Practice bilingual custom batches with live countdown timer, scorecard & mistake notebook (100% saved in Cloud Firestore)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsBulkUploadOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Questions JSON (100+)</span>
                </button>
                <button
                  onClick={() => setIsAddQuestionOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>+ Add Question</span>
                </button>
              </div>
            </div>

            {/* Main Category Cards Grid: 5 Clean Cards (Zero Sub-folders on Home) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Select an Exam or Subject Category</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tap any category below to open its dedicated folders and practice custom question batches
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  5 Categories
                </span>
              </div>

              {/* 5 Clean Category Cards (1. PYQs, 2. GK, 3. English, 4. Maths, 5. Reasoning) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {examSubjects.map((subj, index) => {
                  let totalSubjectBatches = 0;
                  let totalSubjectMCQs = 0;
                  subj.subCategories.forEach((sc) => {
                    totalSubjectBatches += getFolderBatches(sc.id).length;
                    totalSubjectMCQs += getFolderQuestionCount(sc.id);
                  });

                  const isPYQ = subj.id === 'pyq';
                  const isEnglish = subj.id === 'english';

                  return (
                    <div
                      key={subj.id}
                      onClick={() => setViewState({ mode: 'subject', subjectId: subj.id })}
                      className={`group cursor-pointer bg-white rounded-2xl border p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between active:scale-[0.98] ${
                        isPYQ
                          ? 'border-indigo-300 hover:border-indigo-500 bg-gradient-to-br from-white via-indigo-50/20 to-amber-50/20 md:col-span-2 lg:col-span-1'
                          : isEnglish
                          ? 'border-purple-200 hover:border-purple-400 bg-purple-50/10'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                              isPYQ
                                ? 'bg-indigo-600 text-white'
                                : 'bg-indigo-50 border border-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white'
                            }`}
                          >
                            <RenderIcon name={subj.iconName} className="w-6 h-6" />
                          </div>
                          {isPYQ ? (
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              <span>4 Exam Folders Inside</span>
                            </span>
                          ) : isEnglish ? (
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                              Sectional Tests Inside
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                              0{index + 1}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1.5 leading-snug">
                          {subj.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {subj.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800 font-mono">
                            {subj.subCategories.length}
                          </span>
                          <span>Folders</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-indigo-700 font-mono">
                            {totalSubjectBatches}
                          </span>
                          <span>Batches</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-slate-800 font-mono">
                            {totalSubjectMCQs}
                          </span>
                          <span>MCQs</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SUBJECT VIEW (LIST OF FOLDERS IN A SUBJECT - e.g. PYQs 4 Exam Folders) */}
        {viewState.mode === 'subject' && currentSubject && (
          <div className="space-y-6">
            {/* Top Navigation Bar: ← Back to Subjects */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <button
                onClick={() => setViewState({ mode: 'home' })}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-xs w-fit"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-600" />
                <span>← Back to Subjects (ಮುಖ್ಯ ಪುಟ)</span>
              </button>
              <div className="text-xs text-slate-500 font-medium">
                Dashboard / {currentSubject.id === 'pyq' ? "PYQs - Previous Years' Papers" : currentSubject.name}
              </div>
            </div>

            {/* Header info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    currentSubject.id === 'pyq'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                  }`}
                >
                  <RenderIcon name={currentSubject.iconName} className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">
                    {currentSubject.id === 'pyq' ? 'Master Exam Category' : 'Subject Category'}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {currentSubject.id === 'pyq'
                      ? "PYQs - Previous Years' Papers (ಹಿಂದಿನ ಪ್ರಶ್ನೆಗಳು)"
                      : currentSubject.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {currentSubject.tagline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                  {currentSubject.subCategories.length} Dedicated Folders
                </span>
              </div>
            </div>

            {/* Dedicated Folders Grid (e.g. 2025 Exams, SSC CGL, Phase Exams, SSC Stenographer) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>
                    {currentSubject.id === 'pyq'
                      ? '4 Dedicated Exam Folders (ಪರೀಕ್ಷಾ ಫೋಲ್ಡರ್‌ಗಳು)'
                      : `Select a Folder in ${currentSubject.shortName}`}
                  </span>
                </h2>
                <span className="text-xs text-slate-500">Bilingual Support (ಕನ್ನಡ & English)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentSubject.subCategories.map((subCat) => {
                  const bList = getFolderBatches(subCat.id);
                  const qCount = getFolderQuestionCount(subCat.id);

                  return (
                    <div
                      key={subCat.id}
                      onClick={() =>
                        setViewState({
                          mode: 'subCategory',
                          subjectId: currentSubject.id,
                          subCategoryId: subCat.id,
                        })
                      }
                      className="group cursor-pointer bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between active:scale-[0.98]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-xs">
                            <RenderIcon name={subCat.iconName} className="w-5 h-5" />
                          </div>
                          {subCat.badge && (
                            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {subCat.badge}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                          {subCat.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {subCat.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-indigo-700 font-mono">
                            {bList.length}
                          </span>
                          <span>Batches</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-slate-800 font-mono">
                            {qCount}
                          </span>
                          <span>MCQs</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: FOLDER VIEW (DISPLAYS ONLY USER-CREATED BATCHES / SETS) */}
        {viewState.mode === 'subCategory' && currentSubCategory && currentSubject && (
          <div className="space-y-6">
            {/* Top Navigation Bar: ← Back to PYQs or Subject */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <button
                onClick={() => setViewState({ mode: 'subject', subjectId: currentSubject.id })}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-xs w-fit"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-600" />
                <span>
                  ← Back to {currentSubject.id === 'pyq' ? 'PYQs (4 Exam Folders)' : currentSubject.shortName}
                </span>
              </button>
              <div className="text-xs text-slate-500 font-medium">
                {currentSubject.id === 'pyq' ? 'PYQs' : currentSubject.shortName} / {currentSubCategory.name}
              </div>
            </div>
            {/* Folder Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                  <RenderIcon name={currentSubCategory.iconName} className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-indigo-600 font-semibold mb-0.5">
                    {currentSubject.name} · Folder
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {currentSubCategory.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {currentSubCategory.description}
                  </p>
                </div>
              </div>

              {/* Folder Actions: + Add Batch / Upload JSON & Clear All Batches */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsAddQuestionOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Batch / Upload JSON</span>
                </button>

                {activeFolderBatches.length > 0 && (
                  <button
                    onClick={() => setIsConfirmClearFolderOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-colors"
                    title="Clear all question batches in this folder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All in Folder</span>
                  </button>
                )}
              </div>
            </div>

            {/* BATCHES / SETS LIST */}
            <div>
              {/* Empty state if no batches exist in this folder */}
              {activeFolderBatches.length === 0 ? (
                <div className="py-14 px-6 text-center bg-white rounded-2xl border-2 border-dashed border-slate-300 space-y-4 max-w-xl mx-auto my-6 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
                    <FolderOpen className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      No question batches added yet.
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                      Click '+ Add Batch / Upload JSON' below to add single questions or import 100+ questions via JSON into this folder.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddQuestionOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Add Batch / Upload JSON</span>
                  </button>
                </div>
              ) : (
                /* User-Created Custom Batch Cards */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-base font-bold text-slate-900">
                        Question Batches in this Folder ({activeFolderBatches.length})
                      </h2>
                    </div>
                    <span className="text-xs text-slate-500">
                      Total {getFolderQuestionCount(currentSubCategory.id)} MCQs
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeFolderBatches.map((batch, idx) => {
                      // Custom Batch Title entered during upload (e.g. set.name, set.title, setName, or title) with fallback
                      const displayTitle =
                        (batch.title && batch.title.trim() && batch.title.trim() !== 'Question Batch' && batch.title.trim() !== 'Custom Question Batch')
                          ? batch.title.trim()
                          : (batch.name && batch.name.trim() && batch.name.trim() !== 'Question Batch' && batch.name.trim() !== 'Custom Question Batch')
                          ? batch.name.trim()
                          : ((batch as any).setName && typeof (batch as any).setName === 'string' && (batch as any).setName.trim())
                          ? (batch as any).setName.trim()
                          : ((batch as any).set?.name && typeof (batch as any).set.name === 'string' && (batch as any).set.name.trim())
                          ? (batch as any).set.name.trim()
                          : ((batch as any).set?.title && typeof (batch as any).set.title === 'string' && (batch as any).set.title.trim())
                          ? (batch as any).set.title.trim()
                          : ((batch as any).batchTitle && typeof (batch as any).batchTitle === 'string' && (batch as any).batchTitle.trim())
                          ? (batch as any).batchTitle.trim()
                          : (batch.title && batch.title.trim())
                          ? batch.title.trim()
                          : (batch.name && batch.name.trim())
                          ? batch.name.trim()
                          : `Batch ${idx + 1}`;

                      return (
                        <div
                          key={batch.id}
                          className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs transition-all space-y-4 flex flex-col justify-between"
                        >
                          {/* Batch Header: User-Created Custom Batch Title in bold right above MCQs count badge */}
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3
                                className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2 break-words"
                                title={displayTitle}
                              >
                                {displayTitle}
                              </h3>
                              <button
                                onClick={() =>
                                  setBatchToDelete({
                                    id: batch.id,
                                    title: displayTitle,
                                    folderId: currentSubCategory.id,
                                    questionCount: batch.questionCount,
                                  })
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                                title="Delete this batch"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* MCQs Count Badge right below the bold title */}
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold font-mono">
                              <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{batch.questionCount} MCQs</span>
                            </div>
                          </div>

                          {/* Batch Action Buttons: [Practice Quiz] & [View Questions] */}
                          <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
                            <button
                              onClick={() =>
                                setViewState({
                                  mode: 'batch',
                                  subjectId: currentSubject.id,
                                  subCategoryId: currentSubCategory.id,
                                  batchId: batch.id,
                                  batchTitle: displayTitle,
                                  activeTab: 'quiz',
                                })
                              }
                              className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                            >
                              <HelpCircle className="w-4 h-4" />
                              <span>Practice Quiz</span>
                            </button>

                            <button
                              onClick={() =>
                                setViewState({
                                  mode: 'batch',
                                  subjectId: currentSubject.id,
                                  subCategoryId: currentSubCategory.id,
                                  batchId: batch.id,
                                  batchTitle: displayTitle,
                                  activeTab: 'list',
                                })
                              }
                              className="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <Layers className="w-4 h-4 text-indigo-600" />
                              <span>View Questions</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: BATCH PRACTICE QUIZ OR QUESTIONS LIST VIEW */}
        {viewState.mode === 'batch' && currentSubCategory && currentSubject && (
          <div className="space-y-4">
            {/* Tab switch bar (Practice Quiz vs Question Bank) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-indigo-600 font-semibold mb-0.5">
                  {currentSubject.name} · {currentSubCategory.name}
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  {viewState.batchTitle}
                </h1>
                <span className="text-xs text-slate-500 font-medium">
                  {activeBatchQuestions.length} Bilingual MCQs
                </span>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setViewState({ ...viewState, activeTab: 'quiz' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewState.activeTab === 'quiz'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Practice Quiz</span>
                </button>

                <button
                  onClick={() => setViewState({ ...viewState, activeTab: 'list' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewState.activeTab === 'list'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Question Bank ({activeBatchQuestions.length})</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: Quiz or List */}
            {viewState.activeTab === 'quiz' ? (
              <QuizView
                questions={activeBatchQuestions}
                topicTitle={viewState.batchTitle}
                onBookmarkQuestion={handleToggleQuestionBookmark}
                isBookmarked={isItemBookmarked}
                onOpenAddQuestion={() => setIsAddQuestionOpen(true)}
                onSwitchToListMode={() => setViewState({ ...viewState, activeTab: 'list' })}
                activeSetName={viewState.batchTitle}
                onExitTest={() =>
                  setViewState({
                    mode: 'subCategory',
                    subjectId: viewState.subjectId,
                    subCategoryId: viewState.subCategoryId,
                  })
                }
                onOpenMistakeNotebook={() => setIsMistakeNotebookOpen(true)}
                onSaveMistakeToNotebook={handleSaveMistakeToNotebook}
                savedMistakeQuestionIds={mistakes.map((m) => m.questionId)}
              />
            ) : (
              <QuestionListView
                questions={activeBatchQuestions}
                topicTitle={viewState.batchTitle}
                onBookmarkQuestion={handleToggleQuestionBookmark}
                isBookmarked={isItemBookmarked}
                onSwitchToQuizMode={() => setViewState({ ...viewState, activeTab: 'quiz' })}
                onDeleteQuestion={handleDeleteQuestion}
                onDeleteSet={() =>
                  setBatchToDelete({
                    id: viewState.batchId,
                    title: viewState.batchTitle,
                    folderId: currentSubCategory.id,
                    questionCount: activeBatchQuestions.length,
                  })
                }
                activeSetName={viewState.batchTitle}
                activeSetId={viewState.batchId}
              />
            )}
          </div>
        )}
      </main>

      {/* CONFIRMATION MODAL: Delete Single Batch */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Delete Batch: {batchToDelete.title}?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete this batch? All{' '}
              <span className="font-bold text-rose-600 font-mono">
                {batchToDelete.questionCount} questions
              </span>{' '}
              in this upload will be permanently removed from this folder.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBatchToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBatch(batchToDelete.folderId, batchToDelete.id)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: Clear All Batches in Folder */}
      {isConfirmClearFolderOpen && currentSubCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Clear All Batches in {currentSubCategory.name}?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This will permanently delete all question batches and MCQs in the{' '}
              <span className="font-bold text-slate-900">{currentSubCategory.name}</span> folder.
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearFolderOpen(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleClearAllBatchesInFolder(currentSubCategory.id)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All in Folder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        subjects={examSubjects}
        onSelectResult={(newView) => {
          setViewState(newView);
          setIsSearchOpen(false);
        }}
      />

      {/* Bookmarks / Saved Modal */}
      <SavedModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleRemoveBookmark}
        onNavigateToBookmark={(newView: ViewState) => {
          setViewState(newView);
          setIsSavedOpen(false);
        }}
      />

      {/* Add Question / Upload Batch Modal */}
      <AddQuestionModal
        isOpen={isAddQuestionOpen}
        onClose={() => setIsAddQuestionOpen(false)}
        subjects={examSubjects}
        currentSubjectId={viewState.mode !== 'home' ? viewState.subjectId : 'pyq'}
        currentSubCategoryId={
          viewState.mode === 'subCategory' || viewState.mode === 'batch'
            ? viewState.subCategoryId
            : 'pyq-2025-exams'
        }
        onQuestionAdded={handleAddQuestion}
        onBulkQuestionsAdded={handleFolderBulkQuestionsAdded}
        existingSetsCount={activeFolderBatches.length}
      />

      {/* Bulk JSON Upload Modal (Direct 100+ Question Parser) */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onQuestionsImported={(imported, batchConfig) => {
          if (!imported.length) return;
          const folderId = imported[0].subCategoryId;
          handleFolderBulkQuestionsAdded(imported, folderId, batchConfig);
          setIsBulkUploadOpen(false);
        }}
        activeSubCategoryId={
          viewState.mode === 'subCategory' || viewState.mode === 'batch'
            ? viewState.subCategoryId
            : undefined
        }
        activeSubjectId={
          viewState.mode === 'subCategory' || viewState.mode === 'batch' || viewState.mode === 'subject'
            ? viewState.subjectId
            : undefined
        }
        existingSetsCount={activeFolderBatches.length}
      />

      {/* Mistake Notebook Modal */}
      <MistakeNotebookModal
        isOpen={isMistakeNotebookOpen}
        onClose={() => setIsMistakeNotebookOpen(false)}
        mistakes={mistakes}
        onRemoveMistake={handleRemoveMistake}
        onUpdateMistakeNote={handleUpdateMistakeNote}
        onStartReTest={handleStartMistakesReTest}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        viewState={viewState}
        onGoHome={() => setViewState({ mode: 'home' })}
        onOpenDirectQuiz={handleOpenDirectQuiz}
        onOpenSaved={() => setIsSavedOpen(true)}
        onOpenMistakeNotebook={() => setIsMistakeNotebookOpen(true)}
        savedCount={bookmarks.length}
        mistakesCount={mistakes.length}
      />
    </div>
  );
}
