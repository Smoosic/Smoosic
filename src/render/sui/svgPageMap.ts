import { SvgHelpers, StrokeInfo } from "./svgHelpers";
import { SvgPoint, SvgBox, Renderable, ElementLike, RemoveElementLike } from '../../smo/data/common';
import { layoutDebug } from './layoutDebug';
import { layoutProvider, isHorizontalLayout } from "./mapper";
import { SmoGlobalLayout, SmoPageLayout } from '../../smo/data/scoreModifiers';
import { SmoTextGroup } from '../../smo/data/scoreText';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { ModifierTab } from '../../smo/xform/selections';
import { VexFlow, Renderer, SVGContext } from '../../common/vex';

const VF = VexFlow;
/**
 * classes for managing the SVG containers where the music is rendered.  Each
 * page is a different SVG element.  Screen coordinates need to be mapped to the
 * correct page and then to the correct element on that page.
 * @module /render/sui/svgPageMap
 */
declare var $: any;
/**
 * A selection map maps a sub-section of music (a measure, for instance) to a region
 * on the screen.  SelectionMap can contain other SelectionMaps with
 * different 'T', for instance, notes in a measure, in a 'Russian Dolls' kind of model.
 * This allows us to search for elements in < O(n) time and avoid
 * expensive geometry operations.
 * @category SuiRender
 */
export abstract class SelectionMap<T, K> {
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
  box: SvgBox = SvgBox.default;
  /**
   * map of key to child SelectionMaps or SmoSelections
   */
  systemMap: Map<K, T> = new Map();
  /**
   * Given a bounding box (or point), find all the musical elements contained
   * in that point
   * @param box 
   * @returns SmoSelection[]
   */
  findArtifact(box: SvgBox): SmoSelection[] {
    let rv: SmoSelection[] = [];
    for (const [key, value] of this.systemMap) {
      rv = rv.concat(this.findValueInMap(value, box));
    }
    return rv;
  }
  /**
   * Add a rendered element to the map, and update the bounding box
   * @param selection 
   * @returns 
   */
  addArtifact(selection: SmoSelection) {
    if (!selection.note || !selection.note.logicalBox) {
      return;      
    }
    const bounds = this.boxFromSelection(selection);
    if (this.systemMap.size === 0) {
      this.box = JSON.parse(JSON.stringify(bounds));
    }
    const ix = this.createKey(selection);
    this.addKeyToMap(ix, selection);
    this.box = SvgHelpers.unionRect(bounds, this.box);
  }
}

/**
 * logic to map a set of notes to a region on the screen, for searching
 * @category SuiRender
 */
export class MappedNotes extends SelectionMap<SmoSelection, string>{
  createKey(selection: SmoSelection): string {
    return `${selection.selector.voice}-${selection.selector.tick}`;
  }
  boxFromSelection(selection: SmoSelection): SvgBox {
    return selection.note?.logicalBox ?? SvgBox.default;
  }
  addKeyToMap(key: string, selection: SmoSelection) {
    this.systemMap.set(key, selection);
  }
  findValueInMap(value: SmoSelection, box: SvgBox): SmoSelection[] {
    const rv: SmoSelection[] = [];
    const note = value.note;
    if (note && note.logicalBox && SvgHelpers.doesBox1ContainBox2(note.logicalBox, box)) {
      rv.push(value);
    }
    return rv;
  }
}
/**
 * Map of measures to a region on the page.
 * @category SuiRender
 */
export class MappedMeasures extends SelectionMap<MappedNotes, string> {
  box: SvgBox = SvgBox.default;
  systemMap: Map<string, MappedNotes> = new Map();
  createKey(selection: SmoSelection): string {
    return `${selection.selector.staff}-${selection.selector.measure}`;
  }
  boxFromSelection(selection: SmoSelection): SvgBox {
    const noteBox = selection.note?.logicalBox ?? SvgBox.default;
    return SvgHelpers.unionRect(noteBox, selection.measure.svg.logicalBox);
  }
  addKeyToMap(key: string, selection: SmoSelection) {
    if (!this.systemMap.has(key)) {
      const nnote = new MappedNotes();
      this.systemMap.set(key, nnote);  
    }
    this.systemMap.get(key)?.addArtifact(selection);
  }
  findValueInMap(value: MappedNotes, box: SvgBox): SmoSelection[] {
    let rv: SmoSelection[] = [];
    if (SvgHelpers.doesBox1ContainBox2(value.box, box)) {
      rv = rv.concat(value.findArtifact(box));
    }
    return rv;
  }
}

