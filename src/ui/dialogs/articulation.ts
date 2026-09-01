// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelection } from '../../smo/xform/selections';
import { SmoScore } from '../../smo/data/score';
import { InstallDialog, DialogDefinition, SuiDialogParams } from './dialog';
import { SmoArticulation } from '../../smo/data/noteModifiers';
import { replaceVueRoot, modalContainerId } from '../common';
import { DialogButtonDefinition } from '../buttons/button';
import { reactive } from 'vue';
import articulationApp from '../components/dialogs/articulations.vue';

export const SuiArticulationDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);

  const setForAll: Record<string, number> = {};
  let position = 'auto';
  let notesCount = 0;
  parameters.view.tracker.selections.forEach((sel) => {
    const articulations = sel.note!.getArticulations();
    notesCount += 1;
    articulations.forEach((articulation) => {
      if (!setForAll[articulation.articulation]) {
        setForAll[articulation.articulation] = 0;
      }
      setForAll[articulation.articulation] = setForAll[articulation.articulation] + 1;
    });
  });
  const keys = Object.keys(setForAll);
  const transitionButtonState = (button: DialogButtonDefinition) => {
    if (button.state === 'selected') {
      button.state = 'unselected';
    } else {
      button.state = 'selected';
    }
  }
  const articulationCb = async (button: DialogButtonDefinition) => {
    transitionButtonState(button);
    const code = SmoArticulation.articulations[button.id];
    await parameters.view.modifyCurrentSelections('articulation pos', (score: SmoScore, selections: SmoSelection[]) => {
      for (let i = 0; i < selections.length; ++i) {
        const sel = selections[i];
        const nart = new SmoArticulation({ articulation: code, position });
        sel.note!.setArticulation(nart, button.state === 'selected');
      }
    });
  }
  const positionChangeCb = async (value: string) => {
    const selections = parameters.view.tracker.selections.filter((ss) => ss.note);
    position = value;
    await parameters.view.modifyCurrentSelections('articulation pos', (score: SmoScore, selections: SmoSelection[]) => {
      for (let i = 0; i < selections.length; ++i) {
        const selection = selections[i];
        const articulations = selection.note!.getArticulations();
        articulations.forEach((art) => {
          const nart = new SmoArticulation({ articulation: art.articulation, position: value });
          selection.note!.setArticulation(art, false);
          selection.note!.setArticulation(nart, true);
        });
      }
    });
  }
  const articulations: DialogButtonDefinition[] = reactive([{
    classes: '',
    icon: 'icon-bravura icon-articAccentAbove',
    id: 'accent',
    hotkey: '',
    label: 'Accent',
    callback: articulationCb,
    state: 'unselected',
    group: 'Glyphs'
  }, {
    classes: '',
    icon: 'icon-bravura icon-articTenutoAbove',
    id: 'tenuto',
    hotkey: '',
    label: 'Tenuto',
    callback: articulationCb,
    state: 'unselected',
    group: 'Glyphs'
  }, {
    classes: '',
    icon: 'icon-bravura icon-articStaccatoAbove',
    id: 'staccato',
    hotkey: '',
    label: 'Staccato',
    callback: articulationCb,
    state: 'unselected',
    group: 'Glyphs'
  }, {
    classes: '',
    icon: 'icon-bravura icon-articMarcatoAbove',
    id: 'marcato',
    hotkey: '',
    label: 'Marcato',
    callback: articulationCb,
    state: 'unselected',
    group: 'Glyphs'
  }, {
    classes: '',
    icon: 'icon-bravura icon-pluckedSnapPizzicatoAbove',
    id: 'pizzicato',
    hotkey: '',
    label: 'Pizzicato',
    callback: articulationCb,
    state: 'unselected',
    group: 'Glyphs'
  }, {
    classes: '',
    icon: 'icon-bravura icon-stringsDownBow',
    id: 'downStroke',
    hotkey: '',
    label: 'Bow Down',
    callback: articulationCb,
    state: 'unselected',
    group: 'Glyphs'
  }, {
    classes: '',
    icon: 'icon-bravura icon-stringsUpBow',
    id: 'upStroke',
    hotkey: '',
    label: 'Bow Up',
    callback: articulationCb,
    state: 'unselected',
    group: 'Glyphs'
  }, {
    classes: '',
    icon: 'icon-bravura  icon-fermataAbove',
    id: 'fermata',
    hotkey: '',
    label: 'Fermata',
    callback: articulationCb,
    state: 'unselected',
    group: 'Glyphs'
  }
  ]);

  keys.forEach((key) => {
    if (setForAll[key] === notesCount) {
      let btnId = articulations.find((btn) => btn.id === key);
      if (btnId) {
        btnId.state = 'selected';
      }
    } else {
      let btnId = articulations.find((btn) => btn.id === key);
      if (btnId) {
        btnId.state = 'partiallySelected';
      }
    }
  });

  // Undo on cancel for any changes made
  parameters.view.groupUndo(true);
  const commitCb = async () => {
  }
  const cancelCb = async () => {
    await parameters.view.undo();
  }
  const appParams = {
    domId: rootId,
    articulations, positionChangeCb, initialValue: 'auto',
  };

  InstallDialog({ root: rootId, app: articulationApp, appParams, dialogParams: parameters, commitCb, cancelCb });
}
