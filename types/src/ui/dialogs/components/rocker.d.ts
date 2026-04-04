import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from './baseComponent';
/**
 * Basic dialog component info.
 * @category SuiDialog
 */
export interface SuiRockerComponentParams {
    id: string;
    classes: string;
    dataType?: string;
    increment?: number;
    label: string;
    smoName: string;
    control: string;
    min?: number;
    max?: number;
}
/**
 * A numeric input box with +- buttons.   Adjustable type and scale
 * @category SuiDialog
 * */
export declare class SuiRockerComponent extends SuiComponentBase {
    static get dataTypes(): string[];
    static get increments(): Record<string, number>;
    static get parsers(): Record<string, string>;
    initialValue: number;
    dataType: string;
    increment: number;
    parser: string;
    min: number | undefined;
    max: number | undefined;
    constructor(dialog: SuiDialogNotifier, params: SuiRockerComponentParams);
    get html(): import("../../../common/htmlHelpers").DomBuilder;
    get parameterId(): string;
    handleChange(): void;
    bind(): void;
    _getInputElement(): any;
    _getIntValue(): number;
    _getFloatValue(): number;
    _getPercentValue(): number;
    _setIntValue(val: string | number): void;
    setValue(value: number): void;
    getValue(): any;
}
/**
 * Create rocker composite
 * @category SuiDialog
 */
export interface SuiRockerCompositeParams {
    id: string;
    classes: string;
    dataType?: string;
    increment?: number;
    defaultValue: number;
    label: string;
    smoName: string;
    control: string;
    parentControl: SuiComponentParent;
}
/**
 * @category SuiDialog
 */
export declare class SuiRockerComposite extends SuiRockerComponent {
    parentControl: SuiComponentParent;
    constructor(dialog: SuiDialogNotifier, parameters: SuiRockerCompositeParams);
    handleChanged(): Promise<void>;
}
