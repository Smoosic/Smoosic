import { SmoTempo, SmoTempoNumberAttribute, SmoTempoStringAttribute, SmoTempoBooleanAttribute } from '../../smo/data/measureModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { SmoMeasure } from '../../smo/data/measure';
/**
 * Manage tempo map for the score
 * @category SuiDialog
 */
export declare class SuiTempoAdapter extends SuiComponentAdapter {
    SmoTempo: SmoTempo;
    backup: SmoTempo;
    applyToAllVal: boolean;
    applyToSelection: boolean;
    edited: boolean;
    measure: SmoMeasure;
    constructor(view: SuiScoreViewOperations, measure: SmoMeasure);
    writeNumber(param: SmoTempoNumberAttribute, value: number): void;
    writeBoolean(param: SmoTempoBooleanAttribute, value: boolean): void;
    writeString(param: SmoTempoStringAttribute, value: string): void;
    remove(): Promise<void>;
    cancel(): Promise<void>;
    get applyToAll(): boolean;
    set applyToAll(val: boolean);
    commit(): Promise<any>;
    get tempoText(): string;
    set tempoText(value: string);
    get tempoMode(): string;
    set tempoMode(value: string);
    get customText(): string;
    set customText(value: string);
    get bpm(): number;
    set bpm(value: number);
    get display(): boolean;
    set display(value: boolean);
    get beatDuration(): number;
    set beatDuration(value: number);
    get yOffset(): number;
    set yOffset(value: number);
}
/**
 * @category SuiDialog
 */
export declare class SuiTempoDialog extends SuiDialogAdapterBase<SuiTempoAdapter> {
    static dialogElements: DialogDefinition;
    showHideCustom(): void;
    changed(): Promise<void>;
    initialValue(): void;
    constructor(parameters: SuiDialogParams);
}
