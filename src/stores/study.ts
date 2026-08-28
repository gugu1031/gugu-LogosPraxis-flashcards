import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { db } from "@/db";
import { initialCards, initialCatalog } from "@/data/catalog";
import { buildCardFlatTags } from "@/services/cards";
import { cardToSearchDoc, bookToSearchDoc, rebuildBaseSearchIndex } from "@/services/search";
import { importPdfToBook, removeLocalPdf, type PdfImportProgress } from "@/services/pdf";
import { reviewFsrs } from "@/services/fsrs";
import type {
  Annotation,
  Book,
  ReviewLog,
  ReviewRating,
  StudyCard,
  StudySession
} from "@/types";

const todayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
// Pinia 的顶层 toRaw 不会递归移除嵌套数组代理，直接 structuredClone 会在
// 保存阅读进度时触发 DataCloneError。当前业务实体均为 JSON 安全的数据结构。
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const CONTENT_PACK_VERSION = "2026-07-28.2";

async function installContentPack(): Promise<void> {
  const installed = await db.settings.get("curatedContentPackVersion");
  if (installed?.value === CONTENT_PACK_VERSION) return;

  const existingBookIds = new Set((await db.books.toCollection().primaryKeys()).map(String));
  const existingCardIds = new Set((await db.cards.toCollection().primaryKeys()).map(String));
  const missingBooks = initialCatalog.filter((book) => !existingBookIds.has(book.id));
  const missingCards = initialCards.filter((card) => !existingCardIds.has(card.id));

  await db.transaction("rw", [db.books, db.cards, db.settings], async () => {
    if (missingBooks.length) await db.books.bulkAdd(missingBooks);
    if (missingCards.length) await db.cards.bulkAdd(missingCards);

    // 这道北航近现代史题早期作为跨校专题导入，补齐 882 科目码后才能稳定进入北航专栏。
    const buaaModernHistory = await db.cards.get("exam-buaa-2024-invasion-debate");
    if (buaaModernHistory?.exam && !buaaModernHistory.exam.subjectCode) {
      const exam = { ...buaaModernHistory.exam, subjectCode: "882" };
      await db.cards.update(buaaModernHistory.id, {
        exam,
        flatTags: buildCardFlatTags({ tags: buaaModernHistory.tags, exam })
      });
    }

    await db.settings.put({
      key: "curatedContentPackVersion",
      value: CONTENT_PACK_VERSION
    });
  });
}

