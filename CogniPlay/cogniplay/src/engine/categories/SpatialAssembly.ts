import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, PuzzleElement, InteractionType } from '../types';

export function generateSpatialAssembly(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);

  // Target shapes composed of unit cells in a grid
  type Piece = { cells: [number, number][]; color: number };
  const gridSize = difficulty < 0.3 ? 3 : difficulty < 0.6 ? 4 : 5;

  // Generate target shape: a connected region
  const target: Set<string> = new Set();
  const startR = Math.floor(gridSize / 2);
  const startC = Math.floor(gridSize / 2);
  target.add(`${startR},${startC}`);

  const cellCount = ageGroup === AgeGroup.GROUP_A ? 4 : ageGroup === AgeGroup.GROUP_B ? 6 : 8;
  while (target.size < cellCount) {
    const cells = [...target];
    const base = rng.pick(cells);
    const [br, bc] = base.split(',').map(Number);
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    const [dr, dc] = rng.pick(dirs);
    const nr = br + dr;
    const nc = bc + dc;
    if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
      target.add(`${nr},${nc}`);
    }
  }

  const targetCells = [...target].map(s => s.split(',').map(Number) as [number, number]);

  // Split into pieces
  const pieceCount = ageGroup === AgeGroup.GROUP_A ? 2 : difficulty < 0.5 ? 3 : 4;
  const pieces: Piece[] = [];
  const remaining = [...targetCells];
  const colors = rng.shuffle([1, 2, 3, 4, 5, 6]);

  for (let p = 0; p < pieceCount - 1 && remaining.length > pieceCount - p; p++) {
    const pieceCells: [number, number][] = [];
    const count = Math.max(1, Math.floor(remaining.length / (pieceCount - p)));
    for (let i = 0; i < count && remaining.length > 0; i++) {
      const idx = rng.nextInt(0, remaining.length - 1);
      pieceCells.push(remaining.splice(idx, 1)[0]);
    }
    pieces.push({ cells: pieceCells, color: colors[p] });
  }
  if (remaining.length > 0) {
    pieces.push({ cells: remaining, color: colors[pieces.length] });
  }

  // Build elements for display
  const elements: PuzzleElement[] = pieces.flatMap((piece, pi) =>
    piece.cells.map(([r, c]) => ({
      type: 'square',
      color: piece.color,
      size: 1,
      rotation: 0,
      position: { x: c, y: r },
    }))
  );

  // Options: correct arrangement + wrong ones
  const correctOption: PuzzleOption = {
    id: 'opt-correct',
    label: `${pieces.length} pieces → target shape`,
    value: targetCells.map(([r, c]) => r * gridSize + c),
  };

  // Distractors: slightly shifted arrangements
  const distractors: PuzzleOption[] = [];
  for (let d = 0; d < 3; d++) {
    const shifted = targetCells.map(([r, c]) => {
      const nr = Math.min(gridSize - 1, Math.max(0, r + rng.nextInt(-1, 1)));
      const nc = Math.min(gridSize - 1, Math.max(0, c + rng.nextInt(-1, 1)));
      return [nr, nc] as [number, number];
    });
    distractors.push({
      id: `opt-${d}`,
      label: `Arrangement ${d + 1}`,
      value: shifted.map(([r, c]) => r * gridSize + c),
    });
  }

  return {
    id: `sa-${seed}`, seed,
    category: PuzzleCategory.SPATIAL_ASSEMBLY, ageGroup, difficulty,
    cognitiveLoad: [CognitiveDimension.SPATIAL_INTELLIGENCE, CognitiveDimension.PERSISTENCE],
    elements,
    options: rng.shuffle([correctOption, ...distractors]),
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: 25 + Math.floor(difficulty * 20),
    maxHints: 3,
    irtParameters: { difficulty: -1 + difficulty * 3.5, discrimination: 1.3, guessing: 0.25 },
    instruction: `Arrange the ${pieces.length} colored pieces to form the target shape!`,
    interactionType: 'select' as InteractionType,
  };
}
