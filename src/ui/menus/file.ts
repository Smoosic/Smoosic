import { SuiMenuBase, SuiMenuParams, SuiConfiguredMenu, SuiConfiguredMenuOption } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import {
  SuiFileSaveDialog ,  
  SuiFileUploadDialog,
  SuiPrintDialog
} from '../dialogs/fileDialogs';
import { SmoScore } from '../../smo/data/score';

declare var $: any;


const systemNewScoreOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
      const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
      await menu.view.changeScore(score);
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'New',
    value: 'new'
  }
}
const systemQuickSave: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.quickSave();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Quick Save',
    value: 'quickSave'
  }
}
const systemPrintOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiPrintDialog({      ctor: 'SuiPrintFileDialog',
      id: 'print',
      eventSource: menu.eventSource,
      modifier: null,
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      tracker: menu.tracker
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Print',
    value: 'print'
  }
}
const suiFileSaveOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiFileSaveDialog ({
        ctor: 'SuiSaveFileDialog',
        id: 'saveFile',
        modifier: null,
        completeNotifier: menu.completeNotifier,
        tracker: menu.tracker,
        eventSource: menu.eventSource,
        view: menu.view,
        startPromise: menu.closePromise
      });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Save',
    value: 'saveFile'
  }
}

const suiFileOpenOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiFileUploadDialog({
        ctor: 'SuiLoadFileDialog',
        id: 'open',
        modifier: null,
        completeNotifier: menu.completeNotifier,
        tracker: menu.tracker,
        eventSource: menu.eventSource,
        view: menu.view,
        startPromise: menu.closePromise
      });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Open',
    value: 'loadFile'
  }
}
const suiImportMidiOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiFileUploadDialog({
        ctor: 'SuiLoadFileDialog',
        id: 'open',
        modifier: null,
        completeNotifier: menu.completeNotifier,
        tracker: menu.tracker,
        eventSource: menu.eventSource,
        view: menu.view,
        startPromise: menu.closePromise
      });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Import Midi',
    value: 'importMidi'
  }
}

const SuiFileMenuOptions: SuiConfiguredMenuOption[] = [
systemNewScoreOption,systemQuickSave, systemPrintOption, suiFileSaveOption,
suiFileOpenOption,
suiImportMidiOption
]

/**
 * Stuff you can do with parts.
 * @category SuiMenu
 */
export class SuiFileMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'File', SuiFileMenuOptions);
  }  
}
