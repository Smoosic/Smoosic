import { ButtonDefinition } from '../ui/buttons/button';
import { KeyEvent } from '../smo/data/common';
import { SuiNavigation } from '../render/sui/configuration';
import { SuiScoreView } from '../render/sui/scoreView';
import { Ref } from 'vue';
declare var $: any;
/**
 * Define the base class for a modal component that resolves a promise when it is dismissed
 * @category SuiButton
 */
export abstract class ModalComponent {
  abstract closeModalPromise: Promise<void>;
}
export type keyEventCallback = (ke: KeyEvent) => void;
/**
 * Define an interface that gives up event handling when a modal is active
 * @category SuiButton
 */
export abstract class CompleteNotifier {
  abstract unbindKeyboardForModal(component: ModalComponent): void;
}
/**
 * @category SuiButton
 */
export interface RibbonLayout {
  left: string[],
  top: string[]
}
/**
 * @category SuiButton
 */
 export interface RibbonDefinition {
  ribbon: RibbonLayout,
  ribbonButtons: ButtonDefinition[]
}
export interface SelectOption {
  label: string,
  value: string,
  classes?: string,
  icon?: string,
  active?: boolean
}
export interface DomDebugFlag {
  category: string,
  htmlString: string
}
export interface CrashDialog {
  url: string,
  bodyText: Ref<string>,
  show: Ref<boolean>
}
export interface DomDialogNotifiers {
  showSplash: Ref<boolean>,
  splashTimer: Ref<number>,
  debugFlags: DomDebugFlag[],
  crashDialog: CrashDialog,
  showAttributeDialog: Ref<boolean>
}
export interface ExceptionParameters {
  view: SuiScoreView,
  navigation: SuiNavigation
}
export const modalContainerId = '.vue-modal-container';
/**
 * Remove and replace an element, so we can reattach Vue to it
 * @param element the ID or element we are replacing
 * @returns the new element id
 */
export const replaceVueRoot = (element: string | HTMLElement): string => {
  if (typeof element === 'string') {
    if ($(element).length === 1) {
      element = `#${$(element)[0].id}`;
    } else if (!element.startsWith('#')) {
      element = `#${element}`;
    }
  } else {
    element = `#${element.id}`;
  }
  if ($(element).length === 0) {
    const el = $(`<div id="${element.toString().substring(1)}"></div>`);
    $('body').append(el);    
  }
  $(element).empty();
  // $('#attribute-modal-container').empty();
  const parentId = $(element)[0].id;
  const newId = `${parentId}-1`;
  const newElement = $(`<div id="${newId}"></div>`);
  $(element).append(newElement);
  return newId;
}
