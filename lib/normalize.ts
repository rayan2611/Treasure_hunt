export function normalizeAnswer(input: string) {
  return input
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, "")
    .replace(/\s+/g, " ");
}
