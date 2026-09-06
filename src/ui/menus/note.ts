import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiArpeggioDialog } from '../dialogs/arpeggio';
import { SuiClefChangeDialog } from '../dialogs/clefChange';
import { SuiNoteHeadDialog } from '../dialogs/noteHead';
import { SuiOrnamentDialogVue } from '../dialogs/ornament';
import { SuiDurationNoteVue } from '../dialogs/durations';
import { SuiArticulationDialogVue } from '../dialogs/articulation';
import { SuiGraceNoteDialog } from '../dialogs/gracenote';
import { SuiMicrotoneDialogVue } from '../dialogs/microtones';
import { SuiPitchDialogVue } from '../dialogs/pitch';
import { SmoPedalMarking } from '../../smo/data/staffModifiers';
import { SmoSelector } from '../../smo/xform/selections';
import { SuiMenuBase, SuiMenuParams, 
  SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
  import { addOrReplacePedalMarking } from './staffModifier';
declare var $: any;
/**
 * Stuff you can do to notes
 * @category SuiMenu
 */
export class SuiNoteMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Notes', SuiNoteMenuOptions);
  }  
}
/**
 * @category SuiMenu
 */
const toggleCueMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.toggleCue();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'bv sm bv-noteheadHalfFilled',
    text: 'Toggle Cue',
    value: 'toggleCueMenuOption'
  }
}
/**
 * @category SuiMenu
 */
const arpeggioMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiArpeggioDialog({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiArpeggioDialog',
      id: 'insert-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'bv tall oversize bv-arpeggiatoUp',
    text: 'Arpeggio',
    value: 'arpeggioDialog'
  }
}
/**
 * @category SuiMenu
 */
const noteHeadMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiNoteHeadDialog({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiNoteHeadDialog',
      id: 'notehead-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'bv bv-noteheadXBlack',
    text: 'Head and Stem',
    value: 'noteHeadDialog'
  }
}
/**
 * @category SuiMenu
 */
const pitchMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiPitchDialogVue({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiPitchDialog',
      id: 'pitch-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Pitches',
    value: 'pitchDialog'
  }
}
/**
 * @category SuiMenu
 */
const graceNotesMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiGraceNoteDialog({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiNoteHeadDialog',
      id: 'insert-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'icon-smo icon-grace_select',
    text: 'Grace Notes',
    value: 'graceNotes'
  }
}
/**
 * @category SuiMenu
 */
const clefNoteDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiClefChangeDialog({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiClefChangeDialog',
      id: 'insert-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'bv bv-fClef',
    text: 'Change Clef',
    value: 'clefNoteDialog'
  }
}
/**
 * @category SuiMenu
 */
const togglePedalRelease: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.tracker.selections.forEach(async (selection) => {
      const pms = selection.staff.getPedalMarkingsContaining(selection.selector);
      const selectorToAdd = selection.selector;
      let shouldAdd = true;
      
      pms.forEach(async (mod) => {
        const pm = mod as SmoPedalMarking;
        const releaseAr: any = [];
        pm.releases.forEach((rr) => {
          if (SmoSelector.eq(rr, selectorToAdd)) {
            shouldAdd = false;
          } else if (SmoSelector.gt(mod.startSelector, selectorToAdd) && SmoSelector.lt(mod.endSelector, selectorToAdd)) {
            releaseAr.push(rr);
          }
        });
        if (shouldAdd) {
          releaseAr.push(selectorToAdd);
        }
        pm.releases = releaseAr.sort((a: SmoSelector, b: SmoSelector) => SmoSelector.gt(a, b) ? 1 : -1);
        await addOrReplacePedalMarking(menu.view, pm);
      });
    });
  }, display: ((menu: SuiMenuBase) =>  {
    let show = false;
    menu.tracker.selections.forEach((selection) => {
      const pms = selection.staff.getPedalMarkingsContaining(selection.selector);
      if (pms.length) {
        show = true;
      }
    });
    return show;
  }),
  menuChoice: {
    icon: 'bv bv-keyboardPedalUp',
    text: 'Toggle Pedal Release',
    value: 'togglePedalRelease'
  }
}
/**
 * @category SuiMenu
 */
const ornamentNoteDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiOrnamentDialogVue({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiOrnamentDialog',
      id: 'ornament-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'bv bv-ornamentMordent',
    text: 'Ornaments',
    value: 'ornamentDialog'
  }
}
/**
 * @category SuiMenu
 */
const durationDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiDurationNoteVue({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiDurationDialog',
      id: 'duration-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'icon-smo icon-duration',
    text: 'Durations',
    value: 'durationDialog'
  }
}
/**
 * @category SuiMenu
 */
const articulationNoteDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiArticulationDialogVue({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiArticulationDialog',
      id: 'articulation-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'bv bv-accent',
    text: 'Articulations',
    value: 'articulationDialog'
  }
}
/**
 * @category SuiMenu
 */
const microtoneNoteDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiMicrotoneDialogVue({
      view: menu.view,
      completeNotifier: menu.completeNotifier,
      startPromise: menu.closePromise,
      eventSource: menu.eventSource,
      tracker: menu.tracker,
      ctor: 'SuiMicrotoneDialog',
      id: 'microtone-dialog',
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'bv bv-accidentalKoron',
    text: 'Microtones',
    value: 'microtoneDialog'
  }
}
/**
 * Note menu.  Stuff you can do to notes.
 * @category SuiMenu
 */
const SuiNoteMenuOptions: SuiConfiguredMenuOption[] = [
  toggleCueMenuOption, arpeggioMenuOption, clefNoteDialogMenuOption, 
  graceNotesMenuOption,
  noteHeadMenuOption, ornamentNoteDialogMenuOption,
  articulationNoteDialogMenuOption, 
  microtoneNoteDialogMenuOption, togglePedalRelease, 
  durationDialogMenuOption, pitchMenuOption
];