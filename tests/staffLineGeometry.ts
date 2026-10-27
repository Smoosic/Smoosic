/**
 * Headless checks for the staff line geometry used by NoteEntryCaret's mouse tracking
 * (staffLineFromY, yFromStaffLine).  The bug: the mouse position is measured from the top of the
 * first page but the caret box is local to the page the note is on, so on every page after the first
 * the staff line was wrong and the preview note and ledger lines were drawn a page off.
 *
 * It also covers trackingLimits, which decides where the caret stops tracking the mouse above and below
 * its staff so that notes in a close neighboring staff or system can still be selected.
 *
 * Run with: npm run test:staff-line-geometry
 */
import { staffLineFromY, yFromStaffLine, trackingLimits, TrackingLimitParams } from '../src/render/sui/staffLineGeometry';

let failures = 0;
const check = (name: string, condition: boolean, detail?: string) => {
  if (condition) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}${detail ? ' -- ' + detail : ''}`);
  }
};

// The caret box, as NoteEntryCaret defines it: lines are 10px apart, the staff is 5 lines (50px) tall
// and there are 6 ledger positions above and below.  Staff line 1 is the bottom line, 5 the top line.
const LINE = 10;
const STAFF = 50;
const LEDGER_ABOVE = 6;
const BOTTOM_OFFSET = LEDGER_ABOVE * LINE + STAFF;   // 110
const PAGE_HEIGHT = 1056;
// the top staff line of the staff sits this far below the top of its page
const STAFF_Y_ON_PAGE = 120;
const CARET_TOP_LOCAL = STAFF_Y_ON_PAGE - LEDGER_ABOVE * LINE;   // 60, what caretBoundaryBox.y holds

/** where a given staff line is, measured from the top of the first page, for a staff on page `page` */
const absoluteYOfLine = (staffLine: number, page: number) => page * PAGE_HEIGHT + CARET_TOP_LOCAL + BOTTOM_OFFSET - staffLine * LINE;

// --- the middle line of the staff, on the first page ---
check('page 1: the mouse on the middle line is staff line 3',
  staffLineFromY(absoluteYOfLine(3, 0), CARET_TOP_LOCAL + 0 * PAGE_HEIGHT, BOTTOM_OFFSET, LINE) === 3);

// --- the same staff on later pages ---
for (const page of [1, 2, 5]) {
  const caretTopAbsolute = CARET_TOP_LOCAL + page * PAGE_HEIGHT;
  const mouseY = absoluteYOfLine(3, page);
  const got = staffLineFromY(mouseY, caretTopAbsolute, BOTTOM_OFFSET, LINE);
  check(`page ${page + 1}: the mouse on the middle line is staff line 3 (caret top in absolute coordinates)`, got === 3, `got ${got}`);
  // what the old code did: compare the absolute mouse y with the page-local caret top
  const old = staffLineFromY(mouseY, CARET_TOP_LOCAL, BOTTOM_OFFSET, LINE);
  check(`page ${page + 1}: the old calculation (page-local caret top) was wrong`, old !== 3, `old ${old}`);
}

// --- half steps, ledger positions, both ends ---
{
  const page = 3;
  const top = CARET_TOP_LOCAL + page * PAGE_HEIGHT;
  const lines = [-6, -3, -1, -0.5, 0, 0.5, 1, 2.5, 5, 5.5, 6, 7, 11, 12];
  const bad = lines.filter((l) => staffLineFromY(absoluteYOfLine(l, page), top, BOTTOM_OFFSET, LINE) !== l);
  check('page 4: every line and space, including ledger positions, converts back', bad.length === 0, JSON.stringify(bad));
}
// the mouse a little off a line still snaps to the nearest half step
check('snaps to the nearest half step', staffLineFromY(absoluteYOfLine(3, 1) + 2, CARET_TOP_LOCAL + PAGE_HEIGHT, BOTTOM_OFFSET, LINE) === 3 &&
  staffLineFromY(absoluteYOfLine(3, 1) - 3, CARET_TOP_LOCAL + PAGE_HEIGHT, BOTTOM_OFFSET, LINE) === 3.5);

// --- y of a staff line is local to the page, so it can be used directly on the page's SVG ---
for (const page of [0, 1, 2, 7]) {
  const local = yFromStaffLine(3, CARET_TOP_LOCAL, BOTTOM_OFFSET, LINE);
  check(`page ${page + 1}: the middle line is at the same local y (${local}) on every page`, local === 140, `got ${local}`);
  check(`page ${page + 1}: that local y is inside the page`, local >= 0 && local <= PAGE_HEIGHT);
  // adding the page's offset gives the absolute y the mouse reports
  check(`page ${page + 1}: local y plus the page offset is the absolute y`, local + page * PAGE_HEIGHT === absoluteYOfLine(3, page));
}
// what the old code did with the local y: subtracted the page offset a second time, giving a y above the page
{
  const page = 2;
  const local = yFromStaffLine(3, CARET_TOP_LOCAL, BOTTOM_OFFSET, LINE);
  check('page 3: subtracting the page offset again (the old code) puts the line off the page', local - page * PAGE_HEIGHT < 0);
}

// --- the two conversions are inverses on every page ---
{
  let ok = true;
  for (let page = 0; page < 6; ++page) {
    for (let line = -6; line <= 12; line += 0.5) {
      const local = yFromStaffLine(line, CARET_TOP_LOCAL, BOTTOM_OFFSET, LINE);
      const back = staffLineFromY(local + page * PAGE_HEIGHT, CARET_TOP_LOCAL + page * PAGE_HEIGHT, BOTTOM_OFFSET, LINE);
      ok = ok && back === line;
    }
  }
  check('round trip: staff line -> y -> staff line on pages 1 to 6', ok);
}

// --- trackingLimits: where to stop tracking the mouse ---
{
  const STAFF_H = 50;
  const CARET_H = STAFF_H + 2 * LEDGER_ABOVE * LINE;   // 170: the staff plus six ledger positions each way
  /** geometry of a staff whose staff line is at staffY, on a page that starts at pageTop */
  const geometry = (pageTop: number, overrides: Partial<TrackingLimitParams> = {}): TrackingLimitParams => {
    const staffY = pageTop + STAFF_Y_ON_PAGE;
    const caretTop = staffY - LEDGER_ABOVE * LINE;
    const staffTop = staffY - LINE / 2;
    return {
      caretTop, caretBottom: caretTop + CARET_H, staffTop, staffBottom: staffTop + STAFF_H,
      pageTop, pageBottom: pageTop + PAGE_HEIGHT, aboveBottom: null, belowTop: null, ...overrides
    };
  };
  const full = geometry(0);

  // nothing near: the whole caret box
  {
    const l = trackingLimits(full);
    check('limits: with no neighbors the whole caret box is tracked', l.top === full.caretTop && l.bottom === full.caretBottom);
  }
  // a staff below that starts inside the lower ledger area: stop at its top
  {
    const l = trackingLimits(geometry(0, { belowTop: full.caretBottom - 40 }));
    check('limits: stops at the top of the staff or system below', l.bottom === full.caretBottom - 40 && l.top === full.caretTop);
  }
  // a staff above whose bottom is inside the upper ledger area: stop at its bottom
  {
    const l = trackingLimits(geometry(0, { aboveBottom: full.caretTop + 30 }));
    check('limits: stops at the bottom of the staff or system above', l.top === full.caretTop + 30 && l.bottom === full.caretBottom);
  }
  // neighbors further away than the ledger area change nothing
  {
    const l = trackingLimits(geometry(0, { aboveBottom: full.caretTop - 20, belowTop: full.caretBottom + 20 }));
    check('limits: neighbors beyond the ledger area do not shrink the box', l.top === full.caretTop && l.bottom === full.caretBottom);
  }
  // the page edges
  {
    const l = trackingLimits(geometry(0, { pageTop: full.caretTop + 20 }));
    check('limits: stops at the top of the page', l.top === full.caretTop + 20);
    const m = trackingLimits(geometry(0, { pageBottom: full.caretBottom - 25 }));
    check('limits: stops at the bottom of the page', m.bottom === full.caretBottom - 25);
  }
  // whichever comes first: a neighbor that is closer than the page edge, and a page edge closer than the neighbor
  {
    const l = trackingLimits(geometry(0, { pageBottom: full.caretBottom - 25, belowTop: full.caretBottom - 60 }));
    check('limits: the nearer of the next system and the page bottom wins (system)', l.bottom === full.caretBottom - 60);
    const m = trackingLimits(geometry(0, { pageBottom: full.caretBottom - 60, belowTop: full.caretBottom - 25 }));
    check('limits: the nearer of the next system and the page bottom wins (page)', m.bottom === full.caretBottom - 60);
  }
  // a next system on the next page is beyond the page bottom, so the page bottom is the stop
  {
    const l = trackingLimits(geometry(0, { pageBottom: full.caretBottom - 10, belowTop: PAGE_HEIGHT + 50 }));
    check('limits: a system on the next page does not extend the box past the page', l.bottom === full.caretBottom - 10);
    // a staff near the top of page 2, whose previous system is at the bottom of page 1
    const p2 = geometry(PAGE_HEIGHT);
    const pageTop = p2.caretTop + 15;
    const m = trackingLimits(geometry(PAGE_HEIGHT, { pageTop, aboveBottom: PAGE_HEIGHT - 40 }));
    check('limits: a system on the previous page does not extend the box above the page', m.top === pageTop);
  }
  // never cut into the staff itself, even if a neighbor's box overlaps it
  {
    const l = trackingLimits(geometry(0, { belowTop: full.staffTop + 10, aboveBottom: full.staffBottom - 10 }));
    check('limits: the staff itself is always tracked', l.top === full.staffTop && l.bottom === full.staffBottom);
    check('limits: the staff is inside the tracked range', l.top <= full.staffTop && l.bottom >= full.staffBottom);
  }
  // both sides tight at once
  {
    const l = trackingLimits(geometry(0, { aboveBottom: full.caretTop + 40, belowTop: full.caretBottom - 40 }));
    check('limits: both sides can shrink at once', l.top === full.caretTop + 40 && l.bottom === full.caretBottom - 40);
  }
  // the same on later pages (absolute coordinates): the result is the first page's, shifted by the page
  for (const page of [1, 2, 5]) {
    const shift = page * PAGE_HEIGHT;
    const g = geometry(shift, { aboveBottom: shift + full.caretTop + 30, belowTop: shift + full.caretBottom - 40 });
    const l = trackingLimits(g);
    check(`limits: page ${page + 1} gives the first page's stops shifted by the page offset`,
      l.top === shift + full.caretTop + 30 && l.bottom === shift + full.caretBottom - 40);
  }
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
