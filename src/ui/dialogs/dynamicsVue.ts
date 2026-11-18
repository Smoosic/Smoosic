// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { getModifierDialogPosition } from './adapter';
import { SmoDynamicText } from '../../smo/data/noteModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import dynamicsComp from '../components/dialogs/dynamics.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based dialog for the dynamic marking (p, mf, ff...) of the selected notes, following the
 * SuiTimeSignatureDialogVue creation-function pattern.  The dialog's state is kept in local variables and
 * each edit is applied to the score as it is made, so there is no separate adapter object.
 * `parameters.modifier` is always an already score-attached SmoDynamicText by the time
 * this runs — the menu handler in src/ui/menus/text.ts creates and adds a default
 * marking to every selected note before opening the dialog when none exists yet.
 */
export const SuiDynamicModifierDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const view = parameters.view;
  const modifier = parameters.modifier as SmoDynamicText;
  // All the edits made in this dialog are one undo step, and Cancel undoes them.
  view.groupUndo(true);
  view.undoTrackerMeasureSelections('Dynamics');
  // Edit the notes of a selected marking, if a marking itself is selected on the score, otherwise the
  // selected notes.
  let selections: SmoSelection[] = [];
  if (view.tracker.modifierSelections.length) {
    view.tracker.modifierSelections.forEach((ms) => {
      if (ms.selection) {
        selections.push(ms.selection);
      }
    });
  } else {
    selections = view.tracker.selections;
  }

  /** put the marking, as it is now, on every note being edited */
  const syncModifiers = () => {
    selections.forEach((selection) => {
      view.addDynamic(selection, modifier);
    });
  };
  const updateNumberCb = async (param: 'yOffsetLine' | 'yOffsetPixels' | 'xOffset' | 'fontSize', value: number) => {
    // A size that cannot be used is ignored; the marking keeps its last good size
    if (param === 'fontSize' && !SmoDynamicText.isValidFontSize(value)) {
      return;
    }
    modifier[param] = value;
    syncModifiers();
  };
  const updateTextCb = (value: string) => {
    modifier.text = value;
    syncModifiers();
  };
  const commitCb = async () => {
  };
  const cancelCb = async () => {
    await view.undo();
  };
  const removeCb = async () => {
    await view.removeDynamic(modifier);
  };

  const appParams = {
    domId: rootId,
    label: 'Dynamics Properties',
    initialPosition: getModifierDialogPosition(view, parameters.modifier),
    yOffsetLine: modifier.yOffsetLine,
    yOffsetPixels: modifier.yOffsetPixels,
    xOffset: modifier.xOffset,
    fontSize: modifier.fontSize,
    text: modifier.text,
    updateNumberCb,
    updateTextCb
  };

  InstallDialog({
    root: rootId,
    app: dynamicsComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    removeCb
  });
};
