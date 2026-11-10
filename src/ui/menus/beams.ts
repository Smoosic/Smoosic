import { SuiMenuBase, SuiMenuParams, MenuDefinition, SuiMenuHandler, SuiMenuShowOption,
  SuiConfiguredMenuOption, SuiConfiguredMenu, customizeMenuOptionsFcn } from './menu';
import { SuiBeamGroupsDialogVue } from '../dialogs/beamGroupsVue';
import { SmoNote } from '../../smo/data/note';

  declare var $: any;
/**
 * stuff you can do to beams
 * @category SuiMenu
 */
export class SuiBeamMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Beams', SuiBeamMenuOptions);
  }
}

/**
 * True if any of the selected measures has a note that can be beamed (a note, not a rest, shorter
 * than a quarter note).
 */
const hasBeamableNotes = (menu: SuiMenuBase): boolean => {
  for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
    const mm = menu.view.tracker.selections[i].measure;
    for (let j = 0; j < mm.voices.length; ++j) {
      const vv = mm.voices[j];
      for (let k = 0; k < vv.notes.length; ++k) {
        const nn = vv.notes[k];
        if (nn) {
          if (nn.noteType === 'n' &&  nn.tickCount < 4096) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
/**
 * True if any of the selected measures has a note (not a rest)
 */
const hasNotes = (menu: SuiMenuBase): boolean => {
  for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
    const mm = menu.view.tracker.selections[i].measure;
    for (let j = 0; j < mm.voices.length; ++j) {
      const vv = mm.voices[j];
      for (let k = 0; k < vv.notes.length; ++k) {
        const nn = vv.notes[k];
        if (nn) {
          if (nn.noteType === 'n') {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/**
 * @category SuiMenu
 */
const unbeamSelectionsMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.unbeamSelections();
  }, display: hasBeamableNotes,
  menuChoice: {
    icon: 'smoi icon-smo icon-beamBreak',
    text: 'Unbeam Selections',
    hotkey: 'x',
    value: 'toggleBeamMenuOption'
  }
}
/**
 * @category SuiMenu
 */
const beamSelectionsMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.beamSelections();
  }, display: hasBeamableNotes,
  menuChoice: {
    icon: 'bv tall bv-beamed',
    text: 'Beam Selections',
    hotkey: 'Shift-X',
    value: 'beamSelectionsMenuOption'
  }
}
/**
 * Remove any hand-placed beam breaks and joins from the selected notes, so they beam automatically
 * @category SuiMenu
 */
const autoBeamSelectionsMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.autoBeamSelections();
  }, display: hasBeamableNotes,
  menuChoice: {
    icon: '',
    text: 'Autobeam Selections',
    value: 'autoBeamSelectionsMenuOption'
  }
}
const quickBeamOptions: SuiConfiguredMenuOption[] = [
  beamSelectionsMenuOption, unbeamSelectionsMenuOption, autoBeamSelectionsMenuOption
];
/**
 * Beam, unbeam or autobeam the selected notes
 * @category SuiMenu
 */
const quickBeamMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {}, // unreachable -- subMenu takes precedence over handler
  display: hasBeamableNotes,
  subMenu: quickBeamOptions,
  menuChoice: {
    icon: 'bv tall bv-beamed',
    text: 'Quick Beam',
    value: 'quickBeamMenuOption'
  }
}
/**
 * One choice of the Stem Direction submenu
 * @category SuiMenu
 */
const stemDirectionChoice = (flagState: number, text: string, value: string): SuiConfiguredMenuOption => ({
  handler: async (menu: SuiMenuBase) => {
    await menu.view.setStemDirection(flagState);
  }, display: hasNotes,
  menuChoice: {
    icon: '',
    text,
    value
  }
});
const stemDirectionOptions: SuiConfiguredMenuOption[] = [
  stemDirectionChoice(SmoNote.flagStates.up, 'Stems Up', 'stemsUp'),
  stemDirectionChoice(SmoNote.flagStates.down, 'Stems Down', 'stemsDown'),
  stemDirectionChoice(SmoNote.flagStates.auto, 'Stems Auto', 'stemsAuto')
];
/**
 * Set the stem direction of the selected notes to up, down or automatic.  (The Shift-B key
 * still steps through the three.)
 * @category SuiMenu
 */
const stemDirectionMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {}, // unreachable -- subMenu takes precedence over handler
  display: hasNotes,
  subMenu: stemDirectionOptions,
  menuChoice: {
    icon: 'smoi icon-smo icon-flagFlip',
    text: 'Stem Direction',
    value: 'stemDirectionMenuOption'
  }
}
/**
 * Set the beam grouping for measures, e.g. 3 + 2 in 5/8
 * @category SuiMenu
 */
const beamGroupsMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiBeamGroupsDialogVue({
      ctor: 'SuiBeamGroupsDialog',
      id: 'beamGroupsDialog',
      tracker: menu.view.tracker,
      completeNotifier: menu.completeNotifier,
      startPromise: null,
      view: menu.view,
      eventSource: menu.eventSource
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'bv tall bv-beamed',
    text: 'Beam Groups',
    value: 'beamGroupsMenuOption'
  }
}

/**
 * Stuff you can do to beams
 * @category SuiMenu
 */
export const SuiBeamMenuOptions: SuiConfiguredMenuOption[] = [quickBeamMenuOption,
  beamGroupsMenuOption, stemDirectionMenuOption
];
