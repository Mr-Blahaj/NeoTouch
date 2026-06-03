import { Grid } from '../types';

export function gridsEqual(a: Grid, b: Grid): boolean {
  if (a.width !== b.width || a.height !== b.height) return false;
  for (let r = 0; r < a.height; r++) {
    for (let c = 0; c < a.width; c++) {
      if (a.cells[r][c] !== b.cells[r][c]) return false;
    }
  }
  return true;
}

export function ensureUniqueOptions(correctGrid: Grid, candidates: Grid[]): Grid[] {
  const unique: Grid[] = [];
  for (const cand of candidates) {
    if (unique.length >= 3) break;
    if (gridsEqual(cand, correctGrid)) continue;
    let isDuplicate = false;
    for (const u of unique) {
      if (gridsEqual(cand, u)) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      unique.push(cand);
    }
  }

  // Absolute fallback: if we still don't have 3 unique distractors, manually craft them
  while (unique.length < 3) {
    const fallbackGrid: Grid = {
      width: correctGrid.width,
      height: correctGrid.height,
      cells: correctGrid.cells.map(r => [...r])
    };
    // Mutate it deterministically based on how many we need
    const flatIndex = unique.length;
    fallbackGrid.cells[0][0] = (fallbackGrid.cells[0][0] + flatIndex + 1) % 9;
    
    // Ensure it's not somehow a duplicate again (though mutating [0][0] uniquely should guarantee it)
    if (!gridsEqual(fallbackGrid, correctGrid) && !unique.some(u => gridsEqual(fallbackGrid, u))) {
      unique.push(fallbackGrid);
    }
  }

  return unique;
}
