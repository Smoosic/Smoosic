import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from './baseComponent';
/**
 * parameters for simple on-off toggle
 * @category SuiDialog
 */
export interface SuiToggleComponentParams {
    id: string;
    classes: string;
    type?: string;
    increment?: number;
    label: string;
    smoName: string;
    control: string;
}
/**
 * Simple boolean checkbox component
 * @category SuiDialog
 */
export declare class SuiToggleComponent extends SuiComponentBase {
    defaultValue: boolean;
    constructor(dialog: SuiDialogNotifier, parameter: SuiToggleComponentParams);
    get html(): import("../../../common/htmlHelpers").DomBuilder;
    _getInputElement(): any;
    setValue(value: boolean): void;
    getValue(): any;
    bind(): void;
}
/**
 * Params for toggle combined with another component
 * @category SuiDialog
 */
export interface SuiToggleCompositeParams {
    id: string;
    classes: string;
    type?: string;
    increment?: number;
    label: string;
    smoName: string;
    control: string;
    disabledOption?: string;
    defaultValue?: string | number;
    dataType?: string;
    parentControl: SuiComponentParent;
}
/**
 * Dropdown component that can be part of a composite control.
 * @category SuiDialog
 */
export declare class SuiToggleComposite extends SuiToggleComponent {
    parentControl: SuiComponentParent;
    constructor(dialog: SuiDialogNotifier, parameters: SuiToggleCompositeParams);
    handleChanged(): Promise<void>;
}
