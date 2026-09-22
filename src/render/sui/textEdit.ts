// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiInlineText, SuiTextBlock } from './textRender';
import { SuiRenderState } from './renderState';
import { SuiScroller } from './scroller';
import { layoutDebug } from './layoutDebug';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { OutlineInfo, SuiTextStrokes, SvgHelpers, SuiTextStrokeName } from './svgHelpers';
import { SmoScoreText, SmoTextGroup } from '../../smo/data/scoreText';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SmoSelector } from '../../smo/xform/selections';
import { SvgBox, KeyEvent, RemoveElementLike, ElementLike } from '../../smo/data/common';
import { SmoNote } from '../../smo/data/note';
import { SmoScore } from '../../smo/data/score';
import { SmoSelection } from '../../smo/xform/selections';
import { SvgPage } from './svgPageMap';
import { SuiScoreViewOperations } from './scoreViewOperations';
import { SvgPageMap } from './svgPageMap';
import { VexFlow, getChordSymbolGlyphFromCode } from '../../common/vex';

const VF = VexFlow;
declare var $: any;

export interface SuiDragSessionParams {
  context: SvgPageMap;
  scroller: SuiScroller;
  textGroup: SmoTextGroup;
  debug: layoutDebug;
}
/**
 * @category SuiRender
 */
export class SuiDragSession {
  pageMap: SvgPageMap;
  page: SvgPage;
  scroller: SuiScroller;
  outlineBox: SvgBox;
  textObject: SuiTextBlock;
  dragging: boolean = false;
  outlineRect: OutlineInfo | null = null;
  textGroup: SmoTextGroup;
  debug: layoutDebug;
  constructor(params: SuiDragSessionParams) {
    this.textGroup = params.textGroup;
    this.pageMap = params.context;
    this.scroller = params.scroller;
    this.debug = params.debug;
    this.page = this.pageMap.getRendererFromModifier(this.textGroup);
    // create a temporary text object for dragging
    this.textObject = SuiTextBlock.fromTextGroup(this.textGroup, this.page, this.pageMap, this.scroller); // SuiTextBlock
    this.dragging = false;
    this.outlineBox = this.textObject.getLogicalBox();
  }

  _outlineBox() {
    const outlineStroke = SuiTextStrokes['text-drag'];
    const x = this.outlineBox.x - this.page.box.x;
    const y = this.outlineBox.y - this.page.box.y;
    if (!this.outlineRect) {
      this.outlineRect = {
        context: this.page, 
        box: SvgHelpers.boxPoints(x , y + this.outlineBox.height, this.outlineBox.width, this.outlineBox.height),
        classes: 'text-drag',
        stroke: outlineStroke, scroll: this.scroller.scrollState, timeOff: 1000
      };
    }
    this.outlineRect.box = SvgHelpers.boxPoints(x , y + this.outlineBox.height, this.outlineBox.width, this.outlineBox.height),
    SvgHelpers.outlineRect(this.outlineRect);
  }
  unrender() {
    this.textGroup.elements.forEach((el: ElementLike) => {
      RemoveElementLike(el);
    });
    this.textGroup.elements = [];
    this.textObject.unrender();
  }
  scrolledClientBox(x: number, y: number) {
    return { x: x + this.scroller.scrollState.x, y: y + this.scroller.scrollState.y, width: 1, height: 1 };
  }
  checkBounds() {
    if (this.outlineBox.y < this.outlineBox.height) {
      this.outlineBox.y = this.outlineBox.height;
    }
    if (this.outlineBox.x < 0) {
      this.outlineBox.x = 0;
    }
    if (this.outlineBox.x > this.page.box.x + this.page.box.width - this.outlineBox.width) {
      this.outlineBox.x = this.page.box.x + this.page.box.width - this.outlineBox.width;
    }
    if (this.outlineBox.y > this.page.box.y + this.page.box.height) {
      this.outlineBox.y = this.page.box.y + this.page.box.height;
    }
  }
  startDrag(e: any) {
    const evBox = this.scrolledClientBox(e.clientX, e.clientY);
    const svgMouseBox = this.pageMap.clientToSvg(evBox);
    svgMouseBox.y -= this.outlineBox.height;
    if (this.debug.mask & layoutDebug.values['dragDebug']) {
      this.debug.updateDragDebug(svgMouseBox, this.outlineBox, 'start');
    }
    if (!SvgHelpers.doesBox1ContainBox2(this.outlineBox, svgMouseBox)) {
      return;
    }
    this.dragging = true;
    this.outlineBox = svgMouseBox;
    const currentBox = this.textObject.getLogicalBox();
    this.outlineBox.width = currentBox.width;
    this.outlineBox.height = currentBox.height;
    this.unrender();
    this.checkBounds();
    this._outlineBox();
  }

