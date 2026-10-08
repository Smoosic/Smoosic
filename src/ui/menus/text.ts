import { SuiMenuBase, SuiMenuParams, MenuDefinition, SuiMenuHandler, SuiMenuShowOption,
  SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SmoDynamicText, SmoLyric } from '../../smo/data/noteModifiers';
import { SmoTextGroup } from '../../smo/data/scoreText';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
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
 * Looks up an existing landmark text group of the given purpose, checking the same
 * collection `SuiScoreViewOperations.addTextGroup` would have written a new one to,
 * so "does this landmark already exist" and "where would a new one be stored" always
 * agree. See specs/021-landmark-text-menu.
 * @category SuiMenu
 */
const findLandmark = (purpose: number, view: SuiScoreViewOperations): SmoTextGroup | undefined => {
  const partInfo = view.score.staves[0].partInfo;
  const groups = (view.isPartExposed() && partInfo.preserveTextGroups) ?
    partInfo.textGroups : view.score.getTextGroups();
  return groups.find((tg) => tg.purpose === purpose);
};
/**
 * Top-anchored landmarks are stacked in these columns (top-center: Title/Subtitle;
 * upper-right: Composer/Page number/Part). See findAboveLandmark. Bottom-anchored
 * purposes (Copyright, Date) are not columns -- each keeps its own fixed offset
 * from the page's bottom edge.
 * @category SuiMenu
 */
const LANDMARK_COLUMNS: number[][] = [
  [SmoTextGroup.purposes.TITLE, SmoTextGroup.purposes.SUBTITLE],
  [SmoTextGroup.purposes.COMPOSER, SmoTextGroup.purposes.PAGE, SmoTextGroup.purposes.PART]
];
/**
 * For a top-anchored landmark purpose, finds the already-existing landmark in its
 * column with the lowest (furthest down) rendered bottom edge, so a newly created
 * landmark can be stacked directly below the current bottom of that column instead
 * of using the top-of-page base position. Deliberately order-independent -- it does
 * not matter which of the column's purposes was created first (e.g. Page number
 * before Composer); whichever already-existing member currently sits lowest is what
 * the new one stacks below. Returns undefined if the purpose isn't in a column, or
 * no other member of its column exists yet.
 * @category SuiMenu
 */
const findAboveLandmark = (purpose: number, view: SuiScoreViewOperations): SmoTextGroup | undefined => {
  const column = LANDMARK_COLUMNS.find((col) => col.includes(purpose));
  if (!column) {
    return undefined;
  }
  let lowest: SmoTextGroup | undefined;
  let lowestBottom = -Infinity;
  column.forEach((columnPurpose) => {
    if (columnPurpose === purpose) {
      return;
    }
    const existing = findLandmark(columnPurpose, view);
    if (existing && existing.logicalBox) {
      const bottom = existing.logicalBox.y + existing.logicalBox.height;
      if (bottom > lowestBottom) {
        lowestBottom = bottom;
        lowest = existing;
      }
    }
  });
  return lowest;
};
/**
 * Whether the given landmark purpose's underlying source currently has content
 * (score info field defined, or a part is exposed for the Part purpose).
 * @category SuiMenu
 */
const sourceTextDefined = (purpose: number, view: SuiScoreViewOperations): boolean => {
  const scoreInfo = view.score.scoreInfo;
  if (purpose === SmoTextGroup.purposes.TITLE) {
    return scoreInfo.title.trim() !== '';
  }
  if (purpose === SmoTextGroup.purposes.SUBTITLE) {
    return scoreInfo.subTitle.trim() !== '';
  }
  if (purpose === SmoTextGroup.purposes.COMPOSER) {
    return scoreInfo.composer.trim() !== '';
  }
  if (purpose === SmoTextGroup.purposes.COPYRIGHT) {
    return scoreInfo.copyright.trim() !== '';
  }
  if (purpose === SmoTextGroup.purposes.PART) {
    return view.isPartExposed();
  }
  // DATE and PAGE are always available.
  return true;
};
/**
 * Produces the text to populate a newly-created landmark of the given purpose.
 * @category SuiMenu
 */
