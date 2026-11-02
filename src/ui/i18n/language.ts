// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoLanguageStringAr } from './language_ar';
import { smoLanguageStringDe } from './language_de';
import { smoLanguageStringEn } from './language_en';
import { MenuChoiceDefinition, MenuDefinition, MenuTranslation, MenuTranslations } from '../menus/menu';
import { ButtonLabel } from '../buttons/button';
import { SmoNamespace } from '../../smo/data/common';
import { RibbonButtons } from '../buttons/ribbon';
import { DialogTranslations, DialogTranslation } from '../dialogs/dialog';
declare var $: any;

export interface TranslationStrings {
  dialogs: DialogTranslation[],
  menus: MenuTranslation[],
  buttonText: ButtonLabel[]
}
export type languageDirection = 'ltr' | 'rtl';
export interface LanguageTranslation {
  dir: languageDirection, strings: TranslationStrings, helpHtml: any
}
export class SmoTranslator {
  static dialogs: any[] = [];

  static menus: any[] = [];
  static debugMask: number = 0;

  static registerMenu(_class: any) {
    if (!SmoTranslator.menus[_class]) {
      SmoTranslator.menus[_class] = true;
    }
  }
  static registerDialog(_class: any) {
    if (!SmoTranslator.dialogs[_class]) {
      SmoTranslator.dialogs[_class] = true;
    }
  }

  static printLanguages() {
    const dialogs: any[] = [];
    const menus: any[] = [];
    if (!SmoTranslator.debugMask) {
      return;
    }
    DialogTranslations.forEach((translation) => {
      dialogs.push(JSON.parse(JSON.stringify(translation)));
    });
    MenuTranslations.forEach((translation) => {
      menus.push(JSON.parse(JSON.stringify(translation)));
    });
    const buttonText: any[] = JSON.parse(JSON.stringify(RibbonButtons.translateButtons));
    if (SmoTranslator.debugMask) {
      console.log(JSON.stringify({ dialogs, menus, buttonText }, null, ' '));
    }
  }

  static _updateDialog(dialogStrings: DialogTranslation, _dialogClass: any, dialogClass: string) {
    if (!dialogStrings) {
      console.log('no strings for Dialog ' + dialogClass);
      return;
    }
    _dialogClass.label = dialogStrings.label;
    const staticText = dialogStrings.staticText;
    if (staticText || _dialogClass.dialogElements.staticText) {
      const keys = Object.keys(staticText);
      keys.forEach((key) => {
        _dialogClass.dialogElements.staticText[key] = staticText[key];
      });
    }
    _dialogClass.dialogElements.label = dialogStrings.label;
    _dialogClass.dialogElements.elements.forEach((component: any) => {
      const componentStrings = dialogStrings.dialogElements.find((ds: any) => ds.id === component.smoName);
      if (componentStrings) {
        component.label = componentStrings.label;
        if (component.options) {
          component.options.forEach((option: any) => {
            const optionString = componentStrings!.options!.find((cs: any) => cs.value === option.value);
            if (!optionString) {
              if (SmoTranslator.debugMask) {
                console.log('no string for option ' + option.value + ' in component ' + component.smoName + ' in dialog ' + dialogClass);
              }
            } else {
              option.label = optionString.label;
            }
          });
        }
      } else {
        if (SmoTranslator.debugMask) {
          console.log('Untranslated component in  ' + dialogClass);
        }
      }
    });
  }

  /**
   * TODO: update this so that dynamic constructors aren't needed.
   * @param language 
   * @returns 
   */
  static setLanguage(language: string) {
    console.warn('Ouch, need to implement languages');
    if (!(SmoLanguage as any)[language]) {
      return; // no xlate exists
    }
    const trans = (SmoLanguage as any)[language] as LanguageTranslation;    
    // Handle rtl languages
    $('body').find('.language-dir').each((ix: number, dd: any) => { $(dd).attr('dir', trans.dir); });
  }

  static get allMenus() {
    return [
      'SuiDynamicsMenu',
      'SuiFileMenu',
      'SuiKeySignatureMenu',
      'SuiLanguageMenu',
      'SuiMeasureMenu',
      'SuiPartMenu',
      'SuiScoreMenu',
      'SuiStaffModifierMenu',
      'SuiTimeSignatureMenu',
    ];
  }

  static get allDialogs() {
    return [
      // file dialogs
      'SuiChordChangeDialog',
      'SuiDynamicModifierDialog',
      'SuiGlobalLayoutDialog',
      'SuiHairpinAttributesDialog',
      'SuiInsertMeasures',
      'SuiInstrumentDialog',
      'SuiLoadFileDialog',
      'SuiLoadMxmlDialog',
      'SuiLyricDialog',
      'SuiMeasureDialog',
      'SuiPageLayoutDialog',
      'SuiPartInfoDialog',
      'SuiPrintFileDialog',
      'SuiRecoveryDialog',
      'SuiSaveFileDialog',
      'SuiSaveMidiDialog',
      'SuiSaveXmlDialog',
      'SuiScoreFontDialog',
      'SuiScorePreferencesDialog',
      'SuiScoreIdentificationDialog',
      'SuiScoreViewDialog',
      'SuiSlurAttributesDialog',
      'SuiStaffGroupDialog',
      'SuiTempoDialog',
      'SuiTextBlockDialog',
      'SuiTieAttributesDialog',
      'SuiTimeSignatureDialog',
      'SuiVoltaAttributeDialog'
    ];
  }
}

export class SmoLanguage {
  static getHelpFile(category: any) {
    // TODO: how to express language if it is not part of the config?
    return eval(`${SmoNamespace.value}.${category}En`);
  }
  static get en(): LanguageTranslation {
    const strings: TranslationStrings = JSON.parse(smoLanguageStringEn) as TranslationStrings;
    const rv: LanguageTranslation = { dir: 'ltr', strings, helpHtml: {} };
    return rv;
  }

  static get ar(): LanguageTranslation {
    const strings = JSON.parse(smoLanguageStringAr) as TranslationStrings;
    const rv: LanguageTranslation = { dir: 'rtl', strings, helpHtml: {} };
    return rv;
  }

  static get de(): LanguageTranslation {
    const strings = JSON.parse(smoLanguageStringDe) as TranslationStrings;
    const rv: LanguageTranslation = { dir: 'ltr', strings, helpHtml: {} };
    return rv;
  }
}
