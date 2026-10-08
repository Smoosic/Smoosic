// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiDialogParams, InstallDialog } from './dialog';
import { SmoOperation } from '../../smo/xform/operations';
import { SmoNote } from '../../smo/data/note';
import { default as noteHeadApp } from '../components/dialogs/noteHead.vue';
import { replaceVueRoot, modalContainerId } from '../common';
import { DialogButtonDefinition, DialogButtonState } from '../buttons/button';

export const SuiNoteHeadDialog = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  let noteStateSame = false;
  const transitionButtonState = (button: DialogButtonDefinition) => {
    if (button.state === 'selected') {
      button.state = 'unselected';
    } else {
      button.state = 'selected';
    }
  }
  parameters.view.groupUndo(true);
  const stemCbSame = async (button: DialogButtonDefinition) => {
    noteStateSame = false;
    if (button.id === 'slash') {
      await parameters.view.modifyCurrentSelections('set note head', (score, selections) => {
        selections.forEach((selection: SmoSelection) => {
          SmoOperation.makeNote(selection);
        });
      });
      if (button.state === 'selected') {
        await parameters.view.toggleSlash();
      }
    } else if (button.id === 'delete') {
      await parameters.view.modifyCurrentSelections('set note head', (score, selections) => {
        selections.forEach((selection: SmoSelection) => {
          SmoOperation.makeNote(selection);
        });
      });
      if (button.state === 'selected') {
        await parameters.view.deleteNote();
      }
    } else if (button.id === 'rest') {
      if (button.state === 'selected') {
        await parameters.view.makeRest();
      } else {
        await parameters.view.modifyCurrentSelections('set note head', (score, selections) => {
          selections.forEach((selection: SmoSelection) => {
            SmoOperation.makeNote(selection);
          });
        });
      }
    }
  }
  const stemCb = async (button: DialogButtonDefinition) => {
    transitionButtonState(button);
    if (noteStateSame) {
      return await stemCbSame(button);
    }
    if (button.id === 'slash') {
      await parameters.view.toggleSlash();
    } else if (button.id === 'delete') {
      await parameters.view.deleteNote();
    } else {
      await parameters.view.makeRest();
    }
  }
  const shapeCb = async (button: DialogButtonDefinition) => {
    transitionButtonState(button);
    const note = parameters.view.tracker.selections[0].note;
    if (note) {
      if (button.id === 'slash') {
        await parameters.view.toggleSlash();
      } else if (button.id === 'delete') {
        await parameters.view.deleteNote();
      } else {
        await parameters.view.makeRest();
      }
    }
  }
  const headsCb = async (button: DialogButtonDefinition) => {
    transitionButtonState(button);
    const code = button.id === 'Default' ? '' : button.id;
    parameters.view.modifyCurrentSelections('set note head', (score, selections) => {
      SmoOperation.setNoteHead(selections, code);
    });
  };

  const isSlash = (note: SmoNote | null): boolean => {
    return note !== null && note.isSlash();
  }
  const isRest = (note: SmoNote | null) => {
    return note !== null && note.isRest();
  }
  const isHidden = (note: SmoNote | null) => {
    return note !== null && note.isHidden();
  }
  const matchesNoteHeadFcn = (code: string) => {
    return (note: SmoNote | null): boolean => {
      return note !== null && note.noteHead === code;
    }
  }
  const testSelectionState = (func: (note: SmoNote | null) => boolean): DialogButtonState => {
    let state: DialogButtonState = 'unselected';
    let anyUnselected = false;
    const selections = parameters.view.tracker.selections;
    for (let i = 0; i < selections.length; ++i) {
      const selection = selections[i];
      if (func(selection.note)) {
        if (anyUnselected) {
          state = 'partiallySelected';
          break;
        } else {
          state = 'selected';
        }
      } else {
        if (state === 'selected') {
          state = 'partiallySelected';
          break;
        } else {
          anyUnselected = true;
        }
      }
    }
    return state;
  }
  const slashState = testSelectionState(isSlash);
  const restState = testSelectionState(isRest);
  const hiddenState = testSelectionState(isHidden);
  const stems: DialogButtonDefinition[] = [{
    classes: '',
    icon: 'icon-bravura icon-restQuarter',
    id: 'rest',
    hotkey: 'r',
    label: 'Rest',
    callback: stemCb,
    state: restState,
    group: 'stems'
  }, {  
    classes: '',
    icon: 'icon-bravura icon-restQuarter ghost start-0',
    id: 'delete',
    label: 'Delete',
    hotkey: 'Delete',
    callback: stemCb,
    state: hiddenState,
    group: 'stems'
  }, {
    classes: '',
    icon: 'icon-bravura icon-repeatBarSlash',
    id: 'slash',
    label: 'Slash',
    callback: stemCb,
    state: slashState,
    group: 'stems'
  }];
  const shapes: DialogButtonDefinition[] = [
    {
      classes: '',
      callback: shapeCb,
      icon: 'icon-bravura icon-noteheadXBlack',
      label: 'X',
      id: 'CX',
      group: 'shapes',
      state: testSelectionState(matchesNoteHeadFcn('CX'))
    },
    {
      classes: '',
      callback: shapeCb,
      icon: 'icon-bravura icon-noteheadTriangleUpBlack',
      label: 'Triangle Up',
      id: 'TU',
      group: 'shapes',
      state: testSelectionState(matchesNoteHeadFcn('TU'))
    }, {
      classes: '',
      callback: shapeCb,
      icon: 'icon-bravura icon-noteheadTriangleDownBlack',
      label: 'Triangle Down',
      id: 'TD',
      group: 'shapes',
      state: testSelectionState(matchesNoteHeadFcn('TD'))
    }, {
      classes: '',
      icon: 'icon-bravura icon-noteheadDiamondBlack',
      callback: shapeCb,
      label: 'Diamond',
      id: 'D',
      group: 'shapes',
      state: testSelectionState(matchesNoteHeadFcn('D'))
    }, {
      classes: '',
      icon: 'icon-bravura icon-noteheadSquareBlack',
      id: 'SQ',
      label: 'Square',
      callback: shapeCb,
      group: 'shapes',
      state: testSelectionState(matchesNoteHeadFcn('SQ'))
    }
  ];
  const heads: DialogButtonDefinition[] = [
    {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura ribbon-button-text icon-noteheadDiamondWhole',
      label: 'Diamond whole',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('D0')),
      id: 'D0'
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura  icon-noteheadDiamondHalf',
      id: 'D1',
      label: 'Diamond open',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('D1'))
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura icon-noteheadDiamondBlack',
      id: 'D2',
      label: 'Diamond closed',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('D2'))
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura icon-noteheadTriangleUpWhole',
      id: 'T0',
      label: 'Triangle up whole',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('T0'))
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura icon-noteheadTriangleUpHalf',
      id: 'T1',
      label: 'Triangle up open',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('T1'))
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura icon-noteheadTriangleUpBlack',
      id: 'T2',
      label: 'Triangle up closed',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('T2'))
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura icon-noteheadXWhole',
      id: 'X0',
      label: 'X Whole',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('X0'))
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura icon-noteheadXHalf',
      id: 'X1',
      label: 'X Half',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('X1'))
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura icon-noteheadXBlack',
      id: 'X2',
      label: 'X Closed',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('X2'))
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura icon-noteheadMoonBlack',
      id: 'RE',
      label: 'Moon Closed',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('RE'))
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura icon-noteheadTriangleLeftBlack',
      id: 'FA',
      label: 'Left Triangle Closed',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('FA'))
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura icon-noteheadTriangleRightBlack',
      id: 'FAUP',
      label: 'Right Triangle Up Closed',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn('FAUP'))
    }, {
      classes: '',
      callback: headsCb,
      icon: 'icon-bravura icon-noteheadBlack',
      id: 'Default',
      label: 'Moon Black',
      group: 'heads',
      state: testSelectionState(matchesNoteHeadFcn(''))
    }
  ];
  const commitCb = async () => {
    parameters.view.groupUndo(false);
  }
  const cancelCb = async () => {    
    await parameters.view.undo();
  }
  const appParams = {  domId: rootId,
    shapes,
    heads,
    stems};
  InstallDialog({root: rootId, app: noteHeadApp, appParams, dialogParams: parameters, commitCb, cancelCb });
}
