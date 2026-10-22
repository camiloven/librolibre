import { OddsFormat } from '../types/sports';

/**
 * Convert decimal odds to specified format
 */
export function formatOdds(decimalOdds: number, format: OddsFormat = 'decimal'): string {
  if (!decimalOdds || decimalOdds <= 1) return '1.00';

  if (format === 'decimal') {
    return decimalOdds.toFixed(2);
  }

  if (format === 'american') {
    if (decimalOdds >= 2.0) {
      const american = Math.round((decimalOdds - 1) * 100);
      return `+${american}`;
    } else {
      const american = Math.round(-100 / (decimalOdds - 1));
      return `${american}`;
    }
  }

  if (format === 'fractional') {
    const value = decimalOdds - 1;
    // Common fractions approximation
    const tolerance = 0.05;
    const fractions: [number, number][] = [
      [1, 5], [1, 4], [1, 3], [2, 5], [1, 2], [3, 5], [4, 6], [7, 10], [4, 5],
      [1, 1], [6, 5], [5, 4], [11, 8], [6, 4], [7, 4], [2, 1], [9, 4], [5, 2],
      [3, 1], [7, 2], [4, 1], [9, 2], [5, 1], [6, 1], [7, 1], [8, 1], [10, 1]
    ];

    for (const [num, den] of fractions) {
      if (Math.abs(value - num / den) < tolerance) {
        return `${num}/${den}`;
      }
    }
    return `${Math.round(value * 10)}/10`;
  }

  return decimalOdds.toFixed(2);
}

/**
 * Calculate Expected Value (EV%)
 * EV = (Probability * Decimal Odds) - 1
 */
export function calculateExpectedValue(probabilityPct: number, odds: number): {
  evPct: number;
  isPositive: boolean;
  fairOdds: number;
} {
  const prob = probabilityPct / 100;
  const ev = (prob * odds) - 1;
  const fairOdds = prob > 0 ? 1 / prob : 0;

  return {
    evPct: Number((ev * 100).toFixed(2)),
    isPositive: ev > 0,
    fairOdds: Number(fairOdds.toFixed(2)),
  };
}

/**
 * Calculate Kelly Criterion suggested bankroll stake %
 * f* = (bp - q) / b
 * b = decimal odds - 1
 * p = probability of winning (0 to 1)
 * q = 1 - p (probability of losing)
 */
export function calculateKellyCriterion(
  probabilityPct: number,
  odds: number,
  fraction: number = 0.5 // Half-Kelly default for risk control
): {
  fullKellyPct: number;
  recommendedPct: number;
  hasEdge: boolean;
} {
  const p = probabilityPct / 100;
  const q = 1 - p;
  const b = odds - 1;

  if (b <= 0 || p <= 0) {
    return { fullKellyPct: 0, recommendedPct: 0, hasEdge: false };
  }

  const fullKelly = (b * p - q) / b;
  const edge = fullKelly > 0;
  const fullKellyPct = edge ? Number((fullKelly * 100).toFixed(2)) : 0;
  const recommendedPct = edge ? Number((fullKelly * fraction * 100).toFixed(2)) : 0;

  return {
    fullKellyPct,
    recommendedPct,
    hasEdge: edge,
  };
}
