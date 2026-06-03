import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, InteractionType } from '../types';

export function generateSequencing(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);

  let sequence: number[];
  let ruleDesc: string;
  const length = ageGroup === AgeGroup.GROUP_A ? 5 : ageGroup === AgeGroup.GROUP_B ? 6 : 7;

  if (difficulty < 0.3) {
    // Simple +N
    const start = rng.nextInt(1, 5);
    const step = rng.pick([1, 2]);
    sequence = Array.from({ length }, (_, i) => start + i * step);
    ruleDesc = `+${step}`;
  } else if (difficulty < 0.55) {
    // Geometric: ×2 or ×3
    const start = rng.pick([1, 2, 3]);
    const mul = rng.pick([2, 3]);
    sequence = Array.from({ length: Math.min(length, 6) }, (_, i) => start * Math.pow(mul, i));
    ruleDesc = `×${mul}`;
  } else if (difficulty < 0.75) {
    // Alternating: +a, +b
    const start = rng.nextInt(1, 5);
    const stepA = rng.pick([1, 2, 3]);
    const stepB = rng.pick([2, 3, 5]);
    sequence = [start];
    for (let i = 1; i < length; i++) {
      sequence.push(sequence[i - 1] + (i % 2 === 1 ? stepA : stepB));
    }
    ruleDesc = `alternating +${stepA}, +${stepB}`;
  } else {
    // Fibonacci-like: a, b, a+b, ...
    const a = rng.nextInt(1, 3);
    const b = rng.nextInt(1, 4);
    sequence = [a, b];
    for (let i = 2; i < length; i++) {
      sequence.push(sequence[i - 1] + sequence[i - 2]);
    }
    ruleDesc = 'fibonacci-like';
  }

  // Hide last element
  const missing = sequence[sequence.length - 1];
  const displaySeq = sequence.slice(0, -1).join(', ') + ', ?';

  const correctOption: PuzzleOption = { id: 'opt-correct', label: `${missing}`, value: missing };
  const distractors: PuzzleOption[] = [];

  // Smart distractors
  const used = new Set([missing]);
  const candidates = [
    missing + (sequence[1] - sequence[0]),
    missing - 1,
    missing + 1,
    missing * 2,
    sequence[sequence.length - 2],
    missing + rng.nextInt(2, 5),
  ];

  for (const c of candidates) {
    if (!used.has(c) && c > 0 && distractors.length < 3) {
      used.add(c);
      distractors.push({ id: `opt-${distractors.length}`, label: `${c}`, value: c });
    }
  }
  while (distractors.length < 3) {
    const v = missing + rng.nextInt(-10, 10);
    if (!used.has(v) && v > 0) { used.add(v); distractors.push({ id: `opt-${distractors.length}`, label: `${v}`, value: v }); }
  }

  return {
    id: `seq-${seed}`, seed,
    category: PuzzleCategory.SEQUENCING, ageGroup, difficulty,
    cognitiveLoad: [CognitiveDimension.PATTERN_RECOGNITION, CognitiveDimension.LOGICAL_REASONING],
    options: rng.shuffle([correctOption, ...distractors]),
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: 20 + Math.floor(difficulty * 15),
    maxHints: 3,
    irtParameters: { difficulty: -1.5 + difficulty * 4, discrimination: 1.3 + difficulty * 0.5, guessing: 0.25 },
    instruction: `What comes next? ${displaySeq}`,
    interactionType: 'select' as InteractionType,
  };
}