export const useStudyStore = defineStore("study", () => {
  const books = ref<Book[]>([]);
  const cards = ref<StudyCard[]>([]);
  const reviewLogs = ref<ReviewLog[]>([]);
  const annotations = ref<Annotation[]>([]);
  const sessions = ref<StudySession[]>([]);
  const hydrated = ref(false);
  const importProgress = ref<Record<string, PdfImportProgress>>({});

  const dueCards = computed(() => {
    const now = Date.now();
    return cards.value.filter(
      (card) => !card.suspended && new Date(card.fsrs.due).getTime() <= now
    );
  });

  const localBooks = computed(() => books.value.filter((book) => book.status === "local"));
  const todaySession = computed(() => sessions.value.find((item) => item.date === todayKey()));

  async function hydrate(): Promise<void> {
    if (hydrated.value) return;
    // 版本化增量安装：老用户也能获得新增题库，同时不覆盖已有卡片与复习状态。
    await installContentPack();
    books.value = await db.books.toArray();
    cards.value = await db.cards.toArray();
    reviewLogs.value = await db.reviewLogs.toArray();
    annotations.value = await db.annotations.toArray();
    sessions.value = await db.sessions.toArray();
    await rebuildBaseSearchIndex(books.value, cards.value);
    hydrated.value = true;
  }

  async function refresh(): Promise<void> {
    hydrated.value = false;
    await hydrate();
  }

  async function saveCard(card: StudyCard): Promise<void> {
    const timestamp = new Date().toISOString();
    const sourceCard = plain(card);
    const isNew = !cards.value.some((item) => item.id === sourceCard.id);
    const normalized: StudyCard = {
      ...sourceCard,
      flatTags: buildCardFlatTags(sourceCard),
      updatedAt: timestamp
    };
    const date = todayKey();
    const existingSession = sessions.value.find((item) => item.date === date);
    const newSession: StudySession | undefined = isNew
      ? existingSession
        ? {
            ...plain(existingSession),
            newCardCount: existingSession.newCardCount + 1,
            updatedAt: timestamp
          }
        : {
            id: crypto.randomUUID(),
            date,
            reviewCount: 0,
            newCardCount: 1,
            minutes: 0,
            updatedAt: timestamp
          }
      : undefined;
    await db.transaction("rw", [db.cards, db.searchDocs, db.sessions], async () => {
      await db.cards.put(normalized);
      await db.searchDocs.put(cardToSearchDoc(normalized));
      if (newSession) await db.sessions.put(newSession);
    });
    const index = cards.value.findIndex((item) => item.id === normalized.id);
    if (index >= 0) cards.value[index] = normalized;
    else cards.value.unshift(normalized);
    if (newSession) {
      if (existingSession) {
        sessions.value = sessions.value.map((item) =>
          item.id === newSession.id ? newSession : item
        );
      } else {
        sessions.value.push(newSession);
      }
    }
  }

  async function deleteCard(cardId: string): Promise<void> {
    await db.transaction("rw", [db.cards, db.searchDocs], async () => {
      await db.cards.delete(cardId);
      await db.searchDocs.delete(`card:${cardId}`);
    });
    cards.value = cards.value.filter((card) => card.id !== cardId);
  }

  async function reviewCard(
    card: StudyCard,
    rating: ReviewRating,
    durationMs: number
  ): Promise<StudyCard> {
    const reviewedAt = new Date();
    const sourceCard = plain(card);
    const result = reviewFsrs(sourceCard.fsrs, rating, reviewedAt);
    const updated: StudyCard = {
      ...sourceCard,
      fsrs: result.state,
      updatedAt: reviewedAt.toISOString()
    };
    const log: ReviewLog = {
      id: crypto.randomUUID(),
      cardId: card.id,
      rating,
      reviewedAt: reviewedAt.toISOString(),
      elapsedDays: result.elapsedDays,
      scheduledDays: result.state.scheduledDays,
      stabilityBefore: result.previousStability,
      stabilityAfter: result.state.stability,
      durationMs
    };
    const date = todayKey(reviewedAt);
    const existingSession = sessions.value.find((item) => item.date === date);
    const session: StudySession = existingSession
      ? {
          ...existingSession,
          reviewCount: existingSession.reviewCount + 1,
          minutes: Number((existingSession.minutes + durationMs / 60_000).toFixed(1)),
          updatedAt: reviewedAt.toISOString()
        }
      : {
          id: crypto.randomUUID(),
          date,
          reviewCount: 1,
          newCardCount: 0,
          minutes: Number((durationMs / 60_000).toFixed(1)),
          updatedAt: reviewedAt.toISOString()
        };

    await db.transaction("rw", [db.cards, db.reviewLogs, db.sessions, db.searchDocs], async () => {
      await db.cards.put(updated);
      await db.reviewLogs.put(log);
      await db.sessions.put(session);
      await db.searchDocs.put(cardToSearchDoc(updated));
    });
    cards.value = cards.value.map((item) => (item.id === card.id ? updated : item));
    reviewLogs.value.push(log);
    if (existingSession) {
      sessions.value = sessions.value.map((item) => (item.id === session.id ? session : item));
    } else {
      sessions.value.push(session);
    }
    return updated;
  }

  async function importPdf(book: Book, file: File): Promise<void> {
    const sourceBook = plain(book);
    importProgress.value[sourceBook.id] = {
      phase: "opening",
      current: 0,
      total: 1,
      message: "准备导入"
    };
    try {
      const completed = await importPdfToBook(sourceBook, file, (progress) => {
        importProgress.value[sourceBook.id] = progress;
      });
      books.value = books.value.map((item) => (item.id === sourceBook.id ? completed : item));
      await db.searchDocs.put(bookToSearchDoc(completed));
    } catch (error) {
      const message = error instanceof Error ? error.message : "无法解析 PDF";
      const failed: Book = {
        ...sourceBook,
        status: "error",
        importError: message,
        updatedAt: new Date().toISOString()
      };
      await db.books.put(failed);
      books.value = books.value.map((item) => (item.id === sourceBook.id ? failed : item));
      throw error;
    }
  }

  async function importUncataloguedPdf(file: File): Promise<Book> {
    const title = file.name.replace(/\.pdf$/i, "").replace(/\s+\([^)]*(z-library|1lib)[^)]*\)/gi, "");
    const timestamp = new Date().toISOString();
    const newBook: Book = {
      id: crypto.randomUUID(),
      title,
      authors: [],
      category: "拓展阅读",
      subCategory: "未分类",
      thinkers: [],
      tags: ["本地导入"],
      description: "由本地 PDF 自动创建的私人书目。",
      status: "catalog",
      indexedPages: 0,
      lastOpenedPage: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await db.books.put(newBook);
    books.value.unshift(newBook);
    await importPdf(newBook, file);
    return newBook;
  }

  async function detachPdf(book: Book): Promise<void> {
    const sourceBook = plain(book);
    const updated = await removeLocalPdf(sourceBook);
    books.value = books.value.map((item) => (item.id === sourceBook.id ? updated : item));
  }

  async function updateBook(book: Book): Promise<void> {
    const updated = { ...plain(book), updatedAt: new Date().toISOString() };
    await db.transaction("rw", [db.books, db.searchDocs], async () => {
      await db.books.put(updated);
      await db.searchDocs.put(bookToSearchDoc(updated));
    });
    books.value = books.value.map((item) => (item.id === book.id ? updated : item));
  }

  async function saveAnnotation(annotation: Annotation): Promise<void> {
    const normalized = plain(annotation);
    await db.annotations.put(normalized);
    const index = annotations.value.findIndex((item) => item.id === normalized.id);
    if (index >= 0) annotations.value[index] = normalized;
    else annotations.value.unshift(normalized);
  }

  async function deleteAnnotation(id: string): Promise<void> {
    await db.annotations.delete(id);
    annotations.value = annotations.value.filter((item) => item.id !== id);
  }

  return {
    books,
    cards,
    reviewLogs,
    annotations,
    sessions,
    hydrated,
    importProgress,
    dueCards,
    localBooks,
    todaySession,
    hydrate,
    refresh,
    saveCard,
    deleteCard,
    reviewCard,
    importPdf,
    importUncataloguedPdf,
    detachPdf,
    updateBook,
    saveAnnotation,
    deleteAnnotation
  };
});
