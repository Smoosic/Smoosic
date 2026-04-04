import { noteModifierDynamicCtorInit } from '../smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../smo/data/scoreModifiers';
import { collapsableButtonInit } from '../ui/buttons/collapsable';
import { menuTranslationsInit } from '../ui/menus/manager';
import { initDialogTranslationElements, initDialogConstructors } from '../ui/dialogs/factory';
let dynamicCtorInitComplete = false;
/**
 * Dynamic constructors are factories for UI elements (dialogs, menus) that control musical elements (e.g. slur, dynamics etc).  
 * We create them before the score, 
 * so that when the score is rendered, elements of the score can be bound to the appropriate UI elements.
 */
export const createDialogFactories = () => {
  if (!dynamicCtorInitComplete) {
    noteModifierDynamicCtorInit();
    measureModifierDynamicCtorInit();
    staffModifierDynamicCtorInit();
    scoreModifierDynamicCtorInit();
    collapsableButtonInit();
    menuTranslationsInit();
    initDialogTranslationElements();
    initDialogConstructors();
  }
  dynamicCtorInitComplete = true;
}
