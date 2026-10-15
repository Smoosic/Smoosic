/**
 * Guards for the removal of PromiseHelpers from the application (cases P1-P9 in
 * specs/029-remove-promise-helpers/contracts/public-api-contract.md):
 *  - the application source does not use the helper, except for its own file and the export file
 *  - the helper class is still exported and still behaves as before, for external applications
 *
 * Run with: npm run test:promise-helpers
 */
import * as fs from 'fs';
import * as path from 'path';
import { PromiseHelpers, TEmptyPromise } from '../src/common/promiseHelpers';

let failures = 0;
const check = (name: string, condition: boolean, detail?: string) => {
  if (condition) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}${detail ? ' -- ' + detail : ''}`);
  }
};

const srcRoot = path.resolve(__dirname, '..', 'src');
const allowed = [
  path.join(srcRoot, 'common', 'promiseHelpers.ts'),
  path.join(srcRoot, 'application', 'exports.ts')
];
const extensions = ['.ts', '.vue', '.js'];

/** All source files under dir with a checked extension */
const listFiles = (dir: string): string[] => {
  let rv: string[] = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rv = rv.concat(listFiles(full));
    } else if (extensions.indexOf(path.extname(entry.name)) >= 0) {
      rv.push(full);
    }
  });
  return rv;
};
const rel = (file: string) => path.relative(srcRoot, file).replace(/\\/g, '/');

// --- P1, P2: the application does not use the helpers ---
{
  const usingHelper: string[] = [];
  const usingMethods: string[] = [];
  listFiles(srcRoot).forEach((file) => {
    if (allowed.indexOf(file) >= 0) {
      return;
    }
    const text = fs.readFileSync(file, 'utf8');
    if (text.indexOf('PromiseHelpers') >= 0) {
      usingHelper.push(rel(file));
    }
    if (/\b(emptyPromise|makePromise)\(/.test(text)) {
      usingMethods.push(rel(file));
    }
  });
  check('P1 no application file mentions PromiseHelpers', usingHelper.length === 0, usingHelper.join(', '));
  check('P2 no application file calls emptyPromise or makePromise', usingMethods.length === 0, usingMethods.join(', '));
}

// --- P3: still part of the public exports ---
{
  const exportsText = fs.readFileSync(path.join(srcRoot, 'application', 'exports.ts'), 'utf8');
  check('P3 exports.ts re-exports the module', exportsText.indexOf("export * from '../common/promiseHelpers'") >= 0);
  check('P3 exports.ts lists PromiseHelpers', /[\s,]PromiseHelpers\s*,/.test(exportsText));
}

// --- P4: methods exist ---
for (const method of ['makePromise', 'makePromiseObj', 'promiseChainThen', 'emptyPromise']) {
  check(`P4 PromiseHelpers.${method} is a function`, typeof (PromiseHelpers as any)[method] === 'function');
}

const main = async () => {
  // --- P5: emptyPromise ---
  {
    const value = await PromiseHelpers.emptyPromise();
    check('P5 emptyPromise resolves', value === undefined);
  }

  // --- P6: makePromise, condition true on the 3rd poll ---
  {
    let polls = 0;
    let pollCalls = 0;
    let preResolveCalls = 0;
    await PromiseHelpers.makePromise(
      () => { polls += 1; return polls >= 3; },
      () => { preResolveCalls += 1; },
      () => { pollCalls += 1; },
      5
    );
    check('P6 makePromise tests the condition until it is true', polls === 3, `polls=${polls}`);
    check('P6 pre-resolve method is called once', preResolveCalls === 1, `calls=${preResolveCalls}`);
    check('P6 poll method is called once per failed test', pollCalls === 2, `calls=${pollCalls}`);
  }

  // --- P7: makePromise, condition already true: still waits one poll interval before testing ---
  {
    let pollCalls = 0;
    let preResolveCalls = 0;
    let tested = false;
    const start = Date.now();
    await PromiseHelpers.makePromise(
      () => { tested = true; return true; },
      () => { preResolveCalls += 1; },
      () => { pollCalls += 1; },
      30
    );
    const elapsed = Date.now() - start;
    check('P7 makePromise waits one interval before the first test', tested && elapsed >= 20, `elapsed=${elapsed}`);
    check('P7 pre-resolve called once, poll method never', preResolveCalls === 1 && pollCalls === 0);
  }

  // --- P8: promiseChainThen runs the sets in order ---
  {
    const order: string[] = [];
    let first = 0;
    let second = 0;
    await PromiseHelpers.promiseChainThen([
      PromiseHelpers.makePromiseObj(() => { first += 1; return first >= 2; }, () => { order.push('first'); }, null, 5),
      PromiseHelpers.makePromiseObj(() => { second += 1; return second >= 2; }, () => { order.push('second'); }, null, 5)
    ]);
    check('P8 promiseChainThen reaches both end conditions in order', order.join(',') === 'first,second', order.join(','));
  }

  // --- P9: TEmptyPromise ---
  {
    const value = await TEmptyPromise('x');
    check('P9 TEmptyPromise resolves with its value', value === 'x');
  }

  if (failures > 0) {
    console.log(`${failures} check(s) failed`);
    process.exitCode = 1;
  } else {
    console.log('all checks passed');
  }
};
main();
