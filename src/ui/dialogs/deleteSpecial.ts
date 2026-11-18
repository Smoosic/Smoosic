// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoOperation, DeleteAttributeKind } from '../../smo/xform/operations';
import { replaceVueRoot, modalContainerId } from '../common';
import deleteSpecialApp from '../components/dialogs/deleteSpecial.vue';
import { reactive } from 'vue';
import { SuiDialogParams, InstallDialog } from './dialog';

/** The names of the kinds of marking in the dialog */
const deleteKindLabels: Record<DeleteAttributeKind, string> = {
  dynamics: 'Dynamics',
  lyrics: 'Lyrics',
  annotations: 'Annotations',
  chords: 'Chords',
  articulations: 'Articulations',
  ornaments: 'Ornaments',
  graceNotes: 'Grace Notes',
  arpeggios: 'Arpeggios',
  microtones: 'Microtones'
};

/**
 * Delete Special.  Choose which kinds of marking attached to the selected notes (dynamics, lyrics,
 * annotations, chords, articulations, ornaments, grace notes, arpeggios, microtones) to remove.  The notes
 * themselves are not changed.
 * @category SuiDialog
 */
export const SuiDeleteSpecialDialog = async (parameters: SuiDialogParams) => {
  // nothing is chosen at first, so a delete is always a deliberate choice
  const selected: Record<string, boolean> = reactive({});
  SmoOperation.deleteAttributeKinds.forEach((kind) => {
    selected[kind] = false;
  });
  const commitCb = async () => {
    const kinds = SmoOperation.deleteAttributeKinds.filter((kind) => selected[kind]);
    await parameters.view.deleteNoteAttributes(kinds);
  }
  const cancelCb = async () => {
  }
  const rootId = replaceVueRoot(modalContainerId);
  const appParams = {
    domId: rootId,
    label: 'Delete Special',
    kinds: SmoOperation.deleteAttributeKinds.map((kind) => ({ id: kind, label: deleteKindLabels[kind] })),
    selected,
    commitCb,
    cancelCb
  };
  InstallDialog({
    app: deleteSpecialApp,
    appParams,
    root: rootId,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
}
