import { SmoScoreText, SmoTextGroup } from '../../../smo/data/scoreText';
import { KeyEvent } from '../../../smo/data/common';
import { SuiTextSession } from '../../../render/sui/textEdit';
import { SuiScroller } from '../../../render/sui/scroller';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { SuiDialogNotifier, SuiComponentBase, SuiComponentParent } from './baseComponent';
import { SuiButtonComposite } from './button';
import { SuiRockerComposite } from './rocker';
import { SuiDropdownComposite } from './dropdown';
/**
 * @category SuiDialog
 */
export interface SuiTextInPlaceParams {
    id: string;
    classes: string;
    label: string;
    smoName: string;
    control: string;
}
/**
 * Edit the text in an SVG element, in the same scale etc. as the text in the score SVG DOM.
 * This component just manages the text editing component of the renderer.
 * @category SuiDialog
 */
export declare class SuiTextInPlace extends SuiComponentBase {
    scroller: SuiScroller;
    editMode: boolean;
    value: SmoTextGroup;
    staticText: Record<string, string>;
    altLabel: string;
    view: SuiScoreViewOperations;
    session: SuiTextSession | null;
    constructor(dialog: SuiDialogNotifier, parameter: SuiTextInPlaceParams);
    show(): void;
    hide(): void;
    get html(): import("../../../common/htmlHelpers").DomBuilder;
    endSession(): Promise<void>;
    get isRunning(): boolean | null;
    getValue(): SmoTextGroup;
    _getInputElement(): any;
    mouseMove(ev: any): void;
    mouseClick(ev: any): void;
    _renderInactiveBlocks(): void;
    startEditSession(): void;
    evKey(evdata: KeyEvent): void;
    bind(): void;
}
/**
 * @category SuiDialog
 */
export interface SuiTextBlockComponentParams {
    id: string;
    classes: string;
    label: string;
    smoName: string;
    control: string;
}
/**
 * @category SuiDialog
 */
export interface SuiTextBlockValue {
    modifier: SmoTextGroup;
    activeScoreText: SmoScoreText;
}
/**
 * Dialog to edit an block of text components.  Each block can have
 * different font settings and placement.
 * @category SuiDialog
 */
export declare class SuiTextBlockComponent extends SuiComponentParent {
    addBlockCtrl: SuiButtonComposite;
    toggleBlockCtrl: SuiButtonComposite;
    removeBlockCtrl: SuiButtonComposite;
    relativePositionCtrl: SuiDropdownComposite;
    justificationCtrl: SuiDropdownComposite;
    spacingCtrl: SuiRockerComposite;
    modifier: SmoTextGroup;
    activeScoreText: SmoScoreText;
    constructor(dialog: SuiDialogNotifier, parameter: SuiTextBlockComponentParams);
    changed(): void;
    get html(): import("../../../common/htmlHelpers").DomBuilder;
    _getInputElement(): any;
    getValue(): {
        activeScoreText: SmoScoreText;
        modifier: SmoTextGroup;
    };
    _updateMultiiFields(): void;
    setValue(value: SuiTextBlockValue): void;
    bind(): void;
}