/**
 * Map of the systems on a page.  Each system has a unique line index
 * which is the hash
 * @category SuiRender
 */
export class MappedSystems extends SelectionMap<MappedMeasures, number> {
  box: SvgBox = SvgBox.default;
  systemMap: Map<number, MappedMeasures> = new Map();
  createKey(selection: SmoSelection):number {
    return selection.measure.svg.lineIndex;
  }
  boxFromSelection(selection: SmoSelection): SvgBox {
    const noteBox = selection.note?.logicalBox ?? SvgBox.default;
    return SvgHelpers.unionRect(noteBox, selection.measure.svg.logicalBox);
  }
  addKeyToMap(selectionKey: number, selection: SmoSelection) {
    if (!this.systemMap.has(selectionKey)) {
      const nmeasure = new MappedMeasures();
      this.systemMap.set(selectionKey, nmeasure);
    }
    this.systemMap.get(selectionKey)?.addArtifact(selection);
  }
  findValueInMap(value: MappedMeasures, box: SvgBox) {
    let rv: SmoSelection[] = [];
    if (SvgHelpers.doesBox1ContainBox2(value.box, box)) {
      rv = rv.concat(value.findArtifact(box));
    }
    return rv;
  } 
  clearMeasure(selection: SmoSelection) {
    if (this.systemMap.has(selection.measure.svg.lineIndex)) {
      const mmap = this.systemMap.get(selection.measure.svg.lineIndex);
      if (mmap) {
        this.systemMap.delete(selection.measure.svg.lineIndex);
      }
    }
  }
}
export function getDiv(dim: number, box: SvgBox, divSize: number, layoutSource: layoutProvider): number {
  return Math.round((dim - layoutSource.getFlowDimension(box)) / divSize);
}

/**
 * Each page is a different SVG element, with its own offset within the DOM. This
 * makes partial updates faster.  SvgPage keeps track of all musical elements in SelectionMaps.
 * staff and score modifiers are kept in seperate lists since they may span multiple
 * musical elements (e.g. slurs, text elements).
 * @category SuiRender
 */
