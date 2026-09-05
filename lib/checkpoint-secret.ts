// Pure helpers shared by client and server for the checkpoint QR flow.
// No node-only imports here so this can be safely imported from client
// components (see lib/checkpoint-code.ts for the server-only code generator).

export const CHECKPOINT_CODE_TTL_MS = 4 * 60 * 1000;

/**
 * The physical QR sticker encodes a full URL (https://.../scan?c=<secret>)
 * so a phone's native camera app can resolve it directly. The in-app scanner
 * decodes the same payload, but during testing an admin may hand someone a
 * bare secret (e.g. copied from the checkpoint audit view) instead of a URL.
 * Support both shapes.
 */
export function extractCheckpointSecret(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("c");
    if (fromQuery) return fromQuery;
  } catch {
    // Not URL-shaped - treat the whole decoded payload as the bare secret.
  }
  return trimmed;
}
