import { SeedRandom } from '../SeedRandom';
import {
  AgeGroup, PuzzleCategory, CognitiveDimension,
  Puzzle, PuzzleOption, Grid, InteractionType,
} from '../types';

const COLORS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚪', '🟤'];
const SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon'];
const COLOR_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

type PatternType = 'AB' | 'AAB' | 'AABB' | 'ABC' | 'ABAC' | 'ABCABC' | 'ABBA' | 'ABCBA';

function getPatternTypes(difficulty: number): PatternType[] {
  if (difficulty < 0.3) return ['AB', 'AAB', 'AABB'];
  if (difficulty < 0.6) return ['ABC', 'ABAC', 'AABB', 'ABBA'];
  return ['ABCABC', 'ABBA', 'ABCBA', 'ABAC'];
}

function getPatternLength(ageGroup: AgeGroup, difficulty: number): number {
  switch (ageGroup) {
    case AgeGroup.GROUP_A: return 4 + Math.floor(difficulty * 2);
    case AgeGroup.GROUP_B: return 6 + Math.floor(difficulty * 4);
    case AgeGroup.GROUP_C: return 8 + Math.floor(difficulty * 6);
  }
}

function expandPattern(patternType: PatternType, unitCount: number, rng: SeedRandom, paletteSize: number): number[] {
  const palette = rng.shuffle(COLOR_INDICES.slice(0, paletteSize));
  let unit: number[];

  switch (patternType) {
    case 'AB': unit = [palette[0], palette[1]]; break;
    case 'AAB': unit = [palette[0], palette[0], palette[1]]; break;
    case 'AABB': unit = [palette[0], palette[0], palette[1], palette[1]]; break;
    case 'ABC': unit = [palette[0], palette[1], palette[2]]; break;
    case 'ABAC': unit = [palette[0], palette[1], palette[0], palette[2]]; break;
    case 'ABCABC': unit = [palette[0], palette[1], palette[2]]; break;
    case 'ABBA': unit = [palette[0], palette[1], palette[1], palette[0]]; break;
    case 'ABCBA': unit = [palette[0], palette[1], palette[2], palette[1], palette[0]]; break;
    default: unit = [palette[0], palette[1]];
  }

  const result: number[] = [];
  for (let i = 0; i < unitCount; i++) {
    result.push(...unit);
  }
  return result;
}

export function generatePatternCompletion(
  seed: number,
  ageGroup: AgeGroup,
  difficulty: number
): Puzzle {
  const rng = new SeedRandom(seed);
  const patternTypes = getPatternTypes(difficulty);
  const patternType = rng.pick(patternTypes);
  const totalLen = getPatternLength(ageGroup, difficulty);
  const paletteSize = ageGroup === AgeGroup.GROUP_A ? 3 : ageGroup === AgeGroup.GROUP_B ? 5 : 7;

  // Generate the full pattern
  const reps = Math.ceil(totalLen / 2) + 2;
  const fullPattern = expandPattern(patternType, reps, rng, paletteSize);
  const sequence = fullPattern.slice(0, totalLen);

  // Determine how many to hide
  const missingCount = ageGroup === AgeGroup.GROUP_A ? 1 : difficulty < 0.5 ? 1 : 2;
  const correctAnswers = sequence.slice(sequence.length - missingCount);
  const visibleSequence = sequence.slice(0, sequence.length - missingCount);

  // Build the grid representation: 1 row showing the sequence
  const grid: Grid = {
    width: sequence.length,
    height: 1,
    cells: [sequence.map((v, i) => (i >= visibleSequence.length ? 0 : v))],
  };

  // Generate answer options
  const correctId = 'opt-correct';
  const correctOption: PuzzleOption = {
    id: correctId,
    label: correctAnswers.map(c => COLORS[c % COLORS.length] || '⬜').join(' '),
    value: correctAnswers,
  };

  // Distractors
  const distractorValues: number[][] = [];

  // Distractor 1: repeat last visible element
  const lastVisible = visibleSequence[visibleSequence.length - 1];
  distractorValues.push(Array(missingCount).fill(lastVisible));

  // Distractor 2: wrong continuation (next in simple +1 sequence)
  distractorValues.push(correctAnswers.map(v => COLOR_INDICES[(COLOR_INDICES.indexOf(v) + 1) % COLOR_INDICES.length]));

  // Distractor 3: random from palette
  distractorValues.push(correctAnswers.map(() => rng.pick(COLOR_INDICES.slice(0, paletteSize))));

  // Filter out duplicates that match correct answer
  const uniqueDistractors = distractorValues.filter(
    d => JSON.stringify(d) !== JSON.stringify(correctAnswers)
  );

  while (uniqueDistractors.length < 3) {
    uniqueDistractors.push(correctAnswers.map(() => rng.pick(COLOR_INDICES.slice(0, paletteSize))));
  }

  const options: PuzzleOption[] = [
    correctOption,
    ...uniqueDistractors.slice(0, 3).map((val, i) => ({
      id: `opt-${i}`,
      label: val.map(c => COLORS[c % COLORS.length] || '⬜').join(' '),
      value: val,
    })),
  ];

  // Shuffle options
  const shuffledOptions = rng.shuffle(options);

  return {
    id: `pc-${seed}`,
    seed,
    category: PuzzleCategory.PATTERN_COMPLETION,
    ageGroup,
    difficulty,
    cognitiveLoad: [CognitiveDimension.PATTERN_RECOGNITION, CognitiveDimension.WORKING_MEMORY],
    grid,
    options: shuffledOptions,
    correctAnswer: correctId,
    estimatedTimeSeconds: ageGroup === AgeGroup.GROUP_A ? 15 : 25,
    maxHints: 3,
    irtParameters: {
      difficulty: -2 + difficulty * 4,
      discrimination: 1.0 + difficulty * 0.8,
      guessing: 0.25,
    },
    instruction: missingCount === 1
      ? 'What comes next in the pattern?'
      : 'Complete the pattern! What comes next?',
    interactionType: 'select' as InteractionType,
  };
}
