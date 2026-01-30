import {SmoSelection} from "../../smo/xform/selections";
import {SmoGraceNote} from "../../smo/data/noteModifiers";
import {Pitch} from "../../smo/data/common";
import {SuiTracker} from "./tracker";
import {NoteEntryCaret} from "./NoteEntryCaret";
import {SuiScoreViewOperations} from "./scoreViewOperations";

export interface TrackerDelegate {
  onPitchIndexChanged(pitchIndex: number): void;
  onSingleNoteHighlighted(selection: SmoSelection, graceNote: SmoGraceNote | null): void;
}

export interface CaretDelegate {
  onPitchClicked(pitchIndex: number): void;
  onPitchesChanged(newPitches: Pitch[]): void;
}

export class NoteEntryMediator implements TrackerDelegate, CaretDelegate {

  constructor(
    private tracker: SuiTracker,
    private caret: NoteEntryCaret,
    private view: SuiScoreViewOperations
  ) {
    this.tracker.delegate = this;
    this.caret.delegate = this;
  }

  /*
   * TrackerDelegate
   */
  public onPitchIndexChanged(pitchIndex: number) {
    this.caret.renderPitchHighlight(pitchIndex);
  }

  public onSingleNoteHighlighted(selection: SmoSelection, graceNote: SmoGraceNote | null) {
    this.caret.setSelection(selection, graceNote);
    this.caret.render();
  }

  /*
   * CaretDelegate
   */
  public onPitchClicked(pitchIndex: number) {
    const currentIndex = this.tracker.getPitchIndex();
    if (currentIndex === pitchIndex) {
      this.tracker.clearPitchIndex();
    } else {
      this.tracker.setPitchIndex(pitchIndex);
    }
  }

  public onPitchesChanged(newPitches: Pitch[]) {
    this.view.setPitches(newPitches);
    this.tracker.pitchIndex = -1;
  }

}