import Dexie, { type EntityTable } from "dexie";
import type {
  Annotation,
  AppSetting,
  Book,
  PdfPage,
  ReviewLog,
  SearchDocument,
  StoredFile,
  StudyCard,
  StudySession
} from "@/types";

class LogosPraxisDatabase extends Dexie {
  books!: EntityTable<Book, "id">;
  files!: EntityTable<StoredFile, "id">;
  cards!: EntityTable<StudyCard, "id">;
  reviewLogs!: EntityTable<ReviewLog, "id">;
  annotations!: EntityTable<Annotation, "id">;
  pdfPages!: EntityTable<PdfPage, "id">;
  sessions!: EntityTable<StudySession, "id">;
  searchDocs!: EntityTable<SearchDocument, "id">;
  settings!: EntityTable<AppSetting, "key">;

  constructor() {
    super("LogosPraxisDB");
    this.version(1).stores({
      books: "id, category, subCategory, status, lastOpenedAt, *thinkers, *tags",
      files: "id, bookId, createdAt",
      cards: "id, createdAt, updatedAt, suspended, *flatTags",
      reviewLogs: "id, cardId, reviewedAt, rating",
      annotations: "id, bookId, [bookId+page], cardId, createdAt",
      pdfPages: "id, bookId, [bookId+page]",
      sessions: "id, date",
      searchDocs: "id, type, refId, bookId, *tokens",
      settings: "key"
    });
    this.version(2).stores({
      books: "id, category, subCategory, status, lastOpenedAt, *thinkers, *tags",
      files: "id, bookId, createdAt",
      cards: "id, createdAt, updatedAt, suspended, exam.institution, exam.year, exam.subjectCode, *flatTags",
      reviewLogs: "id, cardId, reviewedAt, rating",
      annotations: "id, bookId, [bookId+page], cardId, createdAt",
      pdfPages: "id, bookId, [bookId+page]",
      sessions: "id, date",
      searchDocs: "id, type, refId, bookId, *tokens",
      settings: "key"
    });
  }
}

export const db = new LogosPraxisDatabase();
