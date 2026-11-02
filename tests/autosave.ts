/**
 * Headless checks for autosave: the settings in the score preferences, the rolling set of
 * snapshots, and the rule for when a snapshot is taken.  Cases A, S and T are listed in
 * specs/036-autosave-recovery/contracts/autosave-api.md.
 *
 * Run with: npm run test:autosave
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoScorePreferences, clampAutosaveInterval, clampAutosaveCount, scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';
import { noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { AutosaveStore, AutosaveScheduler, AutosaveStorage, AutosaveTimer } from '../src/render/sui/autosave';

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

/** In-memory storage.  `failWrites` makes the next n writes throw; `quota` limits the total text held. */
class FakeStorage implements AutosaveStorage {
  data: Map<string, string> = new Map();
  failWrites: number = 0;
  alwaysFail: boolean = false;
  quota: number = Infinity;
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string) {
    if (this.alwaysFail) {
      throw new Error('full');
    }
    if (this.failWrites > 0) {
      this.failWrites -= 1;
      throw new Error('full');
    }
    let total = value.length;
    this.data.forEach((v, k) => {
      if (k !== key) {
        total += v.length;
      }
    });
    if (total > this.quota) {
      throw new Error('full');
    }
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  textKeys(): string[] {
    return Array.from(this.data.keys()).filter((kk) => kk.startsWith('_smoosicAutosave.'));
  }
}

/** Records timers instead of running them */
class FakeTimer implements AutosaveTimer {
  pending: Map<number, { cb: () => void, ms: number }> = new Map();
  nextHandle: number = 1;
  setCount: number = 0;
  set(cb: () => void, ms: number): unknown {
    const handle = this.nextHandle++;
    this.setCount += 1;
    this.pending.set(handle, { cb, ms });
    return handle;
  }
  clear(handle: unknown) {
    this.pending.delete(handle as number);
  }
  fire() {
    const first = Array.from(this.pending.entries())[0];
    if (first) {
      this.pending.delete(first[0]);
      first[1].cb();
    }
  }
  get delays(): number[] {
    return Array.from(this.pending.values()).map((pp) => pp.ms);
  }
}

// --- A1-A5: settings ---
{
  const legacy = new SmoScorePreferences({ ...SmoScorePreferences.defaults, autosaveInterval: undefined, autosaveCount: undefined });
  check('A1 legacy preferences get interval 10', legacy.autosaveInterval === 10);
  check('A1 legacy preferences get count 10', legacy.autosaveCount === 10);
  const noFields: any = { ...SmoScorePreferences.defaults };
  delete noFields.autosaveInterval;
  delete noFields.autosaveCount;
  const legacy2 = new SmoScorePreferences(noFields);
  check('A1 absent fields get the defaults', legacy2.autosaveInterval === 10 && legacy2.autosaveCount === 10);

  const intervals: [any, number][] = [[0, 5], [4, 5], [61, 60], [7.6, 8], [NaN, 10], ['12', 10], [Infinity, 10], [5, 5], [60, 60], [-3, 5]];
  intervals.forEach(([input, expected]) => {
    check(`A2 interval ${String(input)} becomes ${expected}`, clampAutosaveInterval(input) === expected,
      String(clampAutosaveInterval(input)));
  });
  const counts: [any, number][] = [[0, 1], [21, 20], [3.2, 3], [undefined, 10], [null, 10], [1, 1], [20, 20], [-1, 1]];
  counts.forEach(([input, expected]) => {
    check(`A3 count ${String(input)} becomes ${expected}`, clampAutosaveCount(input) === expected,
      String(clampAutosaveCount(input)));
  });
  const built = new SmoScorePreferences({ ...SmoScorePreferences.defaults, autosaveInterval: 200, autosaveCount: 0 });
  check('A2 constructor limits the interval', built.autosaveInterval === 60);
  check('A3 constructor limits the count', built.autosaveCount === 1);

  const custom = new SmoScorePreferences({ ...SmoScorePreferences.defaults, autosaveInterval: 25, autosaveCount: 4 });
  const again = new SmoScorePreferences(JSON.parse(JSON.stringify(custom.serialize())));
  check('A4 settings survive serialize and construct', again.autosaveInterval === 25 && again.autosaveCount === 4);
  const defs = SmoScorePreferences.defaults;
  check('A5 defaults are 10 and 10', defs.autosaveInterval === 10 && defs.autosaveCount === 10);
}

