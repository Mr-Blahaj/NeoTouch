import { IRTParameters, PuzzleAttempt, CognitiveProfile, PuzzleCategory } from './types';

/**
 * 3-Parameter Logistic IRT model: P(correct | θ, a, b, c)
 * c + (1 - c) / (1 + exp(-a * (θ - b)))
 */
export function calculateProbability(theta: number, params: IRTParameters): number {
  const { difficulty: b, discrimination: a, guessing: c } = params;
  return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
}

/** Fisher Information at a given θ for an item */
export function fisherInformation(theta: number, params: IRTParameters): number {
  const p = calculateProbability(theta, params);
  const { discrimination: a, guessing: c } = params;
  const q = 1 - p;
  const pStar = (p - c) / (1 - c);
  if (q <= 0 || p <= 0) return 0;
  return (a * a * pStar * pStar * q) / (p * (1 - c) * (1 - c));
}

/** Update θ using Bayesian EAP-like gradient update */
export function updateTheta(
  currentTheta: number,
  attempt: PuzzleAttempt,
  learningRate = 0.4,
): { newTheta: number; newSE: number } {
  const p = calculateProbability(currentTheta, attempt.irtParameters);

  // Time factor: faster = better (capped at 1.3x boost)
  const expectedMs = 25000; // 25 seconds expected
  const timeFactor = Math.min(1.3, Math.max(0.5, expectedMs / Math.max(attempt.timeTakenMs, 1000)));

  // Hint penalty: each hint reduces effective correctness
  const hintPenalty = attempt.hintsUsed * 0.2;
  const retryPenalty = attempt.retries * 0.15;

  // Effective performance
  const effectiveCorrect = attempt.correct
    ? Math.max(0.1, 1 - hintPenalty - retryPenalty) * timeFactor
    : -1 * (1 + retryPenalty);

  // Gradient update
  let delta: number;
  if (attempt.correct) {
    delta = learningRate * (1 - p) * effectiveCorrect;
  } else {
    delta = -learningRate * p * Math.abs(effectiveCorrect) * 0.6;
  }

  const newTheta = Math.max(-3, Math.min(3, currentTheta + delta));

  // Simplified SE update (decreases with more items)
  const info = fisherInformation(newTheta, attempt.irtParameters);
  const newSE = 1 / Math.sqrt(Math.max(info, 0.01) + 0.1);

  return { newTheta, newSE };
}

/** Map θ (-3 to 3) to cognitive score (0-1000) */
export function thetaToScore(theta: number): number {
  return Math.round(Math.max(0, Math.min(1000, 500 + 166.7 * theta)));
}

/** Map cognitive score (0-1000) back to θ */
export function scoreToTheta(score: number): number {
  return (score - 500) / 166.7;
}

/**
 * Select the next puzzle difficulty target.
 * Targets the Zone of Proximal Development: items slightly above current ability.
 */
export function selectNextDifficulty(
  theta: number,
  recentHistory: PuzzleAttempt[],
): number {
  // Base target: slightly above current θ
  let targetB = theta + 0.3;

  // Frustration guard: 3+ consecutive failures → reduce difficulty
  const lastN = recentHistory.slice(-3);
  if (lastN.length >= 3 && lastN.every(a => !a.correct)) {
    targetB = theta - 0.5;
  }

  // Boredom guard: 5+ consecutive successes → increase difficulty
  const last5 = recentHistory.slice(-5);
  if (last5.length >= 5 && last5.every(a => a.correct)) {
    targetB = theta + 0.8;
  }

  // Convert IRT difficulty (b ∈ [-3, 3]) to normalized (0-1)
  return Math.max(0, Math.min(1, (targetB + 3) / 6));
}

/** Select next category with exposure control */
export function selectNextCategory(
  history: PuzzleAttempt[],
  availableCategories: PuzzleCategory[],
): PuzzleCategory {
  // Don't repeat the last 2 categories
  const recent = history.slice(-2).map(a => a.category);
  const candidates = availableCategories.filter(c => !recent.includes(c));

  if (candidates.length === 0) return availableCategories[0];

  // Pick least-played category
  const counts: Record<string, number> = {};
  for (const cat of availableCategories) counts[cat] = 0;
  for (const a of history) {
    if (counts[a.category] !== undefined) counts[a.category]++;
  }

  candidates.sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
  return candidates[0];
}

/** Get the score label for a cognitive score */
export function getScoreLabel(score: number): { label: string; emoji: string; color: string } {
  if (score < 200) return { label: 'Emerging', emoji: '🌱', color: '#22C55E' };
  if (score < 400) return { label: 'Developing', emoji: '📈', color: '#3B82F6' };
  if (score < 600) return { label: 'Proficient', emoji: '⭐', color: '#F59E0B' };
  if (score < 800) return { label: 'Advanced', emoji: '🚀', color: '#8B5CF6' };
  return { label: 'Exceptional', emoji: '👑', color: '#F97316' };
}
