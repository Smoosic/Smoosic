import { buildDom } from '../../../common/htmlHelpers';
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from './baseComponent';
declare var $: any;

/**
 * parameters for simple on-off toggle
 * @category SuiDialog
 */
export interface SuiToggleComponentParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string
}
/**
 * Simple boolean checkbox component
 * @category SuiDialog
 */
export class SuiToggleComponent extends SuiComponentBase {
  defaultValue: boolean = false;
  constructor(dialog: SuiDialogNotifier, parameter: SuiToggleComponentParams) {
    super(dialog, parameter);
    this.defaultValue = false;
    this.dialog = dialog;
  }
  get html() {
    const b = buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('toggleControl smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('input').attr('type', 'checkbox').classes('toggleInput')
        .attr('id', id + '-input')).append(
        b('label').attr('for', id + '-input').text(this.label));
    return r;
  }
  _getInputElement() {
    const pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('input');
  }
  setValue(value: boolean) {
    $(this._getInputElement()).prop('checked', value);
  }
  getValue() {
    return $(this._getInputElement()).prop('checked');
  }

  bind() {
    const input = this._getInputElement();
    $(input).off('change').on('change',
      () => {
        this.handleChanged();
      });
  }
}

/**
 * Params for toggle combined with another component
 * @category SuiDialog
 */
export interface SuiToggleCompositeParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string,
  disabledOption?: string,
  defaultValue?: string | number,
  dataType?: string,
  parentControl: SuiComponentParent
}
/**
 * Dropdown component that can be part of a composite control.
 * @category SuiDialog
 */
export class SuiToggleComposite extends SuiToggleComponent {
  parentControl: SuiComponentParent;
  constructor(dialog: SuiDialogNotifier, parameters: SuiToggleCompositeParams) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  async handleChanged() {
    this.changeFlag = true;
    await this.parentControl.changed();
    this.changeFlag = false;
  }
}
