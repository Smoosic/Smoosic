// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Utilities for formatting the music by estimating the geometry of the music.
 * @module /render/sui/formatter
 */
import { SvgHelpers } from './svgHelpers';
import { SmoMusic } from '../../smo/data/music';
import { vexGlyph } from '../vex/glyphDimensions';
import { SmoDynamicText, SmoLyric, SmoArticulation, SmoOrnament } from '../../smo/data/noteModifiers';
import { SmoNote } from '../../smo/data/note';
import { SmoBeamer } from '../../smo/xform/beamers';
import { SmoSelector } from '../../smo/xform/selections';
import { SmoScore } from '../../smo/data/score';
import { SmoStaffHairpin, SmoStaffTextBracket, SmoTabStave } from '../../smo/data/staffModifiers';
import { layoutDebug } from './layoutDebug';
import { ScaledPageLayout, SmoLayoutManager, SmoPageLayout } from '../../smo/data/scoreModifiers';
import { SmoMeasure, ISmoBeamGroup } from '../../smo/data/measure';
import { TimeSignature, SmoTempoText } from '../../smo/data//measureModifiers';
import { SvgPageMap } from './svgPageMap';
import { VexFlow, defaultMeasurePadding } from '../../common/vex';
import { TextFormatter } from '../../common/textformatter';
const VF = VexFlow;
/**
 * @category SuiRender
 */
export interface SuiTickContext {
  widths: number[],
  tickCounts: number[]
}
/**
 * Estimated x, y position of the measure
 * @category SuiRender
 */
export interface MeasureEstimate {
  measures: SmoMeasure[], x: number, y: number
}
/**
 * @category SuiRender
 */
export interface LineRender {
  systems: Record<number, SmoMeasure[]>
}

/**
 * Keep track of start/end measures on a page.  If the page
 * content doesn't change, and the measures don't change, we don't
 * need to re-render the content
 * @category SuiRender
 */
export interface RenderedPage {
  startMeasure: number,
  endMeasure: number
}
/**
 * Utilities for estimating measure/system/page width and height
 * @category SuiRender
 */
export class SuiLayoutFormatter {
  score: SmoScore;
  systems: Record<number, LineRender> = {};
  columnMeasureMap: Record<number, SmoMeasure[]>;
  currentPage: number = 0;
  svg: SvgPageMap;
  renderedPages: Record<number,RenderedPage | null>;
  lines: number[] = [];
  constructor(score: SmoScore, svg: SvgPageMap, renderedPages: Record<number, RenderedPage | null>) {
    this.score = score;
    this.svg = svg;
    this.columnMeasureMap = {};
    this.renderedPages = renderedPages;
    this.score.staves.forEach((staff) => {
      staff.measures.forEach((measure) => {
        if (!this.columnMeasureMap[measure.measureNumber.measureIndex]) {
          this.columnMeasureMap[measure.measureNumber.measureIndex] = [];
        }
        this.columnMeasureMap[measure.measureNumber.measureIndex].push(measure);
      });
    });
  }
   
