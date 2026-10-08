import { SuiMenuParams, SuiConfiguredMenu } from './menu';
import { SmoPedalMarking } from '../../smo/data/staffModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
/**
 * Dynamic function to add a pedal marking
 * @category SuiMenu
 * @param view
 * @param obj
 */
export declare function addOrReplacePedalMarking(view: SuiScoreViewOperations, obj: SmoPedalMarking): Promise<void>;
/**
 * the 'lines' menu, mostly staff modifiers.
 * @category SuiMenu
 */
export declare class SuiStaffModifierMenu extends SuiConfiguredMenu {
    constructor(params: SuiMenuParams);
}
