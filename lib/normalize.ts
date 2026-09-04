export function normalizeAnswer(input: string) {
  return input
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, "")
    .replace(/\s+/g, " ");
}

export function extractLastFourDigits(bitsId: string) {
  const digits = bitsId.replace(/\D/g, "");
  if (digits.length < 4) throw new Error("BITS ID must contain at least four digits.");
  return digits.slice(-4);
}
