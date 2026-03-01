
import { SmoModifier } from '../../smo/data/score';
import { SuiDialogBase, SuiDialogParams, createAndDisplayDialog, DialogTranslations, 
  suiDialogTranslate } from './dialog';
import { SuiHairpinAttributesDialog } from './hairpin';
import { SuiSlurAttributesDialog } from './slur';
import { SuiPedalMarkingDialog } from './pedalMarking';
import { SuiVoltaAttributeDialog } from './volta';
import { SuiLyricDialog } from './lyric';
import { SuiChordChangeDialog } from './chordChange';
import { SuiTieAttributesDialog } from './tie';
import { SuiDynamicModifierDialog } from './dynamics';
import { SuiTextBlockDialog } from './textBlock';
import { SuiTextBracketDialog } from './textBracket';
import { SuiArpeggioDialog } from './arpeggio';
import { SuiDialogNotifier, SmoDynamicComponentCtor, SuiBaseComponentParams } from './components/baseComponent';
import { SuiButtonComponent, SuiButtonComposite, SuiButtonCompositeParams, SuiButtonComponentParams } from './components/button';
import { CheckboxDropdownComponent, CheckboxDropdownComponentParams } from './components/checkdrop';
import { SuiDragText } from './components/dragText';
import { SuiDropdownComponent, SuiDropdownComponentParams, SuiDropdownCompositeParams, SuiDropdownComposite } from './components/dropdown';
import { SuiFileDownloadComponentParams, SuiFileDownloadComponent } from './components/fileDownload';
import { SuiFontComponent, SuiFontComponentParams } from './components/fontComponent';
import { SuiNoteTextParams, SuiLyricComponent, SuiChordComponent } from './components/noteText';
import { SuiPitchComponentParams, SuiPitchComponent, SuiPitchComposite, SuiPitchCompositeParams, SuiPitchArrayComponentTab } from './components/pitch';
import { SuiRockerComponentParams,SuiRockerComponent, SuiRockerComposite, SuiRockerCompositeParams } from './components/rocker';
import { StaffAddRemoveComponentParams, StaffAddRemoveComponent,  StaffCheckComponentParams, StaffCheckComponent } from './components/staffComponents';
import { TextCheckComponentParams, TextCheckComponent } from './components/textCheck';
import { SuiTextInPlace, SuiTextInPlaceParams,  SuiTextBlockComponent, SuiTextBlockComponentParams } from './components/textInPlace';
import { SuiTextInputComponentParams, SuiTextInputComponent, 
  SuiTextInputCompositeParams, SuiTextInputComposite, SuiReadOnlyTextComponent } from './components/textInput';
import { TieMappingComponentParams, TieMappingComponent } from './components/tie';
import { SuiToggleComponentParams, SuiToggleComponent, SuiToggleCompositeParams, SuiToggleComposite } from './components/toggle';
import { SuiTreeComponent, SuiTreeComponentParams } from './components/tree';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SuiExceptionHandler } from '../exceptions';

export type ModifiersWithDialogs = 'SmoStaffHairpin' | 'SmoTie' | 'SmoSlur' | 
'SmoDynamicText' | 'SmoVolta' | 'SmoScoreText' | 'SmoLoadScore' | 'SmoLyric' | 'SmoPedalMarking';
export var ModifiersWithDialogNames = ['SmoStaffHairpin', 'SmoTie', 'SmoSlur', 'SmoDynamicText', 'SmoVolta',
  'SmoScoreText', 'SmoLoadScore', 'SmoLyric', 'SmoTextGroup', 'SmoStaffTextBracket', 'SmoPedalMarking'];

