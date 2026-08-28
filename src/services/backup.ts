import {
  BlobReader,
  BlobWriter,
  TextReader,
  TextWriter,
  ZipReader,
  ZipWriter,
  type FileEntry
} from "@zip.js/zip.js";
import { db } from "@/db";
import type { BackupPayload, StoredFile } from "@/types";

export async function exportFullBackup(): Promise<Blob> {
  const [
    books,
    cards,
    reviewLogs,
    annotations,
    pdfPages,
    sessions,
    searchDocs,
    settings,
    files
  ] = await Promise.all([
    db.books.toArray(),
    db.cards.toArray(),
    db.reviewLogs.toArray(),
    db.annotations.toArray(),
    db.pdfPages.toArray(),
    db.sessions.toArray(),
    db.searchDocs.toArray(),
    db.settings.toArray(),
    db.files.toArray()
  ]);

  const payload: BackupPayload = {
    format: "logospraxis-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    books,
    cards,
    reviewLogs,
    annotations,
    pdfPages,
    sessions,
    searchDocs,
    settings,
    files: files.map(({ blob: _blob, ...file }) => ({
      ...file,
      archivePath: `pdf/${file.id}.pdf`
    }))
  };

  const writer = new ZipWriter(new BlobWriter("application/zip"));
  await writer.add("data.json", new TextReader(JSON.stringify(payload)));
  for (const file of files) {
    await writer.add(`pdf/${file.id}.pdf`, new BlobReader(file.blob));
  }
  return writer.close();
}

export async function importFullBackup(blob: Blob): Promise<void> {
  const reader = new ZipReader(new BlobReader(blob));
  const entries = await reader.getEntries();
  const dataEntry = entries.find(
    (entry): entry is FileEntry => !entry.directory && entry.filename === "data.json"
  );
  if (!dataEntry) {
    await reader.close();
    throw new Error("备份包中缺少 data.json");
  }

  const raw = await dataEntry.getData(new TextWriter());
  const payload = JSON.parse(raw) as BackupPayload;
  if (payload.format !== "logospraxis-backup" || payload.version !== 1) {
    await reader.close();
    throw new Error("不支持的备份格式或版本");
  }

  const files: StoredFile[] = [];
  for (const meta of payload.files) {
    const entry = entries.find(
      (item): item is FileEntry => !item.directory && item.filename === meta.archivePath
    );
    if (!entry) continue;
    const pdfBlob = await entry.getData(new BlobWriter(meta.mime));
    const { archivePath: _archivePath, ...fileMeta } = meta;
    files.push({ ...fileMeta, blob: pdfBlob });
  }

  await db.transaction(
    "rw",
    [
      db.books,
      db.files,
      db.cards,
      db.reviewLogs,
      db.annotations,
      db.pdfPages,
      db.sessions,
      db.searchDocs,
      db.settings
    ],
    async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
      await db.books.bulkPut(payload.books);
      await db.files.bulkPut(files);
      await db.cards.bulkPut(payload.cards);
      await db.reviewLogs.bulkPut(payload.reviewLogs);
      await db.annotations.bulkPut(payload.annotations);
      await db.pdfPages.bulkPut(payload.pdfPages);
      await db.sessions.bulkPut(payload.sessions);
      await db.searchDocs.bulkPut(payload.searchDocs);
      await db.settings.bulkPut(payload.settings);
    }
  );
  await reader.close();
}
