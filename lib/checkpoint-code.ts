import { randomInt } from "node:crypto";

/** Zero-pads a checkpoint code value to exactly 6 digits, e.g. 42 -> "000042". */
export function formatCheckpointCode(n: number): string {
  return String(n).padStart(6, "0");
}

/**
 * Generates a cryptographically random 6-digit checkpoint code, zero-padded
 * to always be exactly 6 digits (e.g. "042817"). Uses crypto.randomInt, not
 * Math.random, so codes are not predictable. Server-only (node:crypto) -
 * import lib/checkpoint-secret.ts instead from client code.
 */
export function generateCheckpointCode(): string {
  return formatCheckpointCode(randomInt(0, 1_000_000));
}