// --- A6: settings survive a score round trip, and an old score loads with the defaults ---
{
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  score.preferences.autosaveInterval = 25;
  score.preferences.autosaveCount = 4;
  const json = JSON.stringify(score.serialize({ skipStaves: false, useDictionary: false, preserveStaffIds: false }));
  const back = SmoScore.deserialize(json);
  check('A6 score round trip keeps the interval', back.preferences.autosaveInterval === 25);
  check('A6 score round trip keeps the count', back.preferences.autosaveCount === 4);
  const old = JSON.parse(json);
  delete old.metadata.preferences.autosaveInterval;
  delete old.metadata.preferences.autosaveCount;
  const oldScore = SmoScore.deserialize(JSON.stringify(old));
  check('A6 an old score gets the default interval and count',
    oldScore.preferences.autosaveInterval === 10 && oldScore.preferences.autosaveCount === 10);
}

// --- S1-S11: the snapshot set ---
{
  const storage = new FakeStorage();
  const store = new AutosaveStore(storage);
  check('S1 empty store lists nothing', store.list().length === 0);
  const e1 = store.add('aaaa', 'One', 1000, 10);
  const e2 = store.add('bbbbbb', 'Two', 2000, 10);
  const e3 = store.add('cc', 'Three', 3000, 10);
  const list = store.list();
  check('S2 three snapshots listed', list.length === 3);
  check('S2 ids increase, oldest first', list[0].id < list[1].id && list[1].id < list[2].id);
  check('S2 titles are kept', list.map((ee) => ee.title).join(',') === 'One,Two,Three');
  check('S2 read returns the text', store.read(e2!.id) === 'bbbbbb' && store.read(e1!.id) === 'aaaa');
  check('S2 entry records size and time', e3!.size === 2 && e3!.time === 3000);
  check('S2 read of an unknown id is null', store.read(999) === null);

  const e4 = store.add('dddd', 'Four', 4000, 3);
  check('S3 adding past the limit keeps three', store.list().length === 3);
  check('S3 the oldest was dropped', store.list()[0].title === 'Two' && store.read(e1!.id) === null);
  check('S3 the dropped text key is gone', storage.getItem('_smoosicAutosave.' + e1!.id) === null);
  check('S3 the new snapshot is the newest', store.list()[2].id === e4!.id);
}
{
  const storage = new FakeStorage();
  const store = new AutosaveStore(storage);
  for (let ii = 0; ii < 4; ii++) {
    store.add('text' + ii, 'T' + ii, ii, 10);
  }
  store.trim(2);
  check('S4 trim leaves the two newest', store.list().map((ee) => ee.title).join(',') === 'T2,T3');
  check('S4 trimmed text keys are gone', storage.textKeys().length === 2);
  store.trim(5);
  check('S4 trim to a larger limit changes nothing', store.list().length === 2);
}
{
  const storage = new FakeStorage();
  const store = new AutosaveStore(storage);
  store.add('first', 'A', 1, 10);
  store.add('second', 'B', 2, 10);
  storage.failWrites = 1;
  const added = store.add('third', 'C', 3, 10);
  check('S5 a full storage gives up the oldest and retries', added !== null);
  check('S5 the oldest is gone, the rest remain', store.list().map((ee) => ee.title).join(',') === 'B,C');
}
{
  const storage = new FakeStorage();
  const store = new AutosaveStore(storage);
  store.add('first', 'A', 1, 10);
  store.add('second', 'B', 2, 10);
  storage.alwaysFail = true;
  let threw = false;
  let result: any = 'unset';
  try {
    result = store.add('third', 'C', 3, 10);
  } catch (e) {
    threw = true;
  }
  check('S6 a storage that always fails does not throw', !threw);
  check('S6 add returns null', result === null);
  storage.alwaysFail = false;
  const survivors = store.list();
  check('S6 every listed snapshot still has its text', survivors.every((ee) => store.read(ee.id) !== null));
  check('S6 the new snapshot was not stored', survivors.every((ee) => ee.title !== 'C'));
}
{
  const storage = new FakeStorage();
  const store = new AutosaveStore(storage);
  const a = store.add('one', 'A', 1, 10);
  store.add('two', 'B', 2, 10);
  storage.removeItem('_smoosicAutosave.' + a!.id);
  check('S7 an entry with no text is not listed', store.list().map((ee) => ee.title).join(',') === 'B');
  const idx = JSON.parse(storage.getItem('_smoosicAutosaveIndex')!);
  check('S7 and is removed from the index', idx.length === 1);
}
{
  const storage = new FakeStorage();
  const store = new AutosaveStore(storage);
  const a = store.add('abcdefgh', 'A', 1, 10);
  storage.setItem('_smoosicAutosave.' + a!.id, 'abc');
  check('S8 truncated text reads as null', store.read(a!.id) === null);
  check('S8 a truncated entry is still listed', store.list().length === 1);
}
{
  const storage = new FakeStorage();
  const store = new AutosaveStore(storage);
  store.add('one', 'A', 1, 10);
  const b = store.add('two', 'B', 2, 10);
  const c = store.add('three', 'C', 3, 10);
  storage.removeItem('_smoosicAutosave.' + c!.id);
  const d = store.add('four', 'D', 4, 10);
  check('S9 the next id follows the largest remaining', d!.id === b!.id + 1);
  const ids = store.list().map((ee) => ee.id);
  check('S9 ids stay strictly increasing', ids.every((id, ii) => ii === 0 || id > ids[ii - 1]));
}
{
  const storage = new FakeStorage();
  storage.setItem('_smoosicScore', '{"quick":"save"}');
  const store = new AutosaveStore(storage);
  store.add('one', 'A', 1, 2);
  store.add('two', 'B', 2, 2);
  store.add('three', 'C', 3, 2);
  store.trim(1);
  storage.failWrites = 1;
  store.add('four', 'D', 4, 2);
  storage.alwaysFail = true;
  store.add('five', 'E', 5, 2);
  storage.alwaysFail = false;
  check('S10 the Quick Save slot is never changed', storage.getItem('_smoosicScore') === '{"quick":"save"}');
}
{
  const storage = new FakeStorage();
  const tabA = new AutosaveStore(storage);
  const tabB = new AutosaveStore(storage);
  tabA.add('a1', 'A1', 1, 3);
  tabB.add('b1', 'B1', 2, 3);
  tabA.add('a2', 'A2', 3, 3);
  check('S11 each tab sees the other\'s snapshots', tabB.list().length === 3);
  tabB.add('b2', 'B2', 4, 3);
  check('S11 the limit holds across tabs', tabA.list().length === 3 && storage.textKeys().length === 3);
  check('S11 ids are unique', new Set(tabA.list().map((ee) => ee.id)).size === 3);
}

