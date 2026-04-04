import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from './baseComponent';
/**
 * parameters for text input component (simple text entry, not SVG text)
 * @category SuiDialog
 */
export interface SuiTextInputComponentParams {
    id: string;
    classes: string;
    type?: string;
    increment?: number;
    defaultValue: string;
    label: string;
    smoName: string;
    control: string;
}
/**
 * Simple text input, like for a filename.  Not the text editing component.
 * @category SuiDialog
 */
export declare class SuiTextInputComponent extends SuiComponentBase {
    defaultValue: string;
    value: string;
    constructor(dialog: SuiDialogNotifier, parameter: SuiTextInputComponentParams);
    get html(): import("../../../common/htmlHelpers").DomBuilder;
    getValue(): string;
    setValue(val: string): void;
    _getInputElement(): any;
    bind(): void;
}
/**
 * @category SuiDialog
 */
export interface SuiTextInputCompositeParams {
    id: string;
    classes: string;
    type?: string;
    increment?: number;
    defaultValue: string;
    label: string;
    smoName: string;
    control: string;
    parentControl: SuiComponentParent;
}
/**
 * @category SuiDialog
 */
export declare class SuiTextInputComposite extends SuiTextInputComponent {
    parentControl: SuiComponentParent;
    constructor(dialog: SuiDialogNotifier, parameters: SuiTextInputCompositeParams);
    handleChanged(): Promise<void>;
}
/**
 * A static text message that appears in the dialog
 * @category SuiDialog
 */
export declare class SuiReadOnlyTextComponent extends SuiTextInputComponent {
    constructor(dialog: SuiDialogNotifier, parameter: SuiTextInputComponentParams);
}
