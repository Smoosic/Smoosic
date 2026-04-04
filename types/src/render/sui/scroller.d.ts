import { SvgBox, SvgPoint } from '../../smo/data/common';
import { SvgPageMap } from './svgPageMap';
import { layoutDebug } from './layoutDebug';
export interface SuiScrollerParams {
    selector: HTMLElement;
    svgPages: SvgPageMap;
    debug: layoutDebug;
}
/**
 * Respond to scroll events in music DOM, and handle the scroll of the viewport
 * @category SuiRender
 */
export declare class SuiScroller {
    selector: HTMLElement;
    svgPages: SvgPageMap;
    _scroll: SvgPoint;
    _offsetInitial: SvgPoint;
    viewport: SvgBox;
    logicalViewport: SvgBox;
    scrolling: boolean;
    debug: layoutDebug;
    constructor(params: SuiScrollerParams);
    get scrollState(): SvgPoint;
    restoreScrollState(state: SvgPoint): void;
    handleScroll(x: number, y: number): void;
    updateDebug(): void;
    deferUpdateDebug(): void;
    scrollAbsolute(x: number, y: number): void;
    /**
     * Scroll such that the box is fully visible, if possible (if it is
     * not larger than the screen)
     **/
    scrollVisibleBox(box: SvgBox): void;
    updateViewport(): void;
    get scrollBox(): SvgBox;
    scrollOffset(x: number, y: number): void;
    get netScroll(): {
        x: number;
        y: number;
    };
}
