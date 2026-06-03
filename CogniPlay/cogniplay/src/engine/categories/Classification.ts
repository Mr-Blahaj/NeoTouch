import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, PuzzleElement, InteractionType } from '../types';

const SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon'];

export function generateClassification(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);
  const groupCount = difficulty < 0.4 ? 2 : 3;
  const itemsPerGroup = ageGroup === AgeGroup.GROUP_A ? 2 : 3;

  // Build groups by a shared attribute
  type GroupDef = { shape: string; color: number; label: string };
  const groups: GroupDef[] = [];
  const usedShapes = rng.shuffle(SHAPES);
  const usedColors = rng.shuffle([1, 2, 3, 4, 5, 6]);

  const attr = difficulty < 0.3 ? 'shape' : difficulty < 0.6 ? 'color' : 'both';

  for (let g = 0; g < groupCount; g++) {
    groups.push({
      shape: attr !== 'color' ? usedShapes[g] : rng.pick(SHAPES),
      color: attr !== 'shape' ? usedColors[g] : rng.nextInt(1, 6),
      label: attr === 'shape' ? `All ${usedShapes[g]}s` : attr === 'color' ? `Color group ${g + 1}` : `Group ${g + 1}`,
    });
  }

  // Generate items
  const allElements: PuzzleElement[] = [];
  const correctGrouping: number[] = [];

  for (let g = 0; g < groupCount; g++) {
    for (let i = 0; i < itemsPerGroup; i++) {
      allElements.push({
        type: groups[g].shape,
        color: groups[g].color,
        size: rng.pick([1, 2]),
        rotation: 0,
        position: { x: (g * itemsPerGroup + i) * 2, y: 0 },
      });
      correctGrouping.push(g);
    }
  }

  // Shuffle elements (but track correct grouping)
  const indices = allElements.map((_, i) => i);
  const shuffledIndices = rng.shuffle(indices);
  const shuffledElements = shuffledIndices.map(i => allElements[i]);
  const shuffledGrouping = shuffledIndices.map(i => correctGrouping[i]);

  // Test: which group does a specific item belong to?
  const testIdx = rng.nextInt(0, shuffledElements.length - 1);
  const testElement = shuffledElements[testIdx];
  const correctGroup = shuffledGrouping[testIdx];

  const options: PuzzleOption[] = groups.map((g, i) => ({
    id: i === correctGroup ? 'opt-correct' : `opt-${i}`,
    label: g.label,
    value: i,
  }));

  // Add a random wrong option if only 2 groups
  if (groupCount === 2) {
    options.push({
      id: 'opt-none',
      label: 'None of the groups',
      value: -1,
    });
  }

  return {
    id: `cls-${seed}`, seed,
    category: PuzzleCategory.CLASSIFICATION, ageGroup, difficulty,
    cognitiveLoad: [CognitiveDimension.LOGICAL_REASONING, CognitiveDimension.PATTERN_RECOGNITION],
    elements: shuffledElements,
    options: rng.shuffle(options),
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: 20 + Math.floor(difficulty * 15),
    maxHints: 3,
    irtParameters: { difficulty: -1.5 + difficulty * 3.5, discrimination: 1.2, guessing: 1 / options.length },
    instruction: `Which group does the highlighted item belong to?`,
    interactionType: 'select' as InteractionType,
  };
}
