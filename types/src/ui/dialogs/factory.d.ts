import { SmoModifier } from '../../smo/data/score';
import { SuiDialogBase, SuiDialogParams } from './dialog';
export type ModifiersWithDialogs = 'SmoStaffHairpin' | 'SmoTie' | 'SmoSlur' | 'SmoDynamicText' | 'SmoVolta' | 'SmoScoreText' | 'SmoLoadScore' | 'SmoLyric' | 'SmoPedalMarking' | 'SmoRehearsalMark';
export declare var ModifiersWithDialogNames: string[];
export declare function isModifierWithDialog(modifier: SmoModifier): boolean;
/**
 * Dialogs bound to hot keys are created here
 * directly from a button/menu option
 * @category SuiDialog
 */
export declare class SuiModifierDialogFactory {
    static createModifierDialog(modifier: SmoModifier, parameters: SuiDialogParams): SuiDialogBase | null;
}
export declare const initDialogTranslationElements: () => void;
export declare const initDialogConstructors: () => void;
