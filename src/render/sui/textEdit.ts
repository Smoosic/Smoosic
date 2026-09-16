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

