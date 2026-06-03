import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, Grid, InteractionType } from '../types';

export function generateObjectMovement(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);
  const gridSize = ageGroup === AgeGroup.GROUP_A ? 4 : difficulty < 0.5 ? 5 : 6;
  const objColor = rng.nextInt(1, 6);
  const steps = ageGroup === AgeGroup.GROUP_A ? 2 : rng.nextInt(2, 4);

  // Place object
  let x = rng.nextInt(1, gridSize - 2);
  let y = rng.nextInt(1, gridSize - 2);

  // Generate movement directions
  const dirs: [number, number, string][] = [[0, -1, '⬆️'], [0, 1, '⬇️'], [-1, 0, '⬅️'], [1, 0, '➡️']];
  const moves: string[] = [];
  const positions: [number, number][] = [[x, y]];

  for (let i = 0; i < steps; i++) {
    const validDirs = dirs.filter(([dx, dy]) =>
      x + dx >= 0 && x + dx < gridSize && y + dy >= 0 && y + dy < gridSize
    );
    const [dx, dy, arrow] = rng.pick(validDirs);
    x += dx;
    y += dy;
    moves.push(arrow);
    positions.push([x, y]);
  }

  // Build initial grid
  const cells: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
  cells[positions[0][1]][positions[0][0]] = objColor;
  const startGrid: Grid = { width: gridSize, height: gridSize, cells };

  // Build result grid  
  const correctCells = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
  correctCells[y][x] = objColor;
  const correctGrid: Grid = { width: gridSize, height: gridSize, cells: correctCells };

  const correctOption: PuzzleOption = { id: 'opt-correct', grid: correctGrid };

  // Distractors: wrong positions
  const distractors: PuzzleOption[] = [];
  const usedPos = new Set([`${x},${y}`]);

  for (let i = 0; i < 3; i++) {
    let wx: number, wy: number;
    do {
      wx = rng.nextInt(0, gridSize - 1);
      wy = rng.nextInt(0, gridSize - 1);
    } while (usedPos.has(`${wx},${wy}`));
    usedPos.add(`${wx},${wy}`);

    const dc = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    dc[wy][wx] = objColor;
    distractors.push({ id: `opt-${i}`, grid: { width: gridSize, height: gridSize, cells: dc } });
  }

  return {
    id: `om-${seed}`, seed,
    category: PuzzleCategory.OBJECT_MOVEMENT, ageGroup, difficulty,
    cognitiveLoad: [CognitiveDimension.SPATIAL_INTELLIGENCE, CognitiveDimension.WORKING_MEMORY],
    grid: startGrid,
    options: rng.shuffle([correctOption, ...distractors]),
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: 20 + steps * 5,
    maxHints: 3,
    irtParameters: { difficulty: -1.5 + difficulty * 3.5, discrimination: 1.3, guessing: 0.25 },
    instruction: `Move the colored cell: ${moves.join(' ')}. Where does it end up?`,
    interactionType: 'select' as InteractionType,
  };
}
