import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, InteractionType } from '../types';

export function generateCountingNumeracy(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);
  const SHAPES = ['🔴', '🔵', '🟢', '⭐', '🔶', '💜'];

  if (ageGroup === AgeGroup.GROUP_A || difficulty < 0.3) {
    // Simple counting: how many of shape X?
    const targetShape = rng.pick(SHAPES);
    const otherShape = rng.pick(SHAPES.filter(s => s !== targetShape));
    const count = rng.nextInt(1, 5);
    const otherCount = rng.nextInt(1, 3);
    const items = rng.shuffle([
      ...Array(count).fill(targetShape),
      ...Array(otherCount).fill(otherShape),
    ]);

    const correctOption: PuzzleOption = { id: 'opt-correct', label: `${count}`, value: count };
    const distractors: PuzzleOption[] = [
      { id: 'opt-0', label: `${count + 1}`, value: count + 1 },
      { id: 'opt-1', label: `${Math.max(1, count - 1)}`, value: Math.max(1, count - 1) },
      { id: 'opt-2', label: `${count + 2}`, value: count + 2 },
    ];

    return {
      id: `cn-${seed}`, seed,
      category: PuzzleCategory.COUNTING_NUMERACY, ageGroup, difficulty,
      cognitiveLoad: [CognitiveDimension.ATTENTION_CONTROL],
      elements: items.map((s, i) => ({ type: s, color: 0, size: 1, rotation: 0, position: { x: i * 2, y: 0 } })),
      options: rng.shuffle([correctOption, ...distractors]),
      correctAnswer: 'opt-correct',
      estimatedTimeSeconds: 15,
      maxHints: 3,
      irtParameters: { difficulty: -2.5 + difficulty * 2, discrimination: 0.8, guessing: 0.25 },
      instruction: `How many ${targetShape} can you count?`,
      interactionType: 'select' as InteractionType,
    };
  } else if (difficulty < 0.65) {
    // Comparison: which group has more?
    const countA = rng.nextInt(3, 8);
    const countB = rng.nextInt(3, 8);
    const shapeA = rng.pick(SHAPES);
    const shapeB = rng.pick(SHAPES.filter(s => s !== shapeA));
    const bigger = countA > countB ? 'A' : countA < countB ? 'B' : 'same';

    const correctOption: PuzzleOption = { id: 'opt-correct', label: bigger === 'A' ? `${shapeA} group (${countA})` : bigger === 'B' ? `${shapeB} group (${countB})` : 'They are equal!', value: bigger === 'A' ? countA : countB };
    const distractors: PuzzleOption[] = [
      { id: 'opt-0', label: bigger !== 'A' ? `${shapeA} group (${countA})` : `${shapeB} group (${countB})`, value: bigger !== 'A' ? countA : countB },
      { id: 'opt-1', label: 'They are equal!', value: 0 },
      { id: 'opt-2', label: `Can't tell`, value: -1 },
    ];

    return {
      id: `cn-${seed}`, seed,
      category: PuzzleCategory.COUNTING_NUMERACY, ageGroup, difficulty,
      cognitiveLoad: [CognitiveDimension.LOGICAL_REASONING, CognitiveDimension.ATTENTION_CONTROL],
      elements: [
        ...Array(countA).fill(null).map((_, i) => ({ type: shapeA, color: 1, size: 1, rotation: 0, position: { x: i, y: 0 } })),
        ...Array(countB).fill(null).map((_, i) => ({ type: shapeB, color: 2, size: 1, rotation: 0, position: { x: i, y: 2 } })),
      ],
      options: rng.shuffle([correctOption, ...distractors.filter(d => d.label !== correctOption.label)].slice(0, 4)),
      correctAnswer: 'opt-correct',
      estimatedTimeSeconds: 20,
      maxHints: 3,
      irtParameters: { difficulty: -1 + difficulty * 3, discrimination: 1.2, guessing: 0.25 },
      instruction: 'Which group has more?',
      interactionType: 'select' as InteractionType,
    };
  } else {
    // Missing number in sequence
    const start = rng.nextInt(1, 10);
    const step = rng.pick([1, 2, 3, 5]);
    const length = rng.nextInt(5, 7);
    const sequence = Array.from({ length }, (_, i) => start + i * step);
    const hideIdx = rng.nextInt(1, length - 2);
    const missing = sequence[hideIdx];
    const display = sequence.map((n, i) => i === hideIdx ? '?' : `${n}`);

    const correctOption: PuzzleOption = { id: 'opt-correct', label: `${missing}`, value: missing };
    const distractors: PuzzleOption[] = [
      { id: 'opt-0', label: `${missing + step}`, value: missing + step },
      { id: 'opt-1', label: `${missing - step}`, value: missing - step },
      { id: 'opt-2', label: `${missing + 1}`, value: missing + 1 },
    ];

    return {
      id: `cn-${seed}`, seed,
      category: PuzzleCategory.COUNTING_NUMERACY, ageGroup, difficulty,
      cognitiveLoad: [CognitiveDimension.LOGICAL_REASONING, CognitiveDimension.PATTERN_RECOGNITION],
      options: rng.shuffle([correctOption, ...distractors]),
      correctAnswer: 'opt-correct',
      estimatedTimeSeconds: 25,
      maxHints: 3,
      irtParameters: { difficulty: difficulty * 3 - 1, discrimination: 1.5, guessing: 0.25 },
      instruction: `Find the missing number: ${display.join(', ')}`,
      interactionType: 'select' as InteractionType,
    };
  }
}
