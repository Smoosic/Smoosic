import { ButtonDefinition } from '../ui/buttons/button';
import { KeyEvent } from '../smo/data/common';
import { SuiNavigation } from '../render/sui/configuration';
import { SuiScoreView } from '../render/sui/scoreView';
import { Ref } from 'vue';
/**
 * Define the base class for a modal component that resolves a promise when it is dismissed
 * @category SuiButton
 */
export declare abstract class ModalComponent {
    abstract closeModalPromise: Promise<void>;
}
export type keyEventCallback = (ke: KeyEvent) => void;
/**
 * Define an interface that gives up event handling when a modal is active
 * @category SuiButton
 */
export declare abstract class CompleteNotifier {
    abstract unbindKeyboardForModal(component: ModalComponent): void;
}
/**
 * @category SuiButton
 */
export interface RibbonLayout {
    left: string[];
    top: string[];
}
/**
 * @category SuiButton
 */
export interface RibbonDefinition {
    ribbon: RibbonLayout;
    ribbonButtons: ButtonDefinition[];
}
export interface SelectOption {
    label: string;
    value: string;
    classes?: string;
    icon?: string;
    active?: boolean;
}
export interface DomDebugFlag {
    category: string;
    htmlString: string;
}
export interface CrashDialog {
    url: string;
    bodyText: Ref<string>;
    show: Ref<boolean>;
}
export interface DomDialogNotifiers {
    showSplash: Ref<boolean>;
    splashTimer: Ref<number>;
    debugFlags: DomDebugFlag[];
    crashDialog: CrashDialog;
}
export interface ExceptionParameters {
    view: SuiScoreView;
    navigation: SuiNavigation;
}
export declare const modalContainerId = "#vue-modal-container";
/**
 * Remove and replace an element, so we can reattach Vue to it
 * @param element the ID or element we are replacing
 * @returns the new element id
 */
export declare const replaceVueRoot: (element: string | HTMLElement) => string;
