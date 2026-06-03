import {
  AgeGroup,
  CognitiveDimension,
  Grid,
  InteractionType,
  Puzzle,
  PuzzleCategory,
  PuzzleElement,
  PuzzleOption,
} from './types';
import { SeedRandom } from './SeedRandom';

type PlayTemplate =
  | 'pattern'
  | 'count'
  | 'different'
  | 'sort'
  | 'shadow'
  | 'memory'
  | 'maze'
  | 'next';

type PuzzleDraft = Omit<Puzzle, 'id' | 'seed' | 'category' | 'ageGroup' | 'difficulty' | 'estimatedTimeSeconds' | 'maxHints' | 'irtParameters' | 'interactionType'> & {
  interactionType?: InteractionType;
};

const CATEGORY_LABELS: Record<PuzzleCategory, string> = {
  [PuzzleCategory.PATTERN_COMPLETION]: 'Pattern Play',
  [PuzzleCategory.SHAPE_TRANSFORMATION]: 'Shape Match',
  [PuzzleCategory.REFLECTION_SYMMETRY]: 'Shadow Match',
  [PuzzleCategory.COLOR_LOGIC]: 'Color Play',
  [PuzzleCategory.COUNTING_NUMERACY]: 'Counting Play',
  [PuzzleCategory.ODD_ONE_OUT]: 'Find Different',
  [PuzzleCategory.SEQUENCING]: 'Memory Lights',
  [PuzzleCategory.GRID_REASONING]: 'Picture Match',
  [PuzzleCategory.OBJECT_MOVEMENT]: 'Move the Piece',
  [PuzzleCategory.CLASSIFICATION]: 'Sorting Play',
  [PuzzleCategory.ARC_RULE_DISCOVERY]: 'Pattern Play',
  [PuzzleCategory.MULTI_STEP_REASONING]: 'What Comes Next',
  [PuzzleCategory.LOGICAL_DEDUCTION]: 'What Comes Next',
  [PuzzleCategory.SPATIAL_ASSEMBLY]: 'Shape Island',
  [PuzzleCategory.PATHFINDING]: 'Path Play',
};

const CATEGORY_TEMPLATE: Record<PuzzleCategory, PlayTemplate> = {
  [PuzzleCategory.PATTERN_COMPLETION]: 'pattern',
  [PuzzleCategory.SHAPE_TRANSFORMATION]: 'shadow',
  [PuzzleCategory.REFLECTION_SYMMETRY]: 'shadow',
  [PuzzleCategory.COLOR_LOGIC]: 'pattern',
  [PuzzleCategory.COUNTING_NUMERACY]: 'count',
  [PuzzleCategory.ODD_ONE_OUT]: 'different',
  [PuzzleCategory.SEQUENCING]: 'memory',
  [PuzzleCategory.GRID_REASONING]: 'sort',
  [PuzzleCategory.OBJECT_MOVEMENT]: 'maze',
  [PuzzleCategory.CLASSIFICATION]: 'sort',
  [PuzzleCategory.ARC_RULE_DISCOVERY]: 'pattern',
  [PuzzleCategory.MULTI_STEP_REASONING]: 'next',
  [PuzzleCategory.LOGICAL_DEDUCTION]: 'next',
  [PuzzleCategory.SPATIAL_ASSEMBLY]: 'shadow',
  [PuzzleCategory.PATHFINDING]: 'maze',
};

const TEMPLATE_LOAD: Record<PlayTemplate, CognitiveDimension[]> = {
  pattern: [CognitiveDimension.PATTERN_RECOGNITION, CognitiveDimension.WORKING_MEMORY],
  count: [CognitiveDimension.ATTENTION_CONTROL, CognitiveDimension.LOGICAL_REASONING],
  different: [CognitiveDimension.ATTENTION_CONTROL, CognitiveDimension.PATTERN_RECOGNITION],
  sort: [CognitiveDimension.PATTERN_RECOGNITION, CognitiveDimension.LOGICAL_REASONING],
  shadow: [CognitiveDimension.SPATIAL_INTELLIGENCE, CognitiveDimension.ATTENTION_CONTROL],
  memory: [CognitiveDimension.WORKING_MEMORY, CognitiveDimension.ATTENTION_CONTROL],
  maze: [CognitiveDimension.SPATIAL_INTELLIGENCE, CognitiveDimension.PERSISTENCE],
  next: [CognitiveDimension.LOGICAL_REASONING, CognitiveDimension.PATTERN_RECOGNITION],
};

