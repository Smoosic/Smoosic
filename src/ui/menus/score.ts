import { SuiMenuBase, SuiMenuParams, SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { SuiScorePreferencesDialogVue } from '../dialogs/preferences';
import { SuiScoreIdentificationDialogVue } from '../dialogs/scoreId';
import { SuiPageLayoutDialogVue } from '../dialogs/pageLayout';
import { SuiScoreFontDialogVue } from '../dialogs/fonts';
import { SuiGlobalLayoutDialogVue } from '../dialogs/globalLayout';
import { SuiTransposeScoreDialogVue } from '../dialogs/transposeScore';
import { SuiStaffGroupDialogVue } from '../dialogs/staffGroup';

declare var $: any;
/**
 * stuff you can do to a score
 * @category SuiMenu
 */
export class SuiScoreMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Score Settings', SuiScoreMenuOptions);
  }
}
/**
 * @category SuiMenu
 */
const preferencesMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiScorePreferencesDialogVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'preferences',
        ctor: 'SuiScorePreferencesDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'mi settings',
    text: 'Smoosic Preferences',
    value: 'preferences'
  }
}
/**
 * @category SuiMenu
 */
const viewAllMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.viewAll();
  }, display: (menu: SuiMenuBase) => menu.score.staves.length < menu.view.storeScore.staves.length,
  menuChoice: {
    icon: 'mi table_rows',
    text: 'View All',
    value: 'viewAll'
  }
}
/**
 * @category SuiMenu
 */
const globalLayoutMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiGlobalLayoutDialogVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'globalLayout',
        ctor: 'SuiGlobalLayoutDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      });
  }, display: (menu: SuiMenuBase) => menu.view.isPartExposed() === false,
  menuChoice: {
    icon: 'mi insert_page_break',
    text: 'Score Layout',
    value: 'globalLayout'
  }
}
/**
 * @category SuiMenu
 */
const pageLayoutMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiPageLayoutDialogVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'layoutDialog',
        ctor: 'SuiPageLayoutDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      });
  }, display: (menu: SuiMenuBase) => menu.view.isPartExposed() === false,
  menuChoice: {
    icon: 'mi margin',
    text: 'Page Margins',
    value: 'pageLayout'
  }
}
/**
 * @category SuiMenu
 */
const staffGroupsMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiStaffGroupDialogVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'staffGroups',
        ctor: 'SuiStaffGroupDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      }
    );
  }, display: (menu: SuiMenuBase) => menu.view.isPartExposed() === false,
  menuChoice: {
    icon: 'bv tall bv-brace',
    text: 'System Groups',
    value: 'staffGroups'
  }
}
/**
 * @category SuiMenu
 */
const fontsMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiScoreFontDialogVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'fontDialog',
        ctor: 'SuiScoreFontDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'mi font_download',
    text: 'Score Fonts',
    value: 'fonts'
  }
}
/**
 * @category SuiMenu
 */
const identificationMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiScoreIdentificationDialogVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'scoreIdDialog',
        ctor: 'SuiScoreIdentificationDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'mi info',
    text: 'Score Info',
    value: 'identification'
  }
}
/**
 * @category SuiMenu
 */
const transposeScoreMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiTransposeScoreDialogVue(
      {
        completeNotifier: menu.completeNotifier!,
        view: menu.view,
        eventSource: menu.eventSource,
        id: 'transposeScore',
        ctor: 'SuiTransposeScoreDialog',
        tracker: menu.view.tracker,
        modifier: null,
        startPromise: menu.closePromise
      });
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'bv bv-accidentalSharp',
    text: 'Transpose Score',
    value: 'transposeScore'
  }
}
/**
 * stuff you can do to a score
 * @category SuiMenu
 */
const SuiScoreMenuOptions: SuiConfiguredMenuOption[] = [
  preferencesMenuOption, viewAllMenuOption, globalLayoutMenuOption, pageLayoutMenuOption,
  staffGroupsMenuOption, fontsMenuOption, identificationMenuOption, transposeScoreMenuOption
];
