import { SuiMenuBase, SuiMenuParams, MenuDefinition, SuiMenuHandler, SuiMenuShowOption, 
  SuiConfiguredMenuOption, SuiConfiguredMenu, MenuChoiceDefinition } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';

declare var $: any;
/**
 * Add, select, delete and change voices
 * @category SuiMenu
 */
export class SuiVoiceMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Voices', SuiVoiceMenuOptions);
  }
}
class voiceSwapperMenuOption implements SuiConfiguredMenuOption {
  voice1: number;
  voice2: number;
  cmd: string;
  label: string;
  get menuChoice(): MenuChoiceDefinition  {
    return {
      icon: '',
      text: this.label,
      value: this.cmd
    }
  }
  constructor(voice1: number, voice2: number) {
    this.voice1 = voice1;
    this.voice2 = voice2;
    this.label = `Swap ${voice1 + 1} and ${voice2 + 1}`;
    this.cmd = `${voice1}To${voice2}`;
  }
  async handler(menu: SuiMenuBase) {
    menu.view.swapVoices(this.voice1, this.voice2);
  }
  display(menu: SuiMenuBase) {
    const measures = menu.view.tracker.getSelectedMeasures();
    if (measures.length > 0) {
        const sel = measures[0];
        const swaps = sel.measure.getSwapVoicePairs();
        for (let i = 0; i < swaps.length; ++i) {
          const pair = swaps[i];
          if (this.voice1 == pair[0] && this.voice2 == pair[1]) {
            return true;
          }
      }
    }
    return false;
  }
}
class selectVoiceMenuOption implements SuiConfiguredMenuOption {
  voice: number;
  constructor(voice: number) {
    this.voice = voice;
  }
  async handler (menu: SuiMenuBase)  {
    await menu.view.populateVoice(this.voice);
  }
  display (menu: SuiMenuBase) {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      if (mm.voices.length === 1) {
        return this.voice === 1;
      }
      // If there are n voices, and I am n+1, show option
      if (mm.voices.length === this.voice) {
        return true;
      }
      if (mm.voices.length > this.voice && mm.getActiveVoice() !== this.voice) {
        return true;
      }
    }
    return false;
  }
  get menuChoice()  {
    return {
      icon: '',
      text: `Voice ${this.voice + 1}`,
      value: `voice${this.voice.toString()}`
    };
  }
}
/**
 * @category SuiMenu
 */
const selectVoiceOneMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.populateVoice(0);
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      if (mm.voices.length > 1) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Voice 1',
    value: 'voiceOne'
  }
}
/**
 * @category SuiMenu
 */
const selectVoiceTwoMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.populateVoice(1);
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      if (mm.voices.length <= 4 && mm.voices.length > 1) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Voice 2',
    value: 'voiceTwo'
  }
}
/**
 * @category SuiMenu
 */
const selectVoiceThreeMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.populateVoice(2);
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      if (mm.voices.length < 4 && mm.voices.length > 1) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Voice 3',
    value: 'voiceThree'
  }
}
/**
 * @category SuiMenu
 */
const selectVoiceFourMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.populateVoice(3);
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      if (mm.voices.length < 4 && mm.voices.length > 2) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Voice 4',
    value: 'voiceFour'
  }
}
/**
 * @category SuiMenu
 */
const removeVoiceMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    await menu.view.depopulateVoice();
  }, display: (menu: SuiMenuBase) => {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
      const mm = menu.view.tracker.selections[i].measure;
      if (mm.activeVoice > 0) {
        return true;
      }
    }
    return false;
  },
  menuChoice: {
    icon: '',
    text: 'Remove Voice',
    value: 'removeVoice'
  }
}
/**
 * voice editing options (parallel voices in same stave)
 * @category SuiMenu
 */
const SuiVoiceMenuOptions: SuiConfiguredMenuOption[] = [
  new selectVoiceMenuOption(0),
  new selectVoiceMenuOption(1),
  new selectVoiceMenuOption(2),
  new selectVoiceMenuOption(3),
   new voiceSwapperMenuOption(0, 1),  
   new voiceSwapperMenuOption(0, 2),
   new voiceSwapperMenuOption(0, 3),
   new voiceSwapperMenuOption(1, 2),
   new voiceSwapperMenuOption(1, 3),
   new voiceSwapperMenuOption(2, 3),
  removeVoiceMenuOption
];
