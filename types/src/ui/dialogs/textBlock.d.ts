import { SmoScoreText, SmoTextGroup } from '../../smo/data/scoreText';
import { OutlineInfo } from '../../render/sui/svgHelpers';
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SuiDragText } from './components/dragText';
import { SuiTextInPlace } from './components/textInPlace';
import { SuiDropdownComponent } from './components/dropdown';
import { SuiToggleComponent } from './components/toggle';
import { SuiRockerComponent } from './components/rocker';
import { SuiFontComponent } from './components/fontComponent';
import { SuiTextBlockComponent } from './components/textInPlace';
import { EventHandler } from '../eventSource';
/**
 * Complex dialog for managing score text (not associated with music)
 * @category SuiDialog
 */
export declare class SuiTextBlockDialog extends SuiDialogBase {
    get textEditorCtrl(): SuiTextInPlace;
    get insertCodeCtrl(): SuiDropdownComponent;
    get textDraggerCtrl(): SuiDragText;
    get yCtrl(): SuiRockerComponent;
    get xCtrl(): SuiRockerComponent;
    get fontCtrl(): SuiFontComponent;
    get textBlockCtrl(): SuiTextBlockComponent;
    get paginationCtrl(): SuiDropdownComponent;
    get attachToSelectorCtrl(): SuiToggleComponent;
    static dialogElements: DialogDefinition;
    edited: boolean;
    isNew: boolean;
    modifier: SmoTextGroup;
    originalTextGroup: SmoTextGroup | null;
    activeScoreText: SmoScoreText;
    textElement: any;
    mouseMoveHandler: EventHandler | null;
    mouseUpHandler: EventHandler | null;
    mouseDownHandler: EventHandler | null;
    mouseClickHandler: EventHandler | null;
    outlineRect: OutlineInfo | null;
    constructor(parameters: SuiDialogParams);
    populateInitial(): void;
    static unrenderTextGroup(tg: SmoTextGroup): void;
    unrenderOriginal(): void;
    display(): void;
    _resetAttachToSelector(): void;
    _activateAttachToSelector(): void;
    changed(): Promise<void>;
    highlightActiveRegion(): void;
    evKey(evdata: any): void;
    mouseUp(): void;
    mouseMove(ev: any): void;
    mouseClick(ev: any): void;
    mouseDown(ev: any): void;
    _complete(): void;
    _removeText(): void;
    bindElements(): void;
}
/**
 * @category SuiDialog
 */
export declare class helpModal {
    static createAndDisplay(): Promise<void>;
}
