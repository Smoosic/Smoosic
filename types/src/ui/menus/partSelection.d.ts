import { SuiMenuParams, SuiConfiguredMenu } from './menu';
import { SmoPartInfo } from '../../smo/data/partInfo';
/**
 * This is the menu that is always visible on the UI ribbon
 * @category SuiMenu
 */
export declare class SuiPartSelectionMenu extends SuiConfiguredMenu {
    partMap: {
        keys: number[];
        partMap: Record<number, SmoPartInfo>;
    };
    constructor(params: SuiMenuParams);
    preAttach(): void;
}
