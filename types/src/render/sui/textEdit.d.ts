import { SuiTextBlock } from './textRender';
import { SuiScroller } from './scroller';
import { layoutDebug } from './layoutDebug';
import { OutlineInfo } from './svgHelpers';
import { SmoTextGroup } from '../../smo/data/scoreText';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SvgBox } from '../../smo/data/common';
import { SvgPage } from './svgPageMap';
import { SvgPageMap } from './svgPageMap';
export interface SuiDragSessionParams {
    context: SvgPageMap;
    scroller: SuiScroller;
    textGroup: SmoTextGroup;
    debug: layoutDebug;
}
/**
 * @category SuiRender
 */
export declare class SuiDragSession {
    pageMap: SvgPageMap;
    page: SvgPage;
    scroller: SuiScroller;
    outlineBox: SvgBox;
    textObject: SuiTextBlock;
    dragging: boolean;
    outlineRect: OutlineInfo | null;
    textGroup: SmoTextGroup;
    debug: layoutDebug;
    constructor(params: SuiDragSessionParams);
    _outlineBox(): void;
    unrender(): void;
    scrolledClientBox(x: number, y: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    checkBounds(): void;
    startDrag(e: any): void;
    mouseMove(e: any): void;
    endDrag(): void;
}
export interface SuiAnnotationDragSessionParams {
    context: SvgPageMap;
    scroller: SuiScroller;
    annotation: SmoLyric;
    debug: layoutDebug;
}
/**
 * Drags a single note annotation (`SmoLyric` with `parser === annotation`) directly on the
 * score. Unlike `SuiDragSession` (which drags a `SmoTextGroup` and must build a temporary
 * `SuiTextBlock` clone to have something to render), an annotation is always exactly one
 * already-rendered VexFlow glyph, so the live preview here just re-points that same DOM
 * element's `transform` attribute -- the same attribute/convention `VxSystem._updateAnnotationOffsets`
 * already writes on every full render pass -- with no clone and no re-render mid-drag.
 * @category SuiRender
 */
export declare class SuiAnnotationDragSession {
    pageMap: SvgPageMap;
    page: SvgPage;
    scroller: SuiScroller;
    annotation: SmoLyric;
    debug: layoutDebug;
    dragging: boolean;
    originBox: SvgBox;
    startTranslateX: number;
    startTranslateY: number;
    startMouse: {
        x: number;
        y: number;
    };
    currentDx: number;
    currentDy: number;
    outlineRect: OutlineInfo | null;
    constructor(params: SuiAnnotationDragSessionParams);
    scrolledClientBox(x: number, y: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    _outlineBox(box: SvgBox): void;
    _eraseOutline(): void;
    _clampedDelta(dx: number, dy: number): {
        dx: number;
        dy: number;
    };
    startDrag(e: any): void;
    mouseMove(e: any): void;
    endDrag(): void;
    unrender(): void;
}
