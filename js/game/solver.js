// Exhaustive solution counter. Used by the generator to guarantee a unique answer.
// regions: flat array (row-major) of region ids 0..n-1.
export function countSolutions(n, regions, cap = 2) {
  let count = 0;
  const regionOf = regions;
  function place(row, usedCols, usedRegions, prevCol) {
    if (row === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (usedCols & (1 << c)) continue;
      if (prevCol >= 0 && Math.abs(c - prevCol) < 2) continue;
      const reg = regionOf[row * n + c];
      if (usedRegions & (1 << reg)) continue;
      place(row + 1, usedCols | (1 << c), usedRegions | (1 << reg), c);
      if (count >= cap) return;
    }
  }
  place(0, 0, 0, -1);
  return count;
}

export function findSolution(n, regions) {
  const cols = new Array(n);
  function place(row, usedCols, usedRegions, prevCol) {
    if (row === n) return true;
    for (let c = 0; c < n; c++) {
      if (usedCols & (1 << c)) continue;
      if (prevCol >= 0 && Math.abs(c - prevCol) < 2) continue;
      const reg = regions[row * n + c];
      if (usedRegions & (1 << reg)) continue;
      cols[row] = c;
      if (place(row + 1, usedCols | (1 << c), usedRegions | (1 << reg), c)) return true;
    }
    return false;
  }
  return place(0, 0, 0, -1) ? cols : null;
}
