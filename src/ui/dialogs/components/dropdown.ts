// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support dropdown compontents
 * @module /ui/dialogs/components/dropdown
 */
import { buildDom } from '../../../common/htmlHelpers';
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent, DialogDefinitionOption } from './baseComponent';
declare var $: any;

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
  id: string,
  classes: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string,
  disabledOption?: string,
  dataType?: string,
  options?: DialogDefinitionOption[]
}
/**
 * single-select dropdown list
 * @category SuiDialog
 */
export class SuiDropdownComponent extends SuiComponentBase {
  options: DialogDefinitionOption[];
  disabledOption: string;
  dataType: string;
  value: string = '';
  
  optionIds: string[] = [];
  constructor(dialog: SuiDialogNotifier, parameter: SuiDropdownComponentParams) {
    super(dialog, parameter);
    this.options = parameter.options!;
    this.disabledOption = parameter.disabledOption ?? '';
    this.dataType = parameter.dataType ?? 'string';
  }
  checkDefault(s: any, b: any) {
    if (this.disabledOption.length) {
      s.prop('required', true).append(b('option').attr('selected', 'selected').prop('disabled', true).text(this.disabledOption));
    }
  }

  get html() {
    const b = buildDom;
    const id = this.id;
    const label = this.value.length > 0 ? this.value : this.label;
    this.optionIds = [];
    const menuId = `${id}-menu`;
    const r = b('div').classes(this.makeClasses('dropdownControl smoControl')).attr('id', id).attr('data-param', this.smoName)
      .append(b('button').classes('btn dropdown-toggle').text(label));
    const s = b('ul').attr('role', 'menu').classes('dropdown-menu rounded-3 shadow w-220px').attr('id', menuId);
    this.checkDefault(s, b);
    this.options.forEach((option, ix) => {
      const optionId = `${this.parameterId}-${ix}`;
      s.append(
        b('li').attr('id', optionId).attr('role','presentation').
        append(b('a').attr('role', 'menuItem').attr('href', '#').attr('data-value', option.value.toString())
          .classes('dropdown-item').text(option.label)));
    });
    r.append(s).append(
      b('label').attr('for', menuId).text(this.label));
    return r;
  }
  updateControls() {
    const updateEl = this._getInputElement();
    $(updateEl).html('');
    $(updateEl).append(this.html.dom());
    this.bind();
  }
  unselect() {
    $(this._getInputElement())[0].selectedIndex = -1;
    $(this._getInputElement()).blur();
  }

  _getInputElement() {
    var pid = this.id;
    return $(this.dialog.dgDom.element).find('#' + pid);
  }
  getValue(): string | number {
    let val: string | number = this.value;
    if (['int', 'float'].indexOf(this.dataType) >= 0) {
      val = (this.dataType.toLowerCase() === 'int') ?  parseInt(val, 10) : val;
      val = (this.dataType.toLowerCase() === 'float') ?  parseFloat(val as string) : val;
      if (isNaN(val as number)) {
        val = -1;
      }
    }
    return val;
  }
  getValueLabel() {
    let label = this.value;
    const selection = this.options.find((ff) => ff.value.toString() === this.value.toString());
    if (selection) {
      label = selection.label;
    }
    return label;
  }
  setValue(value: string | number) {
    this.value = value.toString();
    if (this.value.length) {
      $(this._getInputElement()).find('button.dropdown-toggle').text(this.getValueLabel());
    }
  }

  bind() {
    const input = this._getInputElement();
    $(input).find('button.dropdown-toggle').off('click').on('click', () => {
      $(input).find('ul.dropdown-menu').toggleClass('show');
    });
    $(input).find('ul li a.dropdown-item').off('click').on('click',
      (elem: any) => {
        this.value = $(elem.target).attr('data-value');
        $(input).find('ul.dropdown-menu').removeClass('show');
        if (this.value.length) {
          $(this._getInputElement()).find('button.dropdown-toggle').text(this.getValueLabel());
        }    
        this.handleChanged();
      });
  }
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
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  label: string,
  smoName: string,
  control: string,
  disabledOption?: string,
  dataType?: string,
  options?: DialogDefinitionOption[],
  parentControl: SuiComponentParent
}
/**
 * A dropdown composite mixes a dropdown with some other 
 * @category SuiDialog
 */
export class SuiDropdownComposite extends SuiDropdownComponent {
  parentControl: SuiComponentParent;
  constructor(dialog: SuiDialogNotifier, parameters: SuiDropdownCompositeParams) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }

  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}