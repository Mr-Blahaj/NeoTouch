import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, Grid, InteractionType } from '../types';

function generateMaze(size: number, rng: SeedRandom): number[][] {
  // 0 = path, 1 = wall. Initialize all walls.
  const grid = Array.from({ length: size }, () => Array(size).fill(1));

  // Recursive backtracker
  function carve(r: number, c: number) {
    grid[r][c] = 0;
    const dirs = rng.shuffle([[0, 2], [0, -2], [2, 0], [-2, 0]]);
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1) {
        grid[r + dr / 2][c + dc / 2] = 0; // knock down wall between
        carve(nr, nc);
      }
    }
  }

  // Start from 0,0
  carve(0, 0);
  // Ensure start and end are open
  grid[0][0] = 0;
  grid[size - 1][size - 1] = 0;

  return grid;
}

function bfs(maze: number[][], start: [number, number], end: [number, number]): [number, number][] | null {
  const rows = maze.length;
  const cols = maze[0].length;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent = new Map<string, [number, number] | null>();
  const queue: [number, number][] = [start];
  visited[start[0]][start[1]] = true;
  parent.set(`${start[0]},${start[1]}`, null);

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === end[0] && c === end[1]) {
      // Reconstruct path
      const path: [number, number][] = [];
      let cur: [number, number] | null = end;
      while (cur) {
        path.unshift(cur);
        cur = parent.get(`${cur[0]},${cur[1]}`) || null;
      }
      return path;
    }

    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && maze[nr][nc] === 0) {
        visited[nr][nc] = true;
        parent.set(`${nr},${nc}`, [r, c]);
        queue.push([nr, nc]);
      }
    }
  }
  return null;
}

export function generatePathfinding(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);
  // Size must be odd for maze generation
  const rawSize = ageGroup === AgeGroup.GROUP_A ? 5 : difficulty < 0.5 ? 7 : 9;
  const size = rawSize % 2 === 0 ? rawSize + 1 : rawSize;

  let maze: number[][];
  let path: [number, number][] | null;

  // Generate until we get a solvable maze
  let attempts = 0;
  do {
    maze = generateMaze(size, rng);
    path = bfs(maze, [0, 0], [size - 1, size - 1]);
    attempts++;
  } while (!path && attempts < 10);

  if (!path) {
    // Fallback: clear a direct path
    for (let i = 0; i < size; i++) { maze[0][i] = 0; maze[i][size - 1] = 0; }
    path = bfs(maze, [0, 0], [size - 1, size - 1])!;
  }

  // Build grid: walls=5 (grey), path=0 (dark), start=3 (green), end=2 (red)
  const displayCells: number[][] = maze.map(r => r.map(c => c === 1 ? 5 : 0));
  displayCells[0][0] = 3;
  displayCells[size - 1][size - 1] = 2;

  const puzzleGrid: Grid = { width: size, height: size, cells: displayCells };

  // Create options: correct path length + wrong ones
  const correctLen = path.length;
  const correctOption: PuzzleOption = {
    id: 'opt-correct',
    label: `${correctLen} steps`,
    value: correctLen,
  };

  const distractors: PuzzleOption[] = [
    { id: 'opt-0', label: `${correctLen + 2} steps`, value: correctLen + 2 },
    { id: 'opt-1', label: `${Math.max(3, correctLen - 2)} steps`, value: Math.max(3, correctLen - 2) },
    { id: 'opt-2', label: `${correctLen + 4} steps`, value: correctLen + 4 },
  ];

  return {
    id: `pf-${seed}`, seed,
    category: PuzzleCategory.PATHFINDING, ageGroup, difficulty,
    cognitiveLoad: [CognitiveDimension.SPATIAL_INTELLIGENCE, CognitiveDimension.LOGICAL_REASONING],
    grid: puzzleGrid,
    options: rng.shuffle([correctOption, ...distractors]),
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: 25 + Math.floor(difficulty * 25),
    maxHints: 3,
    irtParameters: { difficulty: -1 + difficulty * 3.5, discrimination: 1.4, guessing: 0.25 },
    instruction: 'Find the shortest path from 🟢 start to 🔴 end! How many steps?',
    interactionType: 'select' as InteractionType,
  };
}
