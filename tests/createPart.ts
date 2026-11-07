/**
 * Headless checks for creating parts: where a new part goes, not splitting a two-stave part, the
 * name and settings it gets, and keeping the references to staves right when a staff is inserted
 * above others.  Cases are listed in specs/037-fix-new-part-dialog/contracts/create-part-api.md.
 *
 * Run with: npm run test:create-part
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoSystemStaff } from '../src/smo/data/systemStaff';
import { SmoSlur, SmoInstrument } from '../src/smo/data/staffModifiers';
import { SmoSystemGroup, scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';
import { noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { SmoSelector } from '../src/smo/xform/selections';
import { SmoOperation, AddPartParams } from '../src/smo/xform/operations';
import { SmoPartInfo } from '../src/smo/data/partInfo';
import { clampPartLocation, resolvePartName, instrumentChoices, instrumentLabelFor } from '../src/ui/dialogs/createPartHelpers';

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

/** Parameters for a new staff at `index`, with the default instrument */
const staffParams = (index: number) => {
  const params = SmoSystemStaff.defaults;
  params.staffId = index;
  params.measureInstrumentMap[0] = new SmoInstrument(SmoInstrument.defaults);
  return params;
};
/** A score with one staff for each name, each with the same four measures */
const buildScore = (names: string[]): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  for (let ii = 1; ii < names.length; ++ii) {
    score.addStaff(staffParams(ii));
  }
  names.forEach((name, ix) => {
    score.staves[ix].partInfo.partName = name;
  });
  return score;
};
/** The part names, in staff order */
const order = (score: SmoScore): string => {
  return score.staves.map((staff) => staff.partInfo.partName).join(',');
};
/** Insert a staff named `name` at staff index `index` */
const insert = (score: SmoScore, index: number, name: string) => {
  const staff = score.addStaff(staffParams(index));
  staff.partInfo.partName = name;
  return staff;
};
const selector = (staff: number): SmoSelector => {
  const rv = SmoSelector.default;
  rv.staff = staff;
  return rv;
};

// --- R1-R5, S2: references are kept right when a staff is inserted above others ---
{
  const score = buildScore(['A', 'B', 'C']);
  const slur = new SmoSlur(SmoSlur.defaults);
  slur.startSelector = selector(2);
  slur.endSelector = selector(2);
  slur.endSelector.measure = 1;
  slur.associatedStaff = 2;
  score.staves[2].addStaffModifier(slur);
  insert(score, 0, 'N');
  check('R1 insert first: staves are in order', order(score) === 'N,A,B,C', order(score));
  const moved = score.staves[3].modifiers[0];
  check('R1 the slur is still on its staff', moved === slur);
  check('R1 its selectors follow the staff', slur.startSelector.staff === 3 && slur.endSelector.staff === 3);
  check('R1 its associated staff follows', slur.associatedStaff === 3);
  check('R1 its measure is untouched', slur.endSelector.measure === 1);
}
{
  const score = buildScore(['A', 'B', 'C']);
  const group = new SmoSystemGroup(SmoSystemGroup.defaults);
  group.startSelector.staff = 1;
  group.endSelector.staff = 2;
  score.systemGroups.push(group);
  insert(score, 0, 'N');
  check('R2 a group below the insertion moves down', group.startSelector.staff === 2 && group.endSelector.staff === 3);
}
{
  const score = buildScore(['A', 'B', 'C']);
  const group = new SmoSystemGroup(SmoSystemGroup.defaults);
  group.startSelector.staff = 0;
  group.endSelector.staff = 2;
  score.systemGroups.push(group);
  insert(score, 1, 'N');
  check('R3 a group spanning the insertion grows', group.startSelector.staff === 0 && group.endSelector.staff === 3);
}
{
  const score = buildScore(['A', 'B', 'C']);
  const group = new SmoSystemGroup(SmoSystemGroup.defaults);
  group.startSelector.staff = 0;
  group.endSelector.staff = 1;
  score.systemGroups.push(group);
  const slur = new SmoSlur(SmoSlur.defaults);
  slur.startSelector = selector(2);
  slur.endSelector = selector(2);
  slur.associatedStaff = 2;
  score.staves[2].addStaffModifier(slur);
  insert(score, 3, 'N');
  check('R4 an append leaves groups alone', group.startSelector.staff === 0 && group.endSelector.staff === 1);
  check('R4 an append leaves modifiers alone', slur.startSelector.staff === 2 && slur.associatedStaff === 2);
  check('R4 an append puts the staff last', order(score) === 'A,B,C,N', order(score));
}
{
  const score = buildScore(['A', 'B', 'C']);
  insert(score, 1, 'N');
  const instrumentStaves = score.staves.map((staff) => {
    const keys = Object.keys(staff.measureInstrumentMap);
    return keys.every((key) => staff.measureInstrumentMap[parseInt(key, 10)].startSelector.staff === staff.staffId
      && staff.measureInstrumentMap[parseInt(key, 10)].endSelector.staff === staff.staffId);
  });
  check('R5 every instrument selector names its own staff', instrumentStaves.every((ok) => ok), JSON.stringify(instrumentStaves));
  check('S2 staves are numbered in order', score.staves.every((staff, ix) => staff.staffId === ix));
  check('S2 and so are their measures', score.staves.every((staff, ix) =>
    staff.measures.every((measure) => measure.measureNumber.staffId === ix)));
}

