// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { PasteBuffer, PasteAttributeKind } from '../../smo/xform/copypaste';
import { replaceVueRoot, modalContainerId } from '../common';
import pasteSpecialApp from '../components/dialogs/pasteSpecial.vue';
import { reactive, ref, Ref } from 'vue';
import { SuiDialogParams, InstallDialog } from './dialog';

/** The names of the kinds of marking in the dialog */
const pasteKindLabels: Record<PasteAttributeKind, string> = {
  dynamics: 'Dynamics',
  lyrics: 'Lyrics',
  annotations: 'Annotations',
  chords: 'Chords',
  articulations: 'Articulations',
  ornaments: 'Ornaments'
};

/**
 * Paste Special.  Choose which kinds of marking attached to the copied notes (dynamics, lyrics, annotations,
 * chords, articulations, ornaments) to paste onto the notes at the selection, and whether they replace
 * the markings already there or are added to them.  The notes themselves are not changed.
 * @category SuiDialog
 */
export const SuiPasteSpecialDialog = async (parameters: SuiDialogParams) => {
  // nothing is chosen at first, so a paste is always a deliberate choice
  const selected: Record<string, boolean> = reactive({});
  PasteBuffer.attributeKinds.forEach((kind) => {
    selected[kind] = false;
  });
  const replace: Ref<boolean> = ref(true);
  const getReplace = (): Ref<boolean> => {
    return replace;
  }
  const commitCb = async () => {
    const kinds = PasteBuffer.attributeKinds.filter((kind) => selected[kind]);
    await parameters.view.pasteAttributes({ kinds, mode: replace.value ? 'replace' : 'add' });
  }
  const cancelCb = async () => {
  }
  const rootId = replaceVueRoot(modalContainerId);
  const appParams = {
    domId: rootId,
    label: 'Paste Special',
    kinds: PasteBuffer.attributeKinds.map((kind) => ({ id: kind, label: pasteKindLabels[kind] })),
    selected,
    getReplace,
    commitCb,
    cancelCb
  };
  InstallDialog({
    app: pasteSpecialApp,
    appParams,
    root: rootId,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
}
