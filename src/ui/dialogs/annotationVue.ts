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
  const modifier = parameters.modifier as SmoLyric;

  // The menu handler (src/ui/menus/text.ts) already guarantees at least one
  // annotation exists (modifier) before this dialog opens; read the note's
  // full set here so the dialog can offer '+'/index-selection across every
  // annotation, not just the one the menu handler happened to pass through.
  const firstNote = selections[0]?.note;
  const annotations: SmoLyric[] = firstNote
    ? (firstNote.getAnnotations() as SmoLyric[])
    : [modifier];
  const initialIndex = Math.max(0, annotations.findIndex((a) => a.verse === modifier.verse));

  // A brand-new annotation (empty text) starts in the text-editing session;
  // reopening an existing one goes straight to the non-editing dialog (FR-007).
  const startInEditingMode = annotations[initialIndex].getText().length === 0;

  const commitCb = async () => {};
  const cancelCb = async () => {};

  const appParams = {
    domId: rootId,
    label: 'Annotation',
    view,
    selections,
    annotations,
    initialIndex,
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
