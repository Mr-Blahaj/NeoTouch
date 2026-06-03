import {
  CognitiveDimension, CognitiveProfile, PuzzleAttempt, PuzzleCategory,
} from './types';

/** Maps each puzzle category to its primary and secondary cognitive dimensions */
export const DIMENSION_MAP: Record<PuzzleCategory, { primary: CognitiveDimension; secondary: CognitiveDimension[] }> = {
  [PuzzleCategory.PATTERN_COMPLETION]: { primary: CognitiveDimension.PATTERN_RECOGNITION, secondary: [CognitiveDimension.WORKING_MEMORY] },
  [PuzzleCategory.SHAPE_TRANSFORMATION]: { primary: CognitiveDimension.SPATIAL_INTELLIGENCE, secondary: [CognitiveDimension.PATTERN_RECOGNITION] },
  [PuzzleCategory.REFLECTION_SYMMETRY]: { primary: CognitiveDimension.SPATIAL_INTELLIGENCE, secondary: [CognitiveDimension.ATTENTION_CONTROL] },
  [PuzzleCategory.COLOR_LOGIC]: { primary: CognitiveDimension.LOGICAL_REASONING, secondary: [CognitiveDimension.PATTERN_RECOGNITION] },
  [PuzzleCategory.COUNTING_NUMERACY]: { primary: CognitiveDimension.LOGICAL_REASONING, secondary: [CognitiveDimension.ATTENTION_CONTROL] },
  [PuzzleCategory.ODD_ONE_OUT]: { primary: CognitiveDimension.PATTERN_RECOGNITION, secondary: [CognitiveDimension.ATTENTION_CONTROL] },
  [PuzzleCategory.SEQUENCING]: { primary: CognitiveDimension.PATTERN_RECOGNITION, secondary: [CognitiveDimension.LOGICAL_REASONING] },
  [PuzzleCategory.GRID_REASONING]: { primary: CognitiveDimension.LOGICAL_REASONING, secondary: [CognitiveDimension.SPATIAL_INTELLIGENCE, CognitiveDimension.WORKING_MEMORY] },
  [PuzzleCategory.OBJECT_MOVEMENT]: { primary: CognitiveDimension.SPATIAL_INTELLIGENCE, secondary: [CognitiveDimension.WORKING_MEMORY] },
  [PuzzleCategory.CLASSIFICATION]: { primary: CognitiveDimension.LOGICAL_REASONING, secondary: [CognitiveDimension.PATTERN_RECOGNITION] },
  [PuzzleCategory.ARC_RULE_DISCOVERY]: { primary: CognitiveDimension.LOGICAL_REASONING, secondary: [CognitiveDimension.PATTERN_RECOGNITION, CognitiveDimension.WORKING_MEMORY] },
  [PuzzleCategory.MULTI_STEP_REASONING]: { primary: CognitiveDimension.WORKING_MEMORY, secondary: [CognitiveDimension.LOGICAL_REASONING] },
  [PuzzleCategory.LOGICAL_DEDUCTION]: { primary: CognitiveDimension.LOGICAL_REASONING, secondary: [CognitiveDimension.ATTENTION_CONTROL] },
  [PuzzleCategory.SPATIAL_ASSEMBLY]: { primary: CognitiveDimension.SPATIAL_INTELLIGENCE, secondary: [CognitiveDimension.PERSISTENCE] },
  [PuzzleCategory.PATHFINDING]: { primary: CognitiveDimension.SPATIAL_INTELLIGENCE, secondary: [CognitiveDimension.LOGICAL_REASONING] },
};

/** Calculate a composite performance score (0-1) from an attempt */
export function calculatePerformance(attempt: PuzzleAttempt): number {
  const correctBase = attempt.correct ? 1.0 : 0.0;
  const timeFactor = Math.min(1.0, 25000 / Math.max(attempt.timeTakenMs, 1000));
  const hintFactor = Math.max(0, 1 - attempt.hintsUsed * 0.2);
  const retryFactor = Math.max(0, 1 - attempt.retries * 0.15);
  return correctBase * timeFactor * hintFactor * retryFactor;
}

