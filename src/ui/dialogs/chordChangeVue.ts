// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SmoSelector } from '../../smo/xform/selections';
import chordComp from '../components/dialogs/chord.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiChordChangeDialog (src/ui/dialogs/chordChange.ts),
 * following the SuiLyricDialogVue creation-function pattern (010-vue-lyric-dialog).
 * SuiChordChangeDialog and its call sites are unchanged; nothing wires callers
 * over to this function yet (see specs/013-vue-chord-dialog).
 */
export const SuiChordChangeDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const view = parameters.view;
  const tracker = view.tracker;
  const initialSelector: SmoSelector = JSON.parse(JSON.stringify(tracker.selections[0].selector));

  // Chord symbol text, deletions, and ordinality/Y/font/adjust-width changes
  // are all committed to the score incrementally as the user types/navigates/
  // deletes/adjusts (chord.vue's commitIfChanged/navigate/deleteCurrent/
  // onYChange/onFontChange/onAdjustWidthChange) -- there is no working copy
  // to commit or revert at dialog-close time, matching SuiChordChangeDialog
  // wiring both its OK and Cancel buttons to the same no-groupUndo _complete().
  // chord.vue's own handleCommit/handleCancel do the one remaining thing
  // (commit whatever note is currently being edited) before calling these.
  const commitCb = async () => {};
  const cancelCb = async () => {};

  const appParams = {
    domId: rootId,
    label: 'Edit Chord Symbol',
    view,
    initialSelector
  };

  InstallDialog({
    root: rootId,
    app: chordComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
};
