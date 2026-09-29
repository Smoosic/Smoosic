/**
 * Headless checks for repositioning SmoTextGroup objects when a score's (or part's) global
 * layout changes, so text stays visually stable across an svg-scale change and proportionally
 * placed across a page-width/height change.
 * See specs/022-text-reposition-on-resize/contracts/reposition-contract.md (cases R1-R11).
 *
 * Run with: npm run test:global-layout-reposition
 */
import { SmoTextGroup, SmoScoreText } from '../src/smo/data/scoreText';
import { SmoGlobalLayout, SmoLayoutManager } from '../src/smo/data/scoreModifiers';
import { noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';

// The smo layer registers its deserialization factories at app start; do the same here
// without pulling in any UI.
noteModifierDynamicCtorInit();
measureModifierDynamicCtorInit();
staffModifierDynamicCtorInit();
scoreModifierDynamicCtorInit();

let failures = 0;
const check = (name: string, condition: boolean, detail?: string) => {
  if (condition) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}${detail ? ' -- ' + detail : ''}`);
  }
};
const near = (a: number, b: number, eps: number = 1e-9) => Math.abs(a - b) < eps;

/** A full SmoGlobalLayout built from the project defaults, with the given fields overridden. */
const makeLayout = (overrides: Partial<SmoGlobalLayout> = {}): SmoGlobalLayout =>
  ({ ...SmoLayoutManager.defaultLayout, ...overrides });

/** A text group with one block at the given x/y, and optional music offsets. */
const makeGroup = (x: number, y: number, offsets?: { musicXOffset: number, musicYOffset: number }): SmoTextGroup => {
  const params = SmoTextGroup.defaults;
  const text = new SmoScoreText(SmoScoreText.defaults);
  text.x = x;
  text.y = y;
  params.textBlocks = [{ text, position: SmoTextGroup.relativePositions.RIGHT, activeText: false }];
  if (offsets) {
    params.musicXOffset = offsets.musicXOffset;
    params.musicYOffset = offsets.musicYOffset;
  }
  return new SmoTextGroup(params);
};

/** Apply the same two-step reposition setGlobalLayout performs, directly to a group list. */
const reposition = (groups: SmoTextGroup[], oldLayout: SmoGlobalLayout, newLayout: SmoGlobalLayout) => {
  const scaleChanged = oldLayout.svgScale !== newLayout.svgScale;
  const widthChanged = oldLayout.pageWidth !== newLayout.pageWidth;
  const heightChanged = oldLayout.pageHeight !== newLayout.pageHeight;
  const scaleRatio = oldLayout.svgScale / newLayout.svgScale;
  const widthRatio = widthChanged ? newLayout.pageWidth / oldLayout.pageWidth : 1;
  const heightRatio = heightChanged ? newLayout.pageHeight / oldLayout.pageHeight : 1;
  if (scaleChanged) {
    groups.forEach((tg) => tg.scaleText(scaleRatio));
  }
  if (widthChanged || heightChanged) {
    groups.forEach((tg) => tg.rescalePosition(widthRatio, heightRatio));
  }
};

// --- User Story 1 + Foundational: svg-scale ratio (contract R1, R4, R7, R8, R10, R11) ---

// R1: svg-scale ratio applied to x/y, page dimensions unchanged and untouched
{
  const oldLayout = makeLayout({ svgScale: 0.55, pageWidth: 800, pageHeight: 1000 });
  const newLayout = makeLayout({ svgScale: 0.6, pageWidth: 800, pageHeight: 1000 });
  const group = makeGroup(100, 200);
  reposition([group], oldLayout, newLayout);
  const ratio = 0.55 / 0.6;
  check('R1 x scaled by svgScale ratio', near(group.textBlocks[0].text.x, 100 * ratio),
    String(group.textBlocks[0].text.x));
  check('R1 y scaled by svgScale ratio', near(group.textBlocks[0].text.y, 200 * ratio),
    String(group.textBlocks[0].text.y));
}

// R4: no changed value -> nothing touched
{
  const oldLayout = makeLayout({ svgScale: 0.55, pageWidth: 800, pageHeight: 1000, noteSpacing: 1.0 });
  const newLayout = makeLayout({ svgScale: 0.55, pageWidth: 800, pageHeight: 1000, noteSpacing: 1.5 });
  const group = makeGroup(123, 456, { musicXOffset: 7, musicYOffset: 9 });
  reposition([group], oldLayout, newLayout);
  check('R4 x unchanged when svgScale/pageWidth/pageHeight are equal', group.textBlocks[0].text.x === 123);
  check('R4 y unchanged when svgScale/pageWidth/pageHeight are equal', group.textBlocks[0].text.y === 456);
  check('R4 offsets unchanged', group.musicXOffset === 7 && group.musicYOffset === 9);
}

// R7: musicXOffset/musicYOffset rescaled identically to block x/y
{
  const oldLayout = makeLayout({ svgScale: 0.5 });
  const newLayout = makeLayout({ svgScale: 1.0 });
  const group = makeGroup(10, 20, { musicXOffset: 25, musicYOffset: 40 });
  reposition([group], oldLayout, newLayout);
  check('R7 musicXOffset rescaled', near(group.musicXOffset, 25 * 0.5), String(group.musicXOffset));
  check('R7 musicYOffset rescaled', near(group.musicYOffset, 40 * 0.5), String(group.musicYOffset));
}

// R8: a score-level scale change repositions the view list and the store list identically
{
  const oldLayout = makeLayout({ svgScale: 0.55 });
  const newLayout = makeLayout({ svgScale: 0.7 });
  const viewGroup = makeGroup(50, 60);
  const storeGroup = makeGroup(50, 60);
  reposition([viewGroup], oldLayout, newLayout);
  reposition([storeGroup], oldLayout, newLayout);
  check('R8 view and store lists end up identical',
    near(viewGroup.textBlocks[0].text.x, storeGroup.textBlocks[0].text.x) &&
    near(viewGroup.textBlocks[0].text.y, storeGroup.textBlocks[0].text.y));
}

// R10: two sequential changes, each diffed against the immediately-preceding layout, match one direct change
{
  const start = makeLayout({ svgScale: 0.55 });
  const mid = makeLayout({ svgScale: 0.6 });
  const end = makeLayout({ svgScale: 0.5 });
  const sequential = makeGroup(100, 200);
  reposition([sequential], start, mid);
  reposition([sequential], mid, end);
  const direct = makeGroup(100, 200);
  reposition([direct], start, end);
  check('R10 sequential changes land at the same result as one direct change',
    near(sequential.textBlocks[0].text.x, direct.textBlocks[0].text.x) &&
    near(sequential.textBlocks[0].text.y, direct.textBlocks[0].text.y),
    `${sequential.textBlocks[0].text.x} vs ${direct.textBlocks[0].text.x}`);
  // and NOT the same as re-diffing against the original dialog-open snapshot for the 2nd change
  const wrongBaseline = makeGroup(100, 200);
  reposition([wrongBaseline], start, mid);
  reposition([wrongBaseline], start, end);
  check('R10 sequential result differs from (incorrectly) re-using the original snapshot',
    !near(sequential.textBlocks[0].text.x, wrongBaseline.textBlocks[0].text.x));
}

// R11: apply a change, then cancel (revert to backup) -- text returns exactly to its pre-dialog values
{
  const backup = makeLayout({ svgScale: 0.55, pageWidth: 800, pageHeight: 1000 });
  const applied = makeLayout({ svgScale: 0.6, pageWidth: 900, pageHeight: 1000 });
  const group = makeGroup(80, 500);
  const original = { x: group.textBlocks[0].text.x, y: group.textBlocks[0].text.y };
  reposition([group], backup, applied); // dialog change applied
  reposition([group], applied, backup); // cancel: revert to backup
  check('R11 cancel restores x exactly', near(group.textBlocks[0].text.x, original.x),
    String(group.textBlocks[0].text.x));
  check('R11 cancel restores y exactly', near(group.textBlocks[0].text.y, original.y),
    String(group.textBlocks[0].text.y));
}

// --- User Story 2: page-dimension ratio and part scoping (contract R2, R3, R5, R6, R9) ---

// R2: pageWidth ratio, X-axis only
{
  const oldLayout = makeLayout({ pageWidth: 800 });
  const newLayout = makeLayout({ pageWidth: 1000 });
  const group = makeGroup(80, 300); // x is 10% of old page width
  reposition([group], oldLayout, newLayout);
  check('R2 x rescaled to keep the same percentage of page width',
    near(group.textBlocks[0].text.x, 100), String(group.textBlocks[0].text.x));
  check('R2 y untouched by a pageWidth-only change', group.textBlocks[0].text.y === 300);
}

// R3: pageHeight ratio, Y-axis only
{
  const oldLayout = makeLayout({ pageHeight: 1000 });
  const newLayout = makeLayout({ pageHeight: 1200 });
  const group = makeGroup(40, 500); // y is 50% of old page height
  reposition([group], oldLayout, newLayout);
  check('R3 y rescaled to keep the same percentage of page height',
    near(group.textBlocks[0].text.y, 600), String(group.textBlocks[0].text.y));
  check('R3 x untouched by a pageHeight-only change', group.textBlocks[0].text.x === 40);
}

// R5: combined svg-scale and page-dimension change in one call is order-independent
{
  const oldLayout = makeLayout({ svgScale: 0.5, pageWidth: 800, pageHeight: 1000 });
  const newLayout = makeLayout({ svgScale: 0.8, pageWidth: 1000, pageHeight: 1100 });
  const combined = makeGroup(100, 200);
  reposition([combined], oldLayout, newLayout);
  // apply scale first, then page-dimension, exactly as reposition() internally does
  const scaleFirst = makeGroup(100, 200);
  scaleFirst.scaleText(oldLayout.svgScale / newLayout.svgScale);
  scaleFirst.rescalePosition(newLayout.pageWidth / oldLayout.pageWidth, newLayout.pageHeight / oldLayout.pageHeight);
  // apply page-dimension first, then scale -- must give the same result (commutative)
  const pageFirst = makeGroup(100, 200);
  pageFirst.rescalePosition(newLayout.pageWidth / oldLayout.pageWidth, newLayout.pageHeight / oldLayout.pageHeight);
  pageFirst.scaleText(oldLayout.svgScale / newLayout.svgScale);
  check('R5 combined change matches scale-first application',
    near(combined.textBlocks[0].text.x, scaleFirst.textBlocks[0].text.x) &&
    near(combined.textBlocks[0].text.y, scaleFirst.textBlocks[0].text.y));
  check('R5 order of applying scale vs. page-dimension does not matter',
    near(scaleFirst.textBlocks[0].text.x, pageFirst.textBlocks[0].text.x) &&
    near(scaleFirst.textBlocks[0].text.y, pageFirst.textBlocks[0].text.y),
    `${scaleFirst.textBlocks[0].text.x} vs ${pageFirst.textBlocks[0].text.x}`);
}

// R6: a block at the exact page edge stays exactly at the edge after a pageWidth change
{
  const oldLayout = makeLayout({ pageWidth: 800 });
  const newLayout = makeLayout({ pageWidth: 1000 });
  const leftEdge = makeGroup(0, 50);
  const rightEdge = makeGroup(800, 50);
  reposition([leftEdge], oldLayout, newLayout);
  reposition([rightEdge], oldLayout, newLayout);
  check('R6 left edge (x=0) stays at 0', leftEdge.textBlocks[0].text.x === 0);
  check('R6 right edge (x=oldPageWidth) lands exactly at newPageWidth',
    rightEdge.textBlocks[0].text.x === 1000, String(rightEdge.textBlocks[0].text.x));
}

// R9: a part-level layout change only repositions that part's text groups
{
  const oldLayout = makeLayout({ pageWidth: 800 });
  const newLayout = makeLayout({ pageWidth: 1000 });
  const partAGroups = [makeGroup(80, 10)];
  const partBGroups = [makeGroup(80, 10)];
  const scoreGroups = [makeGroup(80, 10)];
  // Only part A's layout changed; part B's and the score's own text groups must be untouched.
  reposition(partAGroups, oldLayout, newLayout);
  check('R9 changed part\'s text is repositioned', near(partAGroups[0].textBlocks[0].text.x, 100));
  check('R9 other part\'s text is untouched', partBGroups[0].textBlocks[0].text.x === 80);
  check('R9 score-level text is untouched', scoreGroups[0].textBlocks[0].text.x === 80);
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
