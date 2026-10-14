/**
 * Headless checks for the pure pieces of the unsaved-changes indicator: the UndoBuffer
 * listener, the full-save-format policy, the title formatter, and the post-save decision.
 * Cases S1-S14 are listed in specs/028-unsaved-changes-indicator/contracts/score-change-contract.md.
 *
 * Run with: npm run test:score-change-state
 */
import { UndoBuffer } from '../src/smo/xform/undo';
import { SmoSelector } from '../src/smo/xform/selections';
import { isFullSaveFormat, formatScoreTitle, nextStepAfterSave } from '../src/render/sui/scoreChangeState';

let failures = 0;
const check = (name: string, condition: boolean, detail?: string) => {
  if (condition) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}${detail ? ' -- ' + detail : ''}`);
  }
};

/** Record the simplest kind of undo step: a score modifier, whose payload is stored as is. */
const record = (buffer: UndoBuffer) => {
  buffer.addBuffer('test edit', UndoBuffer.bufferTypes.SCORE_MODIFIER, SmoSelector.default,
    { ctor: 'test' }, UndoBuffer.bufferSubtypes.NONE);
};

// --- S1: no listener set ---
{
  const buffer = new UndoBuffer();
  let threw = false;
  try {
    record(buffer);
  } catch (e) {
    threw = true;
  }
  check('S1 addBuffer works with no listener', !threw && buffer.opCount === 1);
}

// --- S2: one call, one notification ---
{
  const buffer = new UndoBuffer();
  let calls = 0;
  buffer.onAddBuffer = () => { calls += 1; };
  record(buffer);
  check('S2 listener called once per addBuffer', calls === 1, `calls=${calls}`);
}

// --- S3: many calls, including while grouping ---
{
  const buffer = new UndoBuffer();
  let calls = 0;
  buffer.onAddBuffer = () => { calls += 1; };
  record(buffer);
  buffer.grouping = true;
  record(buffer);
  record(buffer);
  buffer.grouping = false;
  record(buffer);
  check('S3 listener called for every addBuffer, grouped or not', calls === 4, `calls=${calls}`);
}

// --- S4: reset does not drop the listener ---
{
  const buffer = new UndoBuffer();
  let calls = 0;
  buffer.onAddBuffer = () => { calls += 1; };
  record(buffer);
  buffer.reset();
  record(buffer);
  check('S4 listener survives reset()', calls === 2, `calls=${calls}`);
}

// --- S5-S7: isFullSaveFormat ---
check('S5 .json is a full save', isFullSaveFormat('.json') === true);
for (const ext of ['.xml', '.mid', '.midi', '.js']) {
  check(`S6 ${ext} is lossy`, isFullSaveFormat(ext) === false);
}
check('S7 empty extension is not a full save', isFullSaveFormat('') === false);
check('S7 unknown extension is not a full save', isFullSaveFormat('.pdf') === false);
check('S7 .JSON matches case-insensitively', isFullSaveFormat('.JSON') === true);
check('S7 non-string input is not a full save', isFullSaveFormat(undefined as any) === false);

// --- S8-S11: formatScoreTitle ---
check('S8 unchanged score shows its name', formatScoreTitle('My Song', false) === 'My Song');
check('S9 changed score has a trailing asterisk', formatScoreTitle('My Song', true) === 'My Song*');
check('S10 empty name shows Untitled', formatScoreTitle('', false) === 'Untitled');
check('S10 blank name shows Untitled', formatScoreTitle('   ', false) === 'Untitled');
check('S11 empty name and changed is Untitled*', formatScoreTitle('', true) === 'Untitled*');
check('S11 name is trimmed', formatScoreTitle('  Song  ', true) === 'Song*');

// --- S12-S14: nextStepAfterSave ---
check('S12 saved loads the new score', nextStepAfterSave('saved') === 'load');
check('S13 lossy export asks again', nextStepAfterSave('exported') === 'prompt');
check('S14 cancelled aborts the load', nextStepAfterSave('cancelled') === 'abort');

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
