import { SuiMenuBase, SuiMenuParams, SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { SmoTranslator } from '../i18n/language';

declare var $: any;
/**
 * @category SuiMenu
 */
export class SuiLanguageMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Language', SuiLanguageMenuOptions);
  }
}
/**
 * @category SuiMenu
 */
const englishMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SmoTranslator.setLanguage('en');
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'English',
    value: 'en'
  }
}
/**
 * @category SuiMenu
 */
const deutschMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SmoTranslator.setLanguage('de');
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Deutsch',
    value: 'de'
  }
}
/**
 * @category SuiMenu
 */
const arabicMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SmoTranslator.setLanguage('ar');
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'اَلْعَرَبِيَّةُ',
    value: 'ar'
  }
}
/**
 * @category SuiMenu
 */
const SuiLanguageMenuOptions: SuiConfiguredMenuOption[] = [
  englishMenuOption, deutschMenuOption, arabicMenuOption
];