  /**
   * Once we know which line a measure is going on, make a map for it for easy
   * looking during rendering
   * @param measures 
   * @param lineIndex 
   * @param systemIndex 
   */
  updateSystemMap(measures: SmoMeasure[], lineIndex: number, systemIndex: number) {
    if (!this.systems[lineIndex]) {
      const nextLr: LineRender = {
        systems: {}
      };
      this.systems[lineIndex] = nextLr;
    }
    const systemRender = this.systems[lineIndex];
    if (!systemRender.systems[systemIndex]) {
      systemRender.systems[systemIndex] = measures;
    }
  }
  trimPages(startPageCount: number): boolean {
    let pl: SmoPageLayout[] | undefined = this.score?.layoutManager?.pageLayouts;
    if (pl) {
      if (this.currentPage < pl.length - 1) {
        this.score!.layoutManager!.trimPages(this.currentPage);
        pl = this.score?.layoutManager?.pageLayouts;
      }
      if (pl && pl.length !== startPageCount) {
        return true;
      }
    }
    return false;
  }
  /**
   * see if page breaks this boundary.  If it does, bump the current page and move the system down
   * to the new page
   * @param scoreLayout 
   * @param currentLine 
   * @param bottomMeasure 
   * @returns 
   */
  checkPageBreak(scoreLayout: ScaledPageLayout, currentLine: SmoMeasure[], bottomMeasure: SmoMeasure): ScaledPageLayout {
    let pageAdj = 0;
    const lm: SmoLayoutManager = this.score!.layoutManager!;
    // See if this measure breaks a page.
    const maxY = bottomMeasure.lowestY;
    if (maxY > ((this.currentPage + 1) * scoreLayout.pageHeight) - scoreLayout.bottomMargin) {
      this.currentPage += 1;
      // If this is a new page, make sure there is a layout for it.
      lm.addToPageLayouts(this.currentPage);
      scoreLayout = lm.getScaledPageLayout(this.currentPage);

      // When adjusting the page, make it so the top staff of the system
      // clears the bottom of the page.
      const topMeasure = currentLine.reduce((a, b) =>
        a.svg.logicalBox.y < b.svg.logicalBox.y ? a : b
      );
      const minMaxY = topMeasure.svg.logicalBox.y;
      pageAdj = (this.currentPage * scoreLayout.pageHeight) - minMaxY;
      pageAdj = pageAdj + scoreLayout.topMargin;

      // For each measure on the current line, move it down past the page break;
      currentLine.forEach((measure) => {
        measure.adjustY(pageAdj);
        measure.setY(measure.staffY + pageAdj, '_checkPageBreak');
        measure.svg.pageIndex = this.currentPage;
      });
    }
    return scoreLayout;
  }
  measureToLeft(measure: SmoMeasure) {
    const j = measure.measureNumber.staffId;
    const i = measure.measureNumber.measureIndex;
    return (i > 0 ? this.score!.staves[j].measures[i - 1] : measure);
  }
  measureAbove(measure: SmoMeasure) {
    const j = measure.measureNumber.staffId;
    const i = measure.measureNumber.measureIndex;
    return (j > 0 ? this.score!.staves[j - 1].measures[i] : measure);
  }
   // {measures,y,x}  the x and y at the left/bottom of the render
  /**
   * Estimate the dimensions of a column when it's rendered.
   * @param scoreLayout 
   * @param measureIx 
   * @param systemIndex 
   * @param lineIndex 
   * @param x 
   * @param y 
   * @returns { MeasureEstimate } - the measures in the column and the x, y location
   */
   estimateColumn(scoreLayout: ScaledPageLayout, measureIx: number, systemIndex: number, lineIndex: number, x: number, y: number): MeasureEstimate {
    const s: any = {};
    const measures = this.columnMeasureMap[measureIx];
    let rowInSystem = 0;
    let voiceCount = 0;
    let unalignedCtxCount = 0;
    let wsum = 0;
    let dsum = 0;
    let maxCfgWidth = 0;
    let isPickup = false;
    // Keep running tab of accidental widths for justification
    const contextMap: Record<number, SuiTickContext> = {};
    let measureToSkip = false;
    let maxColumnStartX = 0;
    measures.forEach((measure) => {
      // use measure to left to figure out whether I need to render key signature, etc.
      // If I am the first measure, just use self and we always render them on the first measure.
      const measureToLeft = this.measureToLeft(measure);
      const measureAbove = this.measureAbove(measure);
      s.measureKeySig = SmoMusic.vexKeySignatureTranspose(measure.keySignature, 0);
      s.keySigLast = SmoMusic.vexKeySignatureTranspose(measureToLeft.keySignature, 0);
      s.tempoLast = measureToLeft.getTempo();
      if (measure.measureNumber.staffId > 0) {
        s.tempoLast = measureAbove.getTempo();
      }
      s.timeSigLast = measureToLeft.timeSignature;
      s.clefLast = measureToLeft.getLastClef();
      this.calculateBeginningSymbols(systemIndex, measure, s.clefLast, s.keySigLast, s.timeSigLast, s.tempoLast);
      const startX = SuiLayoutFormatter.estimateStartSymbolWidth(measure);
      measure.svg.adjX = startX;
      maxColumnStartX = Math.max(maxColumnStartX, startX);
    });
    measures.forEach((measure) => {
      let tabHeight = 0;
      measure.svg.maxColumnStartX = maxColumnStartX;
      SmoBeamer.applyBeams(measure);
      voiceCount += measure.voices.length;
      if (measure.isPickup()) {
        isPickup = true;
      }
      if (measure.format.skipMeasureCount) {
        measureToSkip = true;
      }
      measure.measureNumber.systemIndex = systemIndex;
      measure.svg.rowInSystem = rowInSystem;
      measure.svg.lineIndex = lineIndex;
      measure.svg.pageIndex = this.currentPage;

      // calculate vertical offsets from the baseline
      const stave = this.score.staves[measure.measureNumber.staffId];
      const tabStave = stave.getTabStaveForMeasure({ staff: measure.measureNumber.staffId, measure: measure.measureNumber.measureIndex, 
        voice: 0, tick: 0, pitches: [] });
      const offsets = this.estimateMeasureHeight(measure);

      measure.setYTop(offsets.aboveBaseline, 'render:estimateColumn');
      measure.setY(y - measure.yTop, 'estimateColumns height');
      measure.setX(x, 'render:estimateColumn');

      // Add custom width to measure:
      measure.setBox(SvgHelpers.boxPoints(measure.staffX, y, measure.staffWidth, offsets.belowBaseline - offsets.aboveBaseline), 'render: estimateColumn');
      this.estimateMeasureWidth(measure, scoreLayout, contextMap);
      // account for the extra stave for tablature in the height, also set the dimensions of the stave tab
      if (tabStave) {
        const stemHeight = tabStave.showStems ? vexGlyph.dimensions['stem'].height : 0;
        tabHeight = stemHeight + tabStave.numLines * tabStave.spacing;
        measure.svg.tabStaveBox = { x, y: measure.svg.logicalBox.y + measure.svg.logicalBox.height,
          width: measure.svg.logicalBox.width, height: tabHeight };
        offsets.belowBaseline += measure.svg.tabStaveBox.height;
      }
      y = y + measure.svg.logicalBox.height + scoreLayout.intraGap + tabHeight;
      maxCfgWidth = Math.max(maxCfgWidth, measure.staffWidth);
      rowInSystem += 1;
    });
    // justify this column to the maximum width.
    const startX = measures[0].staffX;
    const adjX =  measures[0].svg.maxColumnStartX;
    const contexts = Object.keys(contextMap);
    const widths: number[] = [];
    const durations: number[] = [];
    let minTotalWidth = 0;
    contexts.forEach((strIx) => {
      const ix = parseInt(strIx);
      let tickWidth = 0;
      const context = contextMap[ix];
      if (context.tickCounts.length < voiceCount) {
        unalignedCtxCount += 1;
      }
      context.widths.forEach((w, ix) => {
        wsum += w;
        dsum += context.tickCounts[ix];
        widths.push(w);
        durations.push(context.tickCounts[ix]);
        tickWidth = Math.max(tickWidth, w);
      });
      minTotalWidth += tickWidth;
    });
    // Vex formatter adjusts location of ticks based to keep the justified music aligned.  It does this
    // by moving notes to the right.  We try to add padding to each tick context based on the 'entropy' of the 
    // music.   4 quarter notes with no accidentals in all voices will have 0 entropy.  All the notes need the same
    // amount of space, so they don't need additional space to align.
    // wvar - the std deviation in the widths or 'width entropy'
    // dvar - the std deviation in the duration between voices or 'duration entropy'
    const sumArray = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const wavg = wsum > 0 ? wsum / widths.length : 1 / widths.length;
    const wvar = sumArray(widths.map((ll) => Math.pow(ll - wavg, 2)));
    const wpads = Math.pow(wvar / widths.length, 0.5) / wavg;

    const davg = dsum / durations.length;
    const dvar = sumArray(durations.map((ll) => Math.pow(ll - davg, 2)));
    const dpads = Math.pow(dvar / durations.length, 0.5) / davg;
    const unalignedPadding = 2;

    const padmax = Math.max(dpads, wpads) * contexts.length * unalignedPadding;
    const unalignedPad = unalignedPadding * unalignedCtxCount;
    let maxWidth = Math.max(adjX + minTotalWidth + Math.max(unalignedPad, padmax), maxCfgWidth);
    if (scoreLayout.maxMeasureSystem > 0 && !isPickup && !measureToSkip) {
      // Add 1 because there is some overhead in each measure, 
      // so there can never be (width/max) measures in the system
      const defaultWidth = (scoreLayout.pageWidth / (scoreLayout.maxMeasureSystem + 1));
      maxWidth = Math.max(maxWidth, defaultWidth);
    }
    const maxX = startX + maxWidth;
    measures.forEach((measure) => {
      measure.setWidth(maxWidth, 'render:estimateColumn');
      // measure.svg.adjX = adjX;
    });
    const rv = { measures, y, x: maxX };
    return rv;
  }
  /**
   * return true if this is the last measure, taking into account multimeasure rest
   * @param measureIx 
   * @returns 
   */
  isLastVisibleMeasure(measureIx: number) {
    if (measureIx >= this.score.staves[0].measures.length) {
      return true;
    }
    if (this.score.staves[0].partInfo.expandMultimeasureRests) {
      return false;
    }
    let i = 0;
    for (i = measureIx; i < this.score.staves[0].measures.length; ++i) {
      const mm = this.score.staves[0].measures[i];
      if (!mm.svg.hideMultimeasure) {
        return false;
      }
    }
    return true;
  }
  /**
   * Calculate the geometry for the entire score, based on estimated measure width and height.
   * @returns 
   */
  layout() {
    let measureIx = 0;
    let systemIndex = 0;
    if (!this.score.layoutManager) {
      return;
    }
    let scoreLayout = this.score.layoutManager.getScaledPageLayout(0);
    let y = 0;
    let x = 0;
    let lineIndex = 0;
    this.lines = [];
    let pageCheck = 0;
    // let firstMeasureOnPage = 0;
    this.lines.push(lineIndex);
    let currentLine: SmoMeasure[] = []; // the system we are esimating
    let measureEstimate: MeasureEstimate | null = null;

    layoutDebug.clearDebugBoxes(layoutDebug.values.pre);
    layoutDebug.clearDebugBoxes(layoutDebug.values.system);
    const timestamp = new Date().valueOf();

    y = scoreLayout.topMargin;
    x = scoreLayout.leftMargin;

    while (measureIx < this.score.staves[0].measures.length) {
      if (this.score.isPartExposed()) {
        if (this.score.staves[0].measures[measureIx].svg.hideMultimeasure) {
          measureIx += 1;
          continue;
        }
      }
      measureEstimate = this.estimateColumn(scoreLayout, measureIx, systemIndex, lineIndex, x, y);
      x = measureEstimate.x;
      if (systemIndex > 0 &&
        (measureEstimate.measures[0].format.systemBreak || measureEstimate.x > (scoreLayout.pageWidth - scoreLayout.leftMargin))) {
        this.justifyY(scoreLayout, measureEstimate.measures.length, currentLine, false);
        // find the measure with the lowest y extend (greatest y value), not necessarily one with lowest
        // start of staff.
        const bottomMeasure: SmoMeasure = currentLine.reduce((a, b) =>
          a.lowestY > b.lowestY ? a : b
        );
        this.checkPageBreak(scoreLayout, currentLine, bottomMeasure);
        const renderedPage: RenderedPage | null = this.renderedPages[pageCheck];
        if (renderedPage) {
          if (pageCheck !== this.currentPage) {
            // The last measure in the last system of the previous page
            const previousSystem = currentLine[0].measureNumber.measureIndex - 1;
            if (renderedPage.endMeasure !== previousSystem) {
              this.renderedPages[pageCheck] = null;
            }            
            const nextPage = this.renderedPages[this.currentPage];
            if (nextPage && nextPage.startMeasure !== previousSystem + 1) {
              this.renderedPages[this.currentPage] = null;
            }          
          }
        }
        pageCheck = this.currentPage;

        const ld = layoutDebug;
        const sh = SvgHelpers;
        if (layoutDebug.mask & layoutDebug.values.system) {
          currentLine.forEach((measure) => {
            if (measure.svg.logicalBox) {
              const context = this.svg.getRenderer(measure.svg.logicalBox);
              if (context) {
                ld.debugBox(context.svg, measure.svg.logicalBox, layoutDebug.values.system);
              }
            }
          });
        }

        // Now start rendering on the next system.
        y = bottomMeasure.lowestY + scoreLayout.interGap;
  
        currentLine = [];
        systemIndex = 0;
        x = scoreLayout.leftMargin;
        lineIndex += 1;
        this.lines.push(lineIndex);
        measureEstimate = this.estimateColumn(scoreLayout, measureIx, systemIndex, lineIndex, x, y);
        x = measureEstimate.x;
      }
      measureEstimate?.measures.forEach((measure) => {
        const context = this.svg.getRenderer(measure.svg.logicalBox);
        if (context) {
          layoutDebug.debugBox(context.svg, measure.svg.logicalBox, layoutDebug.values.pre);
        }
      });
      this.updateSystemMap(measureEstimate.measures, lineIndex, systemIndex);
      currentLine = currentLine.concat(measureEstimate.measures);
      measureIx += 1;      
      systemIndex += 1;
      // If this is the last measure but we have not filled the x extent,
      // still justify the vertical staves and check for page break.
      if (this.isLastVisibleMeasure(measureIx) && measureEstimate !== null) {
        this.justifyY(scoreLayout, measureEstimate.measures.length, currentLine, true);
        const bottomMeasure = currentLine.reduce((a, b) =>
          a.svg.logicalBox.y + a.svg.logicalBox.height > b.svg.logicalBox.y + b.svg.logicalBox.height ? a : b
        );
        scoreLayout = this.checkPageBreak(scoreLayout, currentLine, bottomMeasure);
      }
    }
    // If a measure was added to the last page, make sure we re-render the page
    const renderedPage: RenderedPage | null = this.renderedPages[this.currentPage];
    if (renderedPage) {
      if (renderedPage.endMeasure !== currentLine[0].measureNumber.measureIndex) {
        this.renderedPages[this.currentPage] = null;
      }
    }
    layoutDebug.setTimestamp(layoutDebug.codeRegions.COMPUTE, new Date().valueOf() - timestamp);
  }
  