/** Update a cognitive profile based on a puzzle attempt (EMA smoothing) */
export function updateProfile(
  profile: CognitiveProfile,
  attempt: PuzzleAttempt,
): CognitiveProfile {
  const perf = calculatePerformance(attempt);
  const mapping = DIMENSION_MAP[attempt.category];
  if (!mapping) return profile;

  const alpha = 0.15; // EMA smoothing factor
  const secondaryAlpha = 0.08;
  const newDims = { ...profile.dimensions };

  // Update primary dimension
  const oldPrimary = newDims[mapping.primary] || 500;
  newDims[mapping.primary] = Math.round(oldPrimary + alpha * (perf * 1000 - oldPrimary));

  // Update secondary dimensions
  for (const dim of mapping.secondary) {
    const old = newDims[dim] || 500;
    newDims[dim] = Math.round(old + secondaryAlpha * (perf * 1000 - old));
  }

  // Update persistence based on retries and hints
  if (attempt.retries > 0 && attempt.correct) {
    const oldP = newDims[CognitiveDimension.PERSISTENCE] || 500;
    newDims[CognitiveDimension.PERSISTENCE] = Math.round(oldP + 0.1 * (800 - oldP)); // reward persistence
  }

  // Update learning speed based on improvement trend
  const oldSpeed = newDims[CognitiveDimension.LEARNING_SPEED] || 500;
  if (attempt.correct) {
    newDims[CognitiveDimension.LEARNING_SPEED] = Math.round(oldSpeed + 0.05 * (700 - oldSpeed));
  }

  return {
    ...profile,
    dimensions: newDims,
    totalPuzzlesSolved: profile.totalPuzzlesSolved + (attempt.correct ? 1 : 0),
    lastUpdated: new Date().toISOString(),
  };
}

/** Get top 3 strongest dimensions */
export function getStrengths(profile: CognitiveProfile): { dimension: CognitiveDimension; score: number }[] {
  return Object.entries(profile.dimensions)
    .map(([dim, score]) => ({ dimension: dim as CognitiveDimension, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/** Get bottom 2 dimensions for improvement */
export function getGrowthAreas(profile: CognitiveProfile): { dimension: CognitiveDimension; score: number }[] {
  return Object.entries(profile.dimensions)
    .map(([dim, score]) => ({ dimension: dim as CognitiveDimension, score }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);
}

/** Human-readable dimension names */
export const DIMENSION_LABELS: Record<CognitiveDimension, string> = {
  [CognitiveDimension.PATTERN_RECOGNITION]: 'Pattern Recognition',
  [CognitiveDimension.SPATIAL_INTELLIGENCE]: 'Spatial Intelligence',
  [CognitiveDimension.LOGICAL_REASONING]: 'Logical Reasoning',
  [CognitiveDimension.WORKING_MEMORY]: 'Working Memory',
  [CognitiveDimension.ATTENTION_CONTROL]: 'Attention Control',
  [CognitiveDimension.PERSISTENCE]: 'Persistence',
  [CognitiveDimension.LEARNING_SPEED]: 'Learning Speed',
};

/** Generate parent-friendly insight text */
export function generateInsights(profile: CognitiveProfile): string[] {
  const strengths = getStrengths(profile);
  const growth = getGrowthAreas(profile);
  const insights: string[] = [];

  if (strengths.length > 0) {
    insights.push(`🌟 Strongest area: ${DIMENSION_LABELS[strengths[0].dimension]} — keep it up!`);
  }
  if (growth.length > 0 && growth[0].score < 450) {
    insights.push(`💪 Room to grow: ${DIMENSION_LABELS[growth[0].dimension]} — try more puzzles in this area!`);
  }
  if (profile.totalPuzzlesSolved >= 10) {
    insights.push(`🎯 ${profile.totalPuzzlesSolved} puzzles solved — great progress!`);
  }
  if (profile.streakDays >= 3) {
    insights.push(`🔥 ${profile.streakDays}-day streak! Consistency builds strong minds.`);
  }

  return insights;
}
