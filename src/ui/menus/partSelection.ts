import { SuiMenuBase, SuiMenuParams, SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import { SmoPartInfo } from '../../smo/data/partInfo';
declare var $: any;

/**
 * This is the menu that is always visible on the UI ribbon
 * @category SuiMenu
 */
export class SuiPartSelectionMenu extends SuiConfiguredMenu {
  partMap: { keys: number[], partMap: Record<number, SmoPartInfo> } = { keys: [], partMap: {} };
  constructor(params: SuiMenuParams) {
    super(params, 'Parts', []);
  }
  preAttach() {
    this.partMap = this.view.getPartMap();
    const cancel = this.menuOptions.find((op) => op.menuChoice.value === 'cancel')!;
    const rebuilt: SuiConfiguredMenuOption[] = [];
    if (this.score.staves.length < this.view.storeScore.staves.length) {
      rebuilt.push({
        handler: async (menu: SuiMenuBase) => {
          menu.view.viewAll();
        }, display: (menu: SuiMenuBase) => true,
        menuChoice: {
          icon: '',
          text: 'View All',
          value: '-1'
        }
      });
    }
    this.partMap.keys.forEach((key) => {
      const partInfo = this.partMap.partMap[key];
      rebuilt.push({
        handler: async (menu: SuiMenuBase) => {
          menu.view.exposePart(menu.view.storeScore.staves[partInfo.associatedStaff]);
        }, display: (menu: SuiMenuBase) => true,
        menuChoice: {
          icon: '',
          text: partInfo.partName,
          value: key.toString()
        }
      });
    });
    rebuilt.push(cancel);
    this.menuOptions = rebuilt;
    super.preAttach();
  }
}
