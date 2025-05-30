// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoTempoText, SmoTempoNumberAttribute, SmoTempoStringAttribute, SmoTempoBooleanAttribute } from '../../smo/data/measureModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { SmoMeasure } from '../../smo/data/measure';
import { PromiseHelpers } from '../../common/promiseHelpers';

declare var $: any;
/**
 * Manage tempo map for the score
 * @category SuiDialog
 */
export class SuiTempoAdapter extends SuiComponentAdapter {
  smoTempoText: SmoTempoText;
  backup: SmoTempoText;
  applyToAllVal: boolean = false;  
  applyToSelection: boolean = false;
  edited: boolean = false;
  measure: SmoMeasure;
  constructor(view: SuiScoreViewOperations, measure: SmoMeasure) {
    super(view);
    this.measure = measure;
    this.smoTempoText = new SmoTempoText(measure.tempo);
    this.backup = new SmoTempoText(this.smoTempoText);
  }
  writeNumber(param: SmoTempoNumberAttribute, value: number) {
    this.smoTempoText[param] = value;
    this.view.updateTempoScore(this.measure, this.smoTempoText, this.applyToAll, this.applyToSelection);
    this.edited = true;
  }
  writeBoolean(param: SmoTempoBooleanAttribute, value: boolean) {
    this.smoTempoText[param] = value;
    this.view.updateTempoScore(this.measure, this.smoTempoText, this.applyToAll, this.applyToSelection);
    this.edited = true;
  }
  writeString(param: SmoTempoStringAttribute, value: string) {
    (this.smoTempoText as any)[param] = value;
    this.view.updateTempoScore(this.measure, this.smoTempoText, this.applyToAll, this.applyToSelection);
    this.edited = true;
  }
  async remove() {
    await this.view.removeTempo(this.measure, this.smoTempoText, this.applyToAll, this.applyToSelection);
  }
  async cancel() {
    await this.view.updateTempoScore(this.measure, this.backup, this.applyToAll, this.applyToSelection);
  }
  get applyToAll() {
    return this.applyToAllVal;
  }
  set applyToAll(val: boolean) {
    this.applyToAllVal = val;
    this.view.updateTempoScore(this.measure, this.smoTempoText, this.applyToAll, this.applyToSelection);
    this.edited = true;
  }
  async commit(){
    return PromiseHelpers.emptyPromise();
  }
  get tempoText() {
    return this.smoTempoText.tempoText;
  }
  set tempoText(value: string) {
    this.writeString('tempoText', value);
  }
  get tempoMode() {
    return this.smoTempoText.tempoMode;
  }
  set tempoMode(value: string) {
    this.writeString('tempoMode', value);
  }
  get customText() {
    return this.smoTempoText.customText;
  }
  set customText(value: string) {
    this.writeString('customText', value);
  }
  get bpm() {
    return this.smoTempoText.bpm;
  }
  set bpm(value: number) {
    this.writeNumber('bpm', value);
  }
  get display() {
    return this.smoTempoText.display;
  }
  set display(value: boolean) {
    this.writeBoolean('display', value);
  }
  get beatDuration() {
    return this.smoTempoText.beatDuration;
  }
  set beatDuration(value: number) {
    this.writeNumber('beatDuration', value);
  }
  get yOffset() {
    return this.smoTempoText.yOffset;
  }
  set yOffset(value: number) {
    this.writeNumber('yOffset', value);
  }
}
/**
 * @category SuiDialog
 */
