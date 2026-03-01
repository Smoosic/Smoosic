import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SuiChordComponent } from './components/noteText';
import { SuiDropdownComponent } from './components/dropdown';
import { SuiToggleComponent } from './components/toggle';
import { SuiRockerComponent } from './components/rocker';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SmoSelector } from '../../smo/xform/selections';
import { SuiFontComponent } from './components/fontComponent';
import { EventHandler } from '../eventSource';
/**
 * Complex dialog for running a chord change editing session.
 * @category SuiDialog
 */
export declare class SuiChordChangeDialog extends SuiDialogBase {
    static dialogElements: DialogDefinition;
    lyric: SmoLyric | null;
    selector: SmoSelector | null;
    mouseMoveHandler: EventHandler | null;
    mouseClickHandler: EventHandler | null;
    constructor(parameters: SuiDialogParams);
    get chordEditorCtrl(): SuiChordComponent;
    get chordSymbolCtrl(): SuiDropdownComponent;
    get translateYCtrl(): SuiRockerComponent;
    get textPositionCtrl(): SuiRockerComponent;
    get adjustWidthCtrl(): SuiToggleComponent;
    get fontCtrl(): SuiFontComponent;
    changed(): Promise<void>;
    setLyric(selector: SmoSelector, lyric: SmoLyric): void;
    display(): void;
    bindElements(): void;
    evKey(evdata: any): Promise<void>;
    _complete(): void;
    mouseMove(ev: any): void;
    mouseClick(ev: any): void;
}