export class SvgPage {
  _renderer: Renderer;
  layoutSource: layoutProvider;
  pageNumber: number;
  box: SvgBox;
  systemMap: MappedSystems = new MappedSystems();
  modifierYKeys: number[] = [];
  modifierTabDivs: Record<number, ModifierTab[]> = {};
  static get defaultMap() {
    return {
      box: SvgBox.default,
      systemMap: new Map()
    };
  }
  /**
   * Modifiers are divided into `modifierDivs` vertical 
   * rectangles for event lookup.
   */
  static get modifierDivs() {
    return 8;
  }
  /**
   * This is the VextFlow renderer context (SVGContext)
   * @returns 
   */
  getContext(): SVGContext {
    return this._renderer.getContext() as SVGContext;
  }
  get divSize(): number {
    return this.layoutSource.getFlowDimension(this.box) / SvgPage.modifierDivs;
  }
  constructor(renderer: Renderer, layoutSource: layoutProvider, pageNumber: number, box: SvgBox) {
    this._renderer = renderer;
    this.layoutSource = layoutSource;
    this.pageNumber = pageNumber;
    this.box = box;
    let divEnd = this.divSize;
    for (let i = 0; i < SvgPage.modifierDivs; ++i) {
      this.modifierYKeys.push(divEnd);
      divEnd += this.divSize;
    }
  }
  /**
   * Given SVG y, return the div for modifiers
   * @param y 
   * @returns 
   */
  divIndex(dim: number): number {
    return Math.round((dim - this.layoutSource.getFlowDimension(this.box)) / this.divSize);
  }
  /**
   * Remove all elements and modifiers in this page, for a redraw.
   */
  clearMap() {
    this.systemMap = new MappedSystems();
    this.modifierTabDivs = {};
  }
  /**
   * Clear mapped objects associated with a measure, including any
   * modifiers that span that measure.
   * @param selection 
   */
  clearMeasure(selection: SmoSelection) {    
    this.systemMap.clearMeasure(selection);
    const div = this.divIndex(this.layoutSource.getFlowDimension(selection.measure.svg.logicalBox));
    if (div < this.modifierYKeys.length) {
      const mods: ModifierTab[] = [];
      this.modifierTabDivs[div].forEach((mt: ModifierTab) => {
        if (mt.selection) {
          if (!SmoSelector.sameMeasure(mt.selection.selector, selection.selector)) {
            mods.push(mt);
          }
        } else {
          mods.push(mt);
        }
      });
      this.modifierTabDivs[div] = mods;
    }
  }
  /**
   * add a modifier to the page, indexed by its rectangle
   * @param modifier 
   */
  addModifierTab(modifier: ModifierTab) {
    const div = this.divIndex(modifier.box.y);
    if (div < this.modifierYKeys.length) {
      if (!this.modifierTabDivs[div]) {
        this.modifierTabDivs[div] = [];
      }
      this.modifierTabDivs[div].push(modifier);
    }
  }
  /**
   * Add a new selection to the page
   * @param selection 
   */
  addArtifact(selection: SmoSelection) {     
    this.systemMap.addArtifact(selection);
  }
  /**
   * Try to find a selection on this page, based on the mouse event
   * @param box 
   * @returns 
   */
  findArtifact(box: SvgBox): SmoSelection[] {
    return this.systemMap.findArtifact(box);
  }
  /**
   * Try to find a modifier on this page, based on the mouse event
   * @param box 
   * @returns 
   */
  findModifierTabs(box: SvgBox): ModifierTab[] {
    const rv:ModifierTab[] = [];
    const div = this.divIndex(this.layoutSource.getFlowDimension(box));
    if (div < this.modifierYKeys.length) {
      if (this.modifierTabDivs[div]) {
        this.modifierTabDivs[div].forEach((modTab) => {
          if (SvgHelpers.doesBox1ContainBox2(modTab.box, box)) {
            rv.push(modTab);
          }
        });
      }
    }
    return rv;
  }
  clearModifiers() {      
    Object.keys(this.modifierTabDivs).forEach((key) => {
      const modifiers = this.modifierTabDivs[parseInt(key)];
      modifiers.forEach((mod) => {
        if (mod instanceof SmoTextGroup) {
          (mod as SmoTextGroup).elements.forEach((element) => {
            RemoveElementLike(element);
          });
          (mod as SmoTextGroup).elements = [];
        }
      });
    });
    this.modifierTabDivs = {};
  }
  /**
   * Measure the bounding box of an element.  Return the box as if the top of the first page were 0,0.
   * Bounding boxes are stored in absolute coordinates from the top of the first page.  When rendering
   * elements, we adjust the coordinates for hte local page.
   * @param element 
   * @returns 
   */
  offsetBbox(element: ElementLike): SvgBox {
    if (element === null) {
      throw('invalidBBox in offsetBbox');
    }
    const yoff = this.box.y;
    const xoff = this.box.x;
    const lbox = element.getBBox();
    return ({ x: lbox.x + xoff, y: lbox.y + yoff, width: lbox.width, height: lbox.height });
  }
  /**
   * Adjust the bounding box to local coordinates for this page.
   * @param box 
   * @returns 
   */
  offsetSvgBox(box: SvgBox) {
    return { x: box.x - this.box.x, y: box.y - this.box.y, width: box.width, height: box.height };
  }
  /**
   * Adjust the point to local coordinates for this page.
   * @param box 
   * @returns 
   */
   offsetSvgPoint(box: SvgPoint) {
    return { x: box.x - this.box.x, y: box.y - this.box.y };
  }
  get svg(): SVGSVGElement {
    return this.getContext().svg as SVGSVGElement;
  }
}
/**
 * A container for all the SVG elements, and methods to manage adding and finding elements.  Each
 * page of the score has its own SVG element.
 * @category SuiRender
 */
