import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, InteractionType } from '../types';

export function generateLogicalDeduction(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);
  const SHAPES = ['circles', 'squares', 'triangles', 'stars', 'diamonds'];
  const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
  const PROPS = ['big', 'small', 'striped', 'dotted', 'shiny'];

  const s1 = rng.pick(SHAPES);
  const c1 = rng.pick(COLORS);
  const s2 = rng.pick(SHAPES.filter(s => s !== s1));
  const c2 = rng.pick(COLORS.filter(c => c !== c1));
  const p1 = rng.pick(PROPS);

  if (difficulty < 0.35) {
    // Simple: All X are Y. Is this X a Y?
    const premise = `All ${s1} are ${c1}.`;
    const question = `This shape is a ${s1.slice(0, -1)}. What color is it?`;

    return {
      id: `ld-${seed}`, seed,
      category: PuzzleCategory.LOGICAL_DEDUCTION, ageGroup, difficulty,
      cognitiveLoad: [CognitiveDimension.LOGICAL_REASONING, CognitiveDimension.ATTENTION_CONTROL],
      options: rng.shuffle([
        { id: 'opt-correct', label: c1, value: c1 },
        { id: 'opt-0', label: c2, value: c2 },
        { id: 'opt-1', label: rng.pick(COLORS.filter(c => c !== c1 && c !== c2)), value: 'wrong' },
        { id: 'opt-2', label: "Can't tell", value: 'cant' },
      ]),
      correctAnswer: 'opt-correct',
      estimatedTimeSeconds: 15,
      maxHints: 3,
      irtParameters: { difficulty: -2 + difficulty * 3, discrimination: 1.0, guessing: 0.25 },
      instruction: `${premise}\n\n${question}`,
      interactionType: 'select' as InteractionType,
    };
  } else if (difficulty < 0.7) {
    // Medium: All X are Y. Some Y are Z. Is this X definitely Z?
    const premise1 = `All ${s1} are ${c1}.`;
    const premise2 = `Some ${c1} shapes are ${p1}.`;
    const question = `This shape is a ${s1.slice(0, -1)}. Must it be ${p1}?`;

    return {
      id: `ld-${seed}`, seed,
      category: PuzzleCategory.LOGICAL_DEDUCTION, ageGroup, difficulty,
      cognitiveLoad: [CognitiveDimension.LOGICAL_REASONING, CognitiveDimension.ATTENTION_CONTROL],
      options: rng.shuffle([
        { id: 'opt-correct', label: `No — only SOME ${c1} shapes are ${p1}`, value: 'no' },
        { id: 'opt-0', label: `Yes — it must be ${p1}`, value: 'yes' },
        { id: 'opt-1', label: `Yes — all ${s1} are ${p1}`, value: 'wrong' },
        { id: 'opt-2', label: "Can't tell at all", value: 'cant' },
      ]),
      correctAnswer: 'opt-correct',
      estimatedTimeSeconds: 25,
      maxHints: 3,
      irtParameters: { difficulty: difficulty * 4 - 1, discrimination: 1.5, guessing: 0.25 },
      instruction: `Rule 1: ${premise1}\nRule 2: ${premise2}\n\n${question}`,
      interactionType: 'select' as InteractionType,
    };
  } else {
    // Hard: 3 premises, requires chaining
    const premise1 = `All ${s1} are ${c1}.`;
    const premise2 = `All ${c1} shapes are ${p1}.`;
    const premise3 = `No ${s2} are ${c1}.`;
    const question = `A shape is a ${s1.slice(0, -1)}. What do we know for sure?`;

    return {
      id: `ld-${seed}`, seed,
      category: PuzzleCategory.LOGICAL_DEDUCTION, ageGroup, difficulty,
      cognitiveLoad: [CognitiveDimension.LOGICAL_REASONING, CognitiveDimension.ATTENTION_CONTROL, CognitiveDimension.WORKING_MEMORY],
      options: rng.shuffle([
        { id: 'opt-correct', label: `It is ${c1} AND ${p1}`, value: 'both' },
        { id: 'opt-0', label: `It is ${c1} but NOT ${p1}`, value: 'partial' },
        { id: 'opt-1', label: `It is ${p1} but might not be ${c1}`, value: 'wrong1' },
        { id: 'opt-2', label: `We can't determine anything`, value: 'cant' },
      ]),
      correctAnswer: 'opt-correct',
      estimatedTimeSeconds: 35,
      maxHints: 3,
      irtParameters: { difficulty: difficulty * 4 - 0.5, discrimination: 2.0, guessing: 0.25 },
      instruction: `Rule 1: ${premise1}\nRule 2: ${premise2}\nRule 3: ${premise3}\n\n${question}`,
      interactionType: 'select' as InteractionType,
    };
  }
}