/** Create a part with the given overrides */
const addPart = (score: SmoScore, location: number, overrides: Partial<AddPartParams> = {}): number => {
  const params: AddPartParams = {
    location,
    instrument: new SmoInstrument(SmoInstrument.defaults),
    twoStaves: false,
    name: '',
    instrumentLabel: 'Piano',
    abbreviation: '',
    ...overrides
  };
  return SmoOperation.addPart(score, params);
};
/** A score with the staves A, then a two-stave part P (P1, P2), then C */
const buildScoreWithPart = (): SmoScore => {
  const score = buildScore(['A', 'C']);
  addPart(score, 2, { twoStaves: true, name: 'P' });
  score.staves[1].partInfo.partName = 'P1';
  score.staves[2].partInfo.partName = 'P2';
  return score;
};

// --- P1: placement on plain staves ---
{
  const score = buildScore(['A', 'B', 'C']);
  const results = [1, 2, 3, 4, 9, 0, -3, 2.6, NaN].map((loc) => score.resolveNewPartIndex(loc));
  check('P1 locations resolve to indexes', results.join(',') === '0,1,2,3,3,0,0,2,3', results.join(','));
}
// --- A1: addPart at every position ---
{
  const expected = ['N,A,B,C', 'A,N,B,C', 'A,B,N,C', 'A,B,C,N'];
  for (let loc = 1; loc <= 4; ++loc) {
    const score = buildScore(['A', 'B', 'C']);
    const index = addPart(score, loc, { name: 'N' });
    check(`A1 location ${loc} puts the part at index ${loc - 1}`, index === loc - 1 && order(score) === expected[loc - 1], order(score));
    check(`A1 location ${loc} numbers the staves`, score.staves.every((staff, ix) => staff.staffId === ix));
  }
}
// --- P2-P5: not splitting a two-stave part ---
{
  const score = buildScoreWithPart();
  check('P2 the setup has A,P1,P2,C', order(score) === 'A,P1,P2,C', order(score));
  check('P2 inside the part resolves to after it', score.resolveNewPartIndex(3) === 3);
  check('P3 at the first staff of the part is before it', score.resolveNewPartIndex(2) === 1);
  check('P3 after the last staff', score.resolveNewPartIndex(5) === 4);
  check('P3 first', score.resolveNewPartIndex(1) === 0);
  check('P3 just after the part is unchanged', score.resolveNewPartIndex(4) === 3);
}
{
  const score = buildScore(['A']);
  addPart(score, 2, { twoStaves: true, name: 'P' });
  check('P4 a two-stave part at the end: inside resolves to the end', score.resolveNewPartIndex(3) === 3);
  check('P4 and so does the end', score.resolveNewPartIndex(4) === 3);
}
{
  const score = buildScore(['A']);
  addPart(score, 2, { twoStaves: true, name: 'P' });
  addPart(score, 4, { twoStaves: true, name: 'Q' });
  check('P5 two parts: the staves are A,P,P,Q,Q', order(score) === 'A,P,P,Q,Q', order(score));
  check('P5 inside the first part goes after it', score.resolveNewPartIndex(3) === 3);
  check('P5 inside the second part goes after it', score.resolveNewPartIndex(5) === 5);
}
// --- A6, A7: a two-stave part ---
{
  const score = buildScore(['A', 'B']);
  const index = addPart(score, 2, { twoStaves: true, name: 'Pn', abbreviation: 'Pn.' });
  const first = score.staves[index].partInfo;
  const second = score.staves[index + 1].partInfo;
  check('A6 two adjacent staves are added', order(score) === 'A,Pn,Pn,B', order(score));
  check('A6 the first staff has a stave after it', first.stavesAfter === 1 && first.stavesBefore === 0);
  check('A6 the second staff has a stave before it', second.stavesAfter === 0 && second.stavesBefore === 1);
  check('A6 both have the abbreviation', first.partAbbreviation === 'Pn.' && second.partAbbreviation === 'Pn.');
  check('A6 the second staff has the opposite clef',
    score.staves[index].measures[0].clef === 'treble' && score.staves[index + 1].measures[0].clef === 'bass');
  check('A6 the part infos are not shared', first !== second);
  const i1 = score.staves[index].measureInstrumentMap[0];
  const i2 = score.staves[index + 1].measureInstrumentMap[0];
  check('A6 each instrument names its own staff', i1.startSelector.staff === index && i2.startSelector.staff === index + 1,
    `${i1.startSelector.staff} ${i2.startSelector.staff}`);
}
{
  const score = buildScoreWithPart();
  const index = addPart(score, 3, { twoStaves: true, name: 'Q' });
  check('A7 a two-stave part inside a two-stave part goes after it', order(score) === 'A,P1,P2,Q,Q,C' && index === 3, order(score));
  check('A7 the existing part is intact', score.staves[1].partInfo.stavesAfter === 1 && score.staves[2].partInfo.stavesBefore === 1);
}
// --- A2, A3: names ---
{
  const score = buildScore(['A']);
  addPart(score, 2, { name: '', instrumentLabel: 'Cello' });
  addPart(score, 3, { name: '   ', instrumentLabel: 'Flute' });
  addPart(score, 4, { name: ' Cello I ', abbreviation: ' Vc. I ', instrumentLabel: 'Cello' });
  check('A2 a blank name becomes the instrument name', score.staves[1].partInfo.partName === 'Cello');
  check('A2 a name of spaces becomes the instrument name', score.staves[2].partInfo.partName === 'Flute');
  check('A3 a typed name and abbreviation are kept, trimmed',
    score.staves[3].partInfo.partName === 'Cello I' && score.staves[3].partInfo.partAbbreviation === 'Vc. I');
  check('A3 no abbreviation is empty', score.staves[1].partInfo.partAbbreviation === '');
}
// --- A4, A5: the text group setting ---
{
  const score = buildScore(['A']);
  const one = addPart(score, 2, { name: 'One' });
  const two = addPart(score, 3, { twoStaves: true, name: 'Two' });
  check('A4 a part from addPart keeps its text groups', score.staves[one].partInfo.preserveTextGroups === true);
  check('A4 so do both staves of a two-stave part',
    score.staves[two].partInfo.preserveTextGroups === true && score.staves[two + 1].partInfo.preserveTextGroups === true);
  check('A4 the default is unchanged', SmoPartInfo.defaults.preserveTextGroups === false);
  check('A5 a staff added another way has the default', score.staves[0].partInfo.preserveTextGroups === false);
  const other = score.addStaff(staffParams(score.staves.length));
  check('A5 so does one added with addStaff', other.partInfo.preserveTextGroups === false);
}
// --- groups for the new staves ---
{
  const score = buildScore(['A', 'B']);
  addPart(score, 3, { twoStaves: true, name: 'P' });
  const grp = score.getSystemGroupForStaffId(2);
  check('G1 a new two-stave part is grouped with the staff above', !!grp && grp.startSelector.staff <= 1 && grp.endSelector.staff === 3);
  const first = buildScore(['A', 'B']);
  addPart(first, 1, { name: 'N' });
  check('G2 a part at the top leaves every group inside the score',
    first.systemGroups.every((g) => g.startSelector.staff >= 0 && g.endSelector.staff < first.staves.length));
}
// --- C1-C3: the dialog helpers ---
{
  const clamped = [0, 1, 4, 5, 2.6, NaN, '3', undefined].map((value) => clampPartLocation(value, 3));
  check('C1 locations are held to 1..N+1', clamped.join(',') === '1,1,4,4,3,4,4,4', clamped.join(','));
  check('C2 a blank name is the instrument name', resolvePartName('', 'Cello') === 'Cello' && resolvePartName('  ', 'Cello') === 'Cello');
  check('C2 a typed name is trimmed', resolvePartName('Cello I', 'Cello') === 'Cello I' && resolvePartName(' Vc ', 'Cello') === 'Vc');
  check('C2 an undefined name is the instrument name', resolvePartName(undefined as any, 'Cello') === 'Cello');
  const values = instrumentChoices.map((choice) => choice.value);
  check('C3 no instrument is listed twice', new Set(values).size === values.length);
  check('C3 an instrument has its label', instrumentLabelFor('cello') === 'Cello' && instrumentLabelFor('trumpet') === 'Bb Trumpet');
  check('C3 an unknown instrument is its own label', instrumentLabelFor('theremin') === 'theremin');
  check('C3 every instrument has a label', instrumentChoices.every((choice) => choice.label.length > 0));
}
// --- S1: serialization ---
{
  const score = buildScore(['A']);
  addPart(score, 1, { name: 'One', abbreviation: '1.' });
  addPart(score, 3, { twoStaves: true, name: 'Two', abbreviation: '2.' });
  const json = JSON.stringify(score.serialize({ skipStaves: false, useDictionary: false, preserveStaffIds: true }));
  const back = SmoScore.deserialize(json);
  const infos = back.staves.map((staff) => staff.partInfo);
  check('S1 names survive', back.staves.length === 4 && infos[0].partName === 'One' && infos[2].partName === 'Two' && infos[3].partName === 'Two',
    infos.map((i) => i.partName).join(','));
  check('S1 abbreviations survive', infos[0].partAbbreviation === '1.' && infos[3].partAbbreviation === '2.');
  check('S1 the setting survives', infos[0].preserveTextGroups && infos[2].preserveTextGroups && infos[3].preserveTextGroups);
  check('S1 the links survive', infos[2].stavesAfter === 1 && infos[3].stavesBefore === 1 && infos[3].stavesAfter === 0);
  check('S1 staves are numbered', back.staves.every((staff, ix) => staff.staffId === ix));
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
