import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, Grid, InteractionType } from '../types';
import { ensureUniqueOptions } from './gridUtils';

type GridRule = 'fill_color' | 'swap_rows' | 'mirror_h' | 'rotate_cw' | 'gravity' | 'border';

function applyGridRule(grid: Grid, rule: GridRule, rng: SeedRandom): Grid {
  const { width, height, cells } = grid;
  const out = cells.map(r => [...r]);

  switch (rule) {
    case 'fill_color': {
      const target = 0;
      const fill = rng.nextInt(1, 5);
      for (let r = 0; r < height; r++)
        for (let c = 0; c < width; c++)
          if (out[r][c] === target) out[r][c] = fill;
      return { width, height, cells: out };
    }
    case 'swap_rows': {
      if (height >= 2) [out[0], out[height - 1]] = [out[height - 1], out[0]];
      return { width, height, cells: out };
    }
    case 'mirror_h': {
      return { width, height, cells: out.map(r => [...r].reverse()) };
    }
    case 'rotate_cw': {
      const rotated: number[][] = [];
      for (let c = 0; c < width; c++) {
        const row: number[] = [];
        for (let r = height - 1; r >= 0; r--) row.push(cells[r][c]);
        rotated.push(row);
      }
      return { width: height, height: width, cells: rotated };
    }
    case 'gravity': {
      // Non-zero cells fall to bottom
      for (let c = 0; c < width; c++) {
        const col = [];
        for (let r = 0; r < height; r++) if (out[r][c] !== 0) col.push(out[r][c]);
        for (let r = 0; r < height; r++) {
          const fillIdx = r - (height - col.length);
          out[r][c] = fillIdx >= 0 ? col[fillIdx] : 0;
        }
      }
      return { width, height, cells: out };
    }
    case 'border': {
      const borderColor = rng.nextInt(1, 5);
      for (let r = 0; r < height; r++)
        for (let c = 0; c < width; c++)
          if (r === 0 || r === height - 1 || c === 0 || c === width - 1)
            out[r][c] = borderColor;
      return { width, height, cells: out };
    }
  }
}

function makeRandomGrid(size: number, rng: SeedRandom, maxColor: number): Grid {
  const cells: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) row.push(rng.nextBool(0.55) ? rng.nextInt(1, maxColor) : 0);
    cells.push(row);
  }
  return { width: size, height: size, cells };
}

export function generateGridReasoning(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);
  const size = ageGroup === AgeGroup.GROUP_A ? 2 : difficulty < 0.5 ? 3 : 4;
  const maxColor = ageGroup === AgeGroup.GROUP_A ? 3 : 5;

  const rulesPool: GridRule[] = difficulty < 0.3
    ? ['fill_color', 'border']
    : difficulty < 0.6
      ? ['swap_rows', 'mirror_h', 'fill_color', 'gravity']
      : ['rotate_cw', 'gravity', 'mirror_h', 'swap_rows'];

  const rule = rng.pick(rulesPool);

  // Generate example pairs
  const examples: { input: Grid; output: Grid }[] = [];
  for (let i = 0; i < 2; i++) {
    const inp = makeRandomGrid(size, rng, maxColor);
    examples.push({ input: inp, output: applyGridRule(inp, rule, rng) });
  }

  // Generate test input
  const testInput = makeRandomGrid(size, rng, maxColor);
  const correctGrid = applyGridRule(testInput, rule, rng);

  const correctOption: PuzzleOption = { id: 'opt-correct', grid: correctGrid };

  // Distractors: apply wrong rules and fallback to random grids
  const otherRules = rulesPool.filter(r => r !== rule);
  const distractorCandidates: Grid[] = [];
  
  // Try applying other rules
  for (const r of otherRules) {
    distractorCandidates.push(applyGridRule(testInput, r, rng));
  }
  
  // Generate random grids as fallback
  for (let i = 0; i < 10; i++) {
    distractorCandidates.push(makeRandomGrid(size, rng, maxColor));
  }
  
  const uniqueDistractorGrids = ensureUniqueOptions(correctGrid, distractorCandidates);
  
  const distractors: PuzzleOption[] = uniqueDistractorGrids.map((grid, i) => ({
    id: `opt-${i}`,
    grid
  }));

  return {
    id: `gr-${seed}`, seed,
    category: PuzzleCategory.GRID_REASONING, ageGroup, difficulty,
    cognitiveLoad: [CognitiveDimension.LOGICAL_REASONING, CognitiveDimension.SPATIAL_INTELLIGENCE, CognitiveDimension.WORKING_MEMORY],
    grid: testInput,
    examplePairs: examples,
    testInput,
    options: rng.shuffle([correctOption, ...distractors]),
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: 30 + Math.floor(difficulty * 20),
    maxHints: 3,
    irtParameters: { difficulty: -1 + difficulty * 4, discrimination: 1.5 + difficulty * 0.5, guessing: 0.25 },
    instruction: 'Look at how the first grids change. What should the last grid look like?',
    interactionType: 'select' as InteractionType,
  };
}
