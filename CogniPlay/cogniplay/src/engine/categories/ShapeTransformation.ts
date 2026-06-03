import { SeedRandom } from '../SeedRandom';
import {
  AgeGroup, PuzzleCategory, CognitiveDimension,
  Puzzle, PuzzleOption, Grid, PuzzleElement, InteractionType,
} from '../types';

const SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon'];
const TRANSFORMS = ['rotate90', 'rotate180', 'rotate270', 'flipH', 'flipV', 'scale'] as const;
type Transform = typeof TRANSFORMS[number];

function applyTransformToElement(el: PuzzleElement, transform: Transform): PuzzleElement {
  const out = { ...el, position: { ...el.position } };
  switch (transform) {
    case 'rotate90': out.rotation = (out.rotation + 90) % 360; break;
    case 'rotate180': out.rotation = (out.rotation + 180) % 360; break;
    case 'rotate270': out.rotation = (out.rotation + 270) % 360; break;
    case 'flipH': out.position.x = -out.position.x; break;
    case 'flipV': out.position.y = -out.position.y; break;
    case 'scale': out.size = out.size === 1 ? 2 : out.size === 2 ? 3 : 1; break;
  }
  return out;
}

function applyTransformToGrid(grid: Grid, transform: Transform): Grid {
  const { width, height, cells } = grid;
  switch (transform) {
    case 'rotate90': {
      const newCells: number[][] = [];
      for (let x = 0; x < width; x++) {
        const row: number[] = [];
        for (let y = height - 1; y >= 0; y--) row.push(cells[y][x]);
        newCells.push(row);
      }
      return { width: height, height: width, cells: newCells };
    }
    case 'rotate180': {
      const newCells = cells.map(row => [...row].reverse()).reverse();
      return { width, height, cells: newCells };
    }
    case 'flipH': {
      const newCells = cells.map(row => [...row].reverse());
      return { width, height, cells: newCells };
    }
    case 'flipV': {
      const newCells = [...cells].reverse().map(r => [...r]);
      return { width, height, cells: newCells };
    }
    default: return { width, height, cells: cells.map(r => [...r]) };
  }
}

function getTransformLabel(t: Transform): string {
  switch (t) {
    case 'rotate90': return 'Rotated 90°';
    case 'rotate180': return 'Rotated 180°';
    case 'rotate270': return 'Rotated 270°';
    case 'flipH': return 'Flipped horizontally';
    case 'flipV': return 'Flipped vertically';
    case 'scale': return 'Changed size';
  }
}

export function generateShapeTransformation(
  seed: number, ageGroup: AgeGroup, difficulty: number
): Puzzle {
  const rng = new SeedRandom(seed);
  const size = ageGroup === AgeGroup.GROUP_A ? 3 : ageGroup === AgeGroup.GROUP_B ? 3 : 4;
  const paletteSize = ageGroup === AgeGroup.GROUP_A ? 3 : 5;
  const colors = rng.shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, paletteSize);

  // Generate source grid
  const inputCells: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      row.push(rng.nextBool(0.6) ? rng.pick(colors) : 0);
    }
    inputCells.push(row);
  }
  const inputGrid: Grid = { width: size, height: size, cells: inputCells };

  // Pick transforms based on difficulty
  const availableTransforms: Transform[] = difficulty < 0.3
    ? ['rotate90', 'flipH']
    : difficulty < 0.6
      ? ['rotate90', 'rotate180', 'flipH', 'flipV']
      : ['rotate90', 'rotate180', 'rotate270', 'flipH', 'flipV'];

  const correctTransform = rng.pick(availableTransforms);
  const correctGrid = applyTransformToGrid(inputGrid, correctTransform);

  // Generate options
  const correctOption: PuzzleOption = {
    id: 'opt-correct',
    grid: correctGrid,
    label: getTransformLabel(correctTransform),
  };

  const wrongTransforms = availableTransforms.filter(t => t !== correctTransform);
  const distractorOptions: PuzzleOption[] = rng.shuffle(wrongTransforms).slice(0, 3).map((t, i) => ({
    id: `opt-${i}`,
    grid: applyTransformToGrid(inputGrid, t),
    label: getTransformLabel(t),
  }));

  // Ensure we have 3 distractors
  while (distractorOptions.length < 3) {
    const cells = inputGrid.cells.map(r => r.map(c => c === 0 ? rng.pick(colors) : 0));
    distractorOptions.push({
      id: `opt-fill-${distractorOptions.length}`,
      grid: { width: size, height: size, cells },
    });
  }

  const options = rng.shuffle([correctOption, ...distractorOptions]);

  return {
    id: `st-${seed}`,
    seed,
    category: PuzzleCategory.SHAPE_TRANSFORMATION,
    ageGroup,
    difficulty,
    cognitiveLoad: [CognitiveDimension.SPATIAL_INTELLIGENCE, CognitiveDimension.PATTERN_RECOGNITION],
    grid: inputGrid,
    options,
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: ageGroup === AgeGroup.GROUP_A ? 20 : 30,
    maxHints: 3,
    irtParameters: {
      difficulty: -1.5 + difficulty * 3.5,
      discrimination: 1.2 + difficulty * 0.6,
      guessing: 0.25,
    },
    instruction: 'Which grid shows the result of the transformation?',
    interactionType: 'select' as InteractionType,
  };
}