export class SuiTempoDialog extends SuiDialogAdapterBase<SuiTempoAdapter> {
  static dialogElements: DialogDefinition = 
      {
        label: 'Tempo Properties',
        elements: [
          {
            smoName: 'tempoMode',
            defaultValue: SmoTempoText.tempoModes.durationMode,
            control: 'SuiDropdownComponent',
            label: 'Tempo Mode',
            options: [{
              value: 'duration',
              label: 'Duration (Beats/Minute)'
            }, {
              value: 'text',
              label: 'Tempo Text'
            }, {
              value: 'custom',
              label: 'Specify text and duration'
            }
            ]
          },
          {
            smoName: 'customText',
            defaultValue: '',
            control: 'SuiTextInputComponent',
            label: 'Custom Text',
            classes: 'hide-when-text-mode'
          },
          {
            smoName: 'bpm',
            defaultValue: 120,
            control: 'SuiRockerComponent',
            label: 'Notes/Minute'
          },
          {
            smoName: 'beatDuration',
            defaultValue: 4096,
            dataType: 'int',
            control: 'SuiDropdownComponent',
            label: 'Unit for Beat',
            options: [{
              value: 4096,
              label: 'Quarter Note',
            }, {
              value: 2048,
              label: '1/8 note'
            }, {
              value: 6144,
              label: 'Dotted 1/4 note'
            }, {
              value: 8192,
              label: '1/2 note'
            }
            ]
          },
          {
            smoName: 'tempoText',
            defaultValue: SmoTempoText.tempoTexts.allegro,
            control: 'SuiDropdownComponent',
            label: 'Tempo Text',
            classes: 'hide-when-not-text-mode',
            options: [{
              value: SmoTempoText.tempoTexts.larghissimo,
              label: 'Larghissimo'
            }, {
              value: SmoTempoText.tempoTexts.grave,
              label: 'Grave'
            }, {
              value: SmoTempoText.tempoTexts.lento,
              label: 'Lento'
            }, {
              value: SmoTempoText.tempoTexts.largo,
              label: 'Largo'
            }, {
              value: SmoTempoText.tempoTexts.larghetto,
              label: 'Larghetto'
            }, {
              value: SmoTempoText.tempoTexts.adagio,
              label: 'Adagio'
            }, {
              value: SmoTempoText.tempoTexts.adagietto,
              label: 'Adagietto'
            }, {
              value: SmoTempoText.tempoTexts.andante_moderato,
              label: 'Andante moderato'
            }, {
              value: SmoTempoText.tempoTexts.andante,
              label: 'Andante'
            }, {
              value: SmoTempoText.tempoTexts.andantino,
              label: 'Andantino'
            }, {
              value: SmoTempoText.tempoTexts.moderator,
              label: 'Moderato'
            }, {
              value: SmoTempoText.tempoTexts.allegretto,
              label: 'Allegretto',
            }, {
              value: SmoTempoText.tempoTexts.allegro,
              label: 'Allegro'
            }, {
              value: SmoTempoText.tempoTexts.vivace,
              label: 'Vivace'
            }, {
              value: SmoTempoText.tempoTexts.presto,
              label: 'Presto'
            }, {
              value: SmoTempoText.tempoTexts.prestissimo,
              label: 'Prestissimo'
            }
            ]
          }, {
            smoName: 'applyToAll',
            control: 'SuiToggleComponent',
            label: 'Apply to all future measures?'
          }, {
            smoName: 'applyToSelection',
            control: 'SuiToggleComponent',
            label: 'Apply to selection?'
          }, {
            smoName: 'display',
            control: 'SuiToggleComponent',
            label: 'Display Tempo'
          }, {
            smoName: 'yOffset',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Y Offset'
          }
        ],
        staticText: []
      };
  showHideCustom(): void {
    if (this.adapter.tempoMode === 'custom') {
      this.cmap.customTextCtrl.show();
    } else {
      this.cmap.customTextCtrl.hide();
    }
  }
  async changed() {
    await super.changed();
    this.showHideCustom();
  }
  initialValue() {
    super.initialValue();
    this.showHideCustom();
  }

  constructor(parameters: SuiDialogParams) {
    const measures = SmoSelection.getMeasureList(parameters.view.tracker.selections)
      .map((sel) => sel.measure);
    const measure = measures[0];
    const adapter = new SuiTempoAdapter(parameters.view, measure);
    super(SuiTempoDialog.dialogElements, { adapter, ...parameters });
  }
}
