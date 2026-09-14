// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogParams, InstallDialog } from './dialog';
import { SmoSystemGroup } from '../../smo/data/scoreModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { replaceVueRoot, modalContainerId } from '../common';
import { reactive, createApp } from 'vue';
import staffGroupsComp from '../components/dialogs/staffGroups.vue';

declare var $: any;
export const SuiStaffGroupDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const selection = parameters.view.tracker.selections[0];
  const score = parameters.view.score;
  let changed = false;
  const staffGroups: SmoSystemGroup[] = reactive([]);
  const populateGroups = () => {
    staffGroups.splice(0);
    for (let i = 0; i < parameters.view.score.staves.length; ++i) {
      const sel = SmoSelection.measureSelection(
        score,
        i,
        selection.selector.measure);
      if (sel) {
        const group = score.getSystemGroupForStaff(sel);
        if (group && group.startSelector.staff === i) {
          staffGroups.push(group);
        } 
      }  
    }
  }
  populateGroups();
  const setConnectorCb = async (staffId: number, connectorId: string) => {
    const conn = parseInt(connectorId, 10);
    const sg = score.getSystemGroupForStaffId(staffId);
    if (sg) {
      sg.leftConnector = conn;
      parameters.view.addOrUpdateStaffGroup(sg);
      await parameters.view.updatePromise();
    }
    await parameters.view.refreshViewport();
    changed = true;
    populateGroups();
  }
  const removeFromGroupCb = async (staffId: number) => {
    const sg = score.getSystemGroupForStaffId(staffId);
    if (sg) {
      if (sg.startSelector.staff < staffId) {
        sg.endSelector.staff = staffId - 1;
        parameters.view.addOrUpdateStaffGroup(sg);
      } else {
        parameters.view.removeStaffGroup(sg);
      }
    }
    await parameters.view.refreshViewport();
    changed = true;
    populateGroups();
  }
  const addToGroupCb = async (staffId: number, direction: 'above' | 'below') => {
    const neighborId = direction === 'above' ? staffId - 1 : staffId + 1;
    const sg = score.getSystemGroupForStaffId(neighborId);
    if (sg) {
      if (direction === 'above') {
        sg.endSelector.staff = staffId;
      } else {
        sg.startSelector.staff = staffId;
      }
      await parameters.view.addOrUpdateStaffGroup(sg);
    }
    await parameters.view.refreshViewport();
    changed = true;
    populateGroups();
  }
  const createStaffGroupCb = async (staffId: number) => {
    const params = SmoSystemGroup.defaults;
    params.startSelector.staff = staffId;
    params.endSelector.staff = staffId;
    await parameters.view.addOrUpdateStaffGroup(new SmoSystemGroup(params));
    await parameters.view.refreshViewport();
    changed = true;
    populateGroups();
  }
  const backup: SmoSystemGroup[] = [];
  staffGroups.forEach((sg) => {
    const group = new SmoSystemGroup(sg);
    backup.push(group);
  });
  const commitCb = async () => {
  }
  const cancelCb = async () => {
    if (!changed) {
      return;
    }
    await parameters.view.clearSystemGroups();
    for (let i = 0; i < backup.length; ++i) {
      await parameters.view.addOrUpdateStaffGroup(backup[i]);
    }
    await parameters.view.refreshViewport();
  }
  
  const appParams = { domId: rootId, staffGroups, label: "Staff Groups", 
    score, setConnectorCb, removeFromGroupCb, addToGroupCb, createStaffGroupCb };
  
  InstallDialog({
    root: rootId,
    app: staffGroupsComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
}
