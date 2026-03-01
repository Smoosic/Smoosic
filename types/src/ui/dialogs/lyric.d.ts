import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SuiLyricComponent } from './components/noteText';
import { SuiDropdownComponent } from './components/dropdown';
import { SuiRockerComponent } from './components/rocker';
import { SmoSelector } from '../../smo/xform/selections';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SuiFontComponent } from './components/fontComponent';
import { SmoRenderConfiguration } from '../../render/sui/configuration';
import { EventHandler } from '../eventSource';
/**
 * Complex dialog for traversing and working with lyrics.
 * @category SuiDialog
 */
export declare class SuiLyricDialog extends SuiDialogBase {
    static get ctor(): string;
    static get idleLyricTime(): number;
    static dialogElements: DialogDefinition;
    originalRefreshTimer: number;
    modifier: SmoLyric | null;
    selector: SmoSelector | null;
    config: SmoRenderConfiguration;
    verse: number;
    mouseMoveHandler: EventHandler | null;
    mouseClickHandler: EventHandler | null;
    constructor(parameters: SuiDialogParams);
    get lyricEditorCtrl(): SuiLyricComponent;
    get fontCtrl(): SuiFontComponent;
    get translateYCtrl(): SuiRockerComponent;
    get verseCtrl(): SuiDropdownComponent;
    display(): void;
    setLyric(selector: SmoSelector, lyric: SmoLyric): void;
    _focusSelection(): void;
    changed(): Promise<void>;
    bindElements(): void;
    evKey(evdata: any): Promise<void>;
    _complete(): void;
    mouseMove(ev: any): void;
    mouseClick(ev: any): void;
}