  static estimateMusicWidth(smoMeasure: SmoMeasure, tickContexts: Record<number, SuiTickContext>): number {
    const widths: number[] = [];
    // Add up the widths of the music glyphs for each voice, including accidentals etc.  We save the widths in a hash by duration
    // and later consider overlapping/colliding ticks in each voice
    const tmObj = smoMeasure.createMeasureTickmaps();
    smoMeasure.voices.forEach((voice) => {
      let width = 0;
      let duration = 0;
      const noteCount = voice.notes.length;
      voice.notes.forEach((note) => {
        let noteWidth = 0;
        const dots: number = (note.dots ? note.dots : 0);
        let headWidth: number = vexGlyph.width(vexGlyph.dimensions.noteHead);
        // Maybe not the best place for this...ideally we'd get the note head glyph from
        // the ntoe.
        if (note.tickCount >= 4096 * 4 && note.noteType === 'n') {
          headWidth *= 2;
        }
        const dotWidth: number = vexGlyph.width(vexGlyph.dimensions.dot);
        noteWidth += headWidth +
          vexGlyph.dimensions.noteHead.spacingRight;
        // TODO: Consider engraving font and adjust grace note size?
        noteWidth += (headWidth + vexGlyph.dimensions.noteHead.spacingRight) * note.graceNotes.length;
        noteWidth += dotWidth * dots + vexGlyph.dimensions.dot.spacingRight * dots;
        if (!note.isRest() && note.endBeam) {
          noteWidth += vexGlyph.dimensions.flag.width;
        }
        note.pitches.forEach((pitch) => {
          const keyAccidental = SmoMusic.getAccidentalForKeySignature(pitch, smoMeasure.keySignature);
          const accidentals = tmObj.accidentalArray.filter((ar) =>
            (ar.duration as number) < duration && ar.pitches[pitch.letter]);
          const acLen = accidentals.length;
          const declared = acLen > 0 ?
            accidentals[acLen - 1].pitches[pitch.letter].pitch.accidental : keyAccidental;
          if (declared !== pitch.accidental || pitch.cautionary) {
            noteWidth += vexGlyph.accidentalWidth(pitch.accidental) * 2;
          }
        });

        let verse = 0;
        let lyricBase = note.getLyricForVerse(verse, SmoLyric.parsers.lyric);
        while (lyricBase.length) {
          let lyric = lyricBase[0] as SmoLyric;
          let lyricWidth = 0;
          let i = 0;
          // TODO: kerning and all that...
          if (!lyric.text.length) {
            break;
          }
          // why did I make this return an array?
          // oh...because of voices
          const textFont =
            TextFormatter.create({ family: lyric.fontInfo.family,
              size: lyric.fontInfo.size, weight: 'normal' });
          const lyricText = lyric.getText();
          for (i = 0; i < lyricText.length; ++i) {
            lyricWidth += textFont.getWidthForTextInPx(lyricText[i])
          }
          if (lyric.isHyphenated()) {
            lyricWidth += 2 * textFont.getWidthForTextInPx('-');
          } else {
            lyricWidth += 2 * textFont.getWidthForTextInPx('H');
          }
          noteWidth = Math.max(lyricWidth, noteWidth);
          verse += 1;
          lyricBase = note.getLyricForVerse(verse, SmoLyric.parsers.lyric);
        }
        if (!tickContexts[duration]) {
          tickContexts[duration] = {
            widths: [],
            tickCounts: [] 
          }
        }
        if (smoMeasure.repeatSymbol) {
          noteWidth = vexGlyph.repeatSymbolWidth() / noteCount;  
        }
        tickContexts[duration].widths.push(noteWidth);
        tickContexts[duration].tickCounts.push(note.tickCount);
        duration += Math.round(note.tickCount);
        width += noteWidth;
      });
      widths.push(width);
    });
    widths.sort((a, b) => a > b ? -1 : 1);
    return widths[0];
  }

  static estimateStartSymbolWidth(smoMeasure: SmoMeasure): number {
    let width = 0;
    // the variables starts and digits used to be in the if statements. I moved them here to fix the resulting error
    var starts = smoMeasure.getStartBarline();
    var digits = smoMeasure.timeSignature.timeSignature.split('/')[0].length;
    if (smoMeasure.svg.forceKeySignature) {
      if (smoMeasure.canceledKeySignature) {
        width += vexGlyph.keySignatureLength(smoMeasure.canceledKeySignature);
      }
      width += vexGlyph.keySignatureLength(smoMeasure.keySignature);
    }
    if (smoMeasure.svg.forceClef) {
      const clefGlyph = vexGlyph.clef(smoMeasure.clef);
      width += clefGlyph.width + clefGlyph.spacingRight;
    }
    if (smoMeasure.svg.forceTimeSignature) {
      width += vexGlyph.width(vexGlyph.dimensions.timeSignature) * digits + vexGlyph.dimensions.timeSignature.spacingRight;
    }
    if (starts) {
      width += vexGlyph.barWidth(starts);
    }
    return width;
  }
  static estimateEndSymbolWidth(smoMeasure: SmoMeasure) {
    var width = 0;
    var ends  = smoMeasure.getEndBarline();
    if (ends) {
      width += vexGlyph.barWidth(ends);
    }
    return width;
  }

