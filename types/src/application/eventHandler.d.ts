import { KeyEvent } from '../smo/data/common';
import { SuiExceptionHandler } from '../ui/exceptions';
import { Qwerty } from '../ui/qwerty';
import { SuiPiano } from '../render/sui/piano';
import { CompleteNotifier } from '../ui/common';
import { SuiTracker } from '../render/sui/tracker';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { BrowserEventSource } from '../ui/eventSource';
import { SuiKeyCommands } from './keyCommands';
import { KeyBinding, ModalEventHandler } from './common';
import { ModifierTab } from '../smo/xform/selections';
import { SuiMenuManager } from '../ui/menus/manager';
import { SmoConfiguration } from './configuration';
import { SuiNavigation } from '../render/sui/configuration';
/**
 * Handle keyboard/mouse events, and pass them to the renderer and other UI elements.
 * @category SuiApplication
 */
export interface EventHandlerParams {
    view: SuiScoreViewOperations;
    eventSource: BrowserEventSource;
    tracker: SuiTracker;
    navigation: SuiNavigation;
    keyCommands: SuiKeyCommands;
    menus: SuiMenuManager;
    completeNotifier: CompleteNotifier;
    keyBindings: KeyBinding[];
    config: SmoConfiguration;
}
/**
 * this is the default keyboard/mouse handler for smoosic in application mode.
 * It diverts key events to tracker or key commmands as appropriate, and mouse events to
 * tracker.  Modal elements take this control away temporarily.
 *
 * It also handles some global events such as window resize and scroll of the music region.
 * @category SuiApplication
*/
export declare class SuiEventHandler implements ModalEventHandler {
    static reentry: boolean;
    static keyboardUi: Qwerty;
    static showQwerty(): void;
    static instance: SuiEventHandler;
    static debugMask: number;
    static altKeyPressed: boolean;
    static ctrlKeyPressed: boolean;
    static shiftKeyPressed: boolean;
    view: SuiScoreViewOperations;
    eventSource: BrowserEventSource;
    tracker: SuiTracker;
    keyBind: KeyBinding[];
    completeNotifier: CompleteNotifier;
    keyCommands: SuiKeyCommands;
    resizing: boolean;
    undoStatus: number;
    trackScrolling: boolean;
    config: SmoConfiguration;
    keyHandlerObj: any;
    menus: SuiMenuManager;
    piano: SuiPiano | null;
    exhandler: SuiExceptionHandler;
    navigation: SuiNavigation;
    constructor(params: EventHandlerParams);
    private handleScrollEventDefer;
    handleScrollEvent(): void;
    createPiano(): void;
    resizeEvent(): void;
    createModifierDialog(modifierSelection: ModifierTab): import("./exports").SuiDialogBase | null;
    trackerModifierSelect(ev: KeyEvent): void;
    bindResize(): void;
    get renderElement(): Element;
    static get editorKeyBindingDefaults(): KeyBinding[];
    static get trackerKeyBindingDefaults(): KeyBinding[];
    helpControls(): void;
    menuHelp(): void;
    keyUp(evdata: any): void;
    handleMetaKeyDown(evdata: any): void;
    evKey(evdata: any): Promise<void>;
    mouseMove(ev: any): void;
    mouseClick(ev: any): Promise<void>;
    bindEvents(): void;
}
