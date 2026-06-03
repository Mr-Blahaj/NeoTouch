import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, Grid, InteractionType } from '../types';

export function generateMultiStepReasoning(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);
  const size = difficulty < 0.5 ? 3 : 4;
  const stepCount = difficulty < 0.3 ? 2 : difficulty < 0.7 ? 3 : 4;
  const maxC = 5;

  type Step = 'rotate' | 'mirror' | 'recolor' | 'invert';
  const stepPool: Step[] = ['rotate', 'mirror', 'recolor', 'invert'];
  const steps: Step[] = [];
  for (let i = 0; i < stepCount; i++) steps.push(rng.pick(stepPool));

  function applyStep(g: Grid, step: Step): Grid {
    const { width, height, cells } = g;
    switch (step) {
      case 'rotate': {
        const r: number[][] = [];
        for (let c = 0; c < width; c++) {
          const row: number[] = [];
          for (let rr = height - 1; rr >= 0; rr--) row.push(cells[rr][c]);
          r.push(row);
        }
        return { width: height, height: width, cells: r };
      }
      case 'mirror': return { width, height, cells: cells.map(r => [...r].reverse()) };
      case 'recolor': {
        const from = rng.nextInt(1, maxC); const to = rng.nextInt(1, maxC);
        return { width, height, cells: cells.map(r => r.map(c => c === from ? to : c)) };
      }
      case 'invert': {
        const fc = rng.nextInt(1, maxC);
        return { width, height, cells: cells.map(r => r.map(c => c === 0 ? fc : 0)) };
      }
    }
  }

  // Generate input
  const inputCells: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) row.push(rng.nextBool(0.5) ? rng.nextInt(1, maxC) : 0);
    inputCells.push(row);
  }
  let current: Grid = { width: size, height: size, cells: inputCells };

  // Apply all steps
  for (const step of steps) current = applyStep(current, step);
  const correctGrid = current;

  // Generate example
  const exCells: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) row.push(rng.nextBool(0.5) ? rng.nextInt(1, maxC) : 0);
    exCells.push(row);
  }
  let exResult: Grid = { width: size, height: size, cells: exCells };
  for (const step of steps) exResult = applyStep(exResult, step);

  const stepLabels = steps.map(s => {
    switch (s) {
      case 'rotate': return '🔄 Rotate 90°';
      case 'mirror': return '🪞 Mirror';
      case 'recolor': return '🎨 Recolor';
      case 'invert': return '🔀 Invert';
    }
  });

  const correctOption: PuzzleOption = { id: 'opt-correct', grid: correctGrid };
  // Distractors: apply only some steps, or wrong order
  const distractors: PuzzleOption[] = [];
  // Only first N-1 steps
  let partial: Grid = { width: size, height: size, cells: inputCells.map(r => [...r]) };
  for (let i = 0; i < steps.length - 1; i++) partial = applyStep(partial, steps[i]);
  distractors.push({ id: 'opt-0', grid: partial });

  // Reverse order
  let reversed: Grid = { width: size, height: size, cells: inputCells.map(r => [...r]) };
  for (let i = steps.length - 1; i >= 0; i--) reversed = applyStep(reversed, steps[i]);
  distractors.push({ id: 'opt-1', grid: reversed });

  // Random
  const randCells: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) row.push(rng.nextBool(0.5) ? rng.nextInt(1, maxC) : 0);
    randCells.push(row);
  }
  distractors.push({ id: 'opt-2', grid: { width: size, height: size, cells: randCells } });

  return {
    id: `msr-${seed}`, seed,
    category: PuzzleCategory.MULTI_STEP_REASONING, ageGroup, difficulty,
    cognitiveLoad: [CognitiveDimension.WORKING_MEMORY, CognitiveDimension.LOGICAL_REASONING],
    grid: { width: size, height: size, cells: inputCells },
    examplePairs: [{ input: { width: size, height: size, cells: exCells }, output: exResult }],
    testInput: { width: size, height: size, cells: inputCells },
    options: rng.shuffle([correctOption, ...distractors]),
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: 30 + stepCount * 10,
    maxHints: 3,
    irtParameters: { difficulty: difficulty * 4 - 0.5, discrimination: 1.6, guessing: 0.25 },
    instruction: `Apply these steps in order:\n${stepLabels.join(' → ')}`,
    interactionType: 'select' as InteractionType,
  };
}
