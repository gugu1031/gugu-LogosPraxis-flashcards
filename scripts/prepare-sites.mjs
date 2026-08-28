import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");
const server = path.join(dist, "server");
const workerSource = path.join(root, "sites", "worker.js");

const entries = await readdir(dist, { withFileTypes: true });

await rm(client, { recursive: true, force: true });
await rm(server, { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(server, { recursive: true });

for (const entry of entries) {
  if (entry.name === "client" || entry.name === "server" || entry.name === ".openai") continue;
  await cp(path.join(dist, entry.name), path.join(client, entry.name), {
    recursive: entry.isDirectory()
  });
}

await cp(workerSource, path.join(server, "index.js"));

console.log("Sites bundle prepared: dist/client + dist/server/index.js");