export function isModifierWithDialog(modifier: SmoModifier) {
  return ModifiersWithDialogNames.indexOf(modifier.attrs.type) >= 0;
}
/**
 * Dialogs bound to hot keys are created here
 * directly from a button/menu option
 * @category SuiDialog
 */
 export class SuiModifierDialogFactory {
  static createModifierDialog(modifier: SmoModifier, parameters: SuiDialogParams): SuiDialogBase | null {
    if (!isModifierWithDialog(modifier)) {
      return null;
    }
    const ctor = modifier.attrs.type;
    parameters.modifier = modifier;
    if (ctor === 'SmoStaffHairpin') {
      return createAndDisplayDialog(SuiHairpinAttributesDialog, parameters);
    } else if (ctor === 'SmoPedalMarking') {
      return createAndDisplayDialog(SuiPedalMarkingDialog, parameters);
    } else if (ctor === 'SmoTie') {
      return createAndDisplayDialog(SuiTieAttributesDialog, parameters);
    } else if (ctor === 'SmoSlur') {
      return createAndDisplayDialog(SuiSlurAttributesDialog, parameters);
    } else if (ctor === 'SmoDynamicText') {
      return createAndDisplayDialog(SuiDynamicModifierDialog, parameters);
    } else if (ctor === 'SmoVolta') {
      return createAndDisplayDialog(SuiVoltaAttributeDialog, parameters);
    } else if (ctor === 'SmoTextGroup') {      
      return createAndDisplayDialog(SuiTextBlockDialog, parameters);
    } else if (ctor === 'SmoStaffTextBracket') {
      return createAndDisplayDialog(SuiTextBracketDialog, parameters);
    } else {
      if (modifier.ctor !== 'SmoLyric') {
         new SuiExceptionHandler({
          view: parameters.view,
          navigation: parameters.view.renderer.navigation
        }).exceptionHandler(`SuiModifierDialogFactory: unhandled modifier type ${modifier.ctor}`);
      }
      
      const lModifier = (modifier as SmoLyric);
      if (lModifier.parser == SmoLyric.parsers.lyric) {
        return createAndDisplayDialog(SuiLyricDialog, parameters);
      } else {
        return createAndDisplayDialog(SuiChordChangeDialog, parameters);
      }
    }
  }
}

