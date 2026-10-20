export type SubjectId = 'gk' | 'maths' | 'reasoning' | 'english' | 'pyq';

export type SubCategoryId =
  | 'gk-2025-exams'
  | 'gk-phase-exams'
  | 'gk-ssc-cgl'
  | 'gk-ssc-steno'
  | 'pyq-2025-exams'
  | 'pyq-phase-exams'
  | 'pyq-ssc-cgl'
  | 'pyq-ssc-steno'
  | 'english_sectional_test'
  | 'history'
  | 'polity'
  | 'geography'
  | 'economics'
  | 'science'
  | 'static-gk'
  | 'current-affairs'
  | 'arithmetic'
  | 'algebra'
  | 'geometry'
  | 'trigonometry'
  | 'di'
  | 'verbal'
  | 'non-verbal'
  | 'analytical'
  | 'grammar'
  | 'vocabulary'
  | 'comprehension'
  | string;

export type LanguageMode = 'en' | 'kn' | 'bilingual';

export type QuestionStatus =
  | 'not_visited'
  | 'not_answered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_marked_for_review';

export type MistakeCategory =
  | 'concept_gap'
  | 'silly_mistake'
  | 'formula_forgot'
  | 'time_pressure'
  | 'calculation'
  | 'general_revision';

export interface MistakeItem {
  id: string;
  questionId: string;
  question: Question;
  selectedOptionIndex?: number;
  category: MistakeCategory;
  userNotes?: string;
  savedAt: number;
  testTitle?: string;
  folderId?: string;
}

export interface TestResult {
  id: string;
  testTitle: string;
  folderId?: string;
  batchId?: string;
  timestamp: number;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  unattempted: number;
  score: number;
  maxScore: number;
  accuracy: number;
  timeSpentSeconds: number;
  userAnswers: Record<string, number>;
}

export interface Question {
  id: string;
  topicId: string;
  subCategoryId: SubCategoryId;
  subjectId: SubjectId;
  question: string;
  questionKn?: string; // Kannada question text
  options: string[];
  optionsKn?: string[]; // Kannada options (4 choices)
  correctAnswerIndex: number;
  explanation: string;
  explanationKn?: string; // Kannada explanation
  difficulty: 'Easy' | 'Medium' | 'Hard';
  examTag?: string; // e.g. "SSC CGL 2025", "Phase XII 2024"
  year?: number;
  isCustom?: boolean;
  setId?: string; // Links question to a specific batch/set
  setName?: string; // Label of the set (e.g., "Set 1: 26 MCQs")
  createdAt?: number;
}

export interface QuestionBatch {
  id: string; // e.g., "batch_17290000_abc"
  title: string; // e.g. "ಸಂವಿಧಾನದ ಪ್ರಮುಖ ವಿಧಿಗಳು - Batch 1", "Modern History Mock 1"
  name?: string; // alias for title
  description?: string;
  folderId: SubCategoryId;
  subjectId: SubjectId;
  createdAt: number;
  updatedAt?: number;
  questionCount: number;
  questions?: Question[];
}

export interface QuestionSet {
  id: string; // e.g., "set_17290000_abc"
  name: string; // e.g., "Set 1: 26 MCQs", "Set 2: 13 MCQs"
  subCategoryId: SubCategoryId;
  subjectId: SubjectId;
  topicId: string;
  createdAt: number;
  questionCount: number;
  isDefault?: boolean;
}

export interface PYQuestion extends Question {
  examName: string;
  year: number;
  shift?: string;
}

export interface StudyNoteSection {
  title: string;
  bullets: string[];
  keyHighlight?: string;
}

export interface TopicStudyNote {
  id: string;
  topicId: string;
  title: string;
  summary: string;
  readTime: string;
  sections: StudyNoteSection[];
  quickMnemonics?: string[];
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  notesCount: number;
  pyqCount: number;
  questions: Question[];
  studyNotes: TopicStudyNote;
  pyqs: PYQuestion[];
}

export interface SubCategory {
  id: SubCategoryId;
  subjectId: SubjectId;
  name: string;
  description: string;
  iconName: string;
  badge?: string;
  topics: Topic[];
}

export interface Subject {
  id: SubjectId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  iconName: string;
  color: string;
  subCategories: SubCategory[];
}

export type ViewState =
  | { mode: 'home' }
  | { mode: 'subject'; subjectId: SubjectId }
  | { mode: 'subCategory'; subjectId: SubjectId; subCategoryId: SubCategoryId }
  | {
      mode: 'batch';
      subjectId: SubjectId;
      subCategoryId: SubCategoryId;
      batchId: string;
      batchTitle: string;
      activeTab: 'quiz' | 'list';
    }
  | {
      mode: 'topic';
      subjectId: SubjectId;
      subCategoryId: SubCategoryId;
      topicId: string;
      activeTab: 'list' | 'quiz' | 'notes' | 'pyq';
      activeSetId?: string;
    };

export interface BookmarkItem {
  id: string;
  type: 'question' | 'note' | 'topic';
  title: string;
  subjectName: string;
  subCategoryName: string;
  savedAt: number;
  payload: any;
}