  estimateMeasureWidth(measure: SmoMeasure, scoreLayout: ScaledPageLayout, tickContexts: Record<number, SuiTickContext>) {
    // Calculate the existing staff width, based on the notes and what we expect to be rendered.
    let measureWidth = SuiLayoutFormatter.estimateMusicWidth(measure, tickContexts) + defaultMeasurePadding;
    // measure.svg.adjX already set based on max column adjX
    measure.svg.adjRight = SuiLayoutFormatter.estimateEndSymbolWidth(measure);
    measureWidth += measure.svg.adjX + measure.svg.adjRight + measure.format.customStretch + measure.format.padLeft;
    const y = measure.svg.logicalBox.y;
    // For systems that start with padding, add width for the padding
    measure.setWidth(measureWidth, 'estimateMeasureWidth adjX adjRight');
    // Calculate the space for left/right text which displaces the measure.
    // measure.setX(measure.staffX  + textOffsetBox.x,'estimateMeasureWidth');
    measure.setBox(SvgHelpers.boxPoints(measure.staffX, y, measure.staffWidth, measure.svg.logicalBox.height),
      'estimate measure width');
  }
  static _beamGroupForNote(measure: SmoMeasure, note: SmoNote): ISmoBeamGroup | null {
    let rv: ISmoBeamGroup | null = null;
    if (!note.beam_group) {
      return null;
    }
    measure.beamGroups.forEach((bg) => {
      if (!rv) {
        if (bg.notes.findIndex((note) => note.beam_group && note.beam_group.id === bg.attrs.id) >= 0) {
          rv = bg;
        }
      }
    });
    return rv;
  }
  /**
   * Format a full system:
   * 1.  Lop the last measure off the end and move it to the first measure of the
   * next system, if it doesn't fit
   * 2. Justify the measures vertically
   * 3. Justify the columns horizontally
   * 4. Hide lines if they don't contain music
   * @param scoreLayout 
   * @param measureEstimate 
   * @param currentLine 
   * @param columnCount 
   * @param lastSystem 
   */
  justifyY(scoreLayout: ScaledPageLayout, rowCount: number, currentLine: SmoMeasure[], lastSystem: boolean) {
    const sh = SvgHelpers;
    // If there are fewer measures in the system than the max, don't justify.
    // We estimate the staves at the same absolute y value.
    // Now, move them down so the top of the staves align for all measures in a  row.
    const measuresToHide: SmoMeasure[] = [];
    const rows: Array<SmoMeasure[]> = [];
    let anyNotes = false;
    for (let i = 0; i < rowCount; ++i) {
      // lowest staff has greatest staffY value.
      const rowAdj = currentLine.filter((mm) => mm.svg.rowInSystem === i);
      rows.push(rowAdj);
      let lowestTabStaff = rowAdj.reduce((a, b) => 
        a.svg.tabStaveBox && b.svg.tabStaveBox && 
          a.svg.tabStaveBox.y + a.svg.tabStaveBox.height > b.svg.tabStaveBox.y + b.svg.tabStaveBox.height ?
          a : b
      );
      const lowestStaff = rowAdj.reduce((a, b) =>
        a.staffY > b.staffY ? a : b
      );
      const hasNotes = rowAdj.findIndex((x) => x.isRest() === false) >= 0;
      if (hasNotes) {
        anyNotes = true;
      }
      rowAdj.forEach((measure) => {
        measure.svg.hideEmptyMeasure = false;
        if (this.score.preferences.hideEmptyLines && !hasNotes && !this.score.isPartExposed()) {
          measuresToHide.push(measure);
        }
        const adj = lowestStaff.staffY - measure.staffY;
        measure.setY(measure.staffY + adj, 'justifyY');
        measure.setBox(sh.boxPoints(measure.svg.logicalBox.x, measure.svg.logicalBox.y + adj, measure.svg.logicalBox.width, measure.svg.logicalBox.height), 'justifyY');
        if (lowestTabStaff.svg.tabStaveBox && measure.svg.tabStaveBox) {
          measure.svg.tabStaveBox.y = measure.svg.tabStaveBox.y + lowestTabStaff.svg.tabStaveBox.y - measure.svg.tabStaveBox.y;
        }
      });
      const rightStaff = rowAdj.reduce((a, b) =>
        a.staffX + a.staffWidth > b.staffX + b.staffWidth ?  a : b);

      const ld = layoutDebug;
      let justifyX = 0;
      let columnCount = rowAdj.length;
      // missing offset is for systems that have fewer measures than the default (due to section break or score ending)
      let missingOffset = 0;
      if (scoreLayout.maxMeasureSystem > 1 && 
        columnCount < scoreLayout.maxMeasureSystem
        && lastSystem) {
          missingOffset = (scoreLayout.pageWidth / (scoreLayout.maxMeasureSystem + 1)) * (scoreLayout.maxMeasureSystem - columnCount);
          columnCount = scoreLayout.maxMeasureSystem;
      }
      if (scoreLayout.maxMeasureSystem > 1 || !lastSystem) {
        justifyX = Math.round((scoreLayout.pageWidth - (scoreLayout.leftMargin + scoreLayout.rightMargin + rightStaff.staffX + rightStaff.staffWidth + missingOffset))
          / columnCount);
      }
      let justOffset = 0;
      rowAdj.forEach((measure) => {
        measure.setWidth(measure.staffWidth + justifyX, '_estimateMeasureDimensions justify');
        measure.setX(measure.staffX + justOffset, 'justifyY');
        measure.setBox(sh.boxPoints(measure.svg.logicalBox.x + justOffset,
          measure.svg.logicalBox.y, measure.staffWidth, measure.svg.logicalBox.height), 'justifyY');
        const context = this.svg.getRenderer(measure.svg.logicalBox);
        if (context) {
          ld.debugBox(context.svg, measure.svg.logicalBox, layoutDebug.values.adjust);
        }
        justOffset += justifyX;
      });
    }
    // If a full line doesn't contain any music, hide it.
    if (this.score.preferences.hideEmptyLines && anyNotes) {
      let adjY = 0;
      for (let i = 0; i < rowCount; ++i) {
        const rowAdj = measuresToHide.filter((mm) => mm.svg.rowInSystem === i);
        if (rowAdj.length) {
          adjY += rowAdj[0].svg.logicalBox.height;
          rowAdj.forEach((mm) => {
            mm.svg.logicalBox.height = 0;
            mm.svg.hideEmptyMeasure = true;            
          });
        } else {
          const rowAdj = currentLine.filter((mm) => mm.svg.rowInSystem === i);
          rowAdj.forEach((row) => {
            row.setY(row.svg.staffY - adjY, 'format-hide');
          });
        }
      }
    }
    // If a hidden measure has tempo or time signature, move it to the
    // first visible measure
    for (let i = 0; i < rowCount; ++i) {
      const row = rows[i];
      if (!row[0].svg.hideEmptyMeasure) {
        break;
      }
      for (let j = 0; j < row.length; ++j) {
        const mm: SmoMeasure = row[j];
        if (mm.svg.hideEmptyMeasure && rows.length > i) {
          const nextmm = rows[i + 1][j];
          nextmm.svg.forceTimeSignature = mm.svg.forceTimeSignature;
          nextmm.svg.forceKeySignature = mm.svg.forceKeySignature;
          nextmm.svg.forceTempo = mm.svg.forceKeySignature;
        }
      }
    }
  }
  /**
   * highest value is actually the one lowest on the page
   * @param measure 
   * @param note 
   * @returns 
   */
  static _highestLowestHead(measure: SmoMeasure, note: SmoNote) {
    // note...er warning: Notes always have at least 1 pitch, even a rest
    // or glyph has a pitch to indicate the placement
    const hilo = { hi: 0, lo: 99999999 };    
    note.pitches.forEach((pitch) => {            
      const line = 5 - SmoMusic.pitchToStaffLine(measure.clef, pitch);
      // TODO: use actual note head/rest/glyph.  10 px is space between staff lines
      const noteHeight = 10;
      const px = (noteHeight * line);
      hilo.lo = Math.min(hilo.lo, px - noteHeight / 2);
      hilo.hi = Math.max(hilo.hi, px + noteHeight / 2);
    });
    return hilo;
  }
  static textFont(lyric: SmoLyric) {
    return TextFormatter.create(lyric.fontInfo);
  }