const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon'];
const SOFT_COLORS = [1, 2, 3, 4, 6, 8];
const SORT_SETS = [
  { group: 'round things', match: 'circle', misses: ['square', 'triangle', 'diamond'] },
  { group: 'pointy things', match: 'triangle', misses: ['circle', 'square', 'hexagon'] },
  { group: 'four-corner things', match: 'square', misses: ['circle', 'triangle', 'star'] },
  { group: 'sparkly things', match: 'star', misses: ['circle', 'square', 'diamond'] },
];
const NEXT_STORIES = [
  { items: ['Seed', 'Sprout', 'Flower'], answer: 'Flower', options: ['Tree', 'Moon', 'Cup'] },
  { items: ['Egg', 'Chick', 'Bird'], answer: 'Bird', options: ['Fish', 'Shoe', 'Star'] },
  { items: ['Morning', 'Sun', 'Night'], answer: 'Night', options: ['Spoon', 'Car', 'Leaf'] },
  { items: ['Small', 'Medium', 'Big'], answer: 'Big', options: ['Tiny', 'Blue', 'Round'] },
];

function clampDifficulty(difficulty: number): number {
  return Math.max(0, Math.min(1, difficulty));
}

function element(type: string, color: number, size = 2, rotation = 0): PuzzleElement {
  return { type, color, size, rotation, position: { x: 0, y: 0 } };
}

function option(id: string, label: string, elements?: PuzzleElement[], grid?: Grid): PuzzleOption {
  return { id, label, elements, grid, value: label };
}

function optionSignature(item: PuzzleOption): string {
  if (item.grid) return `grid:${item.grid.cells.map(row => row.join(',')).join('|')}`;
  if (item.elements?.length) {
    return `elements:${item.elements.map(el => `${el.type}:${el.color}:${el.size}:${el.rotation}`).join('|')}`;
  }
  return `value:${String(item.value ?? item.label ?? item.id)}`;
}

function shuffleOptions(rng: SeedRandom, options: PuzzleOption[]): PuzzleOption[] {
  const genericLabels = new Set(['This one', 'Try this', 'Same', 'Different', 'Belongs', 'Fits', 'Same order']);
  const seen = new Set<string>();
  const deduped = options.map((item, index) => {
    let next = {
      ...item,
      elements: item.elements?.map(el => ({ ...el, position: { ...el.position } })),
      grid: item.grid ? { ...item.grid, cells: item.grid.cells.map(row => [...row]) } : undefined,
    };
    let signature = optionSignature(next);
    let guard = 0;
    while (seen.has(signature) && next.elements?.[0] && guard < 16) {
      const el = next.elements[0];
      next.elements[0] = {
        ...el,
        type: SHAPES[(SHAPES.indexOf(el.type) + guard + index + 1) % SHAPES.length] || el.type,
        color: SOFT_COLORS[(SOFT_COLORS.indexOf(el.color) + guard + index + 1) % SOFT_COLORS.length] || el.color,
      };
      signature = optionSignature(next);
      guard++;
    }
    seen.add(signature);
    return next;
  });
  const shuffled = rng.shuffle(deduped);
  const labelCounts = shuffled.reduce<Record<string, number>>((counts, item) => {
    const label = item.label ?? '';
    counts[label] = (counts[label] ?? 0) + 1;
    return counts;
  }, {});

  return shuffled.map((item, index) => {
    const label = item.label ?? `Choice ${index + 1}`;
    const shouldUseChoiceLabel = genericLabels.has(label) || labelCounts[label] > 1;
    return {
      ...item,
      id: item.id || `opt-${index}`,
      label: shouldUseChoiceLabel ? `Choice ${index + 1}` : label,
    };
  });
}

function basePuzzle(
  seed: number,
  category: PuzzleCategory,
  ageGroup: AgeGroup,
  difficulty: number,
  partial: PuzzleDraft,
): Puzzle {
  const safeDifficulty = clampDifficulty(difficulty);
  return {
    id: `play-${category}-${seed}`,
    seed,
    category,
    ageGroup,
    difficulty: safeDifficulty,
    estimatedTimeSeconds: 45,
    maxHints: 3,
    irtParameters: {
      difficulty: -2.2 + safeDifficulty * 1.2,
      discrimination: 0.8,
      guessing: 0.25,
    },
    interactionType: 'select' as InteractionType,
    ...partial,
  };
}

