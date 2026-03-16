import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const MAX_VERSIONS = 10;

let dataDirEnsured = false;
const ensuredDirs = new Set<string>();

async function ensureDir(dir: string) {
  if (ensuredDirs.has(dir)) return;
  await fs.mkdir(dir, { recursive: true });
  ensuredDirs.add(dir);
  if (dir === DATA_DIR) {
    dataDirEnsured = true;
  }
}

function filePath(name: string) {
  return join(DATA_DIR, `${name}.json`);
}

function versionDir(name: string) {
  return join(DATA_DIR, ".versions", name);
}

export async function readConfig<T>(name: string, defaultValue: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath(name), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export async function writeConfig<T>(name: string, data: T): Promise<void> {
  await ensureDir(DATA_DIR);

  const target = filePath(name);
  const tmp = target + ".tmp";

  const json = JSON.stringify(data, null, 2);

  await fs.writeFile(tmp, json, "utf-8");
  await fs.rename(tmp, target);

  await saveVersion(name, json);
}

async function saveVersion(name: string, content: string) {
  const dir = versionDir(name);
  await ensureDir(dir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const versionFile = join(dir, `${timestamp}.json`);
  await fs.writeFile(versionFile, content, "utf-8");

  const files = (await fs.readdir(dir)).sort();
  if (files.length > MAX_VERSIONS) {
    const toDelete = files.slice(0, files.length - MAX_VERSIONS);
    await Promise.all(toDelete.map((f) => fs.unlink(join(dir, f))));
  }
}

export async function listVersions(name: string): Promise<string[]> {
  const dir = versionDir(name);
  try {
    const files = await fs.readdir(dir);
    return files.sort().reverse();
  } catch {
    return [];
  }
}

export async function readVersion<T>(
  name: string,
  version: string
): Promise<T | null> {
  const file = join(versionDir(name), version);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function deleteConfig(name: string): Promise<void> {
  try {
    await fs.unlink(filePath(name));
  } catch {}
}
