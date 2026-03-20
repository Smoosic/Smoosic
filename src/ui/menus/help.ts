import { SuiMenuBase, SuiConfiguredMenuOption, SuiConfiguredMenu, SuiMenuParams } from './menu';
import { SuiHelp } from '../help';
import { SuiNavigation } from '../../render/sui/configuration';

/**
 * Stuff you can do to notes
 * @category SuiMenu
 */
export class SuiHelpMenu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, 'Help', SuiHelpMenuOptions);
  }  
}
/**
 * @category SuiMenu
 */
const topicMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    SuiHelp.displayHelp();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Topics',
    value: 'topics'
  }
}
/**
 * @category SuiMenu
 */
const aboutMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.view.renderer.navigation.showSplashModal(0);
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'About Smoosic',
    value: 'about'
  }
}
const SuiHelpMenuOptions: SuiConfiguredMenuOption[] = [
  topicMenuOption,
  aboutMenuOption
]