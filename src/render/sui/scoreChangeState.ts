// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
/**
 * Pure helpers for tracking whether a score has unsaved changes, and for deciding what to
 * do after the user tries to save it.  No imports, so they can be tested without a DOM.
 * @module /render/sui/scoreChangeState
 */

/**
 * How the Save dialog closed.  `saved` means the score was written in a full-fidelity
 * format, `exported` means it was written in a lossy format (MusicXML, MIDI...), and
 * `cancelled` means nothing was written.
 * @category SuiRender
 */
export type SaveOutcome = 'saved' | 'exported' | 'cancelled';
/**
 * What the user chose when asked about unsaved changes before another score replaces the open one.
 * @category SuiRender
 */
export type UnsavedChoice = 'save' | 'discard' | 'cancel';
/**
 * What to do with the score the user wanted to load, after the Save dialog closes.
 * @category SuiRender
 */
export type AfterSaveStep = 'load' | 'prompt' | 'abort';

/**
 * Whether a file extension holds the whole score.  Only a save in the full Smoosic
 * format can clear the unsaved-changes indicator, since the other formats lose information.
 * @param extension e.g. '.json'
 */
export function isFullSaveFormat(extension: string): boolean {
  return typeof (extension) === 'string' && extension.trim().toLowerCase() === '.json';
}

/**
 * The score portion of the sidebar header: the score's name, or 'Untitled' if it has none,
 * with a trailing asterisk if the score has unsaved changes.
 * @param name the name from the score's information
 * @param changed true if the score has changed since it was last saved
 */
export function formatScoreTitle(name: string, changed: boolean): string {
  const trimmed = (name ?? '').trim();
  const title = trimmed.length > 0 ? trimmed : 'Untitled';
  return changed ? `${title}*` : title;
}

/**
 * After the user chose to save before loading another score: load it if the score was
 * saved in full, ask again if it was only exported to a lossy format, and stop if the
 * save was abandoned.
 * @param outcome how the Save dialog closed
 */
export function nextStepAfterSave(outcome: SaveOutcome): AfterSaveStep {
  if (outcome === 'saved') {
    return 'load';
  }
  if (outcome === 'exported') {
    return 'prompt';
  }
  return 'abort';
}