const resolveLandmarkText = (purpose: number, view: SuiScoreViewOperations): string => {
  const scoreInfo = view.score.scoreInfo;
  if (purpose === SmoTextGroup.purposes.TITLE) {
    return scoreInfo.title;
  }
  if (purpose === SmoTextGroup.purposes.SUBTITLE) {
    return scoreInfo.subTitle;
  }
  if (purpose === SmoTextGroup.purposes.COMPOSER) {
    return scoreInfo.composer;
  }
  if (purpose === SmoTextGroup.purposes.COPYRIGHT) {
    return scoreInfo.copyright;
  }
  if (purpose === SmoTextGroup.purposes.PART) {
    return view.score.staves[0].partInfo.partName;
  }
  if (purpose === SmoTextGroup.purposes.PAGE) {
    return 'Page ### of @@@';
  }
  // DATE: reuse the zero-padded YYYY-MM-DD convention already used for MusicXML export
  // (src/smo/mxml/smoToXml.ts).
  const today = new Date();
  const dd = (n: number) => n < 10 ? '0' + n.toString() : n.toString();
  return today.getFullYear() + '-' + dd(today.getMonth() + 1) + '-' + dd(today.getDate());
};
/**
 * A representative, already-substituted version of a landmark's text, used only to
 * estimate its width/height for positioning (SmoTextGroup.createLandmarkText's
 * measureText parameter). Needed for Page number, whose stored text is the literal
 * '###'/'@@@' marker template -- those markers are 3 characters each, almost always
 * wider than the real page/total-page numbers they're substituted with at render
 * time, so estimating width from the literal template overstates it and throws off
 * right-justification. Every other purpose's stored text has no markers, so this
 * just returns the same text resolveLandmarkText already produced for it.
 * @category SuiMenu
 */
const resolveLandmarkMeasureText = (purpose: number, view: SuiScoreViewOperations, resolvedText: string): string => {
  if (purpose === SmoTextGroup.purposes.PAGE) {
    const pageCount = view.score.layoutManager!.pageLayouts.length;
    return `Page 1 of ${pageCount}`;
  }
  return resolvedText;
};
/**
 * Finds purpose's existing landmark, or creates and adds one if it's missing (does not open
 * any dialog). Shared by landmarkOption's single-purpose handler and allLandmarksOption's bulk
 * handler, so both paths create a landmark identically. See specs/024-all-landmarks-menu.
 * @category SuiMenu
 */
const ensureLandmark = async (purpose: number, menu: SuiMenuBase): Promise<SmoTextGroup> => {
  let group = findLandmark(purpose, menu.view);
  if (!group) {
    const text = resolveLandmarkText(purpose, menu.view);
    const measureText = resolveLandmarkMeasureText(purpose, menu.view, text);
    const layout = menu.view.score.layoutManager!.getScaledPageLayout(0);
    const above = findAboveLandmark(purpose, menu.view);
    group = SmoTextGroup.createLandmarkText(purpose, text, layout, above, measureText);
    await menu.view.addTextGroup(group);
  }
  return group;
};
/**
 * The purpose/label/icon triples shown as individual landmark submenu choices, and also the
 * order allLandmarksOption creates them in (so same-column stacking via findAboveLandmark sees
 * earlier purposes in the same bulk pass already added). See specs/024-all-landmarks-menu/research.md §3.
 * @category SuiMenu
 */
