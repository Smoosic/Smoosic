import { StrokeInfo } from "./svgHelpers";
import { SvgPoint, SvgBox, Renderable, ElementLike } from '../../smo/data/common';
import { layoutDebug } from './layoutDebug';
import { layoutProvider } from "./mapper";
import { SmoGlobalLayout, SmoPageLayout } from '../../smo/data/scoreModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { ModifierTab } from '../../smo/xform/selections';
import { Renderer, SVGContext } from '../../common/vex';
export interface SvgPageMapParameters {
    layout: SmoGlobalLayout;
    container: HTMLElement;
    pages: SmoPageLayout[];
    debug: layoutDebug;
}
/**
 * A selection map maps a sub-section of music (a measure, for instance) to a region
 * on the screen.  SelectionMap can contain other SelectionMaps with
 * different 'T', for instance, notes in a measure, in a 'Russian Dolls' kind of model.
 * This allows us to search for elements in < O(n) time and avoid
 * expensive geometry operations.
 * @category SuiRender
 */
export declare abstract class SelectionMap<T, K> {
    /**
     * Create a key from the selection (selector). e.g. (1,1)
     * @param selection
     */
    abstract createKey(selection: SmoSelection): K;
    /**
     * get a set of coordinates from this selection, if it has been rendered.
     * @param selection
     */
    abstract boxFromSelection(selection: SmoSelection): SvgBox;
    /**
     * Add the selection to our map, and possibly to our child map.
     * @param key
     * @param selection
     */
    abstract addKeyToMap(key: K, selection: SmoSelection): void;
    /**
     * find a collection of selection that match a bounding box, possibly by
     * recursing through our child SelectionMaps.
     * @param value
     * @param box
     * @param rv
     */
    abstract findValueInMap(value: T, box: SvgBox): SmoSelection[];
    /**
     * the outer bounding box of these selections
     */
    box: SvgBox;
    /**
     * map of key to child SelectionMaps or SmoSelections
     */
    systemMap: Map<K, T>;
    /**
     * Given a bounding box (or point), find all the musical elements contained
     * in that point
     * @param box
     * @returns SmoSelection[]
     */
    findArtifact(box: SvgBox): SmoSelection[];
    /**
     * Add a rendered element to the map, and update the bounding box
     * @param selection
     * @returns
     */
    addArtifact(selection: SmoSelection): void;
}
/**
 * logic to map a set of notes to a region on the screen, for searching
 * @category SuiRender
 */
export declare class MappedNotes extends SelectionMap<SmoSelection, string> {
    createKey(selection: SmoSelection): string;
    boxFromSelection(selection: SmoSelection): SvgBox;
    addKeyToMap(key: string, selection: SmoSelection): void;
    findValueInMap(value: SmoSelection, box: SvgBox): SmoSelection[];
}
/**
 * Map of measures to a region on the page.
 * @category SuiRender
 */
export declare class MappedMeasures extends SelectionMap<MappedNotes, string> {
    box: SvgBox;
    systemMap: Map<string, MappedNotes>;
    createKey(selection: SmoSelection): string;
    boxFromSelection(selection: SmoSelection): SvgBox;
    addKeyToMap(key: string, selection: SmoSelection): void;
    findValueInMap(value: MappedNotes, box: SvgBox): SmoSelection[];
}
/**
 * Map of the systems on a page.  Each system has a unique line index
 * which is the hash
 * @category SuiRender
 */
export declare class MappedSystems extends SelectionMap<MappedMeasures, number> {
    box: SvgBox;
    systemMap: Map<number, MappedMeasures>;
    createKey(selection: SmoSelection): number;
    boxFromSelection(selection: SmoSelection): SvgBox;
    addKeyToMap(selectionKey: number, selection: SmoSelection): void;
    findValueInMap(value: MappedMeasures, box: SvgBox): SmoSelection[];
    clearMeasure(selection: SmoSelection): void;
}
export declare function getDiv(dim: number, box: SvgBox, divSize: number, layoutSource: layoutProvider): number;
export interface SvgPageParameters {
    renderer: Renderer;
    layoutSource: layoutProvider;
    pageNumber: number;
    box: SvgBox;
    debug: layoutDebug;
}
/**
 * Each page is a different SVG element, with its own offset within the DOM. This
 * makes partial updates faster.  SvgPage keeps track of all musical elements in SelectionMaps.
 * staff and score modifiers are kept in seperate lists since they may span multiple
 * musical elements (e.g. slurs, text elements).
 * @category SuiRender
 */
