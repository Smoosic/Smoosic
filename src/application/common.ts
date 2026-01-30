import { SuiScoreViewOperations } from "../render/sui/scoreViewOperations";
import { SuiTracker } from "../render/sui/tracker";
import { CompleteNotifier } from "../ui/common";
import { ModalComponent } from "../ui/common";
import { KeyEvent } from "../smo/data/common";
import { BrowserEventSource, EventHandler } from "../ui/eventSource";

export type trackerKeyAction = "moveHome" | "moveEnd" | "moveSelectionRight" | "moveSelectionLeft" | 
   "moveSelectionUp" | "moveSelectionDown" | "moveSelectionRightMeasure" | "moveSelectionLeftMeasure" |
   "advanceModifierSelection" | "growSelectionRight" | "growSelectionLeft" | 
   "growSelectionRightMeasure" | "growSelectionRightMeasure" |
   "moveSelectionPitchUp" | "moveSelectionPitchDown";
export const trackerKeyActions = ["moveHome" , "moveEnd" , "moveSelectionRight" , "moveSelectionLeft" , 
   "moveSelectionUp" , "moveSelectionDown" , "moveSelectionRightMeasure" , "moveSelectionLeftMeasure" ,
   "advanceModifierSelection" , "growSelectionRight" , "growSelectionLeft" , "growSelectionRightMeasure",
   "moveSelectionPitchUp" , "moveSelectionPitchDown"];   
export type editorKeyAction = "transposeUp" | "transposeDown" | "upOctave" | "downOctave" | 
  "toggleCourtesyAccidental" | "toggleEnharmonic"  | 
    "doubleDuration" | "halveDuration" | "dotDuration" | "undotDuration" | "setPitch" | 
    "slashGraceNotes" | "addGraceNote" | "removeGraceNote" | 
    "playScore" | "stopPlayer" | "pausePlayer" | "togglePlayer" |
    "undo" | "copy" | "paste" |
    "makeTuplet" | "interval" | "unmakeTuplet" | "addMeasure" | "deleteNote" | "makeRest"| 
    "unbeamSelections" | "beamSelections" | "toggleBeamDirection" |
    "addRemoveAccent" | "addRemoveTenuto" | "addRemoveStaccato" | 
    "addRemovePizzicato" | "addRemoveMarcato";
export const editorKeyActions = ["transposeUp" , "transposeDown" , "upOctave" , "downOctave" , 
    "toggleCourtesyAccidental" , "toggleEnharmonic", 
      "doubleDuration" , "halveDuration" , "dotDuration" , "undotDuration" , "setPitch" , 
      "slashGraceNotes" , "addGraceNote" , "removeGraceNote" , 
      "playScore" , "stopPlayer" , "pausePlayer", "togglePlayer",
      "undo", "copy", "paste",
      "makeTuplet" , "interval" , "unmakeTuplet" , "addMeasure" , "deleteNote" , "makeRest", 
      "unbeamSelections" , "beamSelections" , "toggleBeamDirection",
      "addRemoveAccent" , "addRemoveTenuto" , "addRemoveStaccato",
      "addRemovePizzicato", "addRemoveMarcato"
    ]; 

export function isEditorKeyAction(action: string) { return editorKeyActions.indexOf(action) >= 0 };
export function isTrackerKeyAction(action: string) { return trackerKeyActions.indexOf(action) >= 0 };

/**
 * A binding of a key to some action performed by a module
 * @category SuiApplication
 */
export interface KeyBinding {
    event: string,
    key: string,
    ctrlKey: boolean,
    altKey: boolean,
    shiftKey: boolean,
    action: string,
    module?: string
}

/**
 * parameters for the key handlers
 * @param view
 * @param slashMode indicates that the dreaded 'slash' menus are up
 * @param completeNotifier notified  when modals close
 * @param tracker
 * @param eventSource register for event handlers
 * @category SuiApplication
 */
