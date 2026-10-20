import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  PlusCircle,
  CheckCircle,
  Languages,
  AlertCircle,
  FolderCheck,
  Lock,
  Upload,
  FileCode,
  Copy,
  Check,
  Download,
  Layers,
  FileText,
  Sparkles,
  RefreshCw,
  PlusSquare,
} from 'lucide-react';
import { Subject, Question, SubjectId, SubCategoryId } from '../types';

export interface BatchConfig {
  mode: 'new_set' | 'replace';
  setName: string;
  setId?: string;
}

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  currentSubjectId?: SubjectId;
  currentSubCategoryId?: SubCategoryId;
  currentTopicId?: string;
  onQuestionAdded: (newQuestion: Question, batchConfig?: BatchConfig) => void;
  onBulkQuestionsAdded?: (
    questions: Question[],
    folderName: string,
    batchConfig?: BatchConfig
  ) => void;
  existingSetsCount?: number;
}

// Sample JSON template illustrating bilingual 100+ questions format
const SAMPLE_JSON_SNIPPET = [
  {
    "question": "Who was appointed as the 51st Chief Justice of India in November 2024?",
    "questionKn": "ನವೆಂಬರ್ 2024 ರಲ್ಲಿ ಭಾರತದ 51 ನೇ ಮುಖ್ಯ ನ್ಯಾಯಮೂರ್ತಿಯಾಗಿ ಯಾರು ಅಧಿಕಾರ ಸ್ವೀಕರಿಸಿದರು?",
    "options": [
      "Justice Sanjiv Khanna",
      "Justice B.R. Gavai",
      "Justice Surya Kant",
      "Justice Vikram Nath"
    ],
    "optionsKn": [
      "ನ್ಯಾಯಮೂರ್ತಿ ಸಂಜೀವ್ ಖನ್ನಾ",
      "ನ್ಯಾಯಮೂರ್ತಿ ಬಿ.ಆರ್. ಗವಾಯಿ",
      "ನ್ಯಾಯಮೂರ್ತಿ ಸೂರ್ಯಕಾಂತ್",
      "ನ್ಯಾಯಮೂರ್ತಿ ವಿಕ್ರಮ್ ನಾಥ್"
    ],
    "correctAnswerIndex": 0,
    "explanation": "Justice Sanjiv Khanna took oath as the 51st Chief Justice of India on 11 November 2024, succeeding Justice D.Y. Chandrachud. He served as the executive chairman of the National Legal Services Authority (NALSA).",
    "explanationKn": "ನ್ಯಾಯಮೂರ್ತಿ ಸಂಜೀವ್ ಖನ್ನಾ ಅವರು 11 ನವೆಂಬರ್ 2024 ರಂದು ಭಾರತದ 51 ನೇ ಮುಖ್ಯ ನ್ಯಾಯಮೂರ್ತಿಯಾಗಿ ಪ್ರಮಾಣ ವಚನ ಸ್ವೀಕರಿಸಿದರು. ಅವರು ರಾಷ್ಟ್ರೀಯ ಕಾನೂನು ಸೇವೆಗಳ ಪ್ರಾಧಿಕಾರದ (NALSA) ಕಾರ್ಯಕಾರಿ ಅಧ್ಯಕ್ಷರಾಗಿಯೂ ಸೇವೆ ಸಲ್ಲಿಸಿದ್ದಾರೆ.",
    "difficulty": "Easy",
    "examTag": "2025 Target Special",
    "year": 2025
  },
  {
    "question": "Which Constitutional Amendment Act reduced the voting age in India from 21 years to 18 years?",
    "questionKn": "ಭಾರತದಲ್ಲಿ ಮತದಾನದ ವಯಸ್ಸನ್ನು 21 ವರ್ಷಗಳಿಂದ 18 ವರ್ಷಕ್ಕೆ ಇಳಿಸಿದ ಸಾಂವಿಧಾನಿಕ ತಿದ್ದುಪಡಿ ಕಾಯ್ದೆ ಯಾವುದು?",
    "options": [
      "42nd Amendment Act",
      "61st Amendment Act",
      "73rd Amendment Act",
      "86th Amendment Act"
    ],
    "optionsKn": [
      "42 ನೇ ತಿದ್ದುಪಡಿ ಕಾಯ್ದೆ",
      "61 ನೇ ತಿದ್ದುಪಡಿ ಕಾಯ್ದೆ",
      "73 ನೇ ತಿದ್ದುಪಡಿ ಕಾಯ್ದೆ",
      "86 ನೇ ತಿದ್ದುಪಡಿ ಕಾಯ್ದೆ"
    ],
    "correctAnswerIndex": 1,
    "explanation": "The 61st Constitutional Amendment Act, 1988 amended Article 326 of the Constitution to lower the voting age from 21 to 18 years. It came into force on March 28, 1989 during Rajiv Gandhi's tenure.",
    "explanationKn": "1988 ರ 61 ನೇ ಸಾಂವಿಧಾನಿಕ ತಿದ್ದುಪಡಿ ಕಾಯ್ದೆಯು ಸಂವಿಧಾನದ 326 ನೇ ವಿಧಿಯನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡುವ ಮೂಲಕ ಮತದಾನದ ಅರ್ಹತಾ ವಯಸ್ಸನ್ನು 21 ರಿಂದ 18 ವರ್ಷಕ್ಕೆ ಇಳಿಸಿತು.",
    "difficulty": "Easy",
    "examTag": "SSC Tier 1",
    "year": 2024
  }
];

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  subjects,
  currentSubjectId,
  currentSubCategoryId,
  currentTopicId,
  onQuestionAdded,
  onBulkQuestionsAdded,
  existingSetsCount = 0,
}) => {
  // Top-Level Modal Tab: 'single' (Manual Form) vs 'bulk' (Bulk JSON Paste / Upload)
  const [modalTab, setModalTab] = useState<'single' | 'bulk'>('single');

  // Hierarchy selections
  const [subjectId, setSubjectId] = useState<SubjectId>(currentSubjectId || 'pyq');
  const [subCategoryId, setSubCategoryId] = useState<SubCategoryId>(
    currentSubCategoryId || 'pyq-2025-exams'
  );
  const [topicId, setTopicId] = useState<string>(currentTopicId || '');

  // Set / Batch configuration states (Prevents question merging)
  const [batchMode, setBatchMode] = useState<'new_set' | 'replace'>('new_set');
  const [customSetName, setCustomSetName] = useState('');

  // Manual Form States (No character/word limits)
  const [questionEn, setQuestionEn] = useState('');
  const [questionKn, setQuestionKn] = useState('');
  const [optionAEn, setOptionAEn] = useState('');
  const [optionAKn, setOptionAKn] = useState('');
  const [optionBEn, setOptionBEn] = useState('');
  const [optionBKn, setOptionBKn] = useState('');
  const [optionCEn, setOptionCEn] = useState('');
  const [optionCKn, setOptionCKn] = useState('');
  const [optionDEn, setOptionDEn] = useState('');
  const [optionDKn, setOptionDKn] = useState('');
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [explanationEn, setExplanationEn] = useState('');
  const [explanationKn, setExplanationKn] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [examTag, setExamTag] = useState('2025 Target Exam');
  const [activeLangTab, setActiveLangTab] = useState<'dual' | 'en' | 'kn'>('dual');
  const [errorMessage, setErrorMessage] = useState('');

  // Bulk JSON Tab States
  const [jsonInput, setJsonInput] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock to folder if opened inside an active folder
  const isLockedToFolder = Boolean(currentSubCategoryId);

  // Auto-expand textarea dynamically with zero character limit
  const handleAutoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.max(target.scrollHeight, 72)}px`;
  };

  useEffect(() => {
    if (currentSubjectId) setSubjectId(currentSubjectId);
    if (currentSubCategoryId) setSubCategoryId(currentSubCategoryId);
    if (currentTopicId) setTopicId(currentTopicId);
  }, [currentSubjectId, currentSubCategoryId, currentTopicId, isOpen]);

  // Derive active folder details
  const selectedSubject = subjects.find((s) => s.id === subjectId) || subjects[0];
  const availableSubCategories = selectedSubject?.subCategories || [];
  const selectedSubCategory =
    availableSubCategories.find((sc) => sc.id === subCategoryId) || availableSubCategories[0];
  const availableTopics = selectedSubCategory?.topics || [];

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setBulkError(null);
      setParsedCount(null);
      setCustomSetName('');
      setBatchMode('new_set');
    }
  }, [isOpen]);

  // Live validation of pasted JSON
  useEffect(() => {
    if (!jsonInput.trim()) {
      setParsedCount(null);
      setBulkError(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput.trim());
      const arr = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data;
      if (Array.isArray(arr)) {
        setParsedCount(arr.length);
        setBulkError(null);
      } else {
        setParsedCount(null);
        setBulkError('JSON root must be an array of question objects (e.g., [ {...}, {...} ]).');
      }
    } catch {
      setParsedCount(null);
      setBulkError('Invalid JSON syntax. Please check for missing commas or quotes.');
    }
  }, [jsonInput]);

  if (!isOpen) return null;

  const currentFolderDisplayName = selectedSubCategory?.name || 'Current Folder';
  const targetTopicId = topicId || availableTopics[0]?.id || 'general';

  // Copy sample template to clipboard
  const handleCopyTemplate = () => {
    const jsonStr = JSON.stringify(SAMPLE_JSON_SNIPPET, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Download template as .json file
  const handleDownloadTemplate = () => {
    const jsonStr = JSON.stringify(SAMPLE_JSON_SNIPPET, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kannada_english_questions_template.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle file upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonInput(content);
        const parsed = JSON.parse(content);
        const arr = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data;
        if (Array.isArray(arr)) {
          setParsedCount(arr.length);
          setBulkError(null);
          // Auto-populate batch title from file/JSON metadata if not yet entered
          const autoTitle =
            parsed.name ||
            parsed.title ||
            parsed.setName ||
            parsed.set?.name ||
            parsed.set?.title ||
            (arr[0] ? arr[0].setName || arr[0].set?.name || arr[0].set?.title || arr[0].name || arr[0].title : '');
          if (autoTitle && typeof autoTitle === 'string' && !customSetName.trim()) {
            setCustomSetName(autoTitle);
          }
        } else {
          setBulkError('JSON file must contain an array of question objects.');
        }
      } catch {
        setBulkError('Failed to parse uploaded JSON file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Process & Import Bulk Questions into CURRENT folder as independent Batch/Set
  const handleProcessBulkImport = () => {
    if (!jsonInput.trim()) {
      setBulkError('Please paste JSON questions or upload a .json file.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput.trim());
      const items: any[] = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data;

      if (!Array.isArray(items) || items.length === 0) {
        setBulkError('No question objects found in the provided JSON array.');
        return;
      }

      // Auto-resolve batch title from customSetName, JSON root, or question item metadata, or fallback to 'Batch 1'
      const detectedBatchTitle =
        customSetName.trim() ||
        parsed.name ||
        parsed.title ||
        parsed.setName ||
        parsed.set?.name ||
        parsed.set?.title ||
        items[0]?.setName ||
        items[0]?.set?.name ||
        items[0]?.set?.title ||
        items[0]?.name ||
        items[0]?.title ||
        `Batch ${existingSetsCount + 1}`;

      const finalSetName = (typeof detectedBatchTitle === 'string' && detectedBatchTitle.trim())
        ? detectedBatchTitle.trim()
        : `Batch ${existingSetsCount + 1}`;

      // Generate distinct set ID and Name to PREVENT question merging
      const newSetId = `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = Date.now();

      // Automatically attach active folder and format strictly with Batch/Set metadata
      const processedQuestions: Question[] = items.map((item, index) => {
        // Resolve question text
        const qEn = item.questionEn || item.question || item.text || `Question ${index + 1}`;
        const qKn = item.questionKn || item.kannadaQuestion || item.kannada || qEn;

        // Resolve options
        const rawOptionsEn = item.options || item.optionsEn || [
          item.optionA || 'Option A',
          item.optionB || 'Option B',
          item.optionC || 'Option C',
          item.optionD || 'Option D',
        ];

        const rawOptionsKn = item.optionsKn || item.kannadaOptions || rawOptionsEn;

        // Resolve correct answer index
        let correctIdx = 0;
        if (typeof item.correctAnswerIndex === 'number') {
          correctIdx = item.correctAnswerIndex;
        } else if (typeof item.correctOptionIndex === 'number') {
          correctIdx = item.correctOptionIndex;
        } else if (typeof item.correctAnswer === 'number') {
          correctIdx = item.correctAnswer;
        } else if (typeof item.correctAnswer === 'string') {
          const letter = item.correctAnswer.trim().toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(letter)) {
            correctIdx = letter.charCodeAt(0) - 65;
          } else {
            const foundIdx = rawOptionsEn.findIndex(
              (opt: string) => opt.toLowerCase().trim() === item.correctAnswer.toLowerCase().trim()
            );
            if (foundIdx !== -1) correctIdx = foundIdx;
          }
        }

        const validIndex = correctIdx >= 0 && correctIdx <= 3 ? correctIdx : 0;

        // Resolve explanations
        const expEn = item.explanationEn || item.explanation || item.solution || '';
        const expKn = item.explanationKn || item.kannadaExplanation || expEn || '';

        return {
          id: item.id || `bulk_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
          subjectId: subjectId,
          subCategoryId: subCategoryId, // Strictly binds to active folder!
          topicId: targetTopicId, // Strictly binds to active topic!
          setId: newSetId, // Strictly isolated Set ID
          setName: finalSetName,
          createdAt: now,
          question: qEn,
          questionKn: qKn,
          options: rawOptionsEn.slice(0, 4),
          optionsKn: rawOptionsKn.slice(0, 4),
          correctAnswerIndex: validIndex,
          explanation: expEn || expKn || 'Detailed solution provided.',
          explanationKn: expKn || undefined,
          difficulty: item.difficulty || 'Medium',
          examTag: item.examTag || finalSetName || currentFolderDisplayName,
          year: item.year || 2025,
          isCustom: true,
        };
      });

      // Pass questions and batch configuration to parent handler
      if (onBulkQuestionsAdded) {
        onBulkQuestionsAdded(processedQuestions, currentFolderDisplayName, {
          mode: batchMode,
          setName: finalSetName,
          setId: newSetId,
        });
      } else {
        processedQuestions.forEach((q) => onQuestionAdded(q));
      }

      onClose();
    } catch (err: any) {
      setBulkError(err?.message || 'Failed to process bulk questions.');
    }
  };

  // Submit Single Manual Question
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!questionEn.trim() && !questionKn.trim()) {
      setErrorMessage('Please enter the question in at least English or Kannada.');
      return;
    }

    const optA = optionAEn.trim() || optionAKn.trim();
    const optB = optionBEn.trim() || optionBKn.trim();
    const optC = optionCEn.trim() || optionCKn.trim();
    const optD = optionDEn.trim() || optionDKn.trim();

    if (!optA || !optB || !optC || !optD) {
      setErrorMessage('Please fill in all 4 options (A, B, C, and D).');
      return;
    }

    const optionsEn = [
      optionAEn.trim() || optionAKn.trim(),
      optionBEn.trim() || optionBKn.trim(),
      optionCEn.trim() || optionCKn.trim(),
      optionDEn.trim() || optionDKn.trim(),
    ];

    const optionsKn = [
      optionAKn.trim() || optionAEn.trim(),
      optionBKn.trim() || optionBEn.trim(),
      optionCKn.trim() || optionCEn.trim(),
      optionDKn.trim() || optionDEn.trim(),
    ];

    const finalSetName = customSetName.trim() || `Batch ${existingSetsCount + 1}`;
    const newSetId = `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newQuestion: Question = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      subjectId,
      subCategoryId,
      topicId: targetTopicId,
      setId: newSetId,
      setName: finalSetName,
      createdAt: Date.now(),
      question: questionEn.trim() || questionKn.trim(),
      questionKn: questionKn.trim() || questionEn.trim(),
      options: optionsEn,
      optionsKn: optionsKn,
      correctAnswerIndex: correctOptionIndex,
      explanation: explanationEn.trim() || explanationKn.trim() || 'Detailed solution provided.',
      explanationKn: explanationKn.trim() || undefined,
      difficulty,
      examTag: examTag.trim() || `${currentFolderDisplayName} 2025`,
      year: 2025,
      isCustom: true,
    };

    onQuestionAdded(newQuestion, {
      mode: batchMode,
      setName: finalSetName,
      setId: newSetId,
    });
    onClose();

    // Reset form
    setQuestionEn('');
    setQuestionKn('');
    setOptionAEn('');
    setOptionAKn('');
    setOptionBEn('');
    setOptionBKn('');
    setOptionCEn('');
    setOptionCKn('');
    setOptionDEn('');
    setOptionDKn('');
    setExplanationEn('');
    setExplanationKn('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Add Questions / Create Set
              </h2>
              <p className="text-xs text-indigo-200">
                Target Folder: <span className="font-semibold text-white">{currentFolderDisplayName}</span> (Bilingual Kannada & English)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Primary Tabs: Manual Single Question vs Bulk JSON Paste/Upload */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => setModalTab('single')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              modalTab === 'single'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Manual Single Question</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('bulk')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              modalTab === 'bulk'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Bulk JSON Upload (100+)</span>
          </button>
        </div>

        {/* SET / BATCH CONFIGURATION CARD (Prevents question merging) */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Question Sets Architecture (ಪ್ರತ್ಯೇಕ ಸೆಟ್‌ಗಳ ನಿರ್ವಹಣೆ):</span>
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Prevents Merging
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Option A: Create as New Set */}
            <label
              className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                batchMode === 'new_set'
                  ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500 text-indigo-950 font-medium'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="batchMode"
                checked={batchMode === 'new_set'}
                onChange={() => setBatchMode('new_set')}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <PlusSquare className="w-3.5 h-3.5 text-indigo-600" />
                  Option A: Create as New Set
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                  Keeps this batch completely separate (e.g., Set 1, Set 2).
                </span>
              </div>
            </label>

            {/* Option B: Replace All in Folder */}
            <label
              className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                batchMode === 'replace'
                  ? 'bg-rose-50/70 border-rose-500 ring-1 ring-rose-500 text-rose-950 font-medium'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="batchMode"
                checked={batchMode === 'replace'}
                onChange={() => setBatchMode('replace')}
                className="mt-0.5 text-rose-600 focus:ring-rose-500"
              />
              <div>
                <span className="font-bold text-rose-900 block flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                  Option B: Replace All Questions
                </span>
                <span className="text-[11px] text-rose-700 block mt-0.5 leading-snug">
                  Clears existing questions in this folder and starts fresh.
                </span>
              </div>
            </label>
          </div>

          {/* Mandatory Batch / Set Title Input Field */}
          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1">
              Batch / Set Title (ಕಡ್ಡಾಯ - Mandatory) <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={customSetName}
              onChange={(e) => setCustomSetName(e.target.value)}
              placeholder='ಉದಾಹರಣೆಗೆ: "ಸಂವಿಧಾನದ ಪ್ರಮುಖ ವಿಧಿಗಳು - Batch 1", "Modern History Mock 1", "SSC CGL Practice 2025"'
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-indigo-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-400 shadow-xs"
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              This batch title will appear on its card inside this folder with its own [Practice Quiz] and [View Questions] buttons.
            </span>
          </div>
        </div>

        {/* TAB 1: MANUAL SINGLE QUESTION FORM */}
        {modalTab === 'single' && (
          <form onSubmit={handleSingleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Folder Isolation Banner */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FolderCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="text-xs text-slate-800">
                  <span className="font-semibold text-indigo-900">Target Folder: </span>
                  <span className="font-bold text-slate-900">
                    {currentFolderDisplayName}
                  </span>
                  {topicId && selectedSubCategory && (
                    <span className="text-slate-500 block text-[11px] mt-0.5">
                      Topic: {availableTopics.find((t) => t.id === topicId)?.name || 'General Practice'}
                    </span>
                  )}
                </div>
              </div>
              {isLockedToFolder && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  <Lock className="w-3 h-3" />
                  Folder Isolated
                </span>
              )}
            </div>

            {/* Language Input Mode Toggle */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-indigo-600" />
                <span>Bilingual Question Inputs</span>
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveLangTab('dual')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeLangTab === 'dual'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dual View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLangTab('en')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeLangTab === 'en'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English Only
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLangTab('kn')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeLangTab === 'kn'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ಕನ್ನಡ Only
                </button>
              </div>
            </div>

            {/* Question Text Fields (No Word Limit, Auto-Expanding) */}
            <div className="space-y-3">
              {(activeLangTab === 'dual' || activeLangTab === 'en') && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Question Text (English - No word limit):
                  </label>
                  <textarea
                    rows={3}
                    value={questionEn}
                    onChange={(e) => setQuestionEn(e.target.value)}
                    onInput={handleAutoExpand}
                    placeholder="Type full complete question in English (multi-line supported)..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed transition-all resize-y min-h-[72px]"
                  />
                </div>
              )}

              {(activeLangTab === 'dual' || activeLangTab === 'kn') && (
                <div>
                  <label className="text-xs font-semibold text-indigo-900 block mb-1">
                    ಪ್ರಶ್ನೆ ಪಠ್ಯ (ಕನ್ನಡದಲ್ಲಿ / In Kannada - ಪೂರ್ಣ ಪಠ್ಯ):
                  </label>
                  <textarea
                    rows={3}
                    value={questionKn}
                    onChange={(e) => setQuestionKn(e.target.value)}
                    onInput={handleAutoExpand}
                    placeholder="ಕನ್ನಡದಲ್ಲಿ ಸಂಪೂರ್ಣ ಪ್ರಶ್ನೆಯನ್ನು ನಮೂದಿಸಿ..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-indigo-200 bg-indigo-50/20 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed transition-all resize-y min-h-[72px]"
                  />
                </div>
              )}
            </div>

            {/* Options A, B, C, D (Dual Language) */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Answer Options & Correct Answer Selection:
              </span>

              {/* Option A */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px]">
                      A
                    </span>
                    <span>Option A</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 cursor-pointer">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex === 0}
                      onChange={() => setCorrectOptionIndex(0)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    Correct Answer
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="English option A"
                    value={optionAEn}
                    onChange={(e) => setOptionAEn(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="ಕನ್ನಡ ಆಯ್ಕೆ A"
                    value={optionAKn}
                    onChange={(e) => setOptionAKn(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-indigo-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Option B */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px]">
                      B
                    </span>
                    <span>Option B</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 cursor-pointer">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex === 1}
                      onChange={() => setCorrectOptionIndex(1)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    Correct Answer
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="English option B"
                    value={optionBEn}
                    onChange={(e) => setOptionBEn(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="ಕನ್ನಡ ಆಯ್ಕೆ B"
                    value={optionBKn}
                    onChange={(e) => setOptionBKn(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-indigo-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Option C */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px]">
                      C
                    </span>
                    <span>Option C</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 cursor-pointer">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex === 2}
                      onChange={() => setCorrectOptionIndex(2)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    Correct Answer
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="English option C"
                    value={optionCEn}
                    onChange={(e) => setOptionCEn(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="ಕನ್ನಡ ಆಯ್ಕೆ C"
                    value={optionCKn}
                    onChange={(e) => setOptionCKn(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-indigo-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Option D */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px]">
                      D
                    </span>
                    <span>Option D</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 cursor-pointer">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex === 3}
                      onChange={() => setCorrectOptionIndex(3)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    Correct Answer
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="English option D"
                    value={optionDEn}
                    onChange={(e) => setOptionDEn(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="ಕನ್ನಡ ಆಯ್ಕೆ D"
                    value={optionDKn}
                    onChange={(e) => setOptionDKn(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-indigo-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Deep Detailed Explanation Fields (No Truncation or Length Limits) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 block">
                  Deep Detailed Explanation (ಪೂರ್ಣ ವಿವರಣೆ - No length limit):
                </span>
                <span className="text-[11px] text-slate-500">Supports paragraphs & bullet points</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    English Explanation:
                  </label>
                  <textarea
                    rows={4}
                    value={explanationEn}
                    onChange={(e) => setExplanationEn(e.target.value)}
                    onInput={handleAutoExpand}
                    placeholder="Enter full comprehensive explanation with historical background, formula steps, or references (unlimited text)..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed transition-all resize-y min-h-[96px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-indigo-900 block mb-1">
                    ಕನ್ನಡ ವಿವರಣೆ (Kannada Detailed Explanation):
                  </label>
                  <textarea
                    rows={4}
                    value={explanationKn}
                    onChange={(e) => setExplanationKn(e.target.value)}
                    onInput={handleAutoExpand}
                    placeholder="ಸಂಪೂರ್ಣ ವಿವರಣೆಯನ್ನು ನಮೂದಿಸಿ (ಅನಿಯಮಿತ ಪಠ್ಯ, ಪ್ಯಾರಾಗ್ರಾಫ್‌ಗಳು ಮತ್ತು ಮುಖ್ಯಾಂಶಗಳು)..."
                    className="w-full text-xs p-3 rounded-xl border border-indigo-200 bg-indigo-50/20 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed transition-all resize-y min-h-[96px]"
                  />
                </div>
              </div>
            </div>

            {/* Meta: Exam Tag & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Exam Source Tag:
                </label>
                <input
                  type="text"
                  value={examTag}
                  onChange={(e) => setExamTag(e.target.value)}
                  placeholder="e.g. SSC CGL 2025, Phase XII, KPSC KAS"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Difficulty Level:
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Easy">Easy (ಸುಲಭ)</option>
                  <option value="Medium">Medium (ಮಧ್ಯಮ)</option>
                  <option value="Hard">Hard (ಕಠಿಣ)</option>
                </select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save Question to {currentFolderDisplayName}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: BULK JSON PASTE / UPLOAD (100+ QUESTIONS) */}
        {modalTab === 'bulk' && (
          <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
            {/* Target Folder Banner */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FolderCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-emerald-900">Target Folder: </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {currentFolderDisplayName}
                  </span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Will be stored as a distinct set without merging into previous uploads.
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                100+ Bulk Supported
              </span>
            </div>

            {/* Template Helper Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-600" />
                <span>Paste JSON Array or Pick .json File:</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  {copiedTemplate ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Sample JSON Format</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                  title="Download bilingual questions template file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>
            </div>

            {/* Hidden File Input & Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/80 text-indigo-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload .json File from Device / Phone</span>
              </button>
            </div>

            {/* Direct JSON Paste Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Or Paste JSON Array (100+ questions):
                </label>
                {parsedCount !== null && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    {parsedCount} Questions Validated
                  </span>
                )}
              </div>
              <textarea
                rows={8}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                onInput={handleAutoExpand}
                placeholder={`[\n  {\n    "question": "Question in English...",\n    "questionKn": "ಕನ್ನಡದಲ್ಲಿ ಪ್ರಶ್ನೆ...",\n    "options": ["A", "B", "C", "D"],\n    "optionsKn": ["A", "B", "C", "D"],\n    "correctAnswerIndex": 0,\n    "explanation": "Full detailed explanation...",\n    "explanationKn": "ಸಂಪೂರ್ಣ ವಿವರಣೆ..."\n  }\n]`}
                className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed bg-slate-900 text-emerald-400 min-h-[160px] resize-y"
              />
            </div>

            {/* Error Message */}
            {bulkError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProcessBulkImport}
                disabled={!jsonInput.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  jsonInput.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>
                  {batchMode === 'replace'
                    ? `Replace & Import ${parsedCount !== null ? `${parsedCount} ` : ''}Questions`
                    : `Import as New Set (${parsedCount !== null ? `${parsedCount} ` : '100+ '}MCQs)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
