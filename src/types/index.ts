export type LibraryCategory = "马理论" | "马工程教材" | "西方哲学" | "西方马克思主义" | "拓展阅读";
export type BookStatus = "catalog" | "indexing" | "local" | "error";
export type AppTheme = "paper" | "night" | "classic";
export type ReviewRating = 1 | 2 | 3 | 4;

export interface Book {
  id: string;
  title: string;
  authors: string[];
  category: LibraryCategory;
  subCategory: string;
  era?: string;
  thinkers: string[];
  tags: string[];
  description: string;
  status: BookStatus;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  pageCount?: number;
  indexedPages: number;
  importError?: string;
  lastOpenedPage: number;
  lastOpenedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFile {
  id: string;
  bookId: string;
  name: string;
  mime: string;
  size: number;
  blob: Blob;
  createdAt: string;
}

export interface PdfPage {
  id: string;
  bookId: string;
  page: number;
  text: string;
}

export interface SourceLink {
  bookId: string;
  page?: number;
  quote?: string;
}

export interface CardTags {
  subjects: string[];
  thinkers: string[];
  questionTypes: string[];
  difficulty: "基础" | "进阶" | "冲刺";
  eras: string[];
  schools: string[];
}

export interface FsrsState {
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview?: string;
}

export interface ExamMetadata {
  institution: string;
  year: number;
  subjectCode?: string;
  subjectName: string;
  questionType: string;
  questionNumber?: string;
  sourceTitle?: string;
  sourceKind?: "past_exam" | "syllabus_forecast";
}

export interface StudyCard {
  id: string;
  front: string;
  back: string;
  answerTemplate?: string;
  excerpt?: string;
  sources: SourceLink[];
  tags: CardTags;
  flatTags: string[];
  exam?: ExamMetadata;
  fsrs: FsrsState;
  suspended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  rating: ReviewRating;
  reviewedAt: string;
  elapsedDays: number;
  scheduledDays: number;
  stabilityBefore: number;
  stabilityAfter: number;
  durationMs: number;
}

export interface Annotation {
  id: string;
  bookId: string;
  page: number;
  text: string;
  note: string;
  color: "sage" | "amber" | "blue";
  cardId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  date: string;
  reviewCount: number;
  newCardCount: number;
  minutes: number;
  updatedAt: string;
}

export type SearchDocType = "card" | "book" | "pdf";

export interface SearchDocument {
  id: string;
  type: SearchDocType;
  refId: string;
  bookId?: string;
  page?: number;
  title: string;
  content: string;
  tokens: string[];
  updatedAt: string;
}

export interface AppSetting {
  key: string;
  value: unknown;
}

export interface SearchResult {
  id: string;
  type: SearchDocType;
  refId: string;
  bookId?: string;
  page?: number;
  title: string;
  excerpt: string;
  score: number;
}

export interface BackupPayload {
  format: "logospraxis-backup";
  version: 1;
  exportedAt: string;
  books: Book[];
  cards: StudyCard[];
  reviewLogs: ReviewLog[];
  annotations: Annotation[];
  pdfPages: PdfPage[];
  sessions: StudySession[];
  searchDocs: SearchDocument[];
  settings: AppSetting[];
  files: Array<Omit<StoredFile, "blob"> & { archivePath: string }>;
}
