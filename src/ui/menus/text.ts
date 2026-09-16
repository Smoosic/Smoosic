import { SuiMenuBase, SuiMenuParams, MenuDefinition, SuiMenuHandler, SuiMenuShowOption, 
  SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SmoDynamicText, SmoLyric } from '../../smo/data/noteModifiers';
import { SuiChordChangeDialogVue } from '../dialogs/chordChangeVue';
import { SuiLyricDialogVue } from '../dialogs/lyricVue';
import { SuiDynamicModifierDialogVue } from '../dialogs/dynamicsVue';
import { SuiTextBlockDialogVue } from '../dialogs/textBlockVue';
import { SuiAnnotationDialogVue } from '../dialogs/annotationVue';

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
    icon: 'mi font_download',
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
    icon: 'mi title',
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
    SuiChordChangeDialogVue(      {
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
    icon: 'bv bv-csymHalfDiminished',
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

    SuiLyricDialogVue({
      completeNotifier: menu.completeNotifier!,
      view: menu.view,
      eventSource: menu.eventSource,
      id: 'lyricDialog',
      ctor: 'SuiLyricDialogVue',
      tracker: menu.view.tracker,
      startPromise: menu.closePromise,
      modifier: null
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'icon-smo smoi oversize icon-lyric',
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
    icon: 'bv bv-mezzo-forte',
    text: 'Dynamics',
    value: 'dynamicsMenu'
  }
}
/**
 * Free-text annotation attached to selected note(s) (SmoLyric, parser 'annotation').
 * Unlike lyrics/chords, a multi-note selection shares one annotation instance
 * applied identically to every selected note -- modeled on dynamicsDialogMenuOption's
 * multi-selection semantics. See specs/017-text-annotations.
 * @category SuiMenu
 */
const annotationDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    const sel = menu.view.tracker.selections;
    if (!sel.length || !sel[0].note) {
      return;
    }
    const existing = sel[0].note.getAnnotations();
    let annotation: SmoLyric;
    if (existing.length) {
      annotation = existing[0] as SmoLyric;
    } else {
      annotation = new SmoLyric({ ...SmoLyric.defaults, parser: SmoLyric.parsers.annotation, text: '' });
      for (let i = 0; i < sel.length; ++i) {
        if (sel[i].note) {
          await menu.view.addOrUpdateAnnotation(sel[i].selector, annotation);
        }
      }
    }
    SuiAnnotationDialogVue({
      completeNotifier: menu.completeNotifier!,
      view: menu.view,
      eventSource: menu.eventSource,
      id: 'annotationDialog',
      ctor: 'SuiAnnotationDialog',
      tracker: menu.view.tracker,
      startPromise: menu.closePromise,
      modifier: annotation
    });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'mi comment',
    text: 'Annotation',
    value: 'annotationMenu'
  }
}
/**
 * stuff you can do with text, or loosely related to text.
 * @category SuiMenu
 */
const SuiTextMenuOptions: SuiConfiguredMenuOption[] =
[dynamicsDialogMenuOption, textBlockDialogMenuOption,
  chordChangeDialogMenuOption, lyricsDialogMenuOption, annotationDialogMenuOption, rehearsalLetterDialogMenuOption];

