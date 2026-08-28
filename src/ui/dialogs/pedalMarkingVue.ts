// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiPedalMarkingAdapter } from './pedalMarking';
import { getModifierDialogPosition } from './adapter';
import { SmoSelection } from '../../smo/xform/selections';
import { UndoBuffer } from '../../smo/xform/undo';
import { addOrReplacePedalMarking } from '../menus/staffModifier';
import pedalMarkingComp from '../components/dialogs/pedalMarking.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiPedalMarkingDialog (src/ui/dialogs/pedalMarking.ts),
 * following the SuiTimeSignatureDialogVue creation-function pattern.
 * SuiPedalMarkingAdapter is reused unchanged; only the presentation layer is new.
 */
export const SuiPedalMarkingDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const view = parameters.view;
  const adapter = new SuiPedalMarkingAdapter(view, parameters.modifier);

  // Mirrors SuiPedalMarkingDialog.changed(): every field write must redraw the
  // marking's full measure range, not just the modifier itself.
  const redrawPedalMarking = async () => {
    const redraw = SmoSelection.getMeasuresBetween(view.score, adapter.pedalMarking.startSelector,
      adapter.pedalMarking.endSelector
    );
    view.undoStaffModifier('pedal marking', adapter.backup, UndoBuffer.bufferSubtypes.UPDATE);
    await addOrReplacePedalMarking(view, adapter.pedalMarking);
    view._renderChangedMeasures(redraw);
    await view.updatePromise();
  };
  const updateBooleanCb = async (param: 'bracket' | 'startMark' | 'releaseMark', value: boolean) => {
    adapter[param] = value;
    await redrawPedalMarking();
  };
  const updateTextCb = async (param: 'depressText' | 'releaseText', value: string) => {
    adapter[param] = value;
    await redrawPedalMarking();
  };
  const commitCb = async () => {
    await adapter.commit();
  };
  const cancelCb = async () => {
    await adapter.cancel();
  };
  const removeCb = async () => {
    await adapter.remove();
  };

  const appParams = {
    domId: rootId,
    label: 'Pedal Marking Properties',
    initialPosition: getModifierDialogPosition(view, parameters.modifier),
    bracket: adapter.bracket,
    startMark: adapter.startMark,
    releaseMark: adapter.releaseMark,
    depressText: adapter.depressText,
    releaseText: adapter.releaseText,
    updateBooleanCb,
    updateTextCb
  };

  InstallDialog({
    root: rootId,
    app: pedalMarkingComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    removeCb
  });
};
