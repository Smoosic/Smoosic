import { SuiMenuBase, SuiMenuParams, MenuChoiceDefinition, MenuDefinition, 
  SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiScoreViewDialogVue } from '../dialogs/scoreView';
import { SuiInstrumentDialogVue } from '../dialogs/instrument';
import { SuiPartInfoDialogVue } from '../dialogs/partInfo';
import { SuiPageLayoutDialogVue } from '../dialogs/pageLayout';
import { SuiCreatePartVue } from '../dialogs/instrument';
import { SuiTabStaveDialogVue } from '../dialogs/tabStave';
declare var $: any;
/**
 * @category SuiMenu
 */
export const createNotePartMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {
        icon: 'mi add',
        text: 'Create New Part/Stave',
        value: 'createPart'
  }, display: () => true,
  handler: async(menu: SuiMenuBase) => {
    SuiCreatePartVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'newPartDialog',
        ctor: 'SuiNewPartDialog',
        tracker: menu.view.tracker,
        modifier: menu,
        startPromise: menu.closePromise
      });
  }
}
/**
 * @category SuiMenu
 */
export const removePartMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {    
      icon: 'mi delete',
      text: 'Remove Selected Parts/Staves',
      value: 'removePart'
  }, display: () => true,
  handler: async (menu: SuiMenuBase) => {
    await menu.view.removeStaff();
  }
}
/**
 * @category SuiMenu
 */
export const partPropertiesMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {    
    icon: 'mi settings',
    text: 'Part Properties',
    value: 'editPart'
  }, display: (menu: SuiMenuBase) => menu.view.isPartExposed(),
  handler: async (menu: SuiMenuBase) => {
    const selection = menu.view.tracker.selections[0];
    if (menu.view.score.staves.length !== selection.staff.partInfo.stavesAfter + selection.staff.partInfo.stavesBefore + 1) {
      menu.view.exposePart(selection.staff);
    }
    await menu.view.renderPromise();
    SuiPartInfoDialogVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'editPart',
        ctor: 'SuiPartInfoDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      }
    );
  }
}
/**
 * @category SuiMenu
 */
export const pageLayoutMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {
    icon: 'mi margin',
    text: 'Page Layout',
    value: 'pageLayout'
  }, display: (menu: SuiMenuBase) => menu.view.isPartExposed(),
  handler: async (menu: SuiMenuBase) => {
    SuiPageLayoutDialogVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'layoutDialog',
        ctor: 'SuiPageLayoutDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      });
  }
}
/**
 * @category SuiMenu
 */
export const viewPartialScoreMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {
    icon: 'mi disabled_visible',
    text: 'Show/Hide Staves',
    value: 'view'
  }, display: (menu: SuiMenuBase) => !menu.view.isPartExposed(),
  handler: async (menu: SuiMenuBase) => {
    SuiScoreViewDialogVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'scoreViewDialog',
        ctor: 'SuiScoreViewDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      });
  }
}
/**
 * @category SuiMenu
 */
export const viewFullScoreMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {
    icon: 'mi visibility',
    text: 'View All',
    value: 'viewAll'
  }, display: (menu: SuiMenuBase) => menu.view.score.staves.length < menu.view.storeScore.staves.length,
  handler: async (menu: SuiMenuBase) => {
    await menu.view.viewAll();
  }
}
/**
 * @category SuiMenu
 */
export const editInstrumentMenuOption: SuiConfiguredMenuOption = {
  menuChoice: {
    icon: 'mi tune',
    text: 'Instrument Properties',
    value: 'editInstrument'
  }, display: (menu: SuiMenuBase) => true,
  handler: async (menu: SuiMenuBase) => {
    SuiInstrumentDialogVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'instrumentModal',
        ctor: 'SuiInstrumentDialog',
        tracker: menu.view.tracker,
        modifier: menu,
        startPromise: menu.closePromise
      });
  }
}
/**
 * @category SuiMenu
 */
export const tabStaveMenuOption: SuiConfiguredMenuOption = {
  menuChoice:  {
    icon: 'bv tall bv-fretboard5string',
    text: 'Guitar Tablature',
    value: 'tabStave'
  }, display: (menu: SuiMenuBase) => true,
  handler: async (menu: SuiMenuBase) => {
    SuiTabStaveDialogVue({
      ctor: 'SuiTabStaveDialog',
      id: 'tabStaveDialog',
      tracker: menu.view.tracker,
      completeNotifier: menu.completeNotifier,
      startPromise: null,
      view: menu.view,
      eventSource: menu.eventSource
    });
  }
}
/**
 * @category SuiMenu
 */
export const moveUpMenuOption: SuiConfiguredMenuOption = {
  menuChoice:  {
    icon: 'icon-smo smoi icon-arrow-up',
    text: 'Move Part Up',
    value: 'partUp'
  }, display: (menu: SuiMenuBase) =>  {
    return menu.view.score.staves.length > 1;
  },
  handler: async (menu: SuiMenuBase) => {
    await menu.view.moveStaffUpDown(-1);
  }
}
export const moveDownMenuOption: SuiConfiguredMenuOption = {
  menuChoice:  {
    icon: 'icon-smo smoi icon-flip icon-arrow-up',
    text: 'Move Part Down',
    value: 'partDown'
  }, display: (menu: SuiMenuBase) =>  {
    return menu.view.score.staves.length > 1;
  },
  handler: async (menu: SuiMenuBase) => {
    await menu.view.moveStaffUpDown(1);
  }
}
/**
 * Stuff you can do with parts.
 * @category SuiMenu
 */
export const SuiPartMenuOptions: SuiConfiguredMenuOption[] = [
  createNotePartMenuOption, removePartMenuOption, partPropertiesMenuOption, pageLayoutMenuOption, viewPartialScoreMenuOption, 
  editInstrumentMenuOption, viewFullScoreMenuOption, tabStaveMenuOption, moveUpMenuOption, moveDownMenuOption
];

/**
 * Stuff you can do with parts.
 * @category SuiMenu
 */
export class SuiPartMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Parts', SuiPartMenuOptions);
  }  
}
