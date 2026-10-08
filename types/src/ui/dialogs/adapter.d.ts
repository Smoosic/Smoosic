/**
 * Support for converting Smo object model to MIDI
 * @module /ui/dialog/adapter
 */
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiTracker } from '../../render/sui/tracker';
import { CompleteNotifier } from '../common';
import { BrowserEventSource } from '../eventSource';
import { UndoBuffer } from '../../smo/xform/undo';
import { DialogDefinition, SuiDialogBase } from './dialog';
/**
 * Compute an initial dialog position near a score modifier, for Vue dialogs that want to
 * open next to the thing they're editing instead of at the default fixed location.
 * Mirrors the intent of the legacy `SuiDialogBase.positionFromModifier()`, adjusted for
 * current scroll position; unlike the legacy version this does not clamp to the viewport
 * edge or flip side when the dialog would be clipped, since that requires measuring the
 * dialog element after it mounts.
 * @category SuiDialog
 */
export declare const getModifierDialogPosition: (view: SuiScoreViewOperations, modifier: any) => {
    top: number;
    left: number;
} | undefined;
/**
 * An adapter is the glue logic between UI components and the score view.
 * An adapter consists mostly of accessors (get/set) for the component data.  The
 * components have their initial values set from the adapter get, and changes to components
 * result in sets to the adapter.  The adapter can then update the score.
 * For dialogs that use this pattern,
 * the dialog automatically creates the components and binds their values with the
 * adapter.
 * @method commit - called when OK button of dialog is clicked
 * @method cancel - called when cancel button of dialog is clicked
 * @method remove - optional.  Called when 'remove' button is clicked, for artifacts like dynamics that can be removed.
 * @category SuiDialog
 */
export declare abstract class SuiComponentAdapter {
    view: SuiScoreViewOperations;
    constructor(view: SuiScoreViewOperations);
    abstract commit(): Promise<any>;
    abstract cancel(): Promise<any>;
    remove(): Promise<any>;
}
/**
 * A dialog that uses the adapter pattern takes the adapter as argument.
 * Other than that it's the same as normal dialog parameters
 * The adapter type is a generic, so that the specific dialog can reference the
 * specific adapter class
 * @param ctor constructor for reflection
 * @param id ID for dom placement
 * @param tracker
 * @param completeNotifier UI component to notify when dialog is complete
 * @param startProise UI component that notifies us when to display
 * @param view
 * @param eventSource where to register for KB and mouse events
 * @param undoBuffer where to undo things we change
 * @param adapter an adapter which has getters and setters for all of the dialog components.  The adapter should
 *   read the values from the actual score, and update the score with the component values.
 * @category SuiDialog
 */
export interface SuiDialogAdapterParams<T extends SuiComponentAdapter> {
    ctor: string;
    id: string;
    tracker: SuiTracker;
    completeNotifier: CompleteNotifier;
    startPromise: Promise<void> | null;
    view: SuiScoreViewOperations;
    eventSource: BrowserEventSource;
    undoBuffer?: UndoBuffer;
    adapter: T;
}
/**
 * SuiDialogAdapterBase is the base class for dialogs that use the adapter pattern
 * (almost all of them).
 * @typeParam T a class that implements the Adapter interface and fulfills the
 *  adapter data contract, with getters and setters from the components
 * @category SuiDialog
 */
export declare class SuiDialogAdapterBase<T extends SuiComponentAdapter> extends SuiDialogBase {
    adapter: T;
    constructor(def: DialogDefinition, params: SuiDialogAdapterParams<T>);
    /**
     * Call the components bind() methods to activate them.  Also, verify that each
     * adapter meets the contract with the components
     */
    bindComponents(): void;
    /**
     * Called before dialog is displayed.
     * components that interface (bind) with the adapter are called 'bound' components.
     * On initialize, update the component with the score value, as told by the adapter.
     */
    initialValue(): void;
    /**
     * When a component changes, it notifies the parent dialog.  Usually, we just
     * proxy the call to the adapter.  The specific dialog can override this method if
     * something in the UI needs to change as a result of the component state (e.g.
     * show or hide another component)
     */
    changed(): Promise<void>;
    /**
     * If there is any 'saving' to be done when the dialog clicks OK,
     * that is handled by the adapter.  Else it can be a noop.
     */
    commit(): Promise<any>;
    /**
     * If there is any undo or restore to be done when the dialog clicks OK,
     * that is handled by the adapter.  Else it can be a noop.
     */
    cancel(): Promise<any>;
    /**
     * For score artifacts that can be removed,
     */
    remove(): Promise<void>;
    /**
     * Binds the main dialog buttons.  For OK/Cancel/remove, the logic calls the appropriate
     * derived function, which calls the appropriate adapter method, then calls complete()
     * to restore the event handling loop to the application
     */
    bindElements(): void;
}
