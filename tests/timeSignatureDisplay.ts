/**
 * Headless checks for the time signature display string: only a string like '3/4' or '3/8+2/4' is
 * kept; anything else reads as the empty string, so a half-typed value can't reach the renderer.
 *
 * Run with: npm run test:time-signature-display
 */
import { SmoTimeSignature, measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';

measureModifierDynamicCtorInit();

let failures = 0;
const check = (name: string, condition: boolean, detail?: string) => {
  if (condition) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}${detail ? ' -- ' + detail : ''}`);
  }
};

const make = (displayString: string): SmoTimeSignature => {
  return new SmoTimeSignature({ ...SmoTimeSignature.defaults, displayString });
}

['3/4', '12/8', '3/8+2/4', '3/8 + 2/4', ' 5/4 ', '2/4+3/8+3/8'].forEach((str) => {
  check(`valid '${str}' is kept`, make(str).displayString === str);
  check(`valid '${str}' is recognized`, SmoTimeSignature.isValidDisplayString(str));
});
['3', '3/', '/4', '3/4+', '+3/4', '3/4+2', '3/4/2', 'abc', '3/x', '3/4 2/4', '3.5/4', '-3/4', 'C'].forEach((str) => {
  check(`invalid '${str}' reads as empty`, make(str).displayString === '');
  check(`invalid '${str}' is rejected`, !SmoTimeSignature.isValidDisplayString(str));
});
check('empty string is not a valid display string', !SmoTimeSignature.isValidDisplayString(''));
check('empty string stays empty', make('').displayString === '');
check('undefined reads as empty', make(undefined as any).displayString === '');

const ts = make('3/8');
ts.displayString = '3/';
check('setting an invalid string reads as empty', ts.displayString === '');
ts.displayString = '3/4';
check('setting a valid string after it is kept', ts.displayString === '3/4');

// an invalid string is not saved
const bad = make('3/');
check('an invalid string is not serialized', (bad.serialize() as any).displayString === undefined);
const good = SmoTimeSignature.deserialize(make('3/4').serialize() as any) as SmoTimeSignature;
check('a valid string survives serialize and deserialize', good.displayString === '3/4');
// copies made from another time signature, as the dialog does
check('a copy keeps a valid string', new SmoTimeSignature(make('3/4')).displayString === '3/4');
check('a copy of an invalid string is empty', new SmoTimeSignature(make('3/')).displayString === '');
check('equalIncludeAttributes ignores invalid strings', SmoTimeSignature.equalIncludeAttributes(make('3/'), make('')));

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
