import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent, SuiBaseComponentParams } from '../components/baseComponent';
import { Pitch } from '../../../smo/data/common';
import { DomBuilder } from '../../../common/htmlHelpers';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { SuiDropdownComposite } from './dropdown';
import { SuiRockerComposite } from './rocker';
import { SuiButtonComposite } from './button';
/**
 * @category SuiDialog
 */
export interface SuiPitchComponentParams {
    id: string;
    classes: string;
    label: string;
    smoName: string;
    control: string;
}
/**
 * Allows users to pick a letter pitch, used in tab stave dialogs
 * @category SuiDialog
 */
export declare class SuiPitchComponent extends SuiComponentBase {
    view: SuiScoreViewOperations;
    staticText: Record<string, string>;
    letterCtrl: SuiDropdownComposite;
    accidentalCtrl: SuiDropdownComposite;
    octaveCtrl: SuiRockerComposite;
    defaultValue: Pitch;
    constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams);
    get html(): DomBuilder;
    getInputElement(): any;
    getValue(): Pitch;
    setValue(val: Pitch): void;
    changed(): void;
    bind(): void;
}
export interface SuiPitchCompositeParams extends SuiPitchComponentParams {
    parentControl: SuiComponentParent;
}
/**
 * @category SuiDialog
 */
export declare class SuiPitchComposite extends SuiPitchComponent {
    parentControl: SuiComponentParent;
    constructor(dialog: SuiDialogNotifier, parameters: SuiPitchCompositeParams);
    handleChanged(): Promise<void>;
}
/**
 * @category SuiDialog
 */
export interface SuiPitchArrayItem {
    buttonCtrl: SuiButtonComposite;
    pitchCtrl: SuiPitchComposite;
    pitch: Pitch;
}
/**
 * @category SuiDialog
 */
export interface SuiPitchArrayParams {
    id: string;
    classes: string;
    label: string;
    smoName: string;
    control: string;
    pitches?: Pitch[];
}
export type getDefaultPitchesFcn = () => Pitch[];
export declare const getTabNotePitchesFcn: getDefaultPitchesFcn;
/**
 * @category SuiDialog
 */
export declare class SuiPitchArrayComponent extends SuiComponentParent {
    getButtonControlName(index: number): string;
    getPitchControlName(index: number): string;
    resetButton: SuiButtonComposite;
    pitchControls: SuiPitchArrayItem[];
    pitches: Pitch[];
    createdShell: boolean;
    defaultPitchFinder: getDefaultPitchesFcn;
    constructor(dialog: SuiDialogNotifier, parameters: SuiBaseComponentParams, def: getDefaultPitchesFcn);
    setPitchControls(): void;
    bind(): void;
    get html(): DomBuilder;
    getInputElement(): any;
    setValue(pitches: Pitch[]): void;
    getValue(): Pitch[];
    updateControls(): void;
    changed(): void;
}
/**
 * @category SuiDialog
 */
export declare class SuiPitchArrayComponentTab extends SuiPitchArrayComponent {
    constructor(dialog: SuiDialogNotifier, parameters: SuiBaseComponentParams);
}
