import { SuiDialogParams } from './dialog';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
/**
 * Collects the beam grouping and where to apply it, then applies it to the score.
 * @category SuiDialog
 */
export declare class SuiBeamGroupsAdapter {
    view: SuiScoreViewOperations;
    /** the grouping set in the dialog; empty means the default for the meter */
    groups: number[];
    applyTo: 'selections' | 'all';
    constructor(view: SuiScoreViewOperations, groups: number[]);
    commit(): Promise<void>;
    cancel(): Promise<void>;
}
/**
 * Dialog for setting the beam grouping of measures, for compound or irregular meters.
 * Follows the creation-function pattern of SuiKeySignatureDialogVue.
 */
export declare const SuiBeamGroupsDialogVue: (parameters: SuiDialogParams) => void;
