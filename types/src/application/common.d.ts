import { SuiScoreViewOperations } from "../render/sui/scoreViewOperations";
import { SuiTracker } from "../render/sui/tracker";
import { CompleteNotifier } from "../ui/common";
import { ModalComponent } from "../ui/common";
import { BrowserEventSource, EventHandler } from "../ui/eventSource";
export type trackerKeyAction = "moveHome" | "moveEnd" | "moveSelectionRight" | "moveSelectionLeft" | "moveSelectionUp" | "moveSelectionDown" | "moveSelectionRightMeasure" | "moveSelectionLeftMeasure" | "advanceModifierSelection" | "growSelectionRight" | "growSelectionLeft" | "growSelectionRightMeasure" | "growSelectionRightMeasure" | "moveSelectionPitchUp" | "moveSelectionPitchDown";
export declare const trackerKeyActions: string[];
export type editorKeyAction = "transposeUp" | "transposeDown" | "upOctave" | "downOctave" | "toggleCourtesyAccidental" | "toggleEnharmonic" | "doubleDuration" | "halveDuration" | "dotDuration" | "undotDuration" | "setPitch" | "slashGraceNotes" | "addGraceNote" | "removeGraceNote" | "playScore" | "stopPlayer" | "pausePlayer" | "togglePlayer" | "undo" | "copy" | "paste" | "makeTuplet" | "interval" | "unmakeTuplet" | "addMeasure" | "deleteNote" | "makeRest" | "unbeamSelections" | "beamSelections" | "toggleBeamDirection" | "addRemoveAccent" | "addRemoveTenuto" | "addRemoveStaccato" | "addRemovePizzicato" | "addRemoveMarcato";
export declare const editorKeyActions: string[];
export declare function isEditorKeyAction(action: string): boolean;
export declare function isTrackerKeyAction(action: string): boolean;
/**
 * A binding of a key to some action performed by a module
 * @category SuiApplication
 */
export interface KeyBinding {
    event: string;
    key: string;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    action: string;
    module?: string;
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
export declare abstract class ModalEventHandler {
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
export declare class ModalEventHandlerProxy {
    _handler: ModalEventHandler | null;
    eventSource: BrowserEventSource;
    unbound: boolean;
    keydownHandler: EventHandler | null;
    keyupHandler: EventHandler | null;
    mouseMoveHandler: EventHandler | null;
    mouseClickHandler: EventHandler | null;
    mouseUpHandler: EventHandler | null;
    mouseDownHandler: EventHandler | null;
    constructor(evSource: BrowserEventSource);
    set handler(value: ModalEventHandler);
    evKey(ev: any): Promise<void>;
    keyUp(ev: any): void;
    mouseMove(ev: any): void;
    mouseClick(ev: any): Promise<void>;
    mouseUp(ev: any): void;
    mouseDown(ev: any): void;
    bindEvents(): void;
    unbindKeyboardForModal(dialog: ModalComponent): void;
}
