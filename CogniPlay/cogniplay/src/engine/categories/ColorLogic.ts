import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, Grid, InteractionType } from '../types';
import { ensureUniqueOptions } from './gridUtils';

type ColorRule = { type: 'replace'; from: number; to: number }
  | { type: 'swap'; a: number; b: number }
  | { type: 'conditional'; trigger: number; result: number };

function applyColorRule(grid: Grid, rule: ColorRule): Grid {
  const cells = grid.cells.map(r => r.map(c => {
    switch (rule.type) {
      case 'replace': return c === rule.from ? rule.to : c;
      case 'swap': return c === rule.a ? rule.b : c === rule.b ? rule.a : c;
      case 'conditional': return c === rule.trigger ? rule.result : c;
    }
  }));
  return { width: grid.width, height: grid.height, cells };
}

function applyWrongRule(grid: Grid, rule: ColorRule, rng: SeedRandom): Grid {
  const colors = [1, 2, 3, 4, 5, 6, 7];
  const wrongRule: ColorRule = rule.type === 'replace'
    ? { type: 'replace', from: rule.from, to: rng.pick(colors.filter(c => c !== rule.to)) }
    : rule.type === 'swap'
      ? { type: 'swap', a: rule.a, b: rng.pick(colors.filter(c => c !== rule.b && c !== rule.a)) }
      : { type: 'conditional', trigger: rule.trigger, result: rng.pick(colors.filter(c => c !== rule.result)) };
  return applyColorRule(grid, wrongRule);
}

export function generateColorLogic(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);
  const size = ageGroup === AgeGroup.GROUP_A ? 3 : 4;
  const colors = rng.shuffle([1, 2, 3, 4, 5, 6]).slice(0, 4);

  // Pick rule type based on difficulty
  const rule: ColorRule = difficulty < 0.35
    ? { type: 'replace', from: rng.pick(colors), to: rng.pick(colors.filter(c => c !== colors[0])) }
    : difficulty < 0.7
      ? { type: 'swap', a: colors[0], b: colors[1] }
      : { type: 'conditional', trigger: colors[0], result: colors[2] };

  // Generate example pairs
  const examples: { input: Grid; output: Grid }[] = [];
  for (let e = 0; e < 2; e++) {
    const exCells: number[][] = [];
    for (let r = 0; r < size; r++) {
      const row: number[] = [];
      for (let c = 0; c < size; c++) row.push(rng.pick(colors));
      exCells.push(row);
    }
    const exIn: Grid = { width: size, height: size, cells: exCells };
    examples.push({ input: exIn, output: applyColorRule(exIn, rule) });
  }

  // Generate test input
  const testCells: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) row.push(rng.pick(colors));
    testCells.push(row);
  }
  const testGrid: Grid = { width: size, height: size, cells: testCells };
  const correctGrid = applyColorRule(testGrid, rule);

  const correctOption: PuzzleOption = { id: 'opt-correct', grid: correctGrid };
  
  const distractorCandidates: Grid[] = [];
  for (let i = 0; i < 5; i++) {
    distractorCandidates.push(applyWrongRule(testGrid, rule, rng));
  }
  distractorCandidates.push({ ...testGrid, cells: testGrid.cells.map(r => [...r]) }); // unchanged grid
  
  const uniqueDistractorGrids = ensureUniqueOptions(correctGrid, distractorCandidates);
  const distractors: PuzzleOption[] = uniqueDistractorGrids.map((grid, i) => ({
    id: `opt-${i}`,
    grid
  }));

  return {
    id: `cl-${seed}`, seed,
    category: PuzzleCategory.COLOR_LOGIC, ageGroup, difficulty,
    cognitiveLoad: [CognitiveDimension.LOGICAL_REASONING, CognitiveDimension.PATTERN_RECOGNITION],
    grid: testGrid,
    examplePairs: examples,
    testInput: testGrid,
    options: rng.shuffle([correctOption, ...distractors]),
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: 25 + Math.floor(difficulty * 15),
    maxHints: 3,
    irtParameters: { difficulty: -1 + difficulty * 3, discrimination: 1.4, guessing: 0.25 },
    instruction: 'Figure out the secret color change! Apply it to the bottom grid.',
    interactionType: 'select' as InteractionType,
  };
}
