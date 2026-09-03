import { SuiTracker } from '../../render/sui/tracker';
import { SmoScore } from '../../smo/data/score';
import { CompleteNotifier } from '../common';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { BrowserEventSource } from '../eventSource';
import { UndoBuffer } from '../../smo/xform/undo';
/**
 * Data for a menu choice.  'value' indicates which options selected
 * @category SuiMenu
 * @param icon - .icon class will be added to the choice
 * @param text - text to describe the choice
 * @param value - the value received by the menu loop
 * @param hotkey - optional key binding, if not supplied one is selected
 */
export interface MenuChoiceDefinition {
    icon: string;
    text: string;
    value: string;
    hotkey?: string;
    miIcon?: string;
}
/**
 * Menu just array of choices
 * @category SuiMenu
 * @param label - Not currently displayed
 * @param menuItems - list of choices
 */
export interface MenuDefinition {
    label: string;
    menuItems: MenuChoiceDefinition[];
}
/**
 * @category SuiMenu
 */
export interface MenuTranslation {
    ctor: string;
    label: string;
    menuItems: MenuChoiceDefinition[];
}
export declare const MenuTranslations: MenuTranslation[];
export declare const suiMenuTranslation: (menu: MenuDefinition, ctor: string) => {
    ctor: string;
    label: string;
    menuItems: MenuChoiceDefinition[];
};
/**
 * All menus take the same options.  Menu choices can alter the score
 * directly, or call dialogs or even other menus
 * @category SuiMenu
 * @param ctor dialog constructor
 * @param position - menu position
 * @param view the MVVM object to change the score
 * @param score SmoScore, could also be read from the view
 * @param completeNotifier used to take over key/mouse control
 * @param closePromise resolved when the menu closes, used to syncronize with other modals
 * @param eventSource event source to register for additional events like mouseup
 * @param undoBuffer used to create undo
*/
export interface SuiMenuParams {
    ctor: string;
    tracker: SuiTracker;
    score: SmoScore;
    completeNotifier: CompleteNotifier;
    closePromise: Promise<void> | null;
    view: SuiScoreViewOperations;
    eventSource: BrowserEventSource;
    undoBuffer: UndoBuffer;
    items?: MenuDefinition;
}
/**
 * Base class for menus, mostly for the interface and containing the
 * common parameters
 * @category SuiMenu
 */
export declare abstract class SuiMenuBase {
    label: string;
    menuItems: MenuChoiceDefinition[];
    ctor: string;
    completeNotifier: CompleteNotifier;
    score: SmoScore;
    view: SuiScoreViewOperations;
    eventSource: BrowserEventSource;
    undoBuffer: UndoBuffer;
    focusIndex: number;
    closePromise: Promise<void> | null;
    tracker: SuiTracker;
    constructor(params: SuiMenuParams);
    abstract selection(ev: any): Promise<void>;
    abstract getDefinition(): MenuDefinition;
    /**
     * Base class can override this, called before display and event binding to
     * add or remove options from the static list
     */
    preAttach(): void;
    complete(): void;
    keydown(): void;
}
/**
 * Function to handle dislay a menu
 * @category SuiMenu
 */
export type SuiMenuHandler = (menu: SuiMenuBase) => Promise<void>;
/**
 * boolean function to decide to display a dialog, based on selections.
 * @category SuiMenu
 */
export type SuiMenuShowOption = (menu: SuiMenuBase) => boolean;
/**
 * Convenience interface.  A menu option can be defined dynamically as a confiugured menu option,
 * and placed into an array.
 * @category SuiMenu
 */
export interface SuiConfiguredMenuOption {
    menuChoice: MenuChoiceDefinition;
    handler: SuiMenuHandler;
    display: SuiMenuShowOption;
}
export declare const suiConfiguredMenuTranslate: (options: SuiConfiguredMenuOption[], label: string, ctor: string) => MenuTranslation;
export type customizeMenuOptionsFcn = (menu: SuiConfiguredMenu) => void;
/**
 * A menu of configured options.
 * @category SuiMenu
 */
export declare class SuiConfiguredMenu extends SuiMenuBase {
    static menuCustomizations: Record<string, customizeMenuOptionsFcn | undefined>;
    menuOptions: SuiConfiguredMenuOption[];
    label: string;
    constructor(params: SuiMenuParams, label: string, options: SuiConfiguredMenuOption[]);
    selection(ev: any): Promise<void>;
    static definitionFromOptions(label: string, options: SuiConfiguredMenuOption[]): {
        label: string;
        menuItems: MenuChoiceDefinition[];
    };
    getDefinition(): MenuDefinition;
    preAttach(): void;
}
export declare const SuiMenuCustomizer: (fcn: customizeMenuOptionsFcn, ctor: string) => void;