export const initDialogTranslationElements = () => {
  DialogTranslations.push(suiDialogTranslate(SuiHairpinAttributesDialog.dialogElements, 'SuiHairpinAttributesDialog'));
  DialogTranslations.push(suiDialogTranslate(SuiPedalMarkingDialog.dialogElements, 'SuiPedalMarkingDialog'));
  DialogTranslations.push(suiDialogTranslate(SuiTieAttributesDialog.dialogElements, 'SuiTieAttributesDialog'));
  DialogTranslations.push(suiDialogTranslate(SuiSlurAttributesDialog.dialogElements, 'SuiSlurAttributesDialog'));
  DialogTranslations.push(suiDialogTranslate(SuiDynamicModifierDialog.dialogElements, 'SuiDynamicModifierDialog'));
  DialogTranslations.push(suiDialogTranslate(SuiVoltaAttributeDialog.dialogElements, 'SuiVoltaAttributeDialog'));
  DialogTranslations.push(suiDialogTranslate(SuiTextBlockDialog.dialogElements, 'SuiTextBlockDialog'));
  DialogTranslations.push(suiDialogTranslate(SuiTextBlockDialog.dialogElements, 'SuiTextBracketDialog'));
  DialogTranslations.push(suiDialogTranslate(SuiLyricDialog.dialogElements, 'SuiLyricDialog'));
  // DialogTranslations.push(suiDialogTranslate(SuiArpeggioDialog.dialogElements, 'SuiArpeggioDialog'));
}
export const initDialogConstructors = () => {
  SmoDynamicComponentCtor['SuiButtonComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiButtonComponentParams) => new SuiButtonComponent(dialog, params);
  SmoDynamicComponentCtor['SuiButtonComposite'] = 
  (dialog: SuiDialogNotifier, params: SuiButtonCompositeParams) => new SuiButtonComposite(dialog, params);
  SmoDynamicComponentCtor['CheckboxDropdownComponent'] = 
  (dialog: SuiDialogNotifier, params: CheckboxDropdownComponentParams) => new CheckboxDropdownComponent(dialog, params);
  SmoDynamicComponentCtor['SuiDragText'] = 
  (dialog: SuiDialogNotifier, params: SuiBaseComponentParams) => new SuiDragText(dialog, params);
  //SuiDropdownComponent, SuiDropdownComponentParams, SuiDropdownCompositeParams, SuiDropdownComposite
  SmoDynamicComponentCtor['SuiDropdownComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiDropdownComponentParams) => new SuiDropdownComponent(dialog, params);
  SmoDynamicComponentCtor['SuiDropdownComposite'] = 
  (dialog: SuiDialogNotifier, params: SuiDropdownCompositeParams) => new SuiDropdownComposite(dialog, params);
  SmoDynamicComponentCtor['SuiFileDownloadComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiFileDownloadComponentParams) => new SuiFileDownloadComponent(dialog, params);
  SmoDynamicComponentCtor['SuiFontComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiFontComponentParams) => new SuiFontComponent(dialog, params);
  SmoDynamicComponentCtor['SuiLyricComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiNoteTextParams) => new SuiLyricComponent(dialog, params);
  SmoDynamicComponentCtor['SuiChordComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiNoteTextParams) => new SuiChordComponent(dialog, params);
  SmoDynamicComponentCtor['SuiPitchComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiPitchComponentParams) => new SuiPitchComponent(dialog, params);
  SmoDynamicComponentCtor['SuiPitchComposite'] = 
  (dialog: SuiDialogNotifier, params: SuiPitchCompositeParams) => new SuiPitchComposite(dialog, params);
  SmoDynamicComponentCtor['SuiPitchArrayComponentTab'] = 
  (dialog: SuiDialogNotifier, params: SuiPitchCompositeParams) => new SuiPitchArrayComponentTab(dialog, params);
  SmoDynamicComponentCtor['SuiRockerComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiRockerComponentParams) => new SuiRockerComponent(dialog, params);
  SmoDynamicComponentCtor['SuiRockerComposite'] = 
  (dialog: SuiDialogNotifier, params: SuiRockerCompositeParams) => new SuiRockerComposite(dialog, params);
  SmoDynamicComponentCtor['StaffAddRemoveComponent'] = 
  (dialog: SuiDialogNotifier, params: StaffAddRemoveComponentParams) => new StaffAddRemoveComponent(dialog, params);
  SmoDynamicComponentCtor['StaffCheckComponent'] = 
  (dialog: SuiDialogNotifier, params: StaffCheckComponentParams) => new StaffCheckComponent(dialog, params);
  SmoDynamicComponentCtor['TextCheckComponent'] = 
  (dialog: SuiDialogNotifier, params: TextCheckComponentParams) => new TextCheckComponent(dialog, params);
  SmoDynamicComponentCtor['SuiTextInPlace'] = 
  (dialog: SuiDialogNotifier, params: SuiTextInPlaceParams) => new SuiTextInPlace(dialog, params);
  SmoDynamicComponentCtor['SuiTextBlockComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiTextBlockComponentParams) => new SuiTextBlockComponent(dialog, params);
  SmoDynamicComponentCtor['SuiTextInputComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiTextInputComponentParams) => new SuiTextInputComponent(dialog, params);
  SmoDynamicComponentCtor['SuiTextInputComposite'] = 
  (dialog: SuiDialogNotifier, params: SuiTextInputCompositeParams) => new SuiTextInputComposite(dialog, params);
  SmoDynamicComponentCtor['SuiReadOnlyTextComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiTextInputComponentParams) => new SuiReadOnlyTextComponent(dialog, params);
  SmoDynamicComponentCtor['TieMappingComponent'] = 
  (dialog: SuiDialogNotifier, params: TieMappingComponentParams) => new TieMappingComponent(dialog, params);
  SmoDynamicComponentCtor['SuiToggleComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiToggleComponentParams) => new SuiToggleComponent(dialog, params);
  SmoDynamicComponentCtor['SuiToggleComposite'] = 
  (dialog: SuiDialogNotifier, params: SuiToggleCompositeParams) => new SuiToggleComposite(dialog, params);
  SmoDynamicComponentCtor['SuiTreeComponent'] = 
  (dialog: SuiDialogNotifier, params: SuiTreeComponentParams) => new SuiTreeComponent(dialog, params);
}