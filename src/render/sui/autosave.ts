// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
/**
 * Autosave: a rolling set of score snapshots kept in the browser's local storage, and the
 * timing rule that decides when to take one.  Storage and timer are passed in, and nothing here
 * touches the DOM except `createLocalAutosaveStorage`, so it can be tested without a browser.
 * The Quick Save slot is never read or written here.
 * @module /render/sui/autosave
 */

/**
 * The part of the browser's storage that autosave uses, so a test can supply a fake.
 * @category SuiRender
 */
export interface AutosaveStorage {
  getItem(key: string): string | null;
  /** may throw if there is no room */
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * One snapshot in the index.  The score itself is stored under its own key.
 * @category SuiRender
 */
export interface AutosaveEntry {
  /** increases with each snapshot, so it gives the order even if the clock is changed */
  id: number;
  /** milliseconds since the epoch, for display */
  time: number;
  /** the score's name when the snapshot was taken */
  title: string;
  /** length of the stored text, to detect a truncated entry */
  size: number;
}

/**
 * Starts and cancels a one-shot timer, so a test can supply a fake.
 * @category SuiRender
 */
export interface AutosaveTimer {
  set(cb: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

const indexKey = '_smoosicAutosaveIndex';
const entryKeyPrefix = '_smoosicAutosave.';

const entryKey = (id: number): string => {
  return entryKeyPrefix + id.toString();
}

/**
 * The rolling set of snapshots.  The index is read from storage on every call, so two tabs using
 * the same storage share one set.
 * @category SuiRender
 */
export class AutosaveStore {
  storage: AutosaveStorage;
  constructor(storage: AutosaveStorage) {
    this.storage = storage;
  }
  private readIndex(): AutosaveEntry[] {
    let entries: AutosaveEntry[] = [];
    try {
      const text = this.storage.getItem(indexKey);
      const parsed = text ? JSON.parse(text) : [];
      if (Array.isArray(parsed)) {
        entries = parsed.filter((ee) => ee && typeof (ee.id) === 'number' && typeof (ee.size) === 'number');
      }
    } catch (e) {
      entries = [];
    }
    return entries.sort((a, b) => a.id - b.id);
  }
  private writeIndex(entries: AutosaveEntry[]): boolean {
    try {
      this.storage.setItem(indexKey, JSON.stringify(entries));
      return true;
    } catch (e) {
      return false;
    }
  }
  private removeEntry(entry: AutosaveEntry) {
    try {
      this.storage.removeItem(entryKey(entry.id));
    } catch (e) {
      // nothing to be done
    }
  }
  /**
   * @returns the snapshots, oldest first.  Entries whose text is gone are dropped from the index.
   */
  list(): AutosaveEntry[] {
    const entries = this.readIndex();
    const present = entries.filter((ee) => {
      try {
        return this.storage.getItem(entryKey(ee.id)) !== null;
      } catch (e) {
        return false;
      }
    });
    if (present.length !== entries.length) {
      this.writeIndex(present);
    }
    return present;
  }
  /**
   * Add a snapshot, keeping at most `maxCount`.  If the storage is full, the oldest snapshots are
   * given up until the new one fits.
   * @param text the encoded score
   * @param title the score's name
   * @param time milliseconds since the epoch
   * @param maxCount the most snapshots to keep
   * @returns the new entry, or null if it could not be stored.  Never throws.
   */
  add(text: string, title: string, time: number, maxCount: number): AutosaveEntry | null {
    const entries = this.list();
    const nextId = entries.length > 0 ? entries[entries.length - 1].id + 1 : 1;
    const entry: AutosaveEntry = { id: nextId, time, title, size: text.length };
    let stored = false;
    while (!stored) {
      try {
        this.storage.setItem(entryKey(entry.id), text);
        stored = true;
      } catch (e) {
        const oldest = entries.shift();
        if (!oldest) {
          break;
        }
        this.removeEntry(oldest);
      }
    }
    if (!stored) {
      // whatever was given up to make room is gone; keep the index in step
      this.writeIndex(entries);
      return null;
    }
    entries.push(entry);
    const keep = Math.max(1, Math.floor(maxCount));
    while (entries.length > keep) {
      this.removeEntry(entries.shift()!);
    }
    // The text is written before the index, so a failure here leaves a stray text key and no
    // index entry that points at nothing.
    while (!this.writeIndex(entries)) {
      if (entries.length <= 1) {
        this.removeEntry(entry);
        return null;
      }
      this.removeEntry(entries.shift()!);
    }
    return entry;
  }
  /**
   * @returns the stored text, or null if it is missing or its length is not what was recorded
   */
  read(id: number): string | null {
    const entry = this.readIndex().find((ee) => ee.id === id);
    if (!entry) {
      return null;
    }
    try {
      const text = this.storage.getItem(entryKey(id));
      if (text === null || text.length !== entry.size) {
        return null;
      }
      return text;
    } catch (e) {
      return null;
    }
  }
  /** Drop the oldest snapshots so at most `maxCount` remain */
  trim(maxCount: number) {
    const entries = this.list();
    const keep = Math.max(1, Math.floor(maxCount));
    if (entries.length <= keep) {
      return;
    }
    while (entries.length > keep) {
      this.removeEntry(entries.shift()!);
    }
    this.writeIndex(entries);
  }
}

/**
 * Decides when to take a snapshot.  The first change after a snapshot starts a one-shot timer;
 * further changes do nothing until it fires, so there is one snapshot per interval and none for
 * a score that has not changed.
 * @category SuiRender
 */
export class AutosaveScheduler {
  private timer: AutosaveTimer;
  private takeSnapshot: () => void | Promise<void>;
  private handle: unknown = null;
  private isArmed: boolean = false;
  constructor(timer: AutosaveTimer, takeSnapshot: () => void | Promise<void>) {
    this.timer = timer;
    this.takeSnapshot = takeSnapshot;
  }
  /** true if a snapshot is waiting for its timer */
  get armed(): boolean {
    return this.isArmed;
  }
  private start(intervalMinutes: number) {
    this.isArmed = true;
    this.handle = this.timer.set(() => this.fire(), intervalMinutes * 60000);
  }
  private fire() {
    // Go idle first: a change made while the snapshot is being taken arms the next one.
    this.isArmed = false;
    this.handle = null;
    try {
      const result = this.takeSnapshot();
      if (result && typeof ((result as Promise<void>).catch) === 'function') {
        (result as Promise<void>).catch(() => { });
      }
    } catch (e) {
      // a failed snapshot is not reported while the user is editing
    }
  }
  /** The score changed.  Starts the timer if none is running. */
  noteChange(intervalMinutes: number) {
    if (!this.isArmed) {
      this.start(intervalMinutes);
    }
  }
  /** Forget any pending snapshot, e.g. because another score was loaded */
  reset() {
    if (this.handle !== null) {
      this.timer.clear(this.handle);
    }
    this.handle = null;
    this.isArmed = false;
  }
  /** The interval setting changed.  A pending timer starts again from now. */
  retime(intervalMinutes: number) {
    if (!this.isArmed) {
      return;
    }
    if (this.handle !== null) {
      this.timer.clear(this.handle);
    }
    this.start(intervalMinutes);
  }
}

/**
 * @returns the browser's local storage if it can be used, otherwise null (private browsing,
 * blocked site data, or running as a library with no browser)
 */
export const createLocalAutosaveStorage = (): AutosaveStorage | null => {
  try {
    if (typeof (window) === 'undefined' || !window.localStorage) {
      return null;
    }
    const probe = '_smoosicAutosaveProbe';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch (e) {
    return null;
  }
}
