// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SmoSelection } from '../../smo/xform/selections';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import beamGroupsComp from '../components/dialogs/beamGroups.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Collects the beam grouping and where to apply it, then applies it to the score.
 * @category SuiDialog
 */
export class SuiBeamGroupsAdapter {
  view: SuiScoreViewOperations;
  /** the grouping set in the dialog; empty means the default for the meter */
  groups: number[];
  applyTo: 'selections' | 'all' = 'selections';
  constructor(view: SuiScoreViewOperations, groups: number[]) {
    this.view = view;
    this.groups = groups;
  }
  async commit() {
    await this.view.setBeamGroups(this.groups, this.applyTo);
  }
  async cancel() {
  }
}

/**
 * Dialog for setting the beam grouping of measures, for compound or irregular meters.
 * Follows the creation-function pattern of SuiKeySignatureDialogVue.
 */
export const SuiBeamGroupsDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const measures = SmoSelection.getMeasureList(parameters.view.tracker.selections);
  const initial = measures.length > 0 ? measures[0].measure.getBeamGroups() : [];
  const adapter = new SuiBeamGroupsAdapter(parameters.view, initial);

  const setGroupsCb = (groups: number[]) => {
    adapter.groups = groups;
  };
  const setApplyToCb = (value: string) => {
    adapter.applyTo = value === 'all' ? 'all' : 'selections';
  };
  const commitCb = async () => {
    await adapter.commit();
  };
  const cancelCb = async () => {
    await adapter.cancel();
  };

  const appParams = {
    domId: rootId,
    label: 'Beam Groups',
    initialGroups: initial,
    applyTo: adapter.applyTo,
    setGroupsCb,
    setApplyToCb
  };

  InstallDialog({
    root: rootId,
    app: beamGroupsComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
};
