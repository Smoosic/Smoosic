import { SvgBox, SvgPoint } from '../../smo/data/common';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoSelector } from '../../smo/xform/selections';
import { SuiNavigation } from './configuration';
/**
 * SuiRender
 * @internal
 */
export interface CodeRegion {
    time: number;
    percent: number;
}
/**
 * @category SuiRender
 */
export declare class layoutDebug {
    static get values(): Record<string, number>;
    static get classes(): Record<number, string>;
    static get codeRegions(): Record<string, number>;
    testThrow: boolean;
    static get codeRegionStrings(): string[];
    mask: number;
    _textDebug: number[];
    timestampHash: Record<number, number>;
    _dialogEvents: string[];
    navigation: SuiNavigation;
    constructor(navigation: SuiNavigation);
    clearTimestamps(): void;
    setTimestamp(region: number, millis: number): void;
    printTimeReport(): void;
    flagSet(value: number): number;
    clearAll(): void;
    setAll(): void;
    setRenderFlags(): void;
    clearDebugBoxes(value: number): void;
    debugBox(svg: SVGSVGElement, box: SvgBox | null, flag: number): void;
    setFlag(value: number): void;
    setFlagDivs(): void;
    updateScrollDebug(point: SvgPoint): void;
    updateMouseDebug(client: SvgPoint, logical: SvgPoint, offset: SvgPoint): void;
    updateDragDebug(client: SvgPoint, logical: SvgPoint, state: string): void;
    updatePlayDebug(selector: SmoSelector, logical: SvgBox): void;
    addTextDebug(value: number): void;
    addDialogDebug(value: string): void;
    measureHistory(measure: SmoMeasure, oldVal: string, newVal: any, description: string): void;
}
