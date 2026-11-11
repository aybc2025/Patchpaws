// Path geometry for the quilt: seams between patches, faint lines inside a patch,
// and the outline of any set of squares (used by hints and the rules sheet).

export function seamPath(n, regions) {
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const i = r * n + c;
      if (c < n - 1 && regions[i] !== regions[i + 1]) d += `M${c + 1} ${r}V${r + 1}`;
      if (r < n - 1 && regions[i] !== regions[i + n]) d += `M${c} ${r + 1}H${c + 1}`;
    }
  }
  return d;
}

export function innerGridPath(n, regions) {
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const i = r * n + c;
      if (c < n - 1 && regions[i] === regions[i + 1]) d += `M${c + 1} ${r + 0.14}V${r + 0.86}`;
      if (r < n - 1 && regions[i] === regions[i + n]) d += `M${c + 0.14} ${r + 1}H${c + 0.86}`;
    }
  }
  return d;
}

/** Outline of the squares where inSet(r, c) is true, drawn slightly inside the edge. */
export function outlinePath(n, inSet) {
  let d = '';
  const k = 0.06;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!inSet(r, c)) continue;
      const out = (rr, cc) => rr < 0 || cc < 0 || rr >= n || cc >= n || !inSet(rr, cc);
      if (out(r - 1, c)) d += `M${c} ${r + k}H${c + 1}`;
      if (out(r + 1, c)) d += `M${c} ${r + 1 - k}H${c + 1}`;
      if (out(r, c - 1)) d += `M${c + k} ${r}V${r + 1}`;
      if (out(r, c + 1)) d += `M${c + 1 - k} ${r}V${r + 1}`;
    }
  }
  return d;
}

export const markPath = (r, c) =>
  `M${c + 0.36} ${r + 0.36}L${c + 0.64} ${r + 0.64}M${c + 0.64} ${r + 0.36}L${c + 0.36} ${r + 0.64}`;
