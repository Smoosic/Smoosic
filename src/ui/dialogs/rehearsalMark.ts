// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SmoRehearsalMark } from '../../smo/data/measureModifiers';

/**
 * Edits a live SmoRehearsalMark. Modeled on SuiVoltaAdapter (src/ui/dialogs/volta.ts): every
 * field write is pushed to the score immediately, and cancel() restores the backup taken when
 * the dialog opened. Position is intentionally not editable (spec Assumptions).
 * See specs/025-rehearsal-mark-dialog.
 */
export class SuiRehearsalMarkAdapter {
  view: SuiScoreViewOperations;
  mark: SmoRehearsalMark;
  backup: SmoRehearsalMark;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, mark: SmoRehearsalMark) {
    this.view = view;
    this.mark = mark;
    this.backup = new SmoRehearsalMark(mark.serialize());
  }
  get symbol(): string {
    return this.mark.symbol;
  }
  set symbol(value: string) {
    this.mark.symbol = value;
    this.updateMark();
  }
  get cardinality(): string {
    return this.mark.cardinality;
  }
  set cardinality(value: string) {
    this.mark.cardinality = value;
    // a measure-number mark is not part of a series, so turn auto-increment off
    if (value === SmoRehearsalMark.cardinalities.measureNumber) {
      this.mark.increment = false;
    }
    this.updateMark();
  }
  get increment(): boolean {
    return this.mark.increment;
  }
  set increment(value: boolean) {
    this.mark.increment = value;
    this.updateMark();
  }
  updateMark() {
    this.changed = true;
    this.view.updateRehearsalMark(this.mark);
  }
  async commit(): Promise<void> {
    return;
  }
  async cancel(): Promise<void> {
    if (this.changed) {
      await this.view.updateRehearsalMark(this.backup);
    }
  }
  async remove(): Promise<void> {
    await this.view.removeRehearsalMark(this.mark);
  }
}
