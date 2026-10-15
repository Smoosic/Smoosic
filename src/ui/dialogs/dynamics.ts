import { DialogDefinition, SuiDialogParams } from './dialog';
import { SmoDynamicText, SmoLyric } from '../../smo/data/noteModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SmoSelection } from '../../smo/xform/selections';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

/**
 * Edit or remove dynamice, a SmoNote attribute adapter
 * @category SuiDialog
 */
export class SuiDynamicDialogAdapter extends SuiComponentAdapter {
  modifier: SmoDynamicText;
  backup: SmoDynamicText;
  selections: SmoSelection[] = [];
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, modifier: SmoDynamicText) {
    super(view);
    this.modifier = modifier;
    this.backup = new SmoDynamicText(this.modifier);
    this.view.undoTrackerMeasureSelections('Dynamics');
    if (this.view.tracker.modifierSelections.length) {
      this.view.tracker.modifierSelections.forEach((ms) => {
        if (ms.selection) {
          this.selections.push(ms.selection);
        }
      });
    } else {
      this.selections = this.view.tracker.selections;
    }
  }
  async cancel() {
    this.view.undo();
  }
  async commit() {
  }
  get xOffset() {
    return this.modifier.xOffset;
  }
  async remove() {
    for (let i = 0;i < this.selections.length; ++i) {
      await this.view.removeDynamic(this.modifier);
    }
  }
  syncModifiers() {
    for (let i = 0;i < this.selections.length; ++i) {
      this.view.addDynamic(this.selections[i], this.modifier);
    }
  }
  set xOffset(value: number) {
    this.modifier.xOffset = value;
    for (let i = 0;i < this.selections.length; ++i) {
      this.view.addDynamic(this.selections[i], this.modifier);
    }
  }
  get fontSize() {
    return this.modifier.fontSize;
  }
  set fontSize(value: number) {
    this.modifier.fontSize = value;
    this.syncModifiers();
  }
  get yOffsetLine() {
    return this.modifier.yOffsetLine;
  }
  set yOffsetLine(value: number) {
    this.modifier.yOffsetLine = value;
    this.syncModifiers();
  }
  get yOffsetPixels() {
    return this.modifier.yOffsetPixels;
  }
  set yOffsetPixels(value: number) {
    this.modifier.yOffsetPixels = value;
    this.syncModifiers();
  }
  get text() {
    return this.modifier.text;
  }
  set text(value: string) {
    this.modifier.text = value;
    this.syncModifiers();
  }
}
/**
 * @category SuiDialog
 */
export class SuiDynamicModifierDialog extends SuiDialogAdapterBase<SuiDynamicDialogAdapter> {
  static dialogElements: DialogDefinition = {
        label: 'Dynamics Properties', elements:
          [{
            smoName: 'yOffsetLine',
            defaultValue: 11,
            control: 'SuiRockerComponent',
            label: 'Y Line'
          }, {
            smoName: 'yOffsetPixels',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Y Offset Px'
          }, {
            smoName: 'xOffset',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'X Offset'
          }, {
            smoName: 'text',
            defaultValue: SmoDynamicText.dynamics.P,
            options: [{
              value: SmoDynamicText.dynamics.P,
              label: 'Piano'
            }, {
              value: SmoDynamicText.dynamics.PP,
              label: 'Pianissimo'
            }, {
              value: SmoDynamicText.dynamics.MP,
              label: 'Mezzo-Piano'
            }, {
              value: SmoDynamicText.dynamics.MF,
              label: 'Mezzo-Forte'
            }, {
              value: SmoDynamicText.dynamics.F,
              label: 'Forte'
            }, {
              value: SmoDynamicText.dynamics.FF,
              label: 'Fortissimo'
            }, {
              value: SmoDynamicText.dynamics.SFZ,
              label: 'Sforzando'
            }],
            control: 'SuiDropdownComponent',
            label: 'Text'
          }],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiDynamicDialogAdapter(parameters.view, parameters.modifier);
    super(SuiDynamicModifierDialog.dialogElements, { adapter, ...parameters });
    this.view.groupUndo(true);
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
}