function generatePattern(seed: number, category: PuzzleCategory, ageGroup: AgeGroup, difficulty: number, rng: SeedRandom): Puzzle {
  const shapeA = rng.pick(SHAPES);
  let shapeB = rng.pick(SHAPES);
  if (shapeB === shapeA) shapeB = 'square';
  const colorA = rng.pick(SOFT_COLORS);
  let colorB = rng.pick(SOFT_COLORS);
  if (colorB === colorA) colorB = 4;
  const useShapePattern = rng.next() > 0.45;
  const first = element(shapeA, colorA);
  const second = element(useShapePattern ? shapeB : shapeA, useShapePattern ? colorA : colorB);
  const answer = rng.next() > 0.5 ? first : second;
  const visible = [first, second, first, second, element('hole', 0)];

  const distractorA = element(answer.type === shapeA ? shapeB : shapeA, answer.color);
  const distractorB = element(answer.type, answer.color === colorA ? colorB : colorA);
  const distractorC = element(rng.pick(SHAPES), rng.pick(SOFT_COLORS));
  const options = shuffleOptions(rng, [
    option('opt-correct', 'This one', [answer]),
    option('opt-a', 'Try this', [distractorA]),
    option('opt-b', 'Try this', [distractorB]),
    option('opt-c', 'Try this', [distractorC]),
  ]);

  return basePuzzle(seed, category, ageGroup, difficulty, {
    cognitiveLoad: TEMPLATE_LOAD.pattern,
    interactionType: 'drag_drop',
    instruction: 'What fits in the empty spot?',
    elements: visible,
    options,
    correctAnswer: 'opt-correct',
  });
}

function generateCounting(seed: number, category: PuzzleCategory, ageGroup: AgeGroup, difficulty: number, rng: SeedRandom): Puzzle {
  const count = rng.nextInt(2, difficulty > 0.65 ? 8 : 6);
  const shape = rng.pick(['circle', 'square', 'star']);
  const color = rng.pick(SOFT_COLORS);
  const elements = Array.from({ length: count }, () => element(shape, color));
  const numbers = new Set([count]);
  while (numbers.size < 4) numbers.add(Math.max(1, count + rng.nextInt(-2, 3)));

  return basePuzzle(seed, category, ageGroup, difficulty, {
    cognitiveLoad: TEMPLATE_LOAD.count,
    interactionType: 'drag_drop',
    instruction: 'How many can you count?',
    elements,
    options: shuffleOptions(rng, Array.from(numbers).map(n => option(n === count ? 'opt-correct' : `opt-${n}`, String(n)))),
    correctAnswer: 'opt-correct',
  });
}

function generateDifferent(seed: number, category: PuzzleCategory, ageGroup: AgeGroup, difficulty: number, rng: SeedRandom): Puzzle {
  const commonShape = rng.pick(['circle', 'square', 'triangle', 'diamond']);
  const oddShape = rng.pick(SHAPES.filter(s => s !== commonShape));
  const color = rng.pick(SOFT_COLORS);
  const oddColor = rng.pick(SOFT_COLORS.filter(c => c !== color));
  const oddByShape = rng.next() > 0.35;
  const common = element(commonShape, color);
  const odd = element(oddByShape ? oddShape : commonShape, oddByShape ? color : oddColor);
  const scene = rng.shuffle([common, common, common, odd]);

  return basePuzzle(seed, category, ageGroup, difficulty, {
    cognitiveLoad: TEMPLATE_LOAD.different,
    interactionType: 'drag_drop',
    instruction: 'Which one is different?',
    elements: scene,
    options: shuffleOptions(rng, [
      option('opt-correct', 'Different', [odd]),
      option('opt-a', 'Same', [common]),
      option('opt-b', 'Same', [element(commonShape, color)]),
      option('opt-c', 'Same', [element(commonShape, color)]),
    ]),
    correctAnswer: 'opt-correct',
  });
}

