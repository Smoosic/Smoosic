import { InputTrapper } from '../../common/htmlHelpers';
import { SmoModifier } from '../../smo/data/score';
import { SvgBox } from '../../smo/data/common';
import { SuiTracker } from '../../render/sui/tracker';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { CompleteNotifier } from '../common';
import { BrowserEventSource } from '../eventSource';
import { SuiDialogNotifier, DialogDefinitionElement, SuiComponentBase, DialogDefinitionOption } from './components/baseComponent';
import { SuiScroller } from '../../render/sui/scroller';
import { EventHandler } from '../eventSource';
import { SmoUiConfiguration } from '../configuration';
import { layoutDebug } from '../../../typedoc';
export type DialogCallback = () => Promise<void>;
/**
 * Parameters for installing a dialog.  VUE-based dialog logic.
 * complete is a Ref that is set to true when the dialog is finished, used to
 * hand off keyboard control between dialogs and menus.
 * app is a VUE app, appParams are the parameters to pass to the app.
 * we override commitCb, cancelCb, and removeCb to manage the dialog lifetime.
 * root is the DOM id to mount the dialog in (without the '#')
 * @category SuiDialog
 */
export interface DialogInstallParams {
    root: string;
    app: any;
    appParams: any;
    dialogParams: SuiDialogParams;
    commitCb: DialogCallback;
    cancelCb: DialogCallback;
    removeCb?: DialogCallback;
}
/**
 * The callbacks can be confusing.  Dialog CB button calls this callback,
 * which in turn calls the user-supplied callback, and then hides the dialog.
 * params.commitCb is the supplied callback,
 * but appParams.commitCb is set to this function.
 * @param params
 */
export declare const InstallDialog: (params: DialogInstallParams) => Promise<void>;
/**
 * The JSON dialog template is a declaritive structore for the html of the dialog
 * and components.
 * @param label for the dialog itself
 * @param elements a series of elements that define the component
 * @param staticText a hash of text for the dialog and components to use
 * @category SuiDialog
 */
export interface DialogDefinition {
    label: string;
    elements: DialogDefinitionElement[];
    staticText: Record<string, string>[];
}
/**
 * A translation of the labels in DialogDefintionElement
 * @param label the component label
 * @param id used as a key in translation tool
 * @param options options for dropdown and other array components
 * @category SuiDialog
 */
export interface DialogTranslationElement {
    label: string;
    id: string;
    options?: DialogDefinitionOption[];
}
/**
 * A translation of all the strings in the dialog itself, used
 * when switching languages.
 * @param ctor the constructor for the dialog class, used to call static methods
 * @param label the translated label
 * @param dialogElements the translated component json
 * @param staticText translated misc text
 * @category SuiDialog
 */
export interface DialogTranslation {
    ctor: string;
    label: string;
    dialogElements: DialogTranslationElement[];
    staticText: Record<string, string>;
}
export declare const DialogTranslations: DialogTranslation[];
/**
 * Dialog params always contain basic information about the runtime
 * for modal functionality
 * @param ctor dialog constructor
 * @param id DOM id for the dialog
 * @param tracker to get and set selections
 * @param completeNotifier used to take over key/mouse control
 * @param startPromise used if this is called from another modal element
 * @param view the MVVM object to change the score
 * @param eventSource event source to register for additional events like mouseup
 * @param undoBuffer used to create undo
 * @category SuiDialog
 */
export interface SuiDialogParams {
    ctor: string;
    id: string;
    tracker: SuiTracker;
    completeNotifier: CompleteNotifier;
    startPromise: Promise<void> | null;
    view: SuiScoreViewOperations;
    eventSource: BrowserEventSource;
    modifier?: any;
    config?: SmoUiConfiguration;
}
/**
 * internal interface used to create the DOM
 * @internal
 */
export interface SuiDomParams {
    id: string;
    top: number;
    left: number;
    label: string;
}
/**
 * DOM interface for the dialog
 * @internal
 * @param element parent element
 * @param trapper used to trap focus events for the dialog
 */
export interface DialogDom {
    element: any;
    trapper: any;
}
export declare const suiDialogTranslate: (dialog: DialogDefinition, ctor: string) => DialogTranslation;
/**
 * Note: Most dialogs will inherit from SuiDialogAdapter, not SuiDialogBase.
 * You will only want to inherit from SuiDialogBase under 2 conditions:
 * 1. the dialog is triviailly simple, like an alert box that makes no changes to the score, or
 * 2. the dialog is extremely complicated in how it interacts with the user, such that a form-based approach won't work
 * @category SuiDialog
 */
export declare abstract class SuiDialogBase extends SuiDialogNotifier {
    static get displayOptions(): Record<string, string>;
    static getStaticText(staticText: Record<string, string>[]): Record<string, string>;
    id: string;
    ctor: string;
    debug: layoutDebug;
    boundKeyboard: boolean;
    components: SuiComponentBase[];
    boundComponents: SuiComponentBase[];
    cmap: Record<string, SuiComponentBase>;
    scroller: SuiScroller;
    closeDialogPromise: Promise<void>;
    label: string;
    staticText: Record<string, string>[];
    startPromise: Promise<void> | null;
    dialogElements: DialogDefinition;
    eventSource: BrowserEventSource;
    view: SuiScoreViewOperations;
    completeNotifier: CompleteNotifier;
    modifier: any;
    dgDom: DialogDom;
    displayOptions: string[];
    keydownHandler: EventHandler | null;
    constructor(dialogElements: DialogDefinition, parameters: SuiDialogParams);
    display(): void;
    bindElements(): void;
    bindComponents(): void;
    initialValue(): void;
    changed(): Promise<void>;
    getId(): string;
    getModifier(): SmoModifier | null;
    getEventSource(): BrowserEventSource;
    getStaticText(): Record<string, string>;
    commit(): Promise<any>;
    get closeModalPromise(): Promise<any>;
    static position(box: SvgBox, dgDom: DialogDom, scroller: SuiScroller): void;
    getView(): SuiScoreViewOperations;
    applyDisplayOptions(): void;
    position(box: SvgBox): void;
    hideRemoveButton(): void;
    positionFromModifier(): void;
    positionGlobally(): void;
    positionFromSelection(): void;
    _constructDialog(dialogElements: DialogDefinition, parameters: SuiDomParams): {
        element: any;
        trapper: InputTrapper;
    };
    complete(): void;
    makeDraggable(): void;
    captureKeyboardPromise(): Promise<void>;
    evKey(evdata: any): void;
    bindKeyboard(): void;
}
/**
 * Convenience functions
 * @param type
 * @param parameters
 * @returns a new dialog of type T
 * @category SuiDialog
 */
export declare function dialogConstructor<T extends SuiDialogBase>(type: {
    new (parameters: SuiDialogParams): T;
}, parameters: SuiDialogParams): T;
/**
 * Convenience function to display a dialog
 * @category SuiDialog
 * @param ctor
 * @param parameters
 * @returns
 */
export declare function createAndDisplayDialog<T extends SuiDialogBase>(ctor: new (parameters: SuiDialogParams) => T, parameters: SuiDialogParams): T;
