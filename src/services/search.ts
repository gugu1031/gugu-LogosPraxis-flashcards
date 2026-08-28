import { db } from "@/db";
import type { Book, PdfPage, SearchDocument, SearchResult, StudyCard } from "@/types";

const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export function tokenize(value: string): string[] {
  const normalized = normalize(value);
  if (!normalized) return [];

  const tokens = new Set<string>();
  for (const part of normalized.split(/\s+/)) {
    if (!part) continue;
    tokens.add(part);
    if (/[\u3400-\u9fff]/u.test(part)) {
      const chars = [...part];
      for (const char of chars) tokens.add(char);
      for (let index = 0; index < chars.length - 1; index += 1) {
        tokens.add(chars[index] + chars[index + 1]);
      }
    } else if (part.length > 3) {
      for (let index = 0; index < part.length - 2; index += 1) {
        tokens.add(part.slice(index, index + 3));
      }
    }
  }
  return [...tokens].slice(0, 5000);
}

export function cardToSearchDoc(card: StudyCard): SearchDocument {
  const content = [
    card.front,
    card.back,
    card.answerTemplate,
    card.excerpt,
    card.exam?.institution,
    card.exam?.year,
    card.exam?.subjectCode,
    card.exam?.subjectName,
    card.exam?.questionType,
    card.exam?.sourceTitle,
    ...card.flatTags
  ]
    .filter(Boolean)
    .join(" ");
  return {
    id: `card:${card.id}`,
    type: "card",
    refId: card.id,
    bookId: card.sources[0]?.bookId,
    title: card.front,
    content,
    tokens: tokenize(content),
    updatedAt: card.updatedAt
  };
}

export function bookToSearchDoc(book: Book): SearchDocument {
  const content = [
    book.title,
    ...book.authors,
    book.category,
    book.subCategory,
    book.era,
    ...book.thinkers,
    ...book.tags,
    book.description
  ]
    .filter(Boolean)
    .join(" ");
  return {
    id: `book:${book.id}`,
    type: "book",
    refId: book.id,
    bookId: book.id,
    title: book.title,
    content,
    tokens: tokenize(content),
    updatedAt: book.updatedAt
  };
}

export function pdfPageToSearchDoc(page: PdfPage, title: string): SearchDocument {
  return {
    id: `pdf:${page.id}`,
    type: "pdf",
    refId: page.id,
    bookId: page.bookId,
    page: page.page,
    title: `${title} · 第 ${page.page} 页`,
    content: page.text,
    tokens: tokenize(page.text),
    updatedAt: new Date().toISOString()
  };
}

export async function rebuildBaseSearchIndex(books: Book[], cards: StudyCard[]): Promise<void> {
  const docs = [...books.map(bookToSearchDoc), ...cards.map(cardToSearchDoc)];
  await db.searchDocs.bulkPut(docs);
}

export interface SearchFilters {
  type?: "all" | SearchDocument["type"];
  bookId?: string;
  subject?: string;
}

function makeExcerpt(content: string, query: string): string {
  const normalizedContent = content.toLocaleLowerCase("zh-CN");
  const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
  const index = normalizedContent.indexOf(normalizedQuery);
  if (index < 0) return content.slice(0, 150);
  const start = Math.max(0, index - 45);
  const end = Math.min(content.length, index + normalizedQuery.length + 85);
  return `${start > 0 ? "…" : ""}${content.slice(start, end)}${end < content.length ? "…" : ""}`;
}

export async function searchAll(query: string, filters: SearchFilters = {}): Promise<SearchResult[]> {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const tokenCandidates = await db.searchDocs
    .where("tokens")
    .anyOf(queryTokens.slice(0, 12))
    .distinct()
    .toArray();

  const normalizedQuery = normalize(query);
  return tokenCandidates
    .filter((doc) => filters.type === undefined || filters.type === "all" || doc.type === filters.type)
    .filter((doc) => !filters.bookId || doc.bookId === filters.bookId)
    .filter((doc) => !filters.subject || normalize(doc.content).includes(normalize(filters.subject)))
    .map((doc) => {
      const normalizedContent = normalize(doc.content);
      const hasExact = normalizedContent.includes(normalizedQuery);
      const exact = hasExact ? 6 : 0;
      const tokenHits = queryTokens.filter((token) => doc.tokens.includes(token)).length;
      const titleHit = normalize(doc.title).includes(normalizedQuery) ? 4 : 0;
      return {
        result: {
          id: doc.id,
          type: doc.type,
          refId: doc.refId,
          bookId: doc.bookId,
          page: doc.page,
          title: doc.title,
          excerpt: makeExcerpt(doc.content, query),
          score: exact + titleHit + tokenHits / queryTokens.length
        } satisfies SearchResult,
        hasExact,
        tokenHits
      };
    })
    .filter(
      (item) =>
        item.hasExact ||
        item.tokenHits >= Math.max(2, Math.ceil(queryTokens.length * 0.45))
    )
    .map((item) => item.result)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);
}
