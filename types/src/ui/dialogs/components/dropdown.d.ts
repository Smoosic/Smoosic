import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent, DialogDefinitionOption } from './baseComponent';
/**
 * constructor params for {@link SuiDropdownComponent}
 * @param id id in DOM
 * @param classes
 * @param type indicates the data type of the value
 * @param increment not used
 * @param label
 * @param smoName variable name in dialog/adapter
 * @param control name of constructor
 * @param disabledOption
 * @category SuiDialog
 */
export interface SuiDropdownComponentParams {
    id: string;
    classes: string;
    increment?: number;
    label: string;
    smoName: string;
    control: string;
    disabledOption?: string;
    dataType?: string;
    options?: DialogDefinitionOption[];
}
/**
 * single-select dropdown list
 * @category SuiDialog
 */
export declare class SuiDropdownComponent extends SuiComponentBase {
    options: DialogDefinitionOption[];
    disabledOption: string;
    dataType: string;
    value: string;
    optionIds: string[];
    constructor(dialog: SuiDialogNotifier, parameter: SuiDropdownComponentParams);
    checkDefault(s: any, b: any): void;
    get html(): import("../../../common/htmlHelpers").DomBuilder;
    updateControls(): void;
    unselect(): void;
    _getInputElement(): any;
    getValue(): string | number;
    getValueLabel(): string;
    setValue(value: string | number): void;
    bind(): void;
}
/**
 * constructor params for {@link SuiDropdownComposite}
 * element, often a checkbox
 * @param {id} - unique ID for the control DOM
 * @param {classes} - additional classes for styling added to DOM
 * @param {label} - default label for the component
 * @param {smoName} - the variable in the dialog that the componenet maps to
 * @param {control} - the constructor of the UI control
 * @param {parentComponent} - for composite components, the top-level
 * @category SuiDialog
 * */
export interface SuiDropdownCompositeParams {
    id: string;
    classes: string;
    type?: string;
    increment?: number;
    label: string;
    smoName: string;
    control: string;
    disabledOption?: string;
    dataType?: string;
    options?: DialogDefinitionOption[];
    parentControl: SuiComponentParent;
}
/**
 * A dropdown composite mixes a dropdown with some other
 * @category SuiDialog
 */
export declare class SuiDropdownComposite extends SuiDropdownComponent {
    parentControl: SuiComponentParent;
    constructor(dialog: SuiDialogNotifier, parameters: SuiDropdownCompositeParams);
    handleChanged(): Promise<void>;
}
