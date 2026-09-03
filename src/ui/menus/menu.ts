import { SvgBox } from '../../smo/data/common';
import { SuiTracker } from '../../render/sui/tracker';
import { SmoScore } from '../../smo/data/score';
import { CompleteNotifier } from '../common';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { BrowserEventSource } from '../eventSource';
import { UndoBuffer } from '../../smo/xform/undo';
import { SmoTranslator } from '../i18n/language';
declare var $: any;
/**
 * Data for a menu choice.  'value' indicates which options selected
 * @category SuiMenu
 * @param icon - .icon class will be added to the choice
 * @param text - text to describe the choice
 * @param value - the value received by the menu loop
 * @param hotkey - optional key binding, if not supplied one is selected
 */
export interface MenuChoiceDefinition {
    icon: string,
    text: string,
    value: string,
    hotkey?: string,
    miIcon?: string
}
/**
 * Menu just array of choices
 * @category SuiMenu
 * @param label - Not currently displayed
 * @param menuItems - list of choices
 */
export interface MenuDefinition {
  label: string,
  menuItems: MenuChoiceDefinition[]
}
/**
 * @category SuiMenu
 */
export interface MenuTranslation {
  ctor: string,
  label: string,
  menuItems: MenuChoiceDefinition[]
}
export const MenuTranslations: MenuTranslation[] = [];
export const suiMenuTranslation = (menu: MenuDefinition, ctor: string) => {
  const menuItems: MenuChoiceDefinition[] = menu.menuItems as MenuChoiceDefinition[];
  const rvItems: MenuChoiceDefinition[] = [];
  menuItems.forEach((item) => {
    rvItems.push({ value: item.value, text: item.text, icon: '' });
  });
  return { ctor, label: menu.label, menuItems };
}
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
  ctor: string,
  tracker: SuiTracker,  
  score: SmoScore,
  completeNotifier: CompleteNotifier,
  closePromise: Promise<void> | null
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  undoBuffer: UndoBuffer,
  items?: MenuDefinition
}
/**
 * Base class for menus, mostly for the interface and containing the 
 * common parameters
 * @category SuiMenu
 */
export abstract class SuiMenuBase {
  label: string;
  menuItems: MenuChoiceDefinition[];
  ctor: string;
  completeNotifier: CompleteNotifier;
  score: SmoScore;
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  undoBuffer: UndoBuffer;
  focusIndex: number = -1;
  closePromise: Promise<void> | null;
  tracker: SuiTracker;
  constructor(params: SuiMenuParams) {
    this.ctor = params.ctor;
    const definition: MenuDefinition = 
       params.items ?? this.getDefinition();
    this.label = definition.label;
    this.menuItems = definition.menuItems;
    this.completeNotifier = params.completeNotifier;
    this.score = params.score;
    this.view = params.view;
    this.undoBuffer = params.undoBuffer;
    this.eventSource = params.eventSource;
    this.closePromise = params.closePromise;
    this.tracker = params.tracker;
    SmoTranslator.registerMenu(this.ctor);
  }
  abstract selection(ev: any): Promise<void>;
  abstract getDefinition(): MenuDefinition;
  /**
   * Base class can override this, called before display and event binding to 
   * add or remove options from the static list
   */
  preAttach() { }
  complete() {
    $('body').trigger('menuDismiss');
  }
  // Most menus don't process their own events
  keydown() {}
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
  menuChoice: MenuChoiceDefinition,
  handler: SuiMenuHandler,
  display: SuiMenuShowOption
}

/**
 * Common option in all menus
 * @category SuiMenu
 */
const cancelOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.complete();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Cancel',
    value: 'cancel'
  }
}
export const suiConfiguredMenuTranslate = (options: SuiConfiguredMenuOption[], label: string, ctor: string) => {
  const tr: MenuTranslation = {
    ctor, label, menuItems: []
  };
  options.forEach((option) => {
    tr.menuItems.push(option.menuChoice);
  });
  return tr;
}
export type customizeMenuOptionsFcn = (menu: SuiConfiguredMenu) => void;
/**
 * A menu of configured options.
 * @category SuiMenu
 */
export class SuiConfiguredMenu extends SuiMenuBase {
  static menuCustomizations: Record<string, customizeMenuOptionsFcn | undefined> = {};
  menuOptions: SuiConfiguredMenuOption[] = [];
  label: string = '';
  constructor(params: SuiMenuParams, label: string, options: SuiConfiguredMenuOption[]) {
    const cancel = options.find((op) => op.menuChoice.value === 'cancel');
    if (!cancel) {
      options.push(cancelOption);
    }
    super({ items: SuiConfiguredMenu.definitionFromOptions(label, options), ...params });
    this.menuOptions = options;
  }
  async selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    for (let i = 0; i < this.menuOptions.length; ++ i) {
      const option: SuiConfiguredMenuOption = this.menuOptions[i];
      if (option.menuChoice.value === text) {
        await option.handler(this);
        break;
      }
    }
    this.complete();
  }
  static definitionFromOptions(label: string, options: SuiConfiguredMenuOption[]) {
    const menuItems = options.map(oo => oo.menuChoice);
    return { label, menuItems };
  }
  getDefinition(): MenuDefinition {
    const choices: MenuChoiceDefinition[] = [];
    for (let i = 0; i < this.menuOptions.length; ++ i) {
      const option: SuiConfiguredMenuOption = this.menuOptions[i];
      choices.push(option.menuChoice);
    }
    return {
      label: this.label,
      menuItems: choices
    };
  }
  preAttach(): void {
    this.menuItems = [];
    this.menuOptions.forEach((option) => {
      if (option.display(this)) {
        this.menuItems.push(option.menuChoice);
      }
    });
    const customize = SuiConfiguredMenu.menuCustomizations[this.ctor];
    if (customize) {
      customize(this);
    }
  }
}

export const SuiMenuCustomizer = (fcn: customizeMenuOptionsFcn, ctor: string) => {
  SuiConfiguredMenu.menuCustomizations[ctor] = fcn;
}