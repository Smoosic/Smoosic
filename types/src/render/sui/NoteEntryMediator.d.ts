import { SmoSelection } from "../../smo/xform/selections";
import { SmoGraceNote } from "../../smo/data/noteModifiers";
import { Pitch } from "../../smo/data/common";
import { SuiTracker } from "./tracker";
import { NoteEntryCaret } from "./NoteEntryCaret";
import { SuiScoreViewOperations } from "./scoreViewOperations";
export interface TrackerDelegate {
    onPitchIndexChanged(pitchIndex: number): void;
    onSingleNoteHighlighted(selection: SmoSelection, graceNote: SmoGraceNote | null): void;
}
export interface CaretDelegate {
    onPitchClicked(pitchIndex: number): void;
    onPitchesChanged(newPitches: Pitch[]): void;
}
export declare class NoteEntryMediator implements TrackerDelegate, CaretDelegate {
    private tracker;
    private caret;
    private view;
    constructor(tracker: SuiTracker, caret: NoteEntryCaret, view: SuiScoreViewOperations);
    onPitchIndexChanged(pitchIndex: number): void;
    onSingleNoteHighlighted(selection: SmoSelection, graceNote: SmoGraceNote | null): void;
    onPitchClicked(pitchIndex: number): void;
    onPitchesChanged(newPitches: Pitch[]): void;
}