  /**
   * Calculate the dimensions of symbols based on where in a system we are, like whether we need to show
   * the key signature, clef etc.
   * @param systemIndex 
   * @param measure 
   * @param clefLast 
   * @param keySigLast 
   * @param timeSigLast 
   * @param tempoLast 
   * @param score 
   */
  calculateBeginningSymbols(systemIndex: number, measure: SmoMeasure,
    clefLast: string, keySigLast: string, timeSigLast: TimeSignature, tempoLast: SmoTempoText) {
    // The key signature is set based on the transpose index already, i.e. an Eb part in concert C already has 3 sharps.
    const xposeScore = this.score?.preferences?.transposingScore && (this.score?.isPartExposed() === false);
    const xposeOffset = xposeScore ? measure.transposeIndex : 0;
    const measureKeySig = SmoMusic.vexKeySignatureTranspose(measure.keySignature, xposeOffset);
    measure.svg.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
    measure.svg.forceTimeSignature = (measure.measureNumber.measureIndex === 0 || 
      (!SmoMeasure.timeSigEqual(timeSigLast, measure.timeSignature)) || measure.timeSignature.displayString.length > 0);
    if (measure.timeSignature.display === false) {
      measure.svg.forceTimeSignature = false;
    }
    measure.svg.forceTempo = false;
    const tempo = measure.getTempo();
    // always print tempo for the first measure, if indicated
    if (tempo && measure.measureNumber.measureIndex === 0 && measure.measureNumber.staffId === 0) {
      measure.svg.forceTempo = tempo.display && measure.svg.rowInSystem === 0;
    } else if (tempo && tempoLast) {
      // otherwise get tempo from the measure prior.  But only one tempo per system.
      if (!SmoTempoText.eq(tempo, tempoLast) && measure.svg.rowInSystem === 0) {
        measure.svg.forceTempo = tempo.display;
      }
    } else if (tempo) {
      measure.svg.forceTempo = tempo.display && measure.svg.rowInSystem === 0;
    }
    if (measureKeySig !== keySigLast && measure.measureNumber.measureIndex > 0) {
      measure.canceledKeySignature = SmoMusic.vexKeySigWithOffset(keySigLast, xposeOffset);
      measure.svg.forceKeySignature = true;
    } else if (systemIndex === 0 && measureKeySig !== 'C') {
      measure.svg.forceKeySignature = true;
    } else {
      measure.svg.forceKeySignature = false;
    }
  }