function generateSort(seed: number, category: PuzzleCategory, ageGroup: AgeGroup, difficulty: number, rng: SeedRandom): Puzzle {
  const set = rng.pick(SORT_SETS);
  const color = rng.pick(SOFT_COLORS);
  const group = [element(set.match, color), element(set.match, color), element(set.match, color)];
  const misses = rng.shuffle(set.misses).slice(0, 3).map((shape, i) => element(shape, SOFT_COLORS[i]));

  return basePuzzle(seed, category, ageGroup, difficulty, {
    cognitiveLoad: TEMPLATE_LOAD.sort,
    interactionType: 'drag_drop',
    instruction: `Which one belongs with the ${set.group}?`,
    elements: group,
    options: shuffleOptions(rng, [
      option('opt-correct', 'Belongs', [element(set.match, color)]),
      option('opt-a', 'Try this', [misses[0]]),
      option('opt-b', 'Try this', [misses[1]]),
      option('opt-c', 'Try this', [misses[2]]),
    ]),
    correctAnswer: 'opt-correct',
  });
}

function generateShadow(seed: number, category: PuzzleCategory, ageGroup: AgeGroup, difficulty: number, rng: SeedRandom): Puzzle {
  const targetShape = rng.pick(['circle', 'square', 'triangle', 'diamond', 'hexagon']);
  const targetRotation = targetShape === 'circle' ? 0 : rng.pick([0, 45, 90]);
  const color = rng.pick(SOFT_COLORS);
  const shadow = element(targetShape, 5, 2, targetRotation);
  const target = element(targetShape, color, 2, targetRotation);
  const wrongShapes = rng.shuffle(SHAPES.filter(shape => shape !== targetShape)).slice(0, 3);

  return basePuzzle(seed, category, ageGroup, difficulty, {
    cognitiveLoad: TEMPLATE_LOAD.shadow,
    interactionType: 'drag_drop',
    instruction: 'Which piece fits the shadow?',
    elements: [shadow],
    options: shuffleOptions(rng, [
      option('opt-correct', 'Fits', [target]),
      option('opt-a', 'Try this', [element(wrongShapes[0], color)]),
      option('opt-b', 'Try this', [element(wrongShapes[1], rng.pick(SOFT_COLORS))]),
      option('opt-c', 'Try this', [element(wrongShapes[2], rng.pick(SOFT_COLORS))]),
    ]),
    correctAnswer: 'opt-correct',
  });
}

function generateMemory(seed: number, category: PuzzleCategory, ageGroup: AgeGroup, difficulty: number, rng: SeedRandom): Puzzle {
  const length = difficulty > 0.7 ? 4 : 3;
  const colors = rng.shuffle(SOFT_COLORS).slice(0, length);
  const sequence = colors.map(color => element('circle', color));
  const wrong = rng.shuffle([...colors]).reverse();
  if (wrong.join('-') === colors.join('-')) wrong.push(wrong.shift()!);

  return basePuzzle(seed, category, ageGroup, difficulty, {
    cognitiveLoad: TEMPLATE_LOAD.memory,
    instruction: 'Tap the same light order.',
    elements: sequence,
    options: shuffleOptions(rng, [
      option('opt-correct', 'Same order', colors.map(color => element('circle', color))),
      option('opt-a', 'Try this', wrong.map(color => element('circle', color))),
      option('opt-b', 'Try this', colors.map(color => element('square', color))),
      option('opt-c', 'Try this', rng.shuffle(SOFT_COLORS).slice(0, length).map(color => element('circle', color))),
    ]),
    correctAnswer: 'opt-correct',
  });
}

function makeMazeGrid(size: number, rng: SeedRandom): Grid {
  const wall = 5;
  const path = 0;
  const cells = Array.from({ length: size }, () => Array(size).fill(wall));
  const start: [number, number] = [1, 1];
  const stack: [number, number][] = [start];
  cells[start[0]][start[1]] = path;
  const directions: [number, number][] = [[0, 2], [2, 0], [0, -2], [-2, 0]];

  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const neighbors = rng.shuffle(directions)
      .map(([dr, dc]) => [r + dr, c + dc, dr, dc] as const)
      .filter(([nr, nc]) => nr > 0 && nc > 0 && nr < size - 1 && nc < size - 1 && cells[nr][nc] === wall);

    if (!neighbors.length) {
      stack.pop();
      continue;
    }

    const [nr, nc, dr, dc] = neighbors[0];
    cells[r + dr / 2][c + dc / 2] = path;
    cells[nr][nc] = path;
    stack.push([nr, nc]);
  }

  cells[1][1] = 3;
  cells[size - 2][size - 2] = 2;
  return { width: size, height: size, cells };
}

