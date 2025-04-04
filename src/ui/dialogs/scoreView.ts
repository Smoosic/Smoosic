// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { ViewMapEntry } from '../../render/sui/scoreView';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';

import { StaffCheckComponent } from './components/staffComponents';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { PromiseHelpers } from '../../common/promiseHelpers';

declare var $: any;

const deepCopy = (x: any) => JSON.parse(JSON.stringify(x));
/**
 * Handle the mapping of visible staves to score staves
 * @category SuiDialog
 */
export class SuiScoreViewAdapter extends SuiComponentAdapter {
  originalView: ViewMapEntry[];
  currentView: ViewMapEntry[];
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.currentView = this.view.getView();
    this.originalView = JSON.parse(JSON.stringify(this.currentView));
  }
  async cancel() {
    const s1 = JSON.stringify(this.originalView);
    const s2 = JSON.stringify(this.currentView);
    if (s1 !== s2) {
      this.view.setView(this.originalView);
    }
    return PromiseHelpers.emptyPromise();
  }
  async commit() {
    const s1 = JSON.stringify(this.originalView);
    const s2 = JSON.stringify(this.currentView);
    if (s1 !== s2) {
      this.view.setView(this.currentView);
    }
    return PromiseHelpers.emptyPromise();
  }
  get scoreView(): ViewMapEntry[] {
    return this.currentView;
  }
  set scoreView(value: ViewMapEntry[]) {
    this.currentView = value;
  }
}
/**
 * Handle the mapping of visible staves to score staves
 * @category SuiDialog
 */
export class SuiScoreViewDialog extends SuiDialogAdapterBase<SuiScoreViewAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Score View', elements:
        [{
          smoName: 'scoreView',
          control: 'StaffCheckComponent',
          label: 'Show staff',
        }],
      staticText: []
    };
  originalValue: number[];
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiScoreViewAdapter(parameters.view);
    super(SuiScoreViewDialog.dialogElements, { adapter, ...parameters });
    this.originalValue = JSON.parse(JSON.stringify(this.view.getView()));
  }
  get scoreViewCtrl() {
    return this.cmap.scoreViewCtrl as StaffCheckComponent;
  }
}