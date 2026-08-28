import { SuiMenuBase, SuiMenuParams, MenuDefinition, SuiMenuHandler, SuiMenuShowOption, 
  SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiTextBlockDialog } from '../dialogs/textBlock';
import { SmoDynamicText } from '../../smo/data/noteModifiers';
import { SuiChordChangeDialog } from '../dialogs/chordChange';
import { SuiLyricDialog } from '../dialogs/lyric';
import { SuiDynamicModifierDialogVue } from '../dialogs/dynamicsVue';
import { SuiTextBlockDialogVue } from '../dialogs/textBlockVue';

declare var $: any;
/**
 * Stuff you can do with text.
 * @category SuiMenu
 */
export class SuiTextMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Notes', SuiTextMenuOptions);
  }  
}
/**
 * @category SuiMenu
 */
const rehearsalLetterDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.toggleRehearsalMark();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Rehearsal Letter',
    value: 'rehearsalLetter'
  }
}
/**
 * @category SuiMenu
 */
const textBlockDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiTextBlockDialogVue({
      completeNotifier: menu.completeNotifier!,
      view: menu.view,
      eventSource: menu.eventSource,
      id: 'textDialog',
      ctor: 'SuiTextBlockDialog',
      tracker: menu.view.tracker,
      startPromise: menu.closePromise,
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Score Text',
    value: 'textBlock'
  }
}
/**
 * @category SuiMenu
 */
const chordChangeDialogMenuOption: SuiConfiguredMenuOption = {  
  handler: async (menu: SuiMenuBase) => {
    const sel = menu.view.tracker.selections[0];
    const note = sel.note;
    if (!note) {
      return;
    }
    const lyrics = note.getChords();
    const lyric = lyrics.length > 0 ? null : lyrics[0];
    createAndDisplayDialog(SuiChordChangeDialog,
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'chordDialog',
        ctor: 'SuiChordChangeDialog',
        tracker: menu.view.tracker,
        startPromise: menu.closePromise,
        modifier: lyric
      }
    );
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Chord Changes',
    value: 'chordChanges'
  }
}
/**
 * @category SuiMenu
 */
const lyricsDialogMenuOption: SuiConfiguredMenuOption = {  
  handler: async (menu: SuiMenuBase) => {
    const sel = menu.view.tracker.selections[0];
    const note = sel.note;
    if (!note) {
      return;
    }
    const lyrics = note.getTrueLyrics();
    const lyric = lyrics.length > 0 ? lyrics[0] : null;

    createAndDisplayDialog(SuiLyricDialog, 
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'lyricDialog',
        ctor: 'SuiLyricDialog',
        tracker: menu.view.tracker,
        startPromise: menu.closePromise,
        modifier: lyric
      });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Lyrics',
    value: 'lyricMenu'
  }
}
/**
 * @category SuiMenu
 */
const dynamicsDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    const sel = menu.view.tracker.selections;
    let modifier: any = null;
    if (sel[0].note) {
      const dynamics = sel[0].note.getModifiers('SmoDynamicText');
      if (dynamics.length) {
        modifier = dynamics[0];
      } else {
        const params = SmoDynamicText.defaults;
        modifier = new SmoDynamicText(params);
        for (let i = 0; i < sel.length; ++i) {
          await menu.view.addDynamic(sel[i], modifier);
        }
      }
    }
    SuiDynamicModifierDialogVue({
      completeNotifier: menu.completeNotifier!,
      view: menu.view,
      eventSource: menu.eventSource,
      id: 'dynamicsDialog',
      ctor: 'SuiDynamicModifierDialog',
      tracker: menu.view.tracker,
      startPromise: menu.closePromise,
      modifier
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Dynamics',
    value: 'dynamicsMenu'
  }
}
/**
 * stuff you can do with text, or loosely related to text.
 * @category SuiMenu
 */
const SuiTextMenuOptions: SuiConfiguredMenuOption[] = 
[dynamicsDialogMenuOption, textBlockDialogMenuOption, 
  chordChangeDialogMenuOption, lyricsDialogMenuOption, rehearsalLetterDialogMenuOption];

