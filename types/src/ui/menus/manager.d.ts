import { SvgBox } from '../../smo/data/common';
import { UndoBuffer } from '../../smo/xform/undo';
import { layoutDebug } from '../../render/sui/layoutDebug';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiTracker } from '../../render/sui/tracker';
import { CompleteNotifier } from '../common';
import { BrowserEventSource, EventHandler } from '../eventSource';
import { KeyBinding } from '../../application/common';
import { SuiMenuBase } from './menu';
/**
 * @category SuiMenu
 */
export interface SuiMenuManagerParams {
    view: SuiScoreViewOperations;
    eventSource: BrowserEventSource;
    completeNotifier: CompleteNotifier;
    undoBuffer: UndoBuffer;
    menuContainer?: HTMLElement;
}
/**
 * Handle key-binding that map to menus
 * @category SuiMenu
 */
export declare class SuiMenuManager {
    view: SuiScoreViewOperations;
    eventSource: BrowserEventSource;
    completeNotifier: CompleteNotifier;
    undoBuffer: UndoBuffer;
    menuContainer: HTMLElement;
    bound: boolean;
    hotkeyBindings: Record<string, string>;
    closeMenuPromise: Promise<void> | null;
    menu: SuiMenuBase | null;
    keydownHandler: EventHandler | null;
    menuPosition: SvgBox;
    tracker: SuiTracker;
    menuBind: KeyBinding[];
    debug: layoutDebug;
    constructor(params: SuiMenuManagerParams);
    static get defaults(): {
        menuBind: KeyBinding[];
        menuContainer: string;
    };
    get closeModalPromise(): Promise<void> | null;
    setController(c: CompleteNotifier): void;
    get score(): import("../../application/exports").SmoScore;
    static get menuKeyBindingDefaults(): KeyBinding[];
    get optionElements(): any;
    _advanceSelection(inc: number): void;
    unattach(): void;
    attach(): void;
    captureMenuEvents(completeNotifier: CompleteNotifier): void;
    dismiss(): void;
    displayMenu(menu: SuiMenuBase | null): void;
    createMenu(action: string, notifier: CompleteNotifier): void;
    evKey(event: any): void;
    bindEvents(): void;
}
export declare const menuTranslationsInit: () => void;
