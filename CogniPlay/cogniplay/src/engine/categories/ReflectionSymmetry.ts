import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, Grid, InteractionType } from '../types';

function mirrorGridHorizontal(grid: Grid): Grid {
  return { width: grid.width, height: grid.height, cells: grid.cells.map(r => [...r].reverse()) };
}

function mirrorGridVertical(grid: Grid): Grid {
  return { width: grid.width, height: grid.height, cells: [...grid.cells].reverse().map(r => [...r]) };
}

export function generateReflectionSymmetry(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);
  const size = ageGroup === AgeGroup.GROUP_A ? 4 : ageGroup === AgeGroup.GROUP_B ? 4 : 6;
  const half = size / 2;
  const colors = rng.shuffle([1, 2, 3, 4, 5, 6]).slice(0, 4);
  const isHorizontal = difficulty < 0.5 ? true : rng.nextBool();

  // Generate one half
  const fullCells: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      if (isHorizontal ? c < half : r < half) {
        row.push(rng.nextBool(0.5) ? rng.pick(colors) : 0);
      } else {
        row.push(0);
      }
    }
    fullCells.push(row);
  }

  // Fill the mirror side (this is the correct answer)
  const correctCells = fullCells.map(r => [...r]);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isHorizontal ? c >= half : r >= half) {
        const srcR = isHorizontal ? r : size - 1 - r;
        const srcC = isHorizontal ? size - 1 - c : c;
        correctCells[r][c] = fullCells[srcR][srcC];
      }
    }
  }

  const puzzleGrid: Grid = { width: size, height: size, cells: fullCells };
  const correctGrid: Grid = { width: size, height: size, cells: correctCells };

  // Generate options - the correct completed grid + distractors
  const correctOption: PuzzleOption = { id: 'opt-correct', grid: correctGrid };

  const distractors: PuzzleOption[] = [];
  // Distractor 1: wrong axis mirror
  const wrongMirror = correctCells.map(r => [...r]);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isHorizontal ? c >= half : r >= half) {
        wrongMirror[r][c] = fullCells[r][isHorizontal ? c : size - 1 - c] || rng.pick(colors);
      }
    }
  }
  distractors.push({ id: 'opt-0', grid: { width: size, height: size, cells: wrongMirror } });

  // Distractor 2: same as source (no mirror)
  const noMirror = fullCells.map(r => [...r]);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isHorizontal ? c >= half : r >= half) {
        noMirror[r][c] = fullCells[r][c < half ? c : c - half] || 0;
      }
    }
  }
  distractors.push({ id: 'opt-1', grid: { width: size, height: size, cells: noMirror } });

  // Distractor 3: random fill
  const randomFill = fullCells.map(r => [...r]);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isHorizontal ? c >= half : r >= half) {
        randomFill[r][c] = rng.nextBool(0.5) ? rng.pick(colors) : 0;
      }
    }
  }
  distractors.push({ id: 'opt-2', grid: { width: size, height: size, cells: randomFill } });

  return {
    id: `rs-${seed}`, seed,
    category: PuzzleCategory.REFLECTION_SYMMETRY, ageGroup, difficulty,
    cognitiveLoad: [CognitiveDimension.SPATIAL_INTELLIGENCE, CognitiveDimension.ATTENTION_CONTROL],
    grid: puzzleGrid,
    options: rng.shuffle([correctOption, ...distractors]),
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: 20 + Math.floor(difficulty * 15),
    maxHints: 3,
    irtParameters: { difficulty: -1.5 + difficulty * 3, discrimination: 1.3, guessing: 0.25 },
    instruction: isHorizontal
      ? 'Complete the mirror image! (left ↔ right)'
      : 'Complete the mirror image! (top ↔ bottom)',
    interactionType: 'select' as InteractionType,
  };
}