export declare class SvgPage {
    _renderer: Renderer;
    layoutSource: layoutProvider;
    pageNumber: number;
    box: SvgBox;
    systemMap: MappedSystems;
    modifierYKeys: number[];
    modifierTabDivs: Record<number, ModifierTab[]>;
    debug: layoutDebug;
    static get defaultMap(): {
        box: SvgBox;
        systemMap: Map<any, any>;
    };
    /**
     * Modifiers are divided into `modifierDivs` vertical
     * rectangles for event lookup.
     */
    static get modifierDivs(): number;
    /**
     * This is the VextFlow renderer context (SVGContext)
     * @returns
     */
    getContext(): SVGContext;
    get divSize(): number;
    constructor(params: SvgPageParameters);
    /**
     * Given SVG y, return the div for modifiers
     * @param y
     * @returns
     */
    divIndex(dim: number): number;
    /**
     * Remove all elements and modifiers in this page, for a redraw.
     */
    clearMap(): void;
    /**
     * Clear mapped objects associated with a measure, including any
     * modifiers that span that measure.
     * @param selection
     */
    clearMeasure(selection: SmoSelection): void;
    /**
     * add a modifier to the page, indexed by its rectangle
     * @param modifier
     */
    addModifierTab(modifier: ModifierTab): void;
    /**
     * Add a new selection to the page
     * @param selection
     */
    addArtifact(selection: SmoSelection): void;
    /**
     * Try to find a selection on this page, based on the mouse event
     * @param box
     * @returns
     */
    findArtifact(box: SvgBox): SmoSelection[];
    /**
     * Try to find a modifier on this page, based on the mouse event
     * @param box
     * @returns
     */
    findModifierTabs(box: SvgBox): ModifierTab[];
    clearModifiers(): void;
    /**
     * Measure the bounding box of an element.  Return the box as if the top of the first page were 0,0.
     * Bounding boxes are stored in absolute coordinates from the top of the first page.  When rendering
     * elements, we adjust the coordinates for hte local page.
     * @param element
     * @returns
     */
    offsetBbox(element: ElementLike): SvgBox;
    /**
     * Adjust the bounding box to local coordinates for this page.
     * @param box
     * @returns
     */
    offsetSvgBox(box: SvgBox): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * Adjust the point to local coordinates for this page.
     * @param box
     * @returns
     */
    offsetSvgPoint(box: SvgPoint): {
        x: number;
        y: number;
    };
    get svg(): SVGSVGElement;
}
/**
 * A container for all the SVG elements, and methods to manage adding and finding elements.  Each
 * page of the score has its own SVG element.
 * @category SuiRender
 */
export declare class SvgPageMap {
    _layout: SmoGlobalLayout;
    _container: HTMLElement;
    _pageLayouts: SmoPageLayout[];
    vfRenderers: SvgPage[];
    static get strokes(): Record<string, StrokeInfo>;
    containerOffset: SvgPoint;
    debug: layoutDebug;
    getLayout(): SmoGlobalLayout;
    isLayoutHorizontal(): boolean;
    getFlowDimensionPosition(box: SvgBox | SvgPoint): number;
    getFlowDimensionExtent(box: SvgBox): number;
    /**
     *
     * @param layout - defines the page width/height and relative zoom common to all the pages
     * @param container - the parent DOM element that contains all the pages
     * @param pages - the layouts (margins, etc) for each pages.
     */
    constructor(params: SvgPageMapParameters);
    get container(): HTMLElement;
    /**
     * Update the offset of the music container DOM element, in client coordinates. This is used
     * when converting absolute screen coordinates (like from a mouse event) to SVG coordinates
     * @param scrollPoint
     */
    updateContainerOffset(scrollPoint: SvgPoint): void;
    get layout(): SmoGlobalLayout;
    get pageLayouts(): SmoPageLayout[];
    get zoomScale(): number;
    get renderScale(): number;
    get pageDivHeight(): number;
    get pageDivWidth(): number;
    get pageHeight(): number;
    get pageWidth(): number;
    get totalHeight(): number;
    get totalWidth(): number;
    /**
     * create/re-create all the page SVG elements
     */
    createRenderers(): void;
    topY(ix: number): number;
    topX(ix: number): number;
    addPage(): void;
    updateZoom(zoomScale: number): void;
    /**
     * Convert from screen/client event to SVG space.  We assume the scroll offset is already added to `box`
     * @param box
     * @returns
     */
    clientToSvg(box: SvgBox): SvgBox;
    /**
     * Convert from SVG bounding box to screen coordinates
     * @param box
     * @returns
     */
    svgToClient(box: SvgBox): SvgBox;
    /**
     * Convert from SVG bounding box to screen coordinates
     * @param box
     * @returns
    */
    svgToClientNoOffset(box: SvgBox): SvgBox;
    /**
     * Find a selection from a mouse event
     * @param box - location of a mouse event or specific screen coordinates
     * @returns
     */
    findArtifact(logicalBox: SvgBox): {
        selections: SmoSelection[];
        page: SvgPage;
    };
    /**
     * Find any modifiers intersecting with `box`
     * @param box
     * @returns
     */
    findModifierTabs(logicalBox: SvgBox): ModifierTab[];
    /**
     * add a rendered page to the page map
     * @param selection
     * @returns
     */
    addArtifact(selection: SmoSelection): void;
    /**
     * add a rendered modifier to the page map
     * @param modifier
     */
    addModifierTab(modifier: ModifierTab): void;
    clearModifiersForPage(page: number): void;
    /**
     * The number of pages is changing, remove the last page
     * @returns
     */
    removePage(): void;
    /**
     * The score dimensions have changed, clear maps and recreate the pages.
     * @param layout
     * @param pageLayouts
     */
    updateLayout(layout: SmoGlobalLayout, pageLayouts: SmoPageLayout[]): void;
    /**
     * Return the page by index
     * @param page
     * @returns
     */
    getRendererForPage(page: number): SvgPage;
    /**
     * Return the SvgPage based on SVG point (conversion from client coordinates already done)
     * @param point
     * @returns
     */
    getRendererFromPoint(point: SvgPoint): SvgPage | null;
    /**
     * Return the SvgPage based on SVG point (conversion from client coordinates already done)
     * @param box
     * @returns
     */
    getRenderer(box: SvgBox | SvgPoint): SvgPage;
    /**
     * Return the page based on the coordinates of a modifier
     * @param modifier
     * @returns
     */
    getRendererFromModifier(modifier?: Renderable): SvgPage;
}
