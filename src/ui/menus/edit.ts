import { SuiMenuBase, SuiMenuParams, SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { PasteBuffer } from '../../smo/xform/copypaste';

declare var $: any;
/**
 * Stuff you can do to notes
 * @category SuiMenu
 */
export class SuiEditMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Edit', SuiEditMenuOptions);
  }  
}
/**
 * Copy Ctrl^C action
 * @category SuiMenu
 */
const copyMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.copy();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'icon-copy',
    text: 'Copy',
    value: 'copyAction'
  }
}

/**
 * Copy Ctrl^C action
 * @category SuiMenu
 */
const pasteMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.paste();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'icon-paste',
    text: 'Paste',
    value: 'pasteAction'
  }
}

/**
 * Copy Ctrl^C action
 * @category SuiMenu
 */
const pasteChordsMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.pasteChords();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Paste Chords',
    value: 'pasteChordsAction'
  }
}

/**
 * One choice of the Copy Voices submenu: a single voice, or all of them.  A choice is only
 * shown if the selected measures have that voice.
 * @category SuiMenu
 */
const copyVoiceChoice = (voice: number | 'all'): SuiConfiguredMenuOption => ({
  handler: async (menu: SuiMenuBase) => {
    await menu.view.copyVoices(voice);
  },
  display: (menu: SuiMenuBase) =>
    PasteBuffer.copyVoiceChoices(menu.view.getSelectionVoiceCount()).indexOf(voice) >= 0,
  menuChoice: {
    icon: '',
    text: voice === 'all' ? 'All Voices' : `Voice ${voice + 1}`,
    value: voice === 'all' ? 'copyVoiceAll' : `copyVoice${voice}`
  }
});
/**
 * Copy one voice or all voices, in whole measures
 * @category SuiMenu
 */
const copyVoicesMenuOption: SuiConfiguredMenuOption = {
  handler: async () => { }, // unreachable -- subMenu takes precedence over handler
  display: (menu: SuiMenuBase) => PasteBuffer.copyVoiceChoices(menu.view.getSelectionVoiceCount()).length > 0,
  subMenu: [0, 1, 2, 3, 'all'].map((v) => copyVoiceChoice(v as number | 'all')),
  menuChoice: {
    icon: 'icon-copy',
    text: 'Copy Voices',
    value: 'copyVoicesAction'
  }
}
/**
 * The voices that can be pasted at the selected measure, given what was copied
 */
const pasteVoiceChoices = (menu: SuiMenuBase) =>
  PasteBuffer.pasteVoiceChoices(menu.view.storePaste.copiedVoiceNumbers(), menu.view.getDestinationVoiceCount());
/**
 * One choice of the Paste Voice submenu: an existing voice (replacing it), a new voice after the
 * existing ones, or all the copied voices.
 * @category SuiMenu
 */
const pasteVoiceChoice = (voice: number | 'all' | 'new'): SuiConfiguredMenuOption => ({
  handler: async (menu: SuiMenuBase) => {
    await menu.view.pasteVoices(voice);
  },
  display: (menu: SuiMenuBase) => pasteVoiceChoices(menu).indexOf(voice) >= 0,
  menuChoice: {
    icon: '',
    text: voice === 'all' ? 'All Voices' : (voice === 'new' ? 'New Voice' : `Voice ${voice + 1}`),
    value: voice === 'all' ? 'pasteVoiceAll' : (voice === 'new' ? 'pasteVoiceNew' : `pasteVoice${voice}`)
  }
});
/**
 * Paste copied voices at the start of the selected measure
 * @category SuiMenu
 */
const pasteVoiceMenuOption: SuiConfiguredMenuOption = {
  handler: async () => { }, // unreachable -- subMenu takes precedence over handler
  display: (menu: SuiMenuBase) => pasteVoiceChoices(menu).length > 0,
  subMenu: [0, 1, 2, 3, 'new', 'all'].map((v) => pasteVoiceChoice(v as number | 'all' | 'new')),
  menuChoice: {
    icon: 'icon-paste',
    text: 'Paste Voice',
    value: 'pasteVoiceAction'
  }
}

/**
 * Copy Ctrl^C action
 * @category SuiMenu
 */
const undoMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.undo();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'icon-undo',
    text: 'Undo',
    value: 'undoAction'
  }
}

/**
 * Note menu.  Stuff you can do to notes.
 * @category SuiMenu
 */
const SuiEditMenuOptions: SuiConfiguredMenuOption[] = [
  copyMenuOption, pasteMenuOption, pasteChordsMenuOption, copyVoicesMenuOption, pasteVoiceMenuOption, undoMenuOption
];