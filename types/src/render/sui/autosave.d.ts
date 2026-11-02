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
/**
 * The rolling set of snapshots.  The index is read from storage on every call, so two tabs using
 * the same storage share one set.
 * @category SuiRender
 */
export declare class AutosaveStore {
    storage: AutosaveStorage;
    constructor(storage: AutosaveStorage);
    private readIndex;
    private writeIndex;
    private removeEntry;
    /**
     * @returns the snapshots, oldest first.  Entries whose text is gone are dropped from the index.
     */
    list(): AutosaveEntry[];
    /**
     * Add a snapshot, keeping at most `maxCount`.  If the storage is full, the oldest snapshots are
     * given up until the new one fits.
     * @param text the encoded score
     * @param title the score's name
     * @param time milliseconds since the epoch
     * @param maxCount the most snapshots to keep
     * @returns the new entry, or null if it could not be stored.  Never throws.
     */
    add(text: string, title: string, time: number, maxCount: number): AutosaveEntry | null;
    /**
     * @returns the stored text, or null if it is missing or its length is not what was recorded
     */
    read(id: number): string | null;
    /** Drop the oldest snapshots so at most `maxCount` remain */
    trim(maxCount: number): void;
}
/**
 * Decides when to take a snapshot.  The first change after a snapshot starts a one-shot timer;
 * further changes do nothing until it fires, so there is one snapshot per interval and none for
 * a score that has not changed.
 * @category SuiRender
 */
export declare class AutosaveScheduler {
    private timer;
    private takeSnapshot;
    private handle;
    private isArmed;
    constructor(timer: AutosaveTimer, takeSnapshot: () => void | Promise<void>);
    /** true if a snapshot is waiting for its timer */
    get armed(): boolean;
    private start;
    private fire;
    /** The score changed.  Starts the timer if none is running. */
    noteChange(intervalMinutes: number): void;
    /** Forget any pending snapshot, e.g. because another score was loaded */
    reset(): void;
    /** The interval setting changed.  A pending timer starts again from now. */
    retime(intervalMinutes: number): void;
}
/**
 * @returns the browser's local storage if it can be used, otherwise null (private browsing,
 * blocked site data, or running as a library with no browser)
 */
export declare const createLocalAutosaveStorage: () => AutosaveStorage | null;
