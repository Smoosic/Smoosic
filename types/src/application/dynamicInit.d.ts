/**
 * Dynamic constructors are factories for UI elements (dialogs, menus) that control musical elements (e.g. slur, dynamics etc).
 * We create them before the score,
 * so that when the score is rendered, elements of the score can be bound to the appropriate UI elements.
 */
export declare const createDialogFactories: () => void;
