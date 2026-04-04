import { SmoConfiguration, SmoConfigurationParams } from './configuration';
import { SmoScore } from '../smo/data/score';
import { UndoBuffer } from '../smo/xform/undo';
import { SuiRenderState } from '../render/sui/renderState';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { SuiTracker } from '../render/sui/tracker';
import { SuiMenuManager } from '../ui/menus/manager';
import { BrowserEventSource } from '../ui/eventSource';
import { RibbonButtons } from '../ui/buttons/ribbon';
import { SuiKeyCommands } from './keyCommands';
import { SuiEventHandler } from './eventHandler';
import { KeyBinding } from './common';
import { SuiNavigation } from '../render/sui/configuration';
export interface pairType {
    [key: string]: string;
}
/**
 * Score renderer instance
 * @internal
 */
export interface SuiRendererInstance {
    view: SuiScoreViewOperations;
    eventSource: BrowserEventSource;
    undoBuffer: UndoBuffer;
    renderer: SuiRenderState;
}
/**
 * Global instance for debugging
 * @internal
 */
export interface SuiInstance {
    view: SuiScoreViewOperations;
    navigation: SuiNavigation;
    eventSource: BrowserEventSource;
    undoBuffer: UndoBuffer;
    tracker: SuiTracker;
    keyCommands: SuiKeyCommands;
    menus: SuiMenuManager;
    eventHandler: SuiEventHandler;
    ribbon: RibbonButtons;
}
/**
 * Parse query string for application
 * @category SuiApplication
 */
export declare class QueryParser {
    pairs: pairType[];
    queryPair(str: string): pairType;
    constructor();
}
/** SuiApplication
 * main entry point of application.  Based on the configuration,
 * either start the default UI, or initialize library mode and
 * await further instructions.
 * @category SuiApplication
 */
export declare class SuiApplication {
    scoreLibrary: any;
    instance: SuiInstance | null;
    config: SmoConfiguration;
    score: SmoScore | null;
    navigation?: SuiNavigation;
    view: SuiScoreViewOperations | null;
    createUiDom(): void;
    static configure(params: Partial<SmoConfigurationParams>): Promise<SuiApplication>;
    constructor(config: SmoConfiguration);
    static instance: SuiInstance;
    static initSync(): void;
    /**
    // Different applications can create their own key bindings, these are the defaults.
    // Many editor commands can be reached by a single keystroke.  For more advanced things there
    // are menus.
    */
    static get keyBindingDefaults(): KeyBinding[];
    /**
     * Initialize the library according to instruction in config object:
     * 1.  Try to load a new score
     * 2.  If in application mode, start the UI.  If in translation mode, start translation
     * @returns
     */
    initialize(): Promise<SuiApplication>;
    /**
     * Create the initial score we use to populate the UI etc:
     * 0. if translation mode, return empty promise, it won't be used anyway
     * 1. if remoteScore is set in config, try to load from remote
     * 2. if initialScore is set, use that
     * 3. if a score is saved locally with quick save (browser local cache), use that
     * 4. if all else fails, return an 'empty' score.
     * @returns promise for a remote load.  If a local load, will resolve immediately
     */
    createScore(): Promise<SmoScore | null>;
    tryParse(scoreJson: string): SmoScore;
    createView(score: SmoScore): SuiRendererInstance | null;
    /**
     * Convenience constructor, take the score and render it in the
     * configured rendering space.
     */
    createUi(): void;
    static loadMusicFont(face: string, url: string): Promise<void>;
    static registerFonts(): Promise<void>;
    static _deferLanguageSelection(lang: string): void;
}
