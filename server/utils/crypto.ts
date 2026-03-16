import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const keyHex = process.env.CONFIG_ENCRYPT_KEY || "";
  if (!keyHex || keyHex.length < 64) {
    // 开发环境使用固定密钥（生产必须配置环境变量）
    return Buffer.from("0".repeat(64), "hex");
  }
  return Buffer.from(keyHex.slice(0, 64), "hex");
}

/**
 * AES-256-GCM 加密
 * 输出格式：iv(hex) + ':' + authTag(hex) + ':' + ciphertext(hex)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

/**
 * AES-256-GCM 解密
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * 脱敏密码展示（仅展示前2位和后2位）
 */
export function maskPassword(password: string): string {
  if (!password || password.length <= 4) return "****";
  return password.slice(0, 2) + "***" + password.slice(-2);
}
