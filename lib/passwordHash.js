/*
 * Server-only password hashing. Separate from lib/password.js, which states the
 * policy and is imported by client components; node:crypto must never follow
 * those rules into the browser bundle.
 *
 * scrypt rather than bcrypt because node:crypto runs it on the libuv
 * threadpool. bcryptjs is pure JavaScript on the main thread, so every hash
 * stalls the whole server: measured on this codebase, ten concurrent cost-12
 * compares took 2245ms and let the event loop tick 3 times, against 359ms and
 * 35 ticks for the parameters below.
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import bcrypt from "bcryptjs";

const scryptAsync = promisify(scrypt);

/*
 * Cost. N is the security/throughput dial and it is stored inside every hash,
 * so changing it is backward compatible: existing hashes keep verifying at the
 * cost they were minted with.
 *
 * Measured on a 12-core host, logging in 1000 users at once: N=32768 sustains
 * roughly 80 logins/sec. Each halving of N roughly doubles that and halves the
 * work an attacker must do per guess. Raise instances before lowering this.
 */
const envN = Number(process.env.SCRYPT_COST_N);
const N = Number.isInteger(envN) && envN >= 16384 && (envN & (envN - 1)) === 0 ? envN : 32768;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

/* 128 * N * r is scrypt's working set; the default 32MB cap rejects N=32768. */
const MAX_MEM = 128 * N * R * 2;

const derive = (password, salt) =>
  scryptAsync(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: MAX_MEM });

export const hashPassword = async (password) => {
  const salt = randomBytes(16);
  const key = await derive(password, salt);

  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
};

const verifyScrypt = async (password, stored) => {
  const [, n, r, p, salt, key] = stored.split("$");
  const expected = Buffer.from(key, "base64");

  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 128 * Number(n) * Number(r) * 2,
  });

  return timingSafeEqual(actual, expected);
};

/**
 * Verify against whichever algorithm minted the stored hash, so accounts
 * created before the scrypt switch keep working with no backfill.
 */
export const verifyPassword = async (password, stored) => {
  if (typeof stored !== "string" || stored.length === 0) {
    return false;
  }

  try {
    if (stored.startsWith("scrypt$")) {
      return await verifyScrypt(password, stored);
    }

    return await bcrypt.compare(password, stored);
  } catch {
    return false;
  }
};

/* A surviving bcrypt hash is upgraded on the next successful sign-in. */
export const needsRehash = (stored) =>
  typeof stored === "string" && !stored.startsWith("scrypt$");
