import { SuiMenuBase, SuiMenuParams } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import {
  SuiFileSaveDialog ,  
  SuiFileUploadDialog,
  SuiPrintDialog
} from '../dialogs/fileDialogs';
import { SmoScore } from '../../smo/data/score';

declare var $: any;

/**
 * @category SuiMenu
 */
export class SuiFileMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static defaults = {
    label: 'File',
    menuItems: [{
      icon: 'folder-new',
      text: 'New Score',
      value: 'newFile'
    }, {
      icon: 'folder-open',
      text: 'Open',
      value: 'openFile'
    }, {
      icon: '',
      text: 'Quick Save',
      value: 'quickSave'
    }, {
      icon: 'folder-save',
      text: 'Save',
      value: 'saveFile'
    }, {
      icon: '',
      text: 'Print',
      value: 'printScore'
    }, {
      icon: '',
      text: 'Import Midi',
      value: 'importMidi'
    },{
      icon: '',
      text: 'Cancel',
      value: 'cancel'
    }]
  };

  getDefinition() {
    return SuiFileMenu.defaults;
  }
  systemPrint() {
    SuiPrintDialog({      ctor: 'SuiPrintFileDialog',
      id: 'print',
      eventSource: this.eventSource,
      modifier: null,
      view: this.view,
      completeNotifier: this.completeNotifier,
      startPromise: this.closePromise,
      tracker: this.tracker
    });
  }
  async selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    const self = this;
    if (text === 'saveFile') {
      SuiFileSaveDialog ({
        ctor: 'SuiSaveFileDialog',
        id: text,
        modifier: null,
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'openFile' || text === 'importMidi') {
      SuiFileUploadDialog({
        ctor: 'SuiLoadFileDialog',
        id: text,
        modifier: null,
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'newFile') {
      const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
      await this.view.changeScore(score);
    } else if (text === 'quickSave') {
      this.view.quickSave();
    } else if (text === 'printScore') {
      this.systemPrint();
    }
    this.complete();
  }
  keydown() { }
}
