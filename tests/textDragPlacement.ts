/**
 * Headless checks for SmoTextGroup.centerOnPage/rightJustifyOnPage, the pure placement math
 * behind the text-drag toolbar's "Center"/"Right Justify" buttons.
 * See specs/023-text-drag-controls/contracts/component-interfaces.md §2, research.md §5.
 *
 * Run with: npm run test:text-drag-placement
 */
import { SmoTextGroup, SmoScoreText } from '../src/smo/data/scoreText';
import { ScaledPageLayout } from '../src/smo/data/scoreModifiers';
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

/** A minimal ScaledPageLayout with the given fields overridden. */
const makeLayout = (overrides: Partial<ScaledPageLayout> = {}): ScaledPageLayout => ({
  svgScale: 1, zoomScale: 1, noteSpacing: 1, pageWidth: 800, pageHeight: 1000,
  leftMargin: 40, rightMargin: 40, topMargin: 40, bottomMargin: 40,
  interGap: 0, intraGap: 0, pages: 1, maxMeasureSystem: 0, displayMode: 'vertical',
  ...overrides
} as ScaledPageLayout);

/** A text group with one block at the given x/y, and a pre-populated logicalBox (as if rendered). */
const makeGroup = (x: number, y: number, width: number, height: number): SmoTextGroup => {
  const params = SmoTextGroup.defaults;
  const text = new SmoScoreText(SmoScoreText.defaults);
  text.x = x;
  text.y = y;
  params.textBlocks = [{ text, position: SmoTextGroup.relativePositions.RIGHT, activeText: false }];
  const group = new SmoTextGroup(params);
  group.logicalBox = { x, y: y - height, width, height };
  return group;
};

// --- centerOnPage ---

// Centering lands the block's horizontal midpoint on the printable area's midpoint
{
  const layout = makeLayout({ pageWidth: 800, leftMargin: 40, rightMargin: 40 });
  const group = makeGroup(600, 200, 120, 20);
  const yBefore = group.ul().y;
  group.centerOnPage(layout);
  const printableMid = 40 + (800 - 40 - 40) / 2;
  check('center: block midpoint lands on printable-area midpoint',
    near(group.ul().x + 120 / 2, printableMid), `${group.ul().x + 120 / 2} vs ${printableMid}`);
  check('center: y is unchanged', group.ul().y === yBefore);
}

// Centering with asymmetric margins still centers within the printable area, not the raw page
{
  const layout = makeLayout({ pageWidth: 1000, leftMargin: 100, rightMargin: 300 });
  const group = makeGroup(0, 50, 200, 20);
  group.centerOnPage(layout);
  const printableMid = 100 + (1000 - 100 - 300) / 2;
  check('center: asymmetric margins still center within the printable area',
    near(group.ul().x + 200 / 2, printableMid), `${group.ul().x + 200 / 2} vs ${printableMid}`);
}

// Centering is idempotent
{
  const layout = makeLayout({ pageWidth: 800, leftMargin: 40, rightMargin: 40 });
  const group = makeGroup(600, 200, 120, 20);
  group.centerOnPage(layout);
  const first = group.ul().x;
  group.centerOnPage(layout);
  check('center: calling twice in a row is idempotent', near(group.ul().x, first), `${group.ul().x} vs ${first}`);
}

// --- rightJustifyOnPage ---

// Right-justify lands the block's right edge on pageWidth - rightMargin
{
  const layout = makeLayout({ pageWidth: 800, leftMargin: 40, rightMargin: 60 });
  const group = makeGroup(10, 300, 150, 20);
  const yBefore = group.ul().y;
  group.rightJustifyOnPage(layout);
  const targetRightEdge = 800 - 60;
  check('right-justify: right edge lands on pageWidth - rightMargin',
    near(group.ul().x + 150, targetRightEdge), `${group.ul().x + 150} vs ${targetRightEdge}`);
  check('right-justify: y is unchanged', group.ul().y === yBefore);
}

// Right-justify is idempotent
{
  const layout = makeLayout({ pageWidth: 800, leftMargin: 40, rightMargin: 60 });
  const group = makeGroup(10, 300, 150, 20);
  group.rightJustifyOnPage(layout);
  const first = group.ul().x;
  group.rightJustifyOnPage(layout);
  check('right-justify: calling twice in a row is idempotent', near(group.ul().x, first), `${group.ul().x} vs ${first}`);
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
