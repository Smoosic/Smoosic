// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SmoSelector } from '../../smo/xform/selections';
import lyricComp from '../components/dialogs/lyric.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiLyricDialog (src/ui/dialogs/lyric.ts),
 * following the SuiTextBlockDialogVue creation-function pattern.
 * SuiLyricDialog and its call sites are unchanged; nothing wires callers
 * over to this function yet (see specs/010-vue-lyric-dialog).
 */
export const SuiLyricDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const view = parameters.view;
  const tracker = view.tracker;
  const initialSelector: SmoSelector = JSON.parse(JSON.stringify(tracker.selections[0].selector));

  // Lyric text, deletions, verse/Y/font changes are all committed to the
  // score incrementally as the user types/navigates/deletes/adjusts
  // (see specs/010-vue-lyric-dialog/research.md §3-4, §8) -- unlike
  // SuiTextBlockDialogVue, there is no working copy to commit or revert
  // at dialog-close time, matching SuiLyricDialog wiring both its OK and
  // Cancel buttons to the same no-groupUndo _complete(). lyric.vue's own
  // handleCommit/handleCancel do the one remaining thing (commit whatever
  // note is currently being edited) before calling these.
  const commitCb = async () => {};
  const cancelCb = async () => {};

  const appParams = {
    domId: rootId,
    label: 'Lyric Editor',
    view,
    initialSelector
  };

  InstallDialog({
    root: rootId,
    app: lyricComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
};
