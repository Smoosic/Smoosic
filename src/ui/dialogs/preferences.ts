// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScorePreferences } from '../../smo/data/scoreModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { PromiseHelpers } from '../../common/promiseHelpers';

declare var $: any;

const deepCopy = (x: any) => JSON.parse(JSON.stringify(x));

/**
 * @category SuiDialog
 */
export class SuiScorePreferencesAdapter extends SuiComponentAdapter {
  preferences: SmoScorePreferences;
  backup: SmoScorePreferences;
  originalTransposeScore: boolean;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.preferences = new SmoScorePreferences(view.score.preferences);
    this.backup = JSON.parse(JSON.stringify(this.preferences));
    this.originalTransposeScore = this.preferences.transposingScore;
  }
  get autoAdvance(): boolean {
    return this.preferences.autoAdvance;
  }
  set autoAdvance(value: boolean) {
    this.preferences.autoAdvance = value;
    this.view.updateScorePreferences(this.preferences);
  }
  get autoPlay(): boolean {
    return this.preferences.autoPlay;
  }
  set autoPlay(value: boolean) {
    this.preferences.autoPlay = value;
    this.view.updateScorePreferences(this.preferences);
  }
  get showPiano(): boolean {
    return this.preferences.showPiano;
  }
  set showPiano(value: boolean) {
    this.preferences.showPiano = value;
    this.view.updateScorePreferences(this.preferences);
  }
  get autoScrollPlayback(): boolean {
    return this.preferences.autoScrollPlayback;
  }
  set autoScrollPlayback(value: boolean) {
    this.preferences.autoScrollPlayback = value;
    this.view.updateScorePreferences(this.preferences);
  }
  get hideEmptyLines(): boolean {
    return this.preferences.hideEmptyLines;
  }
  set hideEmptyLines(value: boolean) {
    this.preferences.hideEmptyLines = value;
    this.view.updateScorePreferences(this.preferences);
  }
  get defaultDupleDuration() {
    return this.preferences.defaultDupleDuration;
  }
  set defaultDupleDuration(value: number) {
    this.preferences.defaultDupleDuration = value;
    this.view.updateScorePreferences(this.preferences);
  }
  get defaultTripleDuration() {
    return this.preferences.defaultTripleDuration;
  }
  set defaultTripleDuration(value: number) {
    this.preferences.defaultTripleDuration = value;
    this.view.updateScorePreferences(this.preferences);
  }
  get transposingScore() {
    return this.preferences.transposingScore;
  }
  set transposingScore(value: boolean) {
    this.preferences.transposingScore = value;
    this.view.updateScorePreferences(this.preferences);
  }
  async cancel() {
    const p1 = JSON.stringify(this.preferences);
    const p2 = JSON.stringify(this.backup);
    if (p1 !== p2) {
      await this.view.updateScorePreferences(this.backup);
    }
  }
  async commit() {
    if (this.originalTransposeScore !== this.preferences.transposingScore) {
      await this.view.refreshViewport();
      return;
    }
    return;
  }
}
/**
 * @category SuiDialog
 */
export class SuiScorePreferencesDialog extends SuiDialogAdapterBase<SuiScorePreferencesAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Score Preferences',
      elements: [{
        smoName: 'autoAdvance',
        control: 'SuiToggleComponent',
        label: 'Auto-advance after pitch'
      }, {
        smoName: 'autoPlay',
        control: 'SuiToggleComponent',
        label: 'Auto-play sounds for note entry'
      }, {
        smoName: 'autoScrollPlayback',
        control: 'SuiToggleComponent',
        label: 'Auto-Scroll Playback'
      }, {
        smoName: 'showPiano',
        control: 'SuiToggleComponent',
        label: 'Show Piano widget'
      },  {
        smoName: 'transposingScore',
        control: 'SuiToggleComponent',
        label: 'Tranpose Score'
      }, {
        smoName: 'hideEmptyLines',
        control: 'SuiToggleComponent',
        label: 'Hide Empty Lines'
      }, {
        smoName: 'defaultDupleDuration',
        control: 'SuiDropdownComponent',
        label: 'Default Duration (even meter)',
        dataType: 'int',
        options: [{
          value: 4096,
          label: '1/4'
        }, {
          value: 2048,
          label: '1/8'
        }]
      }, {
        smoName: 'defaultTripleDuration',
        control: 'SuiDropdownComponent',
        label: 'Default Duration (triple meter)',
        dataType: 'int',
        options: [{
          value: 6144,
          label: 'dotted 1/4'
        }, {
          value: 2048,
          label: '1/8'
        }]
      }],
      staticText: []
    }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiScorePreferencesAdapter(params.view);
    super(SuiScorePreferencesDialog.dialogElements, { adapter, ...params });
  }
}
