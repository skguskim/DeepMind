import type { Rarity, ComputedStats } from "./schemas";

export const MAX_STATS = {
  hp: 756,
  atk: 454,
  def: 454,
  spd: 382,
};

/**
 * Deterministic scoring pipeline.
 * Given inconvenience I (0-100) and risk R (0-100), compute all stats.
 */
export function computeStats(I: number, R: number): ComputedStats {
  const impact_score = Math.round(0.55 * I + 0.45 * R);
  const level = 1 + Math.floor(impact_score / 10); // 1..11
  const rarity = getRarity(impact_score);
  const mult = 1.0 + (level - 1) * 0.08;

  const hp = Math.round((60 + 2.0 * I + 1.6 * R) * mult);
  const atk = Math.round((12 + 1.8 * R + 0.6 * I) * mult);
  const def = Math.round((12 + 1.2 * R + 1.2 * I) * mult);
  const spd = Math.round((12 + 1.0 * R + 1.0 * I) * mult);

  return { impact_score, level, rarity, hp, atk, def, spd };
}

function getRarity(impact_score: number): Rarity {
  if (impact_score >= 80) return "LEGENDARY";
  if (impact_score >= 60) return "EPIC";
  if (impact_score >= 40) return "RARE";
  if (impact_score >= 20) return "UNCOMMON";
  return "COMMON";
}

/** Get rarity color for badges */
export function getRarityColor(rarity: Rarity): string {
  switch (rarity) {
    case "COMMON":
      return "#9CA3AF"; // gray
    case "UNCOMMON":
      return "#22C55E"; // green
    case "RARE":
      return "#3B82F6"; // blue
    case "EPIC":
      return "#A855F7"; // purple
    case "LEGENDARY":
      return "#FF9919"; // primary orange
  }
}

/** Get rarity label in Korean */
export function getRarityLabel(rarity: Rarity): string {
  switch (rarity) {
    case "COMMON":
      return "커먼";
    case "UNCOMMON":
      return "언커먼";
    case "RARE":
      return "레어";
    case "EPIC":
      return "에픽";
    case "LEGENDARY":
      return "레전더리";
  }
}
