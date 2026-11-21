/** Deterministic love score from a name → percent off (16–20% inclusive). */
export function computeLoveScore(rawName: string): number {
  const name = rawName.trim().toLowerCase().replace(/\s+/g, " ");
  if (!name) return 0;

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }

  const band = 16 + (hash % 5); // 16..20 inclusive
  return band;
}

export function makeDiscountCode(name: string, percent: number) {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8);
  return `FLO${slug}${percent}`;
}
