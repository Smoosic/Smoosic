import { Transposable, SvgBox, SvgPoint, ElementLike } from '../../smo/data/common';
import { SvgPage } from './svgPageMap';
export type SuiTextStrokeName = 'text-suggestion' | 'text-selection' | 'text-highlight' | 'text-drag' | 'inactive-text';
/**
 * @internal
 */
export interface StrokeInfo {
    strokeName: string;
    stroke: string;
    strokeWidth: string | number;
    strokeDasharray: string | number;
    fill: string;
    opacity: number;
}
export declare const SuiTextStrokes: Record<SuiTextStrokeName, StrokeInfo>;
/**
 * @internal
 */
export interface OutlineInfo {
    stroke: StrokeInfo;
    classes: string;
    box: SvgBox | SvgBox[];
    scroll: SvgPoint;
    context: SvgPage;
    timeOff: number;
    timer?: number;
    element?: ElementLike;
}
/**
 * @internal
 */
export interface GradientInfo {
    color: string;
    offset: string;
    opacity: number;
}
/**
 * @internal
 */
export interface Boxable {
    box: SvgBox;
}
/**
 * @internal
 */
export declare class SvgBuilder {
    e: Element;
    constructor(el: string);
    classes(cl: string): SvgBuilder;
    attr(name: string, value: string): SvgBuilder;
    text(x: number | string, y: number | string, classes: string, text: string): SvgBuilder;
    rect(x: number | string, y: number | string, width: number | string, height: number | string, classes: string): SvgBuilder;
    line(x1: number | string, y1: number | string, x2: number | string, y2: number | string, classes: string): SvgBuilder;
    append(el: any): SvgBuilder;
    dom(): Element;
    static b(element: string): SvgBuilder;
}
/**
 * Mostly utilities for converting coordinate spaces based on transforms, etc.
 * @internal
 */
export declare class SvgHelpers {
    static get namespace(): string;
    static gradient(svg: SVGSVGElement, id: string, orientation: string, stops: GradientInfo[]): void;
    static renderCursor(svg: ElementLike, x: number, y: number, height: number): void;
    static updateArtifactBox(context: SvgPage, element: ElementLike, artifact: Transposable): void;
    static eraseOutline(params: OutlineInfo): void;
    static outlineRect(params: OutlineInfo): void;
    static setSvgStyle(element: Element, attrs: StrokeInfo): void;
    static rect(svg: Document, box: SvgBox, attrs: StrokeInfo, classes: string): Element;
    static line(svg: SVGSVGElement, x1: number | string, y1: number | string, x2: number | string, y2: number | string, attrs: StrokeInfo, classes: string): void;
    static arrowDown(svg: SVGSVGElement, box: SvgBox): void;
    static debugBox(svg: SVGSVGElement, box: SvgBox | null, classes: string, voffset: number): void;
    static debugBoxNoText(svg: SVGSVGElement, box: SvgBox | null, classes: string, voffset: number): void;
    static placeSvgText(svg: SVGSVGElement, attributes: Record<string | number, string | number>[], classes: string, text: string): SVGSVGElement;
    static doesBox1ContainBox2(box1?: SvgBox, box2?: SvgBox): boolean;
    static findIntersectingArtifact(clientBox: SvgBox, objects: Boxable[]): Boxable[];
    static findSmallestIntersection(clientBox: SvgBox, objects: Boxable[]): Boxable | null;
    static translateElement(g: SVGSVGElement, x: number | string, y: number | string): void;
    static stringify(box: SvgBox): string;
    static log(box: SvgBox): void;
    static smoBox(box: any): SvgBox;
    static unionRect(b1: SvgBox, b2: SvgBox): SvgBox;
    static boxPoints(x: number, y: number, w: number, h: number): SvgBox;
    static svgViewport(svg: SVGSVGElement, xOffset: number, yOffset: Number, width: number, height: number, scale: number): void;
    static removeElementsByClass(svg: SVGSVGElement, className: string): void;
}
