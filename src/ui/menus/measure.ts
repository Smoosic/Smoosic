import { SuiMenuBase, SuiMenuParams, MenuDefinition,  SuiConfiguredMenuOption, 
  SuiConfiguredMenu } from './menu';
import { SuiEndingsDialogVue } from '../dialogs/endings';
import { SuiInsertMeasuresVue } from '../dialogs/addMeasure';
import { SuiMeasureFormatDialogVue } from '../dialogs/measureFormat';
import { SmoMeasureFormat } from '../../smo/data/measureModifiers';
import { MeasureFillType } from '../../smo/xform/measureFill';
declare var $: any;
/**
 * @category SuiMenu
 */
export class SuiMeasureMenu extends SuiConfiguredMenu {
  static defaults: MenuDefinition = {
    label: 'Measure Menu',
    menuItems: [],
  }
  constructor(params: SuiMenuParams) {
    super(params, 'Notes', SuiMeasureMenuConfig);
  }  
}
/**
 * @category SuiMenu
 */
const formatMeasureMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiMeasureFormatDialogVue({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiMeasureDialog',
      id: 'measure-dialog',
      modifier: null
    });
  },
  display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'mi insert_page_break',
    text: 'Format Measure',
    value: 'formatMeasure'
  }
}
/**
 * @category SuiMenu
 */
const addMeasureMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiInsertMeasuresVue({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiMeasureDialog',
      id: 'insert-dialog',
      modifier: null
    });
  },
  display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'mi add',
    text: 'Add Measures',
    value: 'addMeasures'
  }
}
/**
 * @category SuiMenu
 */
const endingsMeasureMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiEndingsDialogVue({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiEndingsDialog',
      id: 'endings-dialog',
      modifier: null
    });
  },
  display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'bv tall bv-repeat-right-left',
    text: 'Endings',
    value: 'endings'
  }
}
/**
 * @category SuiMenu
 */
const deleteSelectedMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.deleteMeasure();
  },
  display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'mi delete',
    text: 'Delete Selected Measures',
    value: 'deleteSelected'
  }
}
/**
 * @category SuiMenu
 */
const resetSystemBreaksMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.removeSystemBreaks();
  },
  display: (menu: SuiMenuBase) => {
    const selections = menu.tracker.getSelectedMeasures();
    for (let i = 0; i < selections.length; ++i) {
      const sel = selections[i];
      if (sel.measure.format.systemBreak) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Reset system breaks',
    value: 'resetFormatting'
  }
}
/**
 * @category SuiMenu
 */
const resetFormattingMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.setMeasureFormat(new SmoMeasureFormat(SmoMeasureFormat.defaults));
  },
  display: (menu: SuiMenuBase) => {
    const selections = menu.tracker.getSelectedMeasures();
    for (let i = 0; i < selections.length; ++i) {
      const selection = selections[i];
      if (!selection.measure.format.isDefault) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Reset formatting selection',
    value: 'resetFormatting'
  }
}
/**
 * True if measures are selected
 */
const hasSelectedMeasures = (menu: SuiMenuBase): boolean => menu.tracker.getSelectedMeasures().length > 0;
/**
 * One choice of the Fill Measures submenu.  Each one replaces everything in the selected measures with rests.
 * @category SuiMenu
 */
const fillChoice = (fill: MeasureFillType, text: string, value: string): SuiConfiguredMenuOption => ({
  handler: async (menu: SuiMenuBase) => {
    await menu.view.fillMeasures(fill);
  },
  display: hasSelectedMeasures,
  menuChoice: {
    icon: '',
    text,
    value
  }
});
/**
 * Fill the selected measures with rests: the largest rest that fits, a rest for each beat, or eighth rests.
 * This removes the notes and voices in the measures.
 * @category SuiMenu
 */
const fillMeasuresMenuOption: SuiConfiguredMenuOption = {
  handler: async () => { }, // unreachable -- subMenu takes precedence over handler
  display: hasSelectedMeasures,
  subMenu: [
    fillChoice('wholeRest', 'Whole Rest', 'fillWholeRest'),
    fillChoice('beats', 'Beats', 'fillBeats'),
    fillChoice('eighthRests', 'Eighth Rests', 'fillEighthRests')
  ],
  menuChoice: {
    icon: '',
    text: 'Fill Measures',
    value: 'fillMeasuresMenuOption'
  }
}
/**
 * @category SuiMenu
 */
const SuiMeasureMenuConfig: SuiConfiguredMenuOption[] = [
  addMeasureMenuOption, formatMeasureMenuOption, endingsMeasureMenuOption, deleteSelectedMenuOption, 
  resetSystemBreaksMenuOption, resetFormattingMenuOption, fillMeasuresMenuOption];