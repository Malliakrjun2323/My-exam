import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Download,
  Copy,
  Check,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  FolderCheck,
} from 'lucide-react';
import { Question, SubCategoryId, SubjectId } from '../types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsImported: (
    importedQuestions: Question[],
    batchConfig?: { mode: 'new_set' | 'replace'; setName: string; setId?: string }
  ) => void;
  activeSubCategoryId?: SubCategoryId;
  activeSubjectId?: SubjectId;
  existingSetsCount?: number;
}

// Sample JSON template illustrating bilingual 100+ question format
export const SAMPLE_JSON_TEMPLATE = [
  {
    "category": "2025 Exams",
    "topic": "2025 Expected General Awareness Model Paper",
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
    "explanation": "Justice Sanjiv Khanna took oath as the 51st Chief Justice of India on 11 November 2024, succeeding Justice D.Y. Chandrachud.",
    "explanationKn": "ನ್ಯಾಯಮೂರ್ತಿ ಸಂಜೀವ್ ಖನ್ನಾ ಅವರು 11 ನವೆಂಬರ್ 2024 ರಂದು ಭಾರತದ 51 ನೇ ಮುಖ್ಯ ನ್ಯಾಯಮೂರ್ತಿಯಾಗಿ ಪ್ರಮಾಣ ವಚನ ಸ್ವೀಕರಿಸಿದರು.",
    "difficulty": "Easy",
    "examTag": "2025 Target Special",
    "year": 2025
  },
  {
    "category": "SSC CGL",
    "topic": "CGL General Awareness High Frequency Questions",
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
    "explanation": "The 61st Constitutional Amendment Act, 1988 amended Article 326 to lower the voting age from 21 to 18 years.",
    "explanationKn": "1988 ರ 61 ನೇ ಸಾಂವಿಧಾನಿಕ ತಿದ್ದುಪಡಿ ಕಾಯ್ದೆಯು 326 ನೇ ವಿಧಿಯನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಿ ಮತದಾನದ ವಯಸ್ಸನ್ನು 21 ರಿಂದ 18 ವರ್ಷಕ್ಕೆ ಇಳಿಸಿತು.",
    "difficulty": "Easy",
    "examTag": "SSC CGL Tier 1",
    "year": 2024
  },
  {
    "category": "Phase Exams",
    "topic": "Selection Post General Awareness & Static Drills",
    "question": "Under which Article of the Indian Constitution is the Election Commission of India established?",
    "questionKn": "ಭಾರತೀಯ ಸಂವಿಧಾನದ ಯಾವ ವಿಧಿಯ ಅಡಿಯಲ್ಲಿ ಭಾರತೀಯ ಚುನಾವಣಾ ಆಯೋಗವನ್ನು ಸ್ಥಾಪಿಸಲಾಗಿದೆ?",
    "options": [
      "Article 320",
      "Article 324",
      "Article 330",
      "Article 338"
    ],
    "optionsKn": [
      "ವಿಧಿ 320",
      "ವಿಧಿ 324",
      "ವಿಧಿ 330",
      "ವಿಧಿ 338"
    ],
    "correctAnswerIndex": 1,
    "explanation": "Article 324 provides for the superintendence, direction, and control of elections to be vested in an Election Commission.",
    "explanationKn": "ಸಂವಿಧಾನದ 324 ನೇ ವಿಧಿಯು ಸಂಸತ್ತು ಮತ್ತು ರಾಜ್ಯ ಶಾಸಕಾಂಗಗಳಿಗೆ ಚುನಾವಣೆಗಳನ್ನು ನಡೆಸುವ ಅಧಿಕಾರವನ್ನು ಚುನಾವಣಾ ಆಯೋಗಕ್ಕೆ ನೀಡುತ್ತದೆ.",
    "difficulty": "Medium",
    "examTag": "SSC Phase XII",
    "year": 2024
  }
];

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onQuestionsImported,
  activeSubCategoryId,
  activeSubjectId,
  existingSetsCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedPreviewCount, setParsedPreviewCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [batchMode, setBatchMode] = useState<'new_set' | 'replace'>('new_set');
  const [customSetName, setCustomSetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Intelligent category router with strict folder-level isolation
  const resolveTargetCategory = (
    item: any
  ): { subCategoryId: SubCategoryId; subjectId: SubjectId; topicId: string } => {
    // 0. Strict Folder Isolation: If upload was launched from inside a folder, keep all questions inside that folder!
    if (activeSubCategoryId) {
      const derivedSubjectId =
        activeSubjectId ||
        (activeSubCategoryId === 'english_sectional_test'
          ? 'english'
          : activeSubCategoryId.startsWith('pyq')
          ? 'pyq'
          : 'gk');
      return {
        subCategoryId: activeSubCategoryId,
        subjectId: derivedSubjectId,
        topicId: item.topicId || `${activeSubCategoryId}-batch`,
      };
    }

    const rawCategory = String(
      item.category || item.subCategory || item.folder || item.subCategoryId || ''
    ).toLowerCase();

    // 1. English Sectional Test (Dedicated isolation)
    if (
      rawCategory.includes('sectional') ||
      rawCategory.includes('english_sectional') ||
      rawCategory.includes('english sectional') ||
      rawCategory.includes('ವಿಭಾಗವಾರು')
    ) {
      return {
        subCategoryId: 'english_sectional_test',
        subjectId: 'english',
        topicId: item.topicId || 'eng-sectional-mock',
      };
    }

    // 2. PYQ Dedicated Exam Folders
    if (rawCategory.includes('2025') || rawCategory.includes('upcoming')) {
      return {
        subCategoryId: 'pyq-2025-exams',
        subjectId: 'pyq',
        topicId: item.topicId || 'pyq-2025-model',
      };
    }
    if (rawCategory.includes('cgl')) {
      return {
        subCategoryId: 'pyq-ssc-cgl',
        subjectId: 'pyq',
        topicId: item.topicId || 'pyq-cgl-tier1',
      };
    }
    if (rawCategory.includes('phase') || rawCategory.includes('selection post')) {
      return {
        subCategoryId: 'pyq-phase-exams',
        subjectId: 'pyq',
        topicId: item.topicId || 'pyq-phase-core',
      };
    }
    if (rawCategory.includes('steno') || rawCategory.includes('stenographer')) {
      return {
        subCategoryId: 'pyq-ssc-steno',
        subjectId: 'pyq',
        topicId: item.topicId || 'pyq-steno-50',
      };
    }

    // 3. Core GK Folders
    if (rawCategory.includes('polity') || rawCategory.includes('constitution')) {
      return {
        subCategoryId: 'polity',
        subjectId: 'gk',
        topicId: item.topicId || 'polity-batch',
      };
    }
    if (rawCategory.includes('history')) {
      return {
        subCategoryId: 'history',
        subjectId: 'gk',
        topicId: item.topicId || 'history-batch',
      };
    }
    if (rawCategory.includes('geo') || rawCategory.includes('geography')) {
      return {
        subCategoryId: 'geography',
        subjectId: 'gk',
        topicId: item.topicId || 'geography-batch',
      };
    }
    if (rawCategory.includes('eco') || rawCategory.includes('economy')) {
      return {
        subCategoryId: 'economics',
        subjectId: 'gk',
        topicId: item.topicId || 'economics-batch',
      };
    }
    if (rawCategory.includes('sci') || rawCategory.includes('science')) {
      return {
        subCategoryId: 'science',
        subjectId: 'gk',
        topicId: item.topicId || 'science-batch',
      };
    }

    // 4. Maths / Quant
    if (rawCategory.includes('math') || rawCategory.includes('arithmetic') || rawCategory.includes('quant')) {
      return {
        subCategoryId: 'arithmetic',
        subjectId: 'maths',
        topicId: item.topicId || 'math-arithmetic',
      };
    }
    if (rawCategory.includes('algebra')) {
      return {
        subCategoryId: 'algebra',
        subjectId: 'maths',
        topicId: item.topicId || 'math-algebra',
      };
    }
    if (rawCategory.includes('geometry') || rawCategory.includes('mensuration')) {
      return {
        subCategoryId: 'geometry',
        subjectId: 'maths',
        topicId: item.topicId || 'math-geometry',
      };
    }

    // 5. Reasoning
    if (rawCategory.includes('reason') || rawCategory.includes('verbal')) {
      return {
        subCategoryId: 'verbal',
        subjectId: 'reasoning',
        topicId: item.topicId || 'reas-verbal',
      };
    }
    if (rawCategory.includes('non-verbal') || rawCategory.includes('mirror') || rawCategory.includes('pattern')) {
      return {
        subCategoryId: 'non-verbal',
        subjectId: 'reasoning',
        topicId: item.topicId || 'reas-non-verbal',
      };
    }

    // 6. English
    if (rawCategory.includes('grammar') || rawCategory.includes('error')) {
      return {
        subCategoryId: 'grammar',
        subjectId: 'english',
        topicId: item.topicId || 'eng-grammar',
      };
    }
    if (rawCategory.includes('vocab') || rawCategory.includes('idiom')) {
      return {
        subCategoryId: 'vocabulary',
        subjectId: 'english',
        topicId: item.topicId || 'eng-vocab',
      };
    }
    if (rawCategory.includes('comprehension') || rawCategory.includes('cloze')) {
      return {
        subCategoryId: 'comprehension',
        subjectId: 'english',
        topicId: item.topicId || 'eng-comprehension',
      };
    }

    // Fallback: PYQ 2025 Exams
    return {
      subCategoryId: 'pyq-2025-exams',
      subjectId: 'pyq',
      topicId: item.topicId || 'pyq-2025-batch',
    };
  };

  const parseAndValidateJSON = (rawString: string): Question[] => {
    let parsed: any;
    try {
      parsed = JSON.parse(rawString);
    } catch (e: any) {
      throw new Error(`Invalid JSON syntax: ${e.message}`);
    }

    // If an object wrapped with questions array
    const rawArray = Array.isArray(parsed)
      ? parsed
      : parsed.questions || parsed.data || parsed.items;

    if (!Array.isArray(rawArray) || rawArray.length === 0) {
      throw new Error('JSON must contain an array of question objects.');
    }

    const validated: Question[] = [];

    rawArray.forEach((item, index) => {
      // Question text support (English / Kannada)
      const qTextEn = item.question || item.questionEn || item.question_en || '';
      const qTextKn = item.questionKn || item.question_kn || item.questionKannada || '';

      if (!qTextEn && !qTextKn) {
        throw new Error(
          `Question at index ${index + 1} is missing question text ("question" or "questionKn").`
        );
      }

      // Options array support
      let rawOptsEn: string[] = item.options || item.optionsEn || [];
      if (rawOptsEn.length === 0 && item.optionA) {
        rawOptsEn = [item.optionA, item.optionB, item.optionC, item.optionD];
      }

      let rawOptsKn: string[] | undefined = item.optionsKn || item.optionsKannada;
      if (!rawOptsKn && item.optionAKn) {
        rawOptsKn = [item.optionAKn, item.optionBKn, item.optionCKn, item.optionDKn];
      }

      if (rawOptsEn.length < 2 && (!rawOptsKn || rawOptsKn.length < 2)) {
        throw new Error(`Question at index ${index + 1} must have at least options A, B, C, D.`);
      }

      // Correct answer index resolution
      let correctIdx = 0;
      if (typeof item.correctAnswerIndex === 'number') {
        correctIdx = item.correctAnswerIndex;
      } else if (typeof item.correctAnswer === 'string') {
        const char = item.correctAnswer.trim().toUpperCase();
        if (char === 'A' || char === '1') correctIdx = 0;
        else if (char === 'B' || char === '2') correctIdx = 1;
        else if (char === 'C' || char === '3') correctIdx = 2;
        else if (char === 'D' || char === '4') correctIdx = 3;
      } else if (typeof item.answer === 'string') {
        const char = item.answer.trim().toUpperCase();
        if (char.startsWith('A')) correctIdx = 0;
        else if (char.startsWith('B')) correctIdx = 1;
        else if (char.startsWith('C')) correctIdx = 2;
        else if (char.startsWith('D')) correctIdx = 3;
      }

      const routing = resolveTargetCategory(item);

      const qObj: Question = {
        id: item.id || `bulk-q-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
        topicId: routing.topicId,
        subCategoryId: routing.subCategoryId,
        subjectId: routing.subjectId,
        question: qTextEn || qTextKn,
        questionKn: qTextKn || undefined,
        options: rawOptsEn.length >= 2 ? rawOptsEn : rawOptsKn || ['A', 'B', 'C', 'D'],
        optionsKn: rawOptsKn && rawOptsKn.length >= 2 ? rawOptsKn : undefined,
        correctAnswerIndex: Math.max(0, Math.min(3, correctIdx)),
        explanation: item.explanation || item.explanationEn || item.explanation_en || 'Answer confirmed as correct.',
        explanationKn: item.explanationKn || item.explanation_kn || undefined,
        difficulty: (['Easy', 'Medium', 'Hard'].includes(item.difficulty)
          ? item.difficulty
          : 'Medium') as any,
        examTag: item.examTag || item.exam || 'Bulk Imported Question',
        year: item.year ? Number(item.year) : 2025,
        isCustom: true,
      };

      validated.push(qObj);
    });

    return validated;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setJsonText(text);
        const questions = parseAndValidateJSON(text);
        setParsedPreviewCount(questions.length);
      } catch (err: any) {
        setError(err.message);
        setParsedPreviewCount(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file from your device.');
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (text: string) => {
    setJsonText(text);
    setError(null);
    if (!text.trim()) {
      setParsedPreviewCount(null);
      return;
    }
    try {
      const questions = parseAndValidateJSON(text);
      setParsedPreviewCount(questions.length);
    } catch (err: any) {
      setError(err.message);
      setParsedPreviewCount(null);
    }
  };

  const handleImport = () => {
    try {
      if (!customSetName.trim()) {
        setError('Batch / Set Title is mandatory (ಕಡ್ಡಾಯ). Please provide a title (ಉದಾಹರಣೆಗೆ: "ಸಂವಿಧಾನದ ಪ್ರಮುಖ ವಿಧಿಗಳು - Batch 1", "Modern History Mock 1").');
        return;
      }

      const questions = parseAndValidateJSON(jsonText);
      const finalSetName = customSetName.trim();
      const newSetId = `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = Date.now();

      const questionsWithSet = questions.map((q) => ({
        ...q,
        setId: newSetId,
        setName: finalSetName,
        createdAt: now,
      }));

      onQuestionsImported(questionsWithSet, {
        mode: batchMode,
        setName: finalSetName,
        setId: newSetId,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownloadTemplate = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'examprep_sample_questions_100_template.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2));
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Bulk Upload Questions via JSON
              </h2>
              <p className="text-xs text-indigo-200">
                Instantly import 100+ questions into 2025 Exams, CGL, Phase & core subjects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close bulk upload modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action strip: Download Template and Copy */}
        <div className="px-5 py-3 bg-indigo-50/70 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Need the JSON format?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors"
            >
              {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTemplate ? 'Copied!' : 'Copy Template'}</span>
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample JSON Template</span>
            </button>
          </div>
        </div>

        {/* Tab switchers: File Upload vs Paste Raw JSON */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl max-w-sm">
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'file'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .json File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste JSON Text</span>
            </button>
          </div>

          {/* Question Sets / Batches Architecture Selector (Prevents Merging) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Upload Mode / Set Architecture:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`p-2 rounded-lg border flex items-start gap-2 cursor-pointer transition-all ${
                  batchMode === 'new_set'
                    ? 'bg-indigo-50 border-indigo-400 font-semibold text-indigo-900'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="bulkBatchMode"
                  checked={batchMode === 'new_set'}
                  onChange={() => setBatchMode('new_set')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <span className="block font-bold">Option A: Create as New Set</span>
                  <span className="block text-[11px] text-slate-500 font-normal">
                    Keeps questions isolated without merging into previous batches.
                  </span>
                </div>
              </label>

              <label
                className={`p-2 rounded-lg border flex items-start gap-2 cursor-pointer transition-all ${
                  batchMode === 'replace'
                    ? 'bg-rose-50 border-rose-400 font-semibold text-rose-900'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="bulkBatchMode"
                  checked={batchMode === 'replace'}
                  onChange={() => setBatchMode('replace')}
                  className="mt-0.5 text-rose-600"
                />
                <div>
                  <span className="block font-bold">Option B: Replace All in Folder</span>
                  <span className="block text-[11px] text-rose-700 font-normal">
                    Clears existing questions and starts fresh.
                  </span>
                </div>
              </label>
            </div>

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

          {/* Tab 1: File selector */}
          {activeTab === 'file' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30 rounded-2xl p-6 sm:p-8 text-center transition-colors flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {fileName ? fileName : 'Click to browse or drag & drop questions .json'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports bilingual Kannada & English arrays of 100+ questions
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Paste Raw JSON */}
          {activeTab === 'paste' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Paste JSON Array:
              </label>
              <textarea
                rows={9}
                value={jsonText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder='[
  {
    "category": "2025 Exams",
    "question": "Question in English...",
    "questionKn": "ಕನ್ನಡದಲ್ಲಿ ಪ್ರಶ್ನೆ...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "optionsKn": ["ಆಯ್ಕೆ A", "ಆಯ್ಕೆ B", "ಆಯ್ಕೆ C", "ಆಯ್ಕೆ D"],
    "correctAnswerIndex": 0,
    "explanation": "Explanation..."
  }
]'
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50"
              />
            </div>
          )}

          {/* Validation Status & Preview */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {parsedPreviewCount !== null && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-bold">{parsedPreviewCount} questions validated</span>
                  <span className="text-emerald-700 block text-xs">
                    Ready to auto-route into target exam folders & persist in localStorage
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-emerald-800 text-base">
                ✓ Ready
              </span>
            </div>
          )}

          {/* Routing Guide info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 text-[11px] leading-relaxed">
            <span className="font-semibold text-slate-800 block mb-1">
              Automatic Folder Routing:
            </span>
            Include <code className="bg-slate-200/80 px-1 py-0.5 rounded text-indigo-700 font-mono">"category": "2025 Exams"</code>, <code className="bg-slate-200/80 px-1 py-0.5 rounded text-indigo-700 font-mono">"SSC CGL"</code>, <code className="bg-slate-200/80 px-1 py-0.5 rounded text-indigo-700 font-mono">"Phase Exams"</code>, <code className="bg-slate-200/80 px-1 py-0.5 rounded text-indigo-700 font-mono">"SSC Steno"</code>, or core subject names in each item to route them automatically.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!parsedPreviewCount || parsedPreviewCount === 0}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              parsedPreviewCount && parsedPreviewCount > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import {parsedPreviewCount ? `${parsedPreviewCount} Questions` : 'Questions'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