  /**
   * The baseline is the top line of the staff.  aboveBaseline is a negative number
   * that indicates how high above the baseline the measure goes.  belowBaseline
   * is a positive number that indicates how far below the baseline the measure goes.
   * the height of the measure is below-above.  Vex always renders a staff such that
   * the y coordinate passed in for the stave is on the baseline.
   * 
   * Note to past self: this was a really useful comment.  Thank you.
   * **/
  estimateMeasureHeight(measure: SmoMeasure): { aboveBaseline: number, belowBaseline: number } {
    let yTop = 0; // highest point, smallest Y value
    let yBottom = measure.lines * 10;  // lowest point, largest Y value.
    let flag: number = -1;
    let lyricOffset = 0;
    const measureIndex = measure.measureNumber.measureIndex;
    const staffIndex = measure.measureNumber.staffId;
    const stave = this.score.staves[staffIndex];
    stave.renderableModifiers.forEach((mm) => {
      if (mm.startSelector.staff === staffIndex && (mm.startSelector.measure <= measureIndex &&  mm.endSelector.measure >= measureIndex) ||
          mm.endSelector.staff === staffIndex && 
            (mm.endSelector.measure <= measureIndex &&  mm.endSelector.measure >= measureIndex && mm.endSelector.measure !== mm.startSelector.measure)) {
        if (mm.ctor === 'SmoHairpin') {
          const hp = mm as SmoStaffHairpin;
          if (hp.position === SmoStaffHairpin.positions.ABOVE) {
            yTop = yTop - hp.height;
          } else {
            yBottom = yBottom + hp.height;
          }
        } else if (mm.ctor === 'SmoStaffTextBracket') {
          const tb = mm as SmoStaffTextBracket;
          const tbHeight = 14 + (10 * Math.abs(tb.line - 1)); // 14 default font size
          if (tb.position === SmoStaffTextBracket.positions.TOP) {
            yTop = yTop - tbHeight;
          } else {
            yBottom = yBottom + tbHeight;
          }  
        }
      }
    });
    if (measure.svg.forceClef) {
      yBottom += vexGlyph.clef(measure.clef).yTop + vexGlyph.clef(measure.clef).yBottom;
      yTop = yTop - vexGlyph.clef(measure.clef).yTop;
    }

    if (measure.svg.forceTempo) {
      yTop = Math.min(-1 * vexGlyph.tempo.yTop, yTop);
    }
    let yBottomOffset = 0;
    let yBottomVoiceZero = 0;
    measure.voices.forEach((voice, voiceIx) => {
      voice.notes.forEach((note) => {
        const bg = SuiLayoutFormatter._beamGroupForNote(measure, note);
        flag = SmoNote.flagStates.auto;
        if (bg && note.noteType === 'n') {
          flag = bg.notes[0].flagState;
          // an  auto-flag note is up if the 1st note is middle line
          if (flag === SmoNote.flagStates.auto) {
            const pitch = bg.notes[0].pitches[0];
            flag = SmoMusic.pitchToStaffLine(measure.clef, pitch)
               >= 3 ? SmoNote.flagStates.down : SmoNote.flagStates.up;
          }
        }  else {
          flag = note.flagState;
          // odd-numbered voices flip default up/down
          const voiceMod = voiceIx % 2;
          // an  auto-flag note is up if the 1st note is middle line
          if (flag === SmoNote.flagStates.auto) {
            const pitch = note.pitches[0];
            flag = SmoMusic.pitchToStaffLine(measure.clef, pitch)
              >= 3 ? SmoNote.flagStates.down : SmoNote.flagStates.up;
            if (voiceMod === 1) {
              flag = (flag === SmoNote.flagStates.down) ? SmoNote.flagStates.up : SmoNote.flagStates.down;
            }
          }
        }
        const hiloHead = SuiLayoutFormatter._highestLowestHead(measure, note);
        if (flag === SmoNote.flagStates.down) {
          yTop = Math.min(hiloHead.lo, yTop);
          yBottom = Math.max(hiloHead.hi + vexGlyph.stem.height, yBottom);
        } else {
          yTop = Math.min(hiloHead.lo - vexGlyph.stem.height, yTop);
          yBottom = Math.max(hiloHead.hi, yBottom);
        }
        // Lyrics will be rendered below the lowest thing on the staff, so add to
        // belowBaseline value based on the max number of verses and font size
        // it will extend
        });
        // Vex won't adjust for music in voices > 0 when placing lyrics.  
        // So we need to adjust here, if voices > 0 have music below lyrics. 
        if (voiceIx > 0 && yBottomVoiceZero < yBottom) {
          yBottomOffset = yBottom - yBottomVoiceZero;
        } else {
          yBottomVoiceZero = yBottom;
        }
      });
      let lyricsToAdjust: SmoLyric[] = [];
      // get the lowest music part, then consider the lyrics
      measure.voices.forEach((voice, voiceIx) => {
        voice.notes.forEach((note) => {
        const lyrics = note.getTrueLyrics();
        lyricsToAdjust = lyricsToAdjust.concat(lyrics);
        if (lyrics.length) {
          const maxLyric = lyrics.reduce((a, b) => a.verse > b.verse ? a : b);
          const fontInfo = SuiLayoutFormatter.textFont(maxLyric);
          lyricOffset = Math.max((maxLyric.verse + 2) * fontInfo.maxHeight, lyricOffset);
        }
        const dynamics = note.getModifiers('SmoDynamicText') as SmoDynamicText[];
        dynamics.forEach((dyn) => {
          yBottom = Math.max((10 * dyn.yOffsetLine - 50) + 11, yBottom);
          yTop = Math.min(10 * dyn.yOffsetLine - 50, yTop);
        });
        note.articulations.forEach((articulation) => {
          if (articulation.position === SmoArticulation.positions.above) {
            yTop -= 10;
          } else {
            yBottom += 10;
          }
        });
        note.ornaments.forEach((ornament) => {
          if (ornament.position === SmoOrnament.positions.above) {
            yTop -= 10;
          } else {
            yBottom += 10;
          }
        })
      });
    });
    yBottom += lyricOffset;
    if (lyricsToAdjust.length > 0) {
      lyricsToAdjust.forEach((lyric: SmoLyric) => {
        lyric.musicYOffset = yBottomOffset;
      });
    }
    const mmsel = SmoSelector.measureSelector(stave.staffId, measure.measureNumber.measureIndex);
    return { belowBaseline: yBottom, aboveBaseline: yTop };
  }
}
