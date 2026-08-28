import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { db } from "@/db";
import type { Book, PdfPage, StoredFile } from "@/types";
import { pdfPageToSearchDoc } from "@/services/search";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface PdfImportProgress {
  phase: "opening" | "storing" | "indexing" | "done";
  current: number;
  total: number;
  message: string;
}

export async function loadPdfDocument(blob: Blob): Promise<PDFDocumentProxy> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return pdfjsLib.getDocument({ data: bytes, useSystemFonts: true }).promise;
}

export async function importPdfToBook(
  book: Book,
  file: File,
  onProgress: (progress: PdfImportProgress) => void
): Promise<Book> {
  onProgress({ phase: "opening", current: 0, total: 1, message: `正在打开《${book.title}》` });
  const pdf = await loadPdfDocument(file);
  const fileId = `file:${book.id}`;
  const timestamp = new Date().toISOString();

  const storedFile: StoredFile = {
    id: fileId,
    bookId: book.id,
    name: file.name,
    mime: file.type || "application/pdf",
    size: file.size,
    blob: file,
    createdAt: timestamp
  };

  const indexingBook: Book = {
    ...book,
    status: "indexing",
    fileId,
    fileName: file.name,
    fileSize: file.size,
    pageCount: pdf.numPages,
    indexedPages: 0,
    importError: undefined,
    updatedAt: timestamp
  };

  onProgress({ phase: "storing", current: 0, total: pdf.numPages, message: "正在写入本地数据库" });
  await db.transaction("rw", [db.books, db.files, db.pdfPages, db.searchDocs], async () => {
    await db.files.put(storedFile);
    await db.books.put(indexingBook);
    await db.pdfPages.where("bookId").equals(book.id).delete();
    await db.searchDocs.where("bookId").equals(book.id).and((doc) => doc.type === "pdf").delete();
  });

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress({
      phase: "indexing",
      current: pageNumber,
      total: pdf.numPages,
      message: `正在建立全文索引 ${pageNumber}/${pdf.numPages}`
    });
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const pdfPage: PdfPage = {
      id: `${book.id}:${pageNumber}`,
      bookId: book.id,
      page: pageNumber,
      text
    };
    await db.transaction("rw", [db.pdfPages, db.searchDocs, db.books], async () => {
      await db.pdfPages.put(pdfPage);
      await db.searchDocs.put(pdfPageToSearchDoc(pdfPage, book.title));
      await db.books.update(book.id, { indexedPages: pageNumber });
    });
  }

  const completed: Book = {
    ...indexingBook,
    status: "local",
    indexedPages: pdf.numPages,
    updatedAt: new Date().toISOString()
  };
  await db.books.put(completed);
  await pdf.destroy();
  onProgress({ phase: "done", current: pdf.numPages, total: pdf.numPages, message: "导入完成" });
  return completed;
}

export async function removeLocalPdf(book: Book): Promise<Book> {
  const updated: Book = {
    ...book,
    status: "catalog",
    fileId: undefined,
    fileName: undefined,
    fileSize: undefined,
    pageCount: undefined,
    indexedPages: 0,
    importError: undefined,
    lastOpenedPage: 1,
    updatedAt: new Date().toISOString()
  };
  await db.transaction("rw", [db.books, db.files, db.pdfPages, db.searchDocs], async () => {
    if (book.fileId) await db.files.delete(book.fileId);
    await db.pdfPages.where("bookId").equals(book.id).delete();
    await db.searchDocs.where("bookId").equals(book.id).and((doc) => doc.type === "pdf").delete();
    await db.books.put(updated);
  });
  return updated;
}
