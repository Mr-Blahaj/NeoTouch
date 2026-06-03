import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, PuzzleElement, InteractionType } from '../types';

const SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon'];

export function generateOddOneOut(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);
  const count = ageGroup === AgeGroup.GROUP_A ? 4 : difficulty < 0.5 ? 5 : 6;

  // Determine which attribute differs
  type Attr = 'shape' | 'color' | 'size' | 'rotation';
  const attrPool: Attr[] = difficulty < 0.3
    ? ['shape', 'color']
    : difficulty < 0.6
      ? ['shape', 'color', 'size']
      : ['shape', 'color', 'size', 'rotation'];
  const oddAttr = rng.pick(attrPool);

  const baseShape = rng.pick(SHAPES);
  const baseColor = rng.nextInt(1, 6);
  const baseSize = rng.pick([1, 2]);
  const baseRotation = 0;

  const oddIdx = rng.nextInt(0, count - 1);

  const elements: PuzzleElement[] = [];
  for (let i = 0; i < count; i++) {
    if (i === oddIdx) {
      elements.push({
        type: oddAttr === 'shape' ? rng.pick(SHAPES.filter(s => s !== baseShape)) : baseShape,
        color: oddAttr === 'color' ? rng.pick([1,2,3,4,5,6].filter(c => c !== baseColor)) : baseColor,
        size: oddAttr === 'size' ? (baseSize === 1 ? 3 : 1) : baseSize,
        rotation: oddAttr === 'rotation' ? 45 : baseRotation,
        position: { x: i * 2, y: 0 },
      });
    } else {
      elements.push({
        type: baseShape,
        color: baseColor,
        size: baseSize,
        rotation: baseRotation,
        position: { x: i * 2, y: 0 },
      });
    }
  }

  // Options: which position is the odd one?
  const options: PuzzleOption[] = rng.shuffle(
    elements.map((_, i) => ({
      id: i === oddIdx ? 'opt-correct' : `opt-${i}`,
      label: `Item ${i + 1}`,
      value: i,
    }))
  );

  return {
    id: `ooo-${seed}`, seed,
    category: PuzzleCategory.ODD_ONE_OUT, ageGroup, difficulty,
    cognitiveLoad: [CognitiveDimension.PATTERN_RECOGNITION, CognitiveDimension.ATTENTION_CONTROL],
    elements,
    options,
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: 15 + Math.floor(difficulty * 10),
    maxHints: 3,
    irtParameters: { difficulty: -2 + difficulty * 4, discrimination: 1.2 + difficulty * 0.5, guessing: 1 / count },
    instruction: 'Find the odd one out! 🔍',
    interactionType: 'select' as InteractionType,
  };
}