export class SvgPageMap {
    _layout: SmoGlobalLayout;
    _container: HTMLElement;
    _pageLayouts: SmoPageLayout[];
    vfRenderers: SvgPage[] = [];
    static get strokes(): Record<string, StrokeInfo> {
      return {
        'debug-mouse-box': {
          strokeName: 'debug-mouse',
          stroke: '#7ce',
          strokeWidth: 3,
          strokeDasharray: '1,1',
          fill: 'none',
          opacity: 0.6
        }
      };
    }
    containerOffset: SvgPoint = SvgPoint.default;
    getLayout(): SmoGlobalLayout {
      return this._layout;
    }
    isLayoutHorizontal(): boolean {
      return isHorizontalLayout(this._layout);
    }
    getFlowDimension(box: SvgBox | SvgPoint): number{ 
      if (this.isLayoutHorizontal()) {
        return box.x;
      }
      return box.y;
    }
    /**
     * 
     * @param layout - defines the page width/height and relative zoom common to all the pages
     * @param container - the parent DOM element that contains all the pages
     * @param pages - the layouts (margins, etc) for each pages.
     */
    constructor(layout: SmoGlobalLayout, container: HTMLElement, pages: SmoPageLayout[]) {
        this._layout = layout;
        this._container = container;
        this._pageLayouts = pages;
    }
    get container() {
        return this._container;
    }
    /**
     * Update the offset of the music container DOM element, in client coordinates. This is used
     * when converting absolute screen coordinates (like from a mouse event) to SVG coordinates
     * @param scrollPoint 
     */
    updateContainerOffset(scrollPoint: SvgPoint) {
      const rect = SvgHelpers.smoBox(this.container.getBoundingClientRect());
      this.containerOffset = { x: rect.x + scrollPoint.x, y: rect.y + scrollPoint.y };
    }
    get layout() {
      return this._layout;
    }
    get pageLayouts() {
      return this._pageLayouts;
    }
    get zoomScale() {
      return this.layout.zoomScale;
    }
    get renderScale() {
      return this.layout.svgScale;
    }
    get pageDivHeight() {
      return this.layout.pageHeight * this.zoomScale;
    }
    get pageDivWidth() {
      return this.layout.pageWidth * this.zoomScale;
    }
    get pageHeight() {
      return this.layout.pageHeight / this.layout.svgScale;
    }
    get pageWidth() {
      return this.layout.pageWidth / this.layout.svgScale;
    }
    get totalHeight() {
      return this.pageDivHeight * this.pageLayouts.length;
    }
    get totalWidth() {
      return this.pageDivWidth * this.pageLayouts.length;
    }
    /**
     * create/re-create all the page SVG elements
     */
    createRenderers() {
      // $(this.container).html('');
      if (this.isLayoutHorizontal()) {
        $(this.container).css('width', '' + Math.round(this.totalWidth) + 'px');
        $(this.container).css('height', '' + Math.round(this.pageDivHeight) + 'px');
      } else {
        $(this.container).css('width', '' + Math.round(this.pageDivWidth) + 'px');
        $(this.container).css('height', '' + Math.round(this.totalHeight) + 'px');
      }
      const toRemove: HTMLElement[] = [];
      this.vfRenderers.forEach((renderer) => {
          const container = (renderer.svg as SVGSVGElement).parentElement;
          if (container) {
            toRemove.push(container);
          }
      });
      toRemove.forEach((tt) => {
        tt.remove();
      });
      this.vfRenderers = [];
      this.pageLayouts.forEach(() => {
          this.addPage();
      });
    }
    topY(ix: number): number {
      const dim = this.isLayoutHorizontal() ? 0 : this.pageHeight;
      return dim * ix;
    }
    topX(ix: number): number {
      const dim = this.isLayoutHorizontal() ? this.pageWidth : 0;
      return dim * ix;
    }
    addPage() {
      const ix = this.vfRenderers.length;
      const container = document.createElement('div');
      container.setAttribute('id', 'smoosic-svg-div-' + ix.toString());
      this._container.append(container);
      const vexRenderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
      const svg = (vexRenderer.getContext() as any).svg as SVGSVGElement;
      SvgHelpers.svgViewport(svg, 0, 0, this.pageDivWidth, this.pageDivHeight, this.renderScale * this.zoomScale);
      const topY = this.topY(ix);
      const topX = this.topX(ix);
      const box = SvgHelpers.boxPoints(topX, topY, this.pageWidth, this.pageHeight);
      const page = new SvgPage(vexRenderer, this, ix, box);
      this.vfRenderers.push(page);
      if (layoutDebug.mask & layoutDebug.values.page) {
        const dbgBox = JSON.parse(JSON.stringify(box));
        const dims = this.pageLayouts[ix];
        dbgBox.x += dims.leftMargin;
        dbgBox.width -= (dims.leftMargin + dims.rightMargin);
        dbgBox.y += dims.topMargin - topY;
        dbgBox.height -= (dims.topMargin + dims.bottomMargin);
        SvgHelpers.debugBox(page.svg, dbgBox, layoutDebug.classes[layoutDebug.values.page], 0);
      }      
    }
    updateZoom(zoomScale: number) {
      this.layout.zoomScale = zoomScale;
      this.vfRenderers.forEach((pp) => {
        SvgHelpers.svgViewport(pp.svg, 0, 0, this.pageDivWidth, this.pageDivHeight, this.renderScale * this.zoomScale);
      });
      $(this.container).css('width', '' + Math.round(this.pageDivWidth) + 'px');
      $(this.container).css('height', '' + Math.round(this.totalHeight) + 'px');
    }

