import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { isDemoMode } from "@/lib/demo-mode";

const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

function deriveKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: MAX_MEMORY },
      (error, key) => (error ? reject(error) : resolve(key))
    );
  });
}

export async function hashDemoPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt);

  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyDemoCredentials(username: string, password: string) {
  if (!isDemoMode()) return false;

  const expectedUsername = process.env.DEMO_USERNAME?.trim();
  const encodedHash = process.env.DEMO_PASSWORD_HASH?.trim() ?? "";
  const [algorithm, n, r, p, saltHex, keyHex] = encodedHash.split(":");

  if (
    !expectedUsername ||
    !/^[a-f0-9]{32}$/i.test(saltHex ?? "") ||
    !/^[a-f0-9]{128}$/i.test(keyHex ?? "") ||
    algorithm !== "scrypt" ||
    Number(n) !== SCRYPT_N ||
    Number(r) !== SCRYPT_R ||
    Number(p) !== SCRYPT_P
  ) {
    throw new Error("DEMO_PASSWORD_HASH is invalid. Generate it with npm run demo:hash-password.");
  }

  const actualUsername = Buffer.from(username.trim().toLowerCase());
  const expectedUsernameBuffer = Buffer.from(expectedUsername.toLowerCase());
  const usernameMatches =
    actualUsername.length === expectedUsernameBuffer.length &&
    timingSafeEqual(actualUsername, expectedUsernameBuffer);

  const expectedKey = Buffer.from(keyHex, "hex");
  const actualKey = await deriveKey(password, Buffer.from(saltHex, "hex"));

  return usernameMatches && timingSafeEqual(actualKey, expectedKey);
}