export interface KeyCommandParams {
  view: SuiScoreViewOperations;
  slashMode: boolean;
  completeNotifier: CompleteNotifier;
  tracker: SuiTracker;
  eventSource: BrowserEventSource;
}

/**
 * Shared interface for menus, dialogs, etc that can 
 * accept UI events
 * @category SuiApplication
 */
export abstract class ModalEventHandler {
  abstract mouseMove(ev: any): void;
  abstract mouseClick(ev: any): Promise<void>;
  abstract evKey(evdata: any): Promise<void>;
  abstract keyUp(evdata: any): void;
  abstract mouseUp(ev: any): void;
  abstract mouseDown(ev: any): void;
}
export type handler = (ev: any) => void;

/**
 * Dependency injection, sends events to a proxy object, gets around some 
 * cyclic dependencies when bootstrapping the application.
 * @category SuiApplication
 */
export class ModalEventHandlerProxy {
  _handler: ModalEventHandler | null = null;
  eventSource: BrowserEventSource;
  unbound: boolean = true;
  keydownHandler: EventHandler | null = null;
  keyupHandler: EventHandler | null = null;
  mouseMoveHandler: EventHandler | null = null;
  mouseClickHandler: EventHandler | null = null;
  mouseUpHandler: EventHandler | null = null;
  mouseDownHandler: EventHandler | null = null;
  constructor(evSource: BrowserEventSource) {
    this.eventSource = evSource;
    this.bindEvents();
  }
  set handler(value: ModalEventHandler) {
    this._handler = value;
    this.unbound = false;
  }
  async evKey(ev: any) {
    if (this._handler) {
      await this._handler.evKey(ev);
    }
  }
  keyUp(ev: any) {
    if (this._handler) {
      this._handler.keyUp(ev);
    }
  }

  mouseMove(ev: any) {
    if (this._handler) {
      this._handler.mouseMove(ev);
    }
  }
  async mouseClick(ev: any) {
    if (this._handler) {
      await this._handler.mouseClick(ev);
    }
  }
  mouseUp(ev: any) {
    if (this._handler) {
      this._handler.mouseUp(ev);
    }
  }
  mouseDown(ev: any) {
    if (this._handler) {
      this._handler.mouseDown(ev);
    }
  }
  bindEvents() {
    const mousemove = async (ev: any) => { this.mouseMove(ev); }
    const mouseclick = async (ev: any) => { await this.mouseClick(ev); }
    const mouseup = async (ev: any) => { this.mouseUp(ev); }
    const mousedown = async (ev: any) => { this.mouseDown(ev); }
    const keydown = async (ev: any) => { this.evKey(ev); }
    const keyup = async (ev: any) => { this.keyUp(ev); }
    this.mouseMoveHandler = this.eventSource.bindMouseMoveHandler(mousemove);
    this.mouseClickHandler = this.eventSource.bindMouseClickHandler(mouseclick);
    this.mouseUpHandler = this.eventSource.bindMouseUpHandler(mouseup);
    this.mouseDownHandler = this.eventSource.bindMouseDownHandler(mousedown);
    this.keydownHandler = this.eventSource.bindKeydownHandler(keydown);
    this.keyupHandler = this.eventSource.bindKeyupHandler(keyup);
  }

  unbindKeyboardForModal(dialog: ModalComponent) {
    if (this.unbound) {
      console.log('received duplicate bind event');
      return;
    }
    if (!this.keydownHandler || !this.mouseMoveHandler || !this.mouseClickHandler) {
      console.log('received bind with no handlers');
      return;
    }
    this.unbound = true;
    const rebind = () => {
      this.unbound = false;
      this.bindEvents();
    }
    this.eventSource.unbindKeydownHandler(this.keydownHandler!);
    this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler!);
    this.eventSource.unbindMouseUpHandler(this.mouseUpHandler!);
    this.eventSource.unbindMouseDownHandler(this.mouseDownHandler!);
    this.eventSource.unbindMouseClickHandler(this.mouseClickHandler!);
    dialog.closeModalPromise.then(rebind);
  }
}