// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoInstrument, SmoInstrumentNumParamType, SmoInstrumentParams } from '../../smo/data/staffModifiers';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiSampleMedia } from '../../render/audio/samples';
import { replaceVueRoot, modalContainerId } from '../common';
import { reactive, watch, ref } from 'vue';
import instrumentPropertiesApp from '../components/dialogs/instrumentProperties.vue';
import newPartApp from '../components/dialogs/newPart.vue';
import { SmoSystemStaff, SmoSystemStaffParams } from '../../smo/data/systemStaff';

export const SuiInstrumentDialogVue = (parameters: SuiDialogParams) => {
  const selection = parameters.view.tracker.selections[0];
  const instrument = reactive(new SmoInstrument(parameters.view.score.getStaffInstrument(selection.selector)));
  let applies = 'Selected';
  const setApplyTo = (value: string)  => {
    applies = value;
    if (value === 'Score') {
      parameters.view.tracker.selections = SmoSelection.selectionsToEnd(parameters.view.score, parameters.view.tracker.selections[0].selector.staff, 0);
    } else if (applies === 'Remaining') {
      parameters.view.tracker.selections = SmoSelection.selectionsToEnd(parameters.view.score, parameters.view.tracker.selections[0].selector.staff, parameters.view.tracker.selections[0].selector.measure);
    } else {
      parameters.view.tracker.selections = parameters.view.tracker.selections;
    }
  }
  setApplyTo(applies);
  const commitCb = async () => {
    // hack: the family name for musicxml purposes is here.
    instrument.family = SuiSampleMedia.getFamilyForInstrument(instrument.instrument);
    await parameters.view.changeInstrument(instrument, parameters.view.tracker.selections);
  }
  const cancelCb = async () => {    
  }
  watch(instrument, async (newVal) => {
    console.log('Instrument changed');
  });
  const getInstrument = () => instrument;
  const appParams = {
    domId: replaceVueRoot(modalContainerId),
    label: 'Instrument Properties',
    applyToInitial: applies,
    getInstrument,
    updateApplyToCb: setApplyTo,
  }
  const rootId = replaceVueRoot(modalContainerId);
  InstallDialog({
      app: instrumentPropertiesApp,
      appParams,
      root: rootId,
      dialogParams: parameters,
      commitCb, 
      cancelCb
    });
}


export const SuiCreatePartVue = (parameters: SuiDialogParams) => {
  const selection = parameters.view.tracker.selections[0];
  const instrument = new SmoInstrument(parameters.view.score.getStaffInstrument(selection.selector));
  let addStave = false;
  const staffLocation = ref(parameters.view.storeScore.staves.length - 1);
  const addStaveCb = () => {
    addStave = !addStave;
  }
  const setStaffId = (staffId: number) => {
    if (staffId < parameters.view.storeScore.staves.length && staffId >= 0) {
      staffLocation.value = staffId;
    }
  }
  const commitCb = async () => {
    const staffParams: SmoSystemStaffParams = SmoSystemStaff.defaults;
    staffParams.staffId = parameters.view.storeScore.staves.length;
    staffParams.measureInstrumentMap[0] = instrument;
    staffParams.staffId = staffLocation.value;
    await parameters.view.addStaff(staffParams);
    if (addStave) {
      const staffParams2: SmoSystemStaffParams = SmoSystemStaff.defaults;
      staffParams2.staffId = staffParams.staffId + 1;
      const instParams: SmoInstrumentParams = SmoInstrument.defaults;
      instParams.instrument = instrument.instrument;
      instParams.clef = instrument.clef === 'treble' ? 'bass' : 'treble';
      const i2 = new SmoInstrument(instParams);
      staffParams2.measureInstrumentMap[0] = i2;
      await parameters.view.addStaff(staffParams2);
      const partInfo = parameters.view.score.staves[staffParams.staffId].partInfo;
      partInfo.stavesAfter = 1;
    }
  }
  const cancelCb = async () => {    
  }

  const getInstrument = () => instrument;
  const appParams = {
    domId: replaceVueRoot(modalContainerId),
    label: 'Instrument Properties',
    staffLength: parameters.view.storeScore.staves.length,
    getInstrument,
    addStaveCb,
    setStaffId
  }
  const rootId = replaceVueRoot(modalContainerId);
  InstallDialog({
      app: newPartApp,
      appParams,
      root: rootId,    
      dialogParams: parameters,
      commitCb, 
      cancelCb
    });
}