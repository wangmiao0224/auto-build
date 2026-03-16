import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";

const DATA_DIR = join(process.cwd(), "data");
const MAX_VERSIONS = 10;

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function filePath(name: string) {
  return join(DATA_DIR, `${name}.json`);
}

function versionDir(name: string) {
  return join(DATA_DIR, ".versions", name);
}

/**
 * 读取 JSON 配置文件，不存在时返回 defaultValue
 */
export async function readConfig<T>(name: string, defaultValue: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath(name), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 原子写入 JSON 配置（先写 .tmp 再替换），自动保留版本历史
 */
export async function writeConfig<T>(name: string, data: T): Promise<void> {
  await ensureDir(DATA_DIR);

  const target = filePath(name);
  const tmp = target + ".tmp";

  const json = JSON.stringify(data, null, 2);

  // 写入临时文件
  await fs.writeFile(tmp, json, "utf-8");
  // 原子替换
  await fs.rename(tmp, target);

  // 保留版本历史
  await saveVersion(name, json);
}

/**
 * 保留最多 MAX_VERSIONS 个历史版本
 */
async function saveVersion(name: string, content: string) {
  const dir = versionDir(name);
  await ensureDir(dir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const versionFile = join(dir, `${timestamp}.json`);
  await fs.writeFile(versionFile, content, "utf-8");

  // 清理超出数量的旧版本
  const files = (await fs.readdir(dir)).sort();
  if (files.length > MAX_VERSIONS) {
    const toDelete = files.slice(0, files.length - MAX_VERSIONS);
    await Promise.all(toDelete.map((f) => fs.unlink(join(dir, f))));
  }
}

/**
 * 列出版本历史
 */
export async function listVersions(name: string): Promise<string[]> {
  const dir = versionDir(name);
  try {
    const files = await fs.readdir(dir);
    return files.sort().reverse();
  } catch {
    return [];
  }
}

/**
 * 读取指定版本
 */
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

/**
 * 删除配置文件
 */
export async function deleteConfig(name: string): Promise<void> {
  try {
    await fs.unlink(filePath(name));
  } catch {
    // 忽略不存在的文件
  }
}