  mouseMove(e: any) {
    if (!this.dragging) {
      return;
    }
    const evBox = this.scrolledClientBox(e.clientX, e.clientY);
    const svgMouseBox = this.pageMap.clientToSvg(evBox);
    svgMouseBox.y -= this.outlineBox.height;
    this.outlineBox = SvgHelpers.smoBox(svgMouseBox);
    const currentBox = this.textObject.getLogicalBox();
    this.outlineBox.width = currentBox.width;
    this.outlineBox.height = currentBox.height;
    this.checkBounds();

    this.textObject.offsetStartX(this.outlineBox.x - currentBox.x);
    this.textObject.offsetStartY(this.outlineBox.y - currentBox.y);
    this.textObject.render();
    if (this.debug.mask & layoutDebug.values['dragDebug']) {
      this.debug.updateDragDebug(svgMouseBox, this.outlineBox, 'drag');
    }
    if (this.outlineRect) {
      SvgHelpers.eraseOutline(this.outlineRect);
      this.outlineRect = null;
    }
    this._outlineBox();
  }

  endDrag() {
    // this.textObject.render();
    const newBox = this.textObject.getLogicalBox();
    const curBox = this.textGroup.logicalBox ?? SvgBox.default;
    if (this.debug.mask & layoutDebug.values['dragDebug']) {
      this.debug.updateDragDebug(curBox, newBox, 'end');
    }
    this.textGroup.offsetX(newBox.x - curBox.x);
    this.textGroup.offsetY(newBox.y - curBox.y + this.outlineBox.height);
    this.dragging = false;
    if (this.outlineRect) {
      SvgHelpers.eraseOutline(this.outlineRect);
      this.outlineRect = null;
    }
  }
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
export class SuiAnnotationDragSession {
  pageMap: SvgPageMap;
  page: SvgPage;
  scroller: SuiScroller;
  annotation: SmoLyric;
  debug: layoutDebug;
  dragging: boolean = false;
  originBox: SvgBox;
  startTranslateX: number = 0;
  startTranslateY: number = 0;
  startMouse: { x: number, y: number } = { x: 0, y: 0 };
  currentDx: number = 0;
  currentDy: number = 0;
  outlineRect: OutlineInfo | null = null;
  constructor(params: SuiAnnotationDragSessionParams) {
    this.annotation = params.annotation;
    this.pageMap = params.context;
    this.scroller = params.scroller;
    this.debug = params.debug;
    this.page = this.pageMap.getRendererFromModifier(this.annotation);
    this.originBox = SvgHelpers.smoBox(this.annotation.logicalBox ?? SvgBox.default);
  }
  scrolledClientBox(x: number, y: number) {
    return { x: x + this.scroller.scrollState.x, y: y + this.scroller.scrollState.y, width: 1, height: 1 };
  }
  _outlineBox(box: SvgBox) {
    const outlineStroke = SuiTextStrokes['text-drag'];
    const x = box.x - this.page.box.x;
    const y = box.y - this.page.box.y;
    if (!this.outlineRect) {
      this.outlineRect = {
        context: this.page,
        box: SvgHelpers.boxPoints(x, y, box.width, box.height),
        classes: 'text-drag',
        stroke: outlineStroke, scroll: this.scroller.scrollState, timeOff: 1000
      };
    }
    this.outlineRect.box = SvgHelpers.boxPoints(x, y, box.width, box.height);
    SvgHelpers.outlineRect(this.outlineRect);
  }
  _eraseOutline() {
    if (this.outlineRect) {
      SvgHelpers.eraseOutline(this.outlineRect);
      this.outlineRect = null;
    }
  }
  // Clamp a candidate (dx, dy) so the annotation's origin box, shifted by it, stays within the page.
  _clampedDelta(dx: number, dy: number): { dx: number, dy: number } {
    const pageBox = this.page.box;
    let x = this.originBox.x + dx;
    let y = this.originBox.y + dy;
    x = Math.max(pageBox.x, Math.min(x, pageBox.x + pageBox.width - this.originBox.width));
    y = Math.max(pageBox.y, Math.min(y, pageBox.y + pageBox.height - this.originBox.height));
    return { dx: x - this.originBox.x, dy: y - this.originBox.y };
  }
  startDrag(e: any) {
    const evBox = this.scrolledClientBox(e.clientX, e.clientY);
    const svgMouseBox = this.pageMap.clientToSvg(evBox);
    if (this.debug.mask & layoutDebug.values['dragDebug']) {
      this.debug.updateDragDebug(svgMouseBox, this.originBox, 'start');
    }
    if (!SvgHelpers.doesBox1ContainBox2(this.originBox, svgMouseBox)) {
      return;
    }
    this.dragging = true;
    this.startMouse = { x: svgMouseBox.x, y: svgMouseBox.y };
    this.startTranslateX = this.annotation.translateX;
    this.startTranslateY = this.annotation.translateY;
    this.currentDx = 0;
    this.currentDy = 0;
    this._outlineBox(this.originBox);
  }
  mouseMove(e: any) {
    if (!this.dragging) {
      return;
    }
    const evBox = this.scrolledClientBox(e.clientX, e.clientY);
    const svgMouseBox = this.pageMap.clientToSvg(evBox);
    const rawDx = svgMouseBox.x - this.startMouse.x;
    const rawDy = svgMouseBox.y - this.startMouse.y;
    const { dx, dy } = this._clampedDelta(rawDx, rawDy);
    this.currentDx = dx;
    this.currentDy = dy;
    const dom = this.page.svg.getElementById('vf-' + this.annotation.attrs.id);
    if (dom) {
      const liveX = this.startTranslateX + dx;
      const liveY = this.startTranslateY - dy;
      dom.setAttributeNS('', 'transform', 'translate(' + liveX + ' ' + (-1 * liveY) + ')');
    }
    const newBox = SvgHelpers.boxPoints(this.originBox.x + dx, this.originBox.y + dy, this.originBox.width, this.originBox.height);
    this._eraseOutline();
    this._outlineBox(newBox);
    if (this.debug.mask & layoutDebug.values['dragDebug']) {
      this.debug.updateDragDebug(svgMouseBox, newBox, 'drag');
    }
  }
  endDrag() {
    if (!this.dragging) {
      return;
    }
    this.annotation.translateX = this.startTranslateX + this.currentDx;
    this.annotation.translateY = this.startTranslateY - this.currentDy;
    this.dragging = false;
    if (this.debug.mask & layoutDebug.values['dragDebug']) {
      const newBox = SvgHelpers.boxPoints(this.originBox.x + this.currentDx, this.originBox.y + this.currentDy,
        this.originBox.width, this.originBox.height);
      this.debug.updateDragDebug(this.originBox, newBox, 'end');
    }
    this._eraseOutline();
  }
  unrender() {
    if (this.dragging) {
      this.endDrag();
    }
    this._eraseOutline();
  }
}

