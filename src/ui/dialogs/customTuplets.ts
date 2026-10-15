// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMeasure } from '../../smo/data/measure';
import { SmoMeasureFormat, SmoMeasureFormatNumberAttributes, SmoMeasueFormatBooleanAttributes } from '../../smo/data/measureModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import {MakeTupletOperation} from "../../smo/xform/operations";

declare var $: any;

/**
 * @category SuiDialog
 */
export class SuiCustomTupletAdapter extends SuiComponentAdapter {
    makeTuplet: MakeTupletOperation = {
        numNotes: 3,
        notesOccupied: 2,
        ratioed: false,
        bracketed: true
    };
    constructor(view: SuiScoreViewOperations) {
        super(view);
    }
    async commit(){
        await this.view.makeTuplet(this.makeTuplet);
    }
    async cancel() {
    }
    get numNotes() {
        return this.makeTuplet.numNotes;
    }
    set numNotes(value: number) {
        if (value < 1) {
            value = 1;
        }
        this.makeTuplet.numNotes = value;
    }
    get notesOccupied() {
        return this.makeTuplet.notesOccupied;
    }
    set notesOccupied(value: number) {
        if (value < 1) {
            value = 1;
        }
        this.makeTuplet.notesOccupied = value;
    }
    get ratioed(): boolean {
        return this.makeTuplet.ratioed;
    }
    set ratioed(value: boolean) {
        this.makeTuplet.ratioed = value;
    }
    get bracketed(): boolean {
        return this.makeTuplet.bracketed;
    }
    set bracketed(value: boolean) {
        this.makeTuplet.bracketed = value;
    }
}

export class SuiCustomTupletDialog extends SuiDialogAdapterBase<SuiCustomTupletAdapter> {
    static dialogElements: DialogDefinition =
        {
            label: 'Custom Tuplet',
            elements:
                [{
                    smoName: 'numNotes',
                    control: 'SuiRockerComponent',
                    label: 'Num of notes',
                    dataType: 'int',
                    min: 1,
                }, {
                    smoName: 'notesOccupied',
                    control: 'SuiRockerComponent',
                    label: 'Notes occupied',
                    dataType: 'int',
                    min: 1,
                }, {
                    smoName: 'ratioed',
                    control: 'SuiToggleComponent',
                    label: 'Ratioed'
                }, {
                    smoName: 'bracketed',
                    control: 'SuiToggleComponent',
                    label: 'Bracketed'
                }],
            staticText: []
        };
    constructor(parameters: SuiDialogParams) {
        const adapter = new SuiCustomTupletAdapter(parameters.view);
        super(SuiCustomTupletDialog.dialogElements, { adapter, ...parameters });
    }

}
