// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SvgHelpers } from './svgHelpers';
import { SvgBox, SvgPoint } from '../../smo/data/common';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoSelector } from '../../smo/xform/selections';
import  {SuiNavigation } from './configuration';

declare var $: any;

/**
 * SuiRender
 * @internal
 */
export interface CodeRegion {
  time: number,
  percent: number
}
/**
 * @category SuiRender
 */
export class layoutDebug {
  static get values(): Record<string, number> {
    return {
      pre: 1,
      play: 2,
      adjust: 4,
      system: 8,
      scroll: 16,
      artifactMap: 32,
      mouseDebug: 64,
      dragDebug: 128,
      dialogEvents: 256,
      cursor: 512,
      text: 1024,
      page: 2048,
      oscillators: 4096,
    };
  }

  static get classes(): Record<number, string> {
    return {
      1: 'measure-place-dbg',
      2: 'measure-play-dbg',
      4: 'measure-adjust-dbg',
      8: 'system-place-dbg',
      16: 'scroll-box-debug',
      32: 'measure-adjustHeight-dbg',
      64: 'mouse-debug',
      128: 'drag-debug',
      256: 'dialog-events',
      512: 'cursor-adj-dbg',
      1024: 'text-debug',
      2048: 'page-debug',
      4096: 'oscillators-debug'
    };
  }
  // for profiling render performance
  static get codeRegions(): Record<string, number> {
    return {
      COMPUTE: 0,
      PREFORMATA: 1,
      PREFORMATB: 2,
      PREFORMATC: 3,
      FORMAT: 4,
      RENDER: 5,
      UPDATE_MAP: 6,
      POST_RENDER: 7,
      MAP: 8,
      LAST: 8
    };
  }
  testThrow: boolean = false;
  static get codeRegionStrings(): string[] {
    return ['COMPUTE', 'PREFORMATA', 'PREFORMATB', 'PREFORMATC', 'FORMAT', 'RENDER', 'UPDATE_MAP', 'POST_RENDER', 'MAP'];
  }
  mask: number = 0;
  _textDebug: number[] = [];
  timestampHash: Record<number, number> = {};
  _dialogEvents: string[] = [];
  navigation: SuiNavigation;
  constructor(navigation:SuiNavigation) {
    this.navigation = navigation;
  }
  clearTimestamps() {
    for (var i = 0; i <= layoutDebug.codeRegions.LAST; ++i) {
      this.timestampHash[i] = 0;
    }
  }

  setTimestamp(region: number, millis: number) {
    this.timestampHash[region] += millis;
  }
  printTimeReport() {
    let total = 0;
    let report: Record<string, CodeRegion> = {};
    let i = 0;
    for (i = 0; i <= layoutDebug.codeRegions.LAST; ++i) {
      total += this.timestampHash[i];
      report[layoutDebug.codeRegionStrings[i]] = {
        time: this.timestampHash[i], percent: 0
      };
    }
    report['total'] = { time: total, percent: 100 };
    for (i = 0; i <= layoutDebug.codeRegions.LAST; ++i) {
      report[layoutDebug.codeRegionStrings[i]].percent =
        Math.round((report[layoutDebug.codeRegionStrings[i]].time * 100) / report.total.time);
    }
    console.log(JSON.stringify(report, null, ' '));
  }

  flagSet(value: number) {
    return this.mask & value;
  }

  clearAll() {
    this.mask = 0;
    this.setFlagDivs();
  }
  setAll() {
    this.mask = 1 + 2 + 4 + 8 + 16 + 32 + 64 + 128 + 256 + 1024 + 2048;
  }
  setRenderFlags() {
    this.mask = 1 + 2 + 4 + 8 + 16 + 32 + 1024 + 2048;
  }
  clearDebugBoxes(value: number) {
    if (this.flagSet(value)) {
      var selector = 'g.' + layoutDebug.classes[value];
      $(selector).remove();
    }
  }
  debugBox(svg: SVGSVGElement, box: SvgBox | null, flag: number) {
    if (!box) {
      return;
    }
    if (!box.height) {
      box.height = 1;
    }
    if (this.flagSet(flag)) {
      SvgHelpers.debugBox(svg, box, layoutDebug.classes[flag], 0);
    }
  }

  setFlag(value: number) {
    var flag = layoutDebug.values[value];
    if (typeof (this.mask) == 'undefined') {
      this.mask = flag;
      return;
    }
    this.mask |= flag;
    this.setFlagDivs();
  }
  setFlagDivs() {
    if (!this.flagSet(layoutDebug.values.scroll)) {
      this.navigation.showDebugString('scroll', '');
    }
    if (!this.flagSet(layoutDebug.values.mouseDebug)) {
      this.navigation.showDebugString('mouse', '');
    }
    if (!this.flagSet(layoutDebug.values.dragDebug)) {
      this.navigation.showDebugString('drag', '');
    }
    $('.play-debug').remove();
    if (this.mask & layoutDebug.values.scroll) {
      const dbgDiv = $('<div class="scroll-box-debug"/>');
      $('body').append(dbgDiv);  
    }
    if (this.mask & layoutDebug.values.mouseDebug) {
      const dbgDiv = $('<div class="mouse-debug"/>');
      $('body').append(dbgDiv);  
    }
    if (this.mask & layoutDebug.values.dragDebug) {
      const dbgDiv = $('<div class="drag-debug"/>');
      $('body').append(dbgDiv);  
    }
    if (this.mask & layoutDebug.values.play) {
      const dbgDiv = $('<div class="play-debug"/>');
      $('body').append(dbgDiv);  
    }
  }
  updateScrollDebug(point: SvgPoint) {
    const displayString = 'X: ' + point.x + ' Y: ' + point.y;
    this.navigation.showDebugString('scroll', displayString);
  }
  updateMouseDebug(client: SvgPoint, logical: SvgPoint, offset: SvgPoint) {
    const displayString = `clientX: ${client.x} clientY: ${client.y} svg: (${logical.x},${logical.y}) offset (${offset.x}, ${offset.y})`;
    this.navigation.showDebugString('mouse', displayString);
  }
  updateDragDebug(client: SvgPoint, logical: SvgPoint, state: string) {
    const displayString = `clientX: ${client.x} clientY: ${client.y} svg: (${logical.x},${logical.y}) state ${state})`;
    this.navigation.showDebugString('drag', displayString);
  }
  updatePlayDebug(selector: SmoSelector, logical: SvgBox) {
    const displayString = `mm: ${selector.measure} tick: ${selector.tick} svg: (${logical.x},${logical.y}, ${logical.width}, ${logical.height})`;
    $('.play-debug').text(displayString);
    $('.play-debug').css('left', '2%').css('top', '100px').css('position','absolute').css('font-size','11px');
  }

  addTextDebug(value: number) {
    this._textDebug.push(value);
    //console.log(value);
  }

  addDialogDebug(value: string) {
    this._dialogEvents.push(value);
    // console.log(value);
  }

  measureHistory(measure: SmoMeasure, oldVal: string, newVal: any, description: string) {
    if (this.flagSet(layoutDebug.values.measureHistory)) {
      var oldExp = (typeof ((measure as any).svg[oldVal]) == 'object') ?
        JSON.stringify((measure as any).svg[oldVal]).replace(/"/g, '') : (measure as any).svg[oldVal];
      var newExp = (typeof (newVal) == 'object') ? JSON.stringify(newVal).replace(/"/g, '') : newVal;
      measure.svg.history.push(oldVal + ': ' + oldExp + '=> ' + newExp + ' ' + description);
    }
  }
}
