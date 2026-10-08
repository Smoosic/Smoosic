import { SvgBox, SvgPoint } from '../../smo/data/common';
import { UndoBuffer } from '../../smo/xform/undo';
import { layoutDebug } from '../../render/sui/layoutDebug';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiTracker } from '../../render/sui/tracker';
import { CompleteNotifier } from '../common';
import { BrowserEventSource, EventHandler } from '../eventSource';
import { KeyBinding } from '../../application/common';
import { App } from 'vue';
import { SuiConfiguredMenu } from './menu';
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
    closeMenuPromise: Promise<void> | null;
    menu: SuiConfiguredMenu | null;
    menuApp: App | null;
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
    unattach(): void;
    attach(): void;
    captureMenuEvents(completeNotifier: CompleteNotifier): void;
    dismiss(): void;
    displayMenu(menu: SuiConfiguredMenu): void;
    createMenu(action: string, notifier: CompleteNotifier, anchor?: SvgPoint): Promise<void | null>;
    evKey(event: any): void;
    bindEvents(): void;
}
export declare const menuTranslationsInit: () => void;
