import { SeedRandom } from '../SeedRandom';
import { AgeGroup, PuzzleCategory, CognitiveDimension, Puzzle, PuzzleOption, Grid, InteractionType } from '../types';
import { ensureUniqueOptions } from './gridUtils';

type ArcRule = 'extract_color' | 'count_to_fill' | 'replicate' | 'invert' | 'max_color';

function applyArcRule(grid: Grid, rule: ArcRule, rng: SeedRandom): Grid {
  const { width, height, cells } = grid;

  switch (rule) {
    case 'extract_color': {
      // Find the least common non-zero color and extract only those cells
      const colorCount: Record<number, number> = {};
      for (const row of cells) for (const c of row) if (c !== 0) colorCount[c] = (colorCount[c] || 0) + 1;
      const colors = Object.entries(colorCount).sort((a, b) => a[1] - b[1]);
      const targetColor = colors.length > 0 ? Number(colors[0][0]) : 1;
      const out = cells.map(r => r.map(c => c === targetColor ? c : 0));
      return { width, height, cells: out };
    }
    case 'count_to_fill': {
      // Count non-zero cells per row → fill that many cells from left with color 1
      const out = cells.map(row => {
        const count = row.filter(c => c !== 0).length;
        return row.map((_, i) => i < count ? 1 : 0);
      });
      return { width, height, cells: out };
    }
    case 'replicate': {
      // Find a 2x2 pattern in top-left and tile it
      const pattern = cells.slice(0, 2).map(r => r.slice(0, 2));
      const out = cells.map((row, r) => row.map((_, c) => pattern[r % 2][c % 2]));
      return { width, height, cells: out };
    }
    case 'invert': {
      // Non-zero becomes 0, zero becomes a specific color
      const fillColor = rng.nextInt(1, 5);
      const out = cells.map(r => r.map(c => c === 0 ? fillColor : 0));
      return { width, height, cells: out };
    }
    case 'max_color': {
      // Find the most common color, make everything that color or 0
      const colorCount: Record<number, number> = {};
      for (const row of cells) for (const c of row) if (c !== 0) colorCount[c] = (colorCount[c] || 0) + 1;
      const maxColor = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '1';
      const out = cells.map(r => r.map(c => c === Number(maxColor) ? c : 0));
      return { width, height, cells: out };
    }
  }
}

function makeGrid(size: number, rng: SeedRandom, maxC: number): Grid {
  const cells: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) row.push(rng.nextBool(0.5) ? rng.nextInt(1, maxC) : 0);
    cells.push(row);
  }
  return { width: size, height: size, cells };
}

export function generateARCRuleDiscovery(seed: number, ageGroup: AgeGroup, difficulty: number): Puzzle {
  const rng = new SeedRandom(seed);
  const size = difficulty < 0.4 ? 3 : 4;
  const maxC = difficulty < 0.4 ? 3 : 5;

  const rules: ArcRule[] = difficulty < 0.4
    ? ['invert', 'count_to_fill']
    : difficulty < 0.7
      ? ['extract_color', 'replicate', 'invert']
      : ['extract_color', 'count_to_fill', 'replicate', 'max_color'];

  const rule = rng.pick(rules);

  // Generate 2-3 example pairs
  const exCount = difficulty < 0.5 ? 3 : 2;
  const examples: { input: Grid; output: Grid }[] = [];
  for (let i = 0; i < exCount; i++) {
    const inp = makeGrid(size, rng, maxC);
    examples.push({ input: inp, output: applyArcRule(inp, rule, rng) });
  }

  // Test
  const testInput = makeGrid(size, rng, maxC);
  const correctGrid = applyArcRule(testInput, rule, rng);

  const correctOption: PuzzleOption = { id: 'opt-correct', grid: correctGrid };
  const otherRules = rules.filter(r => r !== rule);
  const distractorCandidates: Grid[] = [];
  
  for (const r of otherRules) {
    distractorCandidates.push(applyArcRule(testInput, r, rng));
  }
  for (let i = 0; i < 10; i++) {
    distractorCandidates.push(makeGrid(size, rng, maxC));
  }

  const uniqueDistractorGrids = ensureUniqueOptions(correctGrid, distractorCandidates);
  const distractors: PuzzleOption[] = uniqueDistractorGrids.map((grid, i) => ({
    id: `opt-${i}`,
    grid
  }));

  return {
    id: `arc-${seed}`, seed,
    category: PuzzleCategory.ARC_RULE_DISCOVERY, ageGroup, difficulty,
    cognitiveLoad: [CognitiveDimension.LOGICAL_REASONING, CognitiveDimension.PATTERN_RECOGNITION, CognitiveDimension.WORKING_MEMORY],
    grid: testInput,
    examplePairs: examples,
    testInput,
    options: rng.shuffle([correctOption, ...distractors]),
    correctAnswer: 'opt-correct',
    estimatedTimeSeconds: 40 + Math.floor(difficulty * 20),
    maxHints: 3,
    irtParameters: { difficulty: difficulty * 4 - 1, discrimination: 1.8, guessing: 0.25 },
    instruction: 'These grids follow a secret rule! Can you find the rule and finish the last one?',
    interactionType: 'select' as InteractionType,
  };
}
