export const TERM_WHITELIST = new Set([
  "ATO",
  "FBT",
  "ECM",
  "GST",
  "PAYG",
  "Medicare levy",
  "Residual",
  "Gross-up factor",
  "RFBA",
  "EV",
  "BEV",
  "ICE",
]);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function preserveWhitelistedTerms(text: string): string {
  const orderedTerms = Array.from(TERM_WHITELIST).sort(
    (left, right) => right.length - left.length,
  );
  let result = text;
  for (const term of orderedTerms) {
    const pattern = new RegExp(`(?<![A-Za-z0-9])${escapeRegex(term)}(?![A-Za-z0-9])`, "gi");
    result = result.replace(pattern, term);
  }
  return result;
}
