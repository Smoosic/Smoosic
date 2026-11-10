/**
 * Headless checks for beaming in duple time: dotted eighth/sixteenth figures beam across the beat.
 *
 * Run with: npm run test:beam-dotted
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoNote } from '../src/smo/data/note';
import { SmoBeamer } from '../src/smo/xform/beamers';
import { noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';

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

const Q = 4096, E = 2048, S = 1024, DE = 3072, DDE = 3584, T = 512;
/** Beam a 4/4 measure of notes with the given tick counts; returns the size of each beam group */
const beamSizes = (ticks: number[]): string => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  const measure = score.staves[0].measures[0];
  const proto = measure.voices[0].notes[0];
  measure.voices[0].notes = ticks.map((tt) => {
    const note = SmoNote.cloneWithDuration(proto, tt);
    note.noteType = 'n';
    return note;
  });
  SmoBeamer.applyBeams(measure);
  return measure.beamGroups.map((bg) => bg.notes.length).join(',');
};

check('four eighths and two quarters (unchanged)', beamSizes([E, E, E, E, Q, Q]) === '4', beamSizes([E, E, E, E, Q, Q]));
check('sixteenths still beam by the beat', beamSizes([S, S, S, S, S, S, S, S, Q, Q]) === '4,4', beamSizes([S, S, S, S, S, S, S, S, Q, Q]));
check('dotted eighth sixteenth x2 beam together', beamSizes([DE, S, DE, S, Q, Q]) === '4', beamSizes([DE, S, DE, S, Q, Q]));
check('double dotted eighth thirty-second x2 beam together', beamSizes([DDE, T, DDE, T, Q, Q]) === '4', beamSizes([DDE, T, DDE, T, Q, Q]));
check('dotted eighth sixteenth then eighths', beamSizes([DE, S, E, E, Q, Q]) === '4', beamSizes([DE, S, E, E, Q, Q]));
check('quarter ends the group', beamSizes([DE, S, Q, E, E, Q]) === '2,2', beamSizes([DE, S, Q, E, E, Q]));

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