    /**
     * Convert from screen/client event to SVG space.  We assume the scroll offset is already added to `box`
     * @param box 
     * @returns 
     */
    clientToSvg(box: SvgBox) {
      const cof = (this.zoomScale * this.renderScale);
      const x = (box.x - this.containerOffset.x) / cof;
      const y = (box.y - this.containerOffset.y) / cof;
      const logicalBox = SvgHelpers.boxPoints(x, y, Math.max(box.width / cof, 1), Math.max(box.height / cof, 1));
      if (layoutDebug.mask | layoutDebug.values['mouseDebug']) {
        layoutDebug.updateMouseDebug(box, logicalBox, this.containerOffset);
      }
      return logicalBox;
    }
    /**
     * Convert from SVG bounding box to screen coordinates
     * @param box 
     * @returns 
     */
    svgToClient(box: SvgBox) {
      const cof = (this.zoomScale * this.renderScale);
      const x = (box.x * cof) + this.containerOffset.x;
      const y = (box.y * cof) + this.containerOffset.y;
      const clientBox = SvgHelpers.boxPoints(x, y, box.width * cof, box.height * cof);
      return clientBox;
    }
    /**
     * Convert from SVG bounding box to screen coordinates
     * @param box 
     * @returns 
    */
    svgToClientNoOffset(box: SvgBox) {
      const cof = (this.zoomScale * this.renderScale);
      const x = (box.x * cof);
      const y = (box.y * cof);
      const clientBox = SvgHelpers.boxPoints(x, y, box.width * cof, box.height * cof);
      return clientBox;
    }

