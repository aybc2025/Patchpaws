// Scoring and hint wording. Pure — no DOM.
export const PATCH_NAMES = ['rose', 'apricot', 'butter', 'mint', 'lagoon', 'cornflower', 'lilac', 'pistachio', 'coral', 'fog'];

/** ★★★ clean · −1 for any mistake · −1 for any hint · never below 1. */
export function starsFor({ mistakes, hintsUsed }) {
  return Math.max(1, 3 - (mistakes > 0 ? 1 : 0) - (hintsUsed > 0 ? 1 : 0));
}

const unitName = (u, patchName) => {
  if (u.kind === 'region') return `the ${patchName(u.index)} patch`;
  return `${u.kind === 'row' ? 'row' : 'column'} ${u.index + 1}`;
};

/** Turns a logic step into one plain sentence. patchName maps region id → colour word. */
export function hintText(step, patchName) {
  const f = step.focus || [];
  switch (step.rule) {
    case 'wrongMark':
      return 'This ✕ is sitting where a cat belongs. Clear it.';
    case 'attacked':
      return 'These squares share a line, a patch or a corner with a cat, so they stay empty.';
    case 'lastSpot':
      return `Only one square is left in ${unitName(f[0], patchName)}, so its cat goes there.`;
    case 'regionInLine':
      return `The ${patchName(f[0].index)} patch only fits in ${unitName(f[1], patchName)}, so the rest of that ${f[1].kind === 'row' ? 'row' : 'column'} stays empty.`;
    case 'lineInRegion':
      return `${cap(unitName(f[0], patchName))} can only use the ${patchName(f[1].index)} patch, so the rest of that patch stays empty.`;
    case 'blocks':
      return `A cat here would leave ${unitName(f[0], patchName)} with no room.`;
    case 'squeeze': {
      const regions = f.filter((u) => u.kind === 'region');
      const lines = f.filter((u) => u.kind !== 'region');
      const lineWord = lines[0].kind === 'row' ? 'rows' : 'columns';
      const k = lines.length;
      return f[0].kind === 'region'
        ? `These ${k} patches fit only inside these ${k} ${lineWord}, so nothing else there can hold a cat.`
        : `These ${k} ${lineWord} can only use these ${regions.length} patches, so the rest of those patches stays empty.`;
    }
    default:
      return 'Here is a cat to get you going.';
  }
}

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
