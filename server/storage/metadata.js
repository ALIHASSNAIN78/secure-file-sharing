import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "files.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

async function readAll() {
  await ensureStore();
  return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
}

async function writeAll(records) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf8");
}

export async function createRecord(record) {
  const records = await readAll();
  records.push(record);
  await writeAll(records);
  return record;
}

export async function getById(id) {
  const records = await readAll();
  return records.find((r) => r.id === id) ?? null;
}

export async function listUploaded() {
  const records = await readAll();
  return records
    .filter((r) => r.status === "uploaded")
    .map((r) => ({
      id: r.id,
      originalName: r.originalName,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      uploadedAt: r.uploadedAt,
    }))
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}
