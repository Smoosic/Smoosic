import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from './baseComponent';
/**
 * Simple buttons in dialogs
 * @category SuiDialog
 */
export interface SuiButtonComponentParams {
    id: string;
    classes: string;
    type?: string;
    increment?: number;
    text?: string;
    label: string;
    smoName: string;
    control: string;
    icon: string;
}
/**
 * Simple click behavior.  No value just used to notifiy parent dialog
 * @category SuiDialog
 */
export declare class SuiButtonComponent extends SuiComponentBase {
    icon: string;
    text?: string;
    constructor(dialog: SuiDialogNotifier, parameter: SuiButtonComponentParams);
    get html(): import("../../../common/htmlHelpers").DomBuilder;
    _getInputElement(): any;
    setValue(): void;
    getValue(): null;
    bind(): void;
}
/**
 * @category SuiDialog
 */
export interface SuiButtonCompositeParams {
    id: string;
    classes: string;
    type?: string;
    increment?: number;
    label: string;
    smoName: string;
    text?: string;
    control: string;
    icon: string;
    parentControl: SuiComponentParent;
}
/**
 * Buttons that are part of a composite control
 * @category SuiDialog
 */
export declare class SuiButtonComposite extends SuiButtonComponent {
    parentControl: SuiComponentParent;
    constructor(dialog: SuiDialogNotifier, parameters: SuiButtonCompositeParams);
    handleChanged(): Promise<void>;
}