function generateMaze(seed: number, category: PuzzleCategory, ageGroup: AgeGroup, difficulty: number, rng: SeedRandom): Puzzle {
  const size = difficulty > 0.55 ? 15 : 13;

  return basePuzzle(seed, category, ageGroup, difficulty, {
    cognitiveLoad: TEMPLATE_LOAD.maze,
    interactionType: 'trace_maze',
    instruction: 'Trace from the green start to the home. Stay inside the path.',
    grid: makeMazeGrid(size, rng),
    options: [],
    correctAnswer: 'opt-correct',
  });
}

function generateNext(seed: number, category: PuzzleCategory, ageGroup: AgeGroup, difficulty: number, rng: SeedRandom): Puzzle {
  const story = rng.pick(NEXT_STORIES);
  const visible = story.items.slice(0, 2).map((label, i) => option(`scene-${i}`, label));

  return basePuzzle(seed, category, ageGroup, difficulty, {
    cognitiveLoad: TEMPLATE_LOAD.next,
    instruction: `What comes next? ${story.items[0]} → ${story.items[1]} → ?`,
    options: shuffleOptions(rng, [
      option('opt-correct', story.answer),
      ...story.options.map((label, i) => option(`opt-${i}`, label)),
    ]),
    correctAnswer: 'opt-correct',
    elements: visible.map((_, i) => element(i === 0 ? 'circle' : 'triangle', SOFT_COLORS[i])),
  });
}

/** Generate one preschool-safe play puzzle for any category. */
export function generatePuzzle(
  category: PuzzleCategory,
  ageGroup: AgeGroup,
  difficulty: number,
  seed?: number,
): Puzzle {
  const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);
  const rng = new SeedRandom(actualSeed);
  const template = CATEGORY_TEMPLATE[category] ?? 'pattern';

  switch (template) {
    case 'count': return generateCounting(actualSeed, category, ageGroup, difficulty, rng);
    case 'different': return generateDifferent(actualSeed, category, ageGroup, difficulty, rng);
    case 'sort': return generateSort(actualSeed, category, ageGroup, difficulty, rng);
    case 'shadow': return generateShadow(actualSeed, category, ageGroup, difficulty, rng);
    case 'memory': return generateMemory(actualSeed, category, ageGroup, difficulty, rng);
    case 'maze': return generateMaze(actualSeed, category, ageGroup, difficulty, rng);
    case 'next': return generateNext(actualSeed, category, ageGroup, difficulty, rng);
    case 'pattern':
    default:
      return generatePattern(actualSeed, category, ageGroup, difficulty, rng);
  }
}

/** Generate a set of safe play puzzles with optional filters. */
export function generatePuzzleSet(
  count: number,
  ageGroup: AgeGroup,
  categories?: PuzzleCategory[],
  difficulty?: number,
): Puzzle[] {
  const rng = new SeedRandom(Date.now());
  const pool = categories ?? getCategoriesForAge(ageGroup);
  return Array.from({ length: count }, (_, index) => {
    const category = pool[index % pool.length];
    const diff = difficulty ?? rng.nextFloat(0.15, 0.55);
    return generatePuzzle(category, ageGroup, diff, rng.nextInt(1, 2147483647));
  });
}

/** Get a child-facing label for a puzzle category. */
export function getCategoryLabel(category: PuzzleCategory): string {
  return CATEGORY_LABELS[category] ?? 'Play';
}

/** Get categories appropriate for an age group. The engine keeps all of them preschool-safe. */
export function getCategoriesForAge(ageGroup: AgeGroup): PuzzleCategory[] {
  if (ageGroup === AgeGroup.GROUP_A) {
    return [
      PuzzleCategory.PATTERN_COMPLETION,
      PuzzleCategory.COUNTING_NUMERACY,
      PuzzleCategory.ODD_ONE_OUT,
      PuzzleCategory.CLASSIFICATION,
      PuzzleCategory.SEQUENCING,
      PuzzleCategory.SPATIAL_ASSEMBLY,
      PuzzleCategory.PATHFINDING,
      PuzzleCategory.MULTI_STEP_REASONING,
    ];
  }

  return Object.values(PuzzleCategory);
}