const LANDMARK_PURPOSE_LIST: { purpose: number, label: string, icon: string }[] = [
  { purpose: SmoTextGroup.purposes.TITLE, label: 'Title', icon: 'mi title' },
  { purpose: SmoTextGroup.purposes.SUBTITLE, label: 'Subtitle', icon: 'mi title' },
  { purpose: SmoTextGroup.purposes.COMPOSER, label: 'Composer', icon: 'mi title' },
  { purpose: SmoTextGroup.purposes.COPYRIGHT, label: 'Copyright', icon: 'mi title' },
  { purpose: SmoTextGroup.purposes.DATE, label: 'Date', icon: 'mi title' },
  { purpose: SmoTextGroup.purposes.PAGE, label: 'Page Number', icon: 'mi title' },
  { purpose: SmoTextGroup.purposes.PART, label: 'Part', icon: 'mi title' }
];
/**
 * One choice per landmark purpose, shown as a submenu of landmarkTextMenuOption.
 * Selecting a purpose that has no existing landmark creates one automatically
 * (SmoTextGroup.createLandmarkText) and adds it to the score/part; selecting a
 * purpose that already has one just opens its dialog. See specs/021-landmark-text-menu.
 * @category SuiMenu
 */
const landmarkOption = (purpose: number, label: string, icon: string): SuiConfiguredMenuOption => ({
  handler: async (menu: SuiMenuBase) => {
    const group = await ensureLandmark(purpose, menu);
    SuiTextBlockDialogVue({
      completeNotifier: menu.completeNotifier!,
      view: menu.view,
      eventSource: menu.eventSource,
      id: 'textDialog',
      ctor: 'SuiTextBlockDialog',
      tracker: menu.view.tracker,
      startPromise: menu.closePromise,
      modifier: group
    });
  },
  display: (menu: SuiMenuBase) => sourceTextDefined(purpose, menu.view)
    || (purpose !== SmoTextGroup.purposes.PART && typeof (findLandmark(purpose, menu.view)) !== 'undefined'),
  menuChoice: {
    icon,
    text: label,
    value: `landmark-${label}`
  }
});
/**
 * Creates every currently-available landmark that doesn't already exist, in LANDMARK_PURPOSE_LIST
 * order; already-existing landmarks are left untouched. Unlike landmarkOption's handler, never
 * opens SuiTextBlockDialogVue -- the menu framework already closes the menu after any leaf
 * option's handler returns (SuiConfiguredMenu.selection / menuLevel selectItem), so no additional
 * "close the menu" step is needed here. See specs/024-all-landmarks-menu.
 * @category SuiMenu
 */
const allLandmarksOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    for (const { purpose } of LANDMARK_PURPOSE_LIST) {
      if (findLandmark(purpose, menu.view)) {
        continue;
      }
      if (sourceTextDefined(purpose, menu.view)) {
        await ensureLandmark(purpose, menu);
      }
    }
  },
  display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'mi title',
    text: 'All',
    value: 'landmark-All'
  }
};
/**
 * @category SuiMenu
 */
const landmarkOptions: SuiConfiguredMenuOption[] = [
  ...LANDMARK_PURPOSE_LIST.map(({ purpose, label, icon }) => landmarkOption(purpose, label, icon)),
  allLandmarksOption
];
/**
 * Submenu of landmark text choices, one per SmoTextGroup.purposes value (Title,
 * Subtitle, Composer, Copyright, Date, Page Number, Part). See specs/021-landmark-text-menu.
 * @category SuiMenu
 */
const landmarkTextMenuOption: SuiConfiguredMenuOption = {
  handler: async () => {}, // unreachable -- subMenu takes precedence over handler
  display: (menu: SuiMenuBase) => true,
  subMenu: landmarkOptions,
  menuChoice: {
    icon: 'mi title',
    text: 'Landmark Text',
    value: 'landmarkTextMenu'
  }
}
/**
 * stuff you can do with text, or loosely related to text.
 * @category SuiMenu
 */
const SuiTextMenuOptions: SuiConfiguredMenuOption[] =
[dynamicsDialogMenuOption, textBlockDialogMenuOption, landmarkTextMenuOption,
  chordChangeDialogMenuOption, lyricsDialogMenuOption, annotationDialogMenuOption, rehearsalLetterDialogMenuOption];

