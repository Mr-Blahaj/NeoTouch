import { PuzzleAttempt, CognitiveProfile, World, Badge, PuzzleCategory } from './types';

/** Active game worlds */
export const WORLDS: World[] = [
  {
    id: 'shape-forest',
    name: 'Shape Island',
    emoji: '◼',
    description: 'Sort, stack, rotate, and match soft wooden shapes.',
    categories: [PuzzleCategory.SPATIAL_ASSEMBLY, PuzzleCategory.CLASSIFICATION, PuzzleCategory.ODD_ONE_OUT, PuzzleCategory.COUNTING_NUMERACY],
    unlockScore: 0,
    color: '#22C55E',
  },
  {
    id: 'pattern-mountains',
    name: 'Pattern Room',
    emoji: '◆',
    description: 'Continue gentle color rhythms and copy light sequences.',
    categories: [PuzzleCategory.PATTERN_COMPLETION, PuzzleCategory.COLOR_LOGIC, PuzzleCategory.ARC_RULE_DISCOVERY],
    unlockScore: 0,
    color: '#3B82F6',
  },
  {
    id: 'logic-laboratory',
    name: 'Memory Train',
    emoji: '●',
    description: 'Flip, remember, hide, find, and repeat short visual games.',
    categories: [PuzzleCategory.SEQUENCING],
    unlockScore: 0,
    color: '#8B5CF6',
  },
  {
    id: 'arc-galaxy',
    name: 'Drawing Studio',
    emoji: '✎',
    description: 'Draw, zoom, place stickers, and turn doodles into ideas.',
    categories: [PuzzleCategory.GRID_REASONING],
    unlockScore: 0,
    color: '#EC4899',
  },
];

/** All achievement badges */
export const BADGES: Badge[] = [
  { id: 'first-puzzle', name: 'First Steps', emoji: '🎉', description: 'Solve your first puzzle!', condition: { type: 'puzzles_solved', threshold: 1 } },
  { id: 'ten-puzzles', name: 'Puzzle Explorer', emoji: '🗺️', description: 'Solve 10 puzzles', condition: { type: 'puzzles_solved', threshold: 10 } },
  { id: 'fifty-puzzles', name: 'Puzzle Champion', emoji: '🏆', description: 'Solve 50 puzzles', condition: { type: 'puzzles_solved', threshold: 50 } },
  { id: 'hundred-puzzles', name: 'Puzzle Legend', emoji: '👑', description: 'Solve 100 puzzles', condition: { type: 'puzzles_solved', threshold: 100 } },
  { id: 'streak-3', name: 'On Fire', emoji: '🔥', description: '3-day streak!', condition: { type: 'streak', threshold: 3 } },
  { id: 'streak-7', name: 'Week Warrior', emoji: '⚡', description: '7-day streak!', condition: { type: 'streak', threshold: 7 } },
  { id: 'streak-30', name: 'Monthly Master', emoji: '🌟', description: '30-day streak!', condition: { type: 'streak', threshold: 30 } },
  { id: 'pattern-master', name: 'Pattern Master', emoji: '🧬', description: 'Excel at Pattern Recognition', condition: { type: 'category_mastery', threshold: 700, category: PuzzleCategory.PATTERN_COMPLETION } },
  { id: 'logic-wizard', name: 'Logic Wizard', emoji: '🧙', description: 'Excel at Logical Reasoning', condition: { type: 'category_mastery', threshold: 700, category: PuzzleCategory.LOGICAL_DEDUCTION } },
  { id: 'spatial-genius', name: 'Spatial Genius', emoji: '🌀', description: 'Excel at Spatial Intelligence', condition: { type: 'category_mastery', threshold: 700, category: PuzzleCategory.SHAPE_TRANSFORMATION } },
  { id: 'score-500', name: 'Rising Star', emoji: '⭐', description: 'Reach score 500', condition: { type: 'score_threshold', threshold: 500 } },
  { id: 'score-750', name: 'Brilliant Mind', emoji: '💎', description: 'Reach score 750', condition: { type: 'score_threshold', threshold: 750 } },
  { id: 'perfect-5', name: 'Perfectionist', emoji: '✨', description: '5 perfect solves in a row!', condition: { type: 'perfect_solves', threshold: 5 } },
  { id: 'speed-demon', name: 'Speed Thinker', emoji: '⚡', description: 'Solve 3 puzzles under 10 seconds each', condition: { type: 'speed', threshold: 3 } },
  { id: 'world-forest', name: 'Forest Explorer', emoji: '🌲', description: 'Complete Shape Forest', condition: { type: 'world_complete', threshold: 1, world: 'shape-forest' } },
  { id: 'world-mountains', name: 'Mountain Climber', emoji: '⛰️', description: 'Complete Pattern Mountains', condition: { type: 'world_complete', threshold: 1, world: 'pattern-mountains' } },
];

/** Calculate XP earned from a puzzle attempt */
export function calculateXP(difficulty: number, attempt: PuzzleAttempt, streakDays: number): number {
  if (!attempt.correct) return 2; // Participation XP
  const baseXP = Math.round(10 + difficulty * 20);
  const expectedMs = 25000;
  const timeBonus = Math.max(0, Math.round((expectedMs - attempt.timeTakenMs) / 1000));
  const streakMultiplier = Math.min(2.0, 1 + streakDays * 0.1);
  const hintPenalty = attempt.hintsUsed * 2;
  return Math.max(1, Math.round((baseXP + timeBonus) * streakMultiplier - hintPenalty));
}

/** Calculate stars (1-3) for a puzzle attempt */
export function calculateStars(attempt: PuzzleAttempt): number {
  if (!attempt.correct) return 0;
  if (attempt.hintsUsed === 0 && attempt.retries === 0 && attempt.timeTakenMs < 15000) return 3;
  if (attempt.hintsUsed <= 1 && attempt.retries <= 1) return 2;
  return 1;
}

/** Check which new badges the player earned */
export function checkBadgeUnlocks(
  profile: CognitiveProfile,
  history: PuzzleAttempt[],
  currentBadges: string[],
): Badge[] {
  const newBadges: Badge[] = [];

  for (const badge of BADGES) {
    if (currentBadges.includes(badge.id)) continue;

    const { type, threshold } = badge.condition;
    let earned = false;

    switch (type) {
      case 'puzzles_solved':
        earned = profile.totalPuzzlesSolved >= threshold;
        break;
      case 'streak':
        earned = profile.streakDays >= threshold;
        break;
      case 'score_threshold':
        earned = profile.cognitiveScore >= threshold;
        break;
      case 'perfect_solves': {
        let consecutive = 0;
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].correct && history[i].hintsUsed === 0 && history[i].retries === 0) {
            consecutive++;
          } else break;
        }
        earned = consecutive >= threshold;
        break;
      }
      case 'speed': {
        const fast = history.filter(a => a.correct && a.timeTakenMs < 10000);
        earned = fast.length >= threshold;
        break;
      }
      default:
        break;
    }

    if (earned) newBadges.push(badge);
  }

  return newBadges;
}

/** Check if a new world should be unlocked */
export function getUnlockedWorlds(cognitiveScore: number): World[] {
  return WORLDS.filter(w => cognitiveScore >= w.unlockScore);
}
