import { SuiButton, SuiButtonParams } from './button';
import { KeyEvent } from '../../smo/data/common';
/**
 * These are the quick-buttons that show up on the left of the button ribbon.
 * @category SuiButton
 */
export declare class DisplaySettings extends SuiButton {
    hotKey: string | undefined;
    constructor(parameters: SuiButtonParams);
    handleKeyDown(ev: KeyEvent): void;
    enablePartSelection(): void;
    handleScoreChange(ev: any): void;
    setView(): void;
    refresh(): void;
    zoomout(): void;
    zoomin(): void;
    playButton2(): void;
    stopButton2(): void;
    keySignature(): void;
    ribbonTime(): void;
    ribbonTempo(): void;
    selectPart(): Promise<void>;
    bind(): void;
}