    /**
     * Find a selection from a mouse event
     * @param box - location of a mouse event or specific screen coordinates
     * @returns 
     */
    findArtifact(logicalBox: SvgBox): { selections: SmoSelection[], page: SvgPage} {
      const selections: SmoSelection[] = [];
      const page = this.getRenderer(logicalBox);
      if (page) {
        return { selections: page.findArtifact(logicalBox), page };
      }
      return { selections, page: this.vfRenderers[0] };
    }
    /**
     * Find any modifiers intersecting with `box`
     * @param box 
     * @returns 
     */
    findModifierTabs(logicalBox: SvgBox): ModifierTab[] {
      const page = this.getRenderer(logicalBox);
      if (page) {
        return page.findModifierTabs(logicalBox);
      }
      return [];
    }
    /**
     * add a rendered page to the page map
     * @param selection 
     * @returns 
     */
    addArtifact(selection: SmoSelection) {
      if (!selection.note || !selection.note.logicalBox) {
        return;
      }
      const page = this.getRenderer(selection.note.logicalBox);
      if (page) {
        page.addArtifact(selection);
      }
    }
    /**
     * add a rendered modifier to the page map
     * @param modifier 
     */
    addModifierTab(modifier: ModifierTab) {
      const page = this.getRenderer(modifier.box);
      if (page) {
        page.addModifierTab(modifier);
      }
    }
    clearModifiersForPage(page: number) {
      if (this.vfRenderers.length > page) {
        this.vfRenderers[page].clearModifiers();
      }
    }
    /**
     * The number of pages is changing, remove the last page
     * @returns 
     */
    removePage() {
        let i = 0;
        // Don't remove the only page
        if (this.vfRenderers.length < 2) {
            return;
        }

        // Remove last page div
        const elementId = 'smoosic-svg-div-' + (this.vfRenderers.length - 1).toString();
        const container = document.getElementById(elementId);
        if (container) {
            container.remove();
        }
        // pop last renderer off the stack.
        const renderers: SvgPage[] = [];
        const layouts: SmoPageLayout[] = [];
        for (i = 0; i < this.vfRenderers.length - 1; ++i) {
            renderers.push(this.vfRenderers[i]);
            layouts.push(this.pageLayouts[i]);
        }
        this.vfRenderers = renderers;
        this._pageLayouts = layouts;

        // update page height
        const totalHeight = this.isLayoutHorizontal() ? this.pageDivHeight : this.pageDivHeight *  this.pageLayouts.length;
        const totalWidth = this.isLayoutHorizontal() ? this.pageDivWidth *  this.pageLayouts.length : this.pageDivWidth;
        $(this.container).css('width', '' + Math.round(totalWidth) + 'px');
        $(this.container).css('height', '' + Math.round(totalHeight) + 'px');
    }
    /**
     * The score dimensions have changed, clear maps and recreate the pages.
     * @param layout 
     * @param pageLayouts 
     */
    updateLayout(layout: SmoGlobalLayout, pageLayouts: SmoPageLayout[]) {
        this._layout = layout;
        this._pageLayouts = pageLayouts;
        this.createRenderers();
    }
    /**
     * Return the page by index
     * @param page 
     * @returns 
     */
    getRendererForPage(page: number) {
        if (this.vfRenderers.length > page) {
            return this.vfRenderers[page];
        }
        return this.vfRenderers[this.vfRenderers.length - 1];
    }
    /**
     * Return the SvgPage based on SVG point (conversion from client coordinates already done)
     * @param point 
     * @returns 
     */
    getRendererFromPoint(point: SvgPoint): SvgPage | null {
      const pointDim = this.getFlowDimension(point);
      const pageDim = this.isLayoutHorizontal() ? this.pageWidth : this.pageHeight;
      const ix = Math.floor(pointDim / (pageDim / this.layout.svgScale));
      if (ix < this.vfRenderers.length) {
          return this.vfRenderers[ix];
      }
      return null;
    }
    /**
     * Return the SvgPage based on SVG point (conversion from client coordinates already done)
     * @param box 
     * @returns 
     */
    getRenderer(box: SvgBox | SvgPoint): SvgPage {
        const rv =  this.getRendererFromPoint({ x: box.x, y: box.y });
        if (rv) {
            return rv;
        }
        return this.vfRenderers[0];
    }
    /**
     * Return the page based on the coordinates of a modifier
     * @param modifier 
     * @returns 
     */
    getRendererFromModifier(modifier?: Renderable) {
        let rv = this.vfRenderers[0];
        if (modifier && modifier.logicalBox) {
            const context = this.getRenderer(modifier.logicalBox);
            if (context) {
                rv = context;
            }
        }
        return rv;
    }
}
