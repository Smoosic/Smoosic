/**
 * Headless checks for moving parts up and down: a 2-staff part moves as a unit.
 *
 * Run with: npm run test:move-part
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoSystemStaff } from '../src/smo/data/systemStaff';
import { SmoInstrument, staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';
import { noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { SmoSelector, SmoSelection } from '../src/smo/xform/selections';
import { SmoOperation } from '../src/smo/xform/operations';

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

/** A score with a staff for each name; a name ending in '1' is the first staff of a 2-staff part, '2' the second */
const buildScore = (names: string[]): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  for (let ii = 1; ii < names.length; ++ii) {
    const params = SmoSystemStaff.defaults;
    params.staffId = ii;
    params.measureInstrumentMap[0] = new SmoInstrument(SmoInstrument.defaults);
    score.addStaff(params);
  }
  names.forEach((name, ix) => {
    const info = score.staves[ix].partInfo;
    info.partName = name;
    if (name.endsWith('1')) {
      info.stavesAfter = 1;
    } else if (name.endsWith('2')) {
      info.stavesBefore = 1;
    }
  });
  return score;
};
const order = (score: SmoScore): string => score.staves.map((staff) => staff.partInfo.partName).join(',');
const move = (score: SmoScore, staff: number, dir: number) => {
  const selector = SmoSelector.default;
  selector.staff = staff;
  SmoOperation.moveStaffUpDown(score, { selector } as SmoSelection, dir);
};

let score = buildScore(['A', 'B1', 'B2']);
move(score, 1, -1);
check('2-staff part up passes single staff', order(score) === 'B1,B2,A', order(score));
move(score, 0, 1);
check('2-staff part down passes single staff', order(score) === 'A,B1,B2', order(score));

score = buildScore(['A', 'B1', 'B2']);
move(score, 0, 1);
check('single staff down passes whole 2-staff part', order(score) === 'B1,B2,A', order(score));
move(score, 2, -1);
check('single staff up passes whole 2-staff part', order(score) === 'A,B1,B2', order(score));

score = buildScore(['A', 'B1', 'B2']);
move(score, 2, -1);
check('selecting second staff of a part moves the part', order(score) === 'B1,B2,A', order(score));

score = buildScore(['A', 'B1', 'B2', 'C1', 'C2']);
move(score, 3, -1);
check('2-staff part up passes 2-staff part', order(score) === 'A,C1,C2,B1,B2', order(score));

score = buildScore(['A', 'B', 'C1', 'C2']);
move(score, 2, 1);
check('last part down wraps to first', order(score) === 'C1,C2,A,B', order(score));
move(score, 0, -1);
check('first part up wraps to last', order(score) === 'A,B,C1,C2', order(score));

score = buildScore(['A1', 'A2', 'B', 'C']);
move(score, 0, -1);
check('first 2-staff part up wraps to last', order(score) === 'B,C,A1,A2', order(score));
check('part links are kept', score.staves[2].partInfo.stavesAfter === 1 && score.staves[3].partInfo.stavesBefore === 1);
check('staves are numbered', score.staves.every((staff, ix) => staff.staffId === ix));

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
