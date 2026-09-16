// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SmoLyric } from '../../smo/data/noteModifiers';
import annotationComp from '../components/dialogs/annotation.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based dialog for note text annotations (SmoLyric, parser 'annotation').
 * Structurally modeled on SuiLyricDialogVue (src/ui/dialogs/lyricVue.ts), minus
 * note-to-note navigation, plus multi-selection propagation modeled on
 * SuiDynamicDialogAdapter's syncModifiers (src/ui/dialogs/dynamics.ts).
 * See specs/017-text-annotations.
 */
export const SuiAnnotationDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const view = parameters.view;
  const selections = view.tracker.selections;
  const annotation = parameters.modifier as SmoLyric;

  // A brand-new annotation (empty text) starts in the text-editing session;
  // reopening an existing one goes straight to the non-editing dialog (FR-007).
  const startInEditingMode = annotation.getText().length === 0;

  const commitCb = async () => {};
  const cancelCb = async () => {};

  const appParams = {
    domId: rootId,
    label: 'Annotation',
    view,
    selections,
    annotation,
    startInEditingMode
  };

  InstallDialog({
    root: rootId,
    app: annotationComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
};
