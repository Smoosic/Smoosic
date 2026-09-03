import { SuiMenuBase, SuiMenuParams, SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { SmoPedalMarking } from '../../smo/data/staffModifiers';
import { SmoSelector } from '../../smo/xform/selections';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';

declare var $: any;

/**
 * Dynamic function to add a pedal marking
 * @category SuiMenu
 * @param view
 * @param obj
 */
export async function addOrReplacePedalMarking(view: SuiScoreViewOperations, obj: SmoPedalMarking) {
  await view.addOrReplaceStaffModifier((score, fromSelection, toSelection) => {
    const modifier = new SmoPedalMarking(obj.serialize());
    modifier.startSelector = fromSelection.selector;
    modifier.endSelector = toSelection.selector;
    score.staves[modifier.startSelector.staff].addStaffModifier(modifier);
  }, obj);
}
/**
 * the 'lines' menu, mostly staff modifiers.
 * @category SuiMenu
 */
export class SuiStaffModifierMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Lines', SuiStaffModifierMenuOptions);
  }
}
/**
 * @category SuiMenu
 */
const crescendoMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.crescendo();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'cresc',
    text: 'Cresc. Hairpin',
    value: 'crescendo'
  }
}
/**
 * @category SuiMenu
 */
const decrescendoMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.decrescendo();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'decresc',
    text: 'Dim. Hairpin',
    value: 'decrescendo'
  }
}
/**
 * @category SuiMenu
 */
const slurMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.addSlur();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'slur',
    text: 'Slur',
    value: 'slur'
  }
}
/**
 * @category SuiMenu
 */
const tieMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.tie();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'slur',
    text: 'Tie',
    value: 'tie'
  }
}
/**
 * @category SuiMenu
 */
const pedalMarkingMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    const ft = menu.tracker.getExtremeSelection(-1);
    const tt = menu.tracker.getExtremeSelection(1);
    const defaults = SmoPedalMarking.defaults;
    defaults.startSelector = ft.selector;
    defaults.endSelector = tt.selector;
    const pedalMarking = new SmoPedalMarking(defaults);
    const overlaps = menu.score.staves[pedalMarking.startSelector.staff].findSimlarOverlap(pedalMarking);
    if (overlaps.length) {
      const minSelector = SmoSelector.order(overlaps[0].startSelector, pedalMarking.startSelector)[0];
      const maxSelector = SmoSelector.order(overlaps[0].endSelector, pedalMarking.endSelector)[1];
      pedalMarking.startSelector = minSelector;
      pedalMarking.endSelector = maxSelector;
      await menu.view.removeStaffModifier(overlaps[0]);
    }
    await addOrReplacePedalMarking(menu.view, pedalMarking);
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'pedal',
    text: 'Pedal Marking',
    value: 'pedalMarking'
  }
}
/**
 * @category SuiMenu
 */
const endingMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.addEnding();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'ending',
    text: 'nth ending',
    value: 'ending'
  }
}
/**
 * @category SuiMenu
 */
const dimenuendoMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.dimenuendo();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Dim. Bracket',
    value: 'dimenuendo'
  }
}
/**
 * @category SuiMenu
 */
const crescendoBracketMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.crescendoBracket();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Cresc. Bracket',
    value: 'crescendoBracket'
  }
}
/**
 * @category SuiMenu
 */
const accelMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.accelerando();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Accelerando',
    value: 'accel'
  }
}
/**
 * @category SuiMenu
 */
const ritardMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.ritard();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Ritard',
    value: 'ritard'
  }
}
/**
 * @category SuiMenu
 */
const resetSlursMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.refreshViewport();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'slur',
    text: 'Reset slurs',
    value: 'resetSlurs'
  }
}
/**
 * @category SuiMenu
 */
const endingsMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.addEnding();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'icon-ending',
    text: 'Repeate Endings',
    value: 'endings'
  }
}
/**
 * the 'lines' menu, mostly staff modifiers.
 * @category SuiMenu
 */
const SuiStaffModifierMenuOptions: SuiConfiguredMenuOption[] = [
  crescendoMenuOption, decrescendoMenuOption, slurMenuOption, tieMenuOption,
  pedalMarkingMenuOption, endingMenuOption, dimenuendoMenuOption, crescendoBracketMenuOption,
  accelMenuOption, ritardMenuOption, resetSlursMenuOption, endingsMenuOption
];