// --- T1-T9: the schedule ---
{
  const timer = new FakeTimer();
  let taken = 0;
  const sched = new AutosaveScheduler(timer, () => { taken += 1; });
  check('T1 starts idle', !sched.armed && timer.pending.size === 0);
  sched.noteChange(10);
  check('T1 a change arms the timer', sched.armed && timer.pending.size === 1);
  check('T1 for the interval in milliseconds', timer.delays[0] === 600000);

  for (let ii = 0; ii < 10; ii++) {
    sched.noteChange(10);
  }
  check('T2 more changes while armed set no more timers', timer.setCount === 1 && timer.pending.size === 1);
  timer.fire();
  check('T2 one snapshot for many changes', taken === 1);
  check('T3 after firing it is idle with no timer', !sched.armed && timer.pending.size === 0);

  sched.noteChange(10);
  timer.fire();
  check('T5 a change after a snapshot arms the next', taken === 2 && timer.setCount === 2);
}
{
  const timer = new FakeTimer();
  let taken = 0;
  const sched = new AutosaveScheduler(timer, () => { taken += 1; });
  sched.noteChange(10);
  sched.reset();
  check('T6 reset clears the timer', !sched.armed && timer.pending.size === 0);
  timer.fire();
  check('T6 and nothing is taken', taken === 0);
}
{
  const timer = new FakeTimer();
  const sched = new AutosaveScheduler(timer, () => { });
  sched.noteChange(10);
  sched.retime(20);
  check('T7 retime replaces the timer', timer.pending.size === 1 && timer.delays[0] === 20 * 60000 && sched.armed);
  const idle = new FakeTimer();
  const idleSched = new AutosaveScheduler(idle, () => { });
  idleSched.retime(20);
  check('T8 retime while idle sets nothing', idle.pending.size === 0 && !idleSched.armed);
}
{
  const timer = new FakeTimer();
  let calls = 0;
  const sched = new AutosaveScheduler(timer, async () => { calls += 1; throw new Error('failed'); });
  sched.noteChange(5);
  timer.fire();
  check('T9 a failing snapshot leaves the scheduler idle', !sched.armed && calls === 1);
  sched.noteChange(5);
  check('T9 and a later change arms it again', sched.armed && timer.pending.size === 1);
  const sync = new FakeTimer();
  const syncSched = new AutosaveScheduler(sync, () => { throw new Error('sync failure'); });
  syncSched.noteChange(5);
  let threw = false;
  try {
    sync.fire();
  } catch (e) {
    threw = true;
  }
  check('T9 a throwing snapshot does not escape the timer', !threw && !syncSched.armed);
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
