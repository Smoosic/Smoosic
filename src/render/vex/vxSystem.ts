// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { VxMeasure } from './vxMeasure';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { SvgHelpers } from '../sui/svgHelpers';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SmoStaffHairpin, SmoSlur, StaffModifierBase, SmoTie, SmoStaffTextBracket, SmoPedalMarking } from '../../smo/data/staffModifiers';
import { SmoScore } from '../../smo/data/score';
import { SmoMusic } from '../../smo/data/music';
import { leftConnectorVx, rightConnectorVx } from './smoAdapter';
import { SmoMeasure, SmoVoice } from '../../smo/data/measure';
import { SvgBox, ElementLike, RemoveElementLike } from '../../smo/data/common';
import { SmoNote } from '../../smo/data/note';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { SmoVolta } from '../../smo/data/measureModifiers';
import { SmoMeasureFormat } from '../../smo/data/measureModifiers';
import { SmoScoreText } from '../../smo/data/scoreText'
import { SvgPage } from '../sui/svgPageMap';
import { SuiScroller } from '../sui/scroller';
import { VexFlow, Voice, Note, createHairpin, createSlur, createTie, PedalMarking, StaveNote,
  Beam, Stem
 } from '../../common/vex';
import { toVexVolta, vexOptions } from './smoAdapter';
const VF = VexFlow;
/**
 * @category SuiRender
 */
export interface VoltaInfo {
  smoMeasure: SmoMeasure,
  ending: SmoVolta
}
/**
 * @category SuiRender
 */
export interface SuiSystemGroup {
  firstMeasure: VxMeasure,
  voices: Voice[]
}
/**
 * Create a system of staves and draw music on it.  This calls the Vex measure
 * rendering methods, and also draws all the score and system level stuff like slurs, 
 * text, aligns the lyrics.
 * @category SuiRender
 * */
export class VxSystem {
  context: SvgPage;
  leftConnector: any[] = [null, null];
  score: SmoScore;
  vxMeasures: VxMeasure[] = [];
  smoMeasures: SmoMeasure[] = [];
  lineIndex: number;
  maxStaffIndex: number;
  maxSystemIndex: number;
  minMeasureIndex: number = -1;
  maxMeasureIndex: number = 0;
  width: number;
  staves: SmoSystemStaff[] = [];
  box: SvgBox = SvgBox.default;
  currentY: number;
  topY: number;
  clefWidth: number;
  ys: number[] = [];
  measures: VxMeasure[] = [];
  modifiers: any[] = [];
  constructor(context: SvgPage, topY: number, lineIndex: number, score: SmoScore) {
    this.context = context;
    this.lineIndex = lineIndex;
    this.score = score;
    this.maxStaffIndex = -1;
    this.maxSystemIndex = -1;
    this.width = -1;
    this.staves = [];
    this.currentY = 0;
    this.topY = topY;
    this.clefWidth = 70;
    this.ys = [];
  }

  getVxMeasure(smoMeasure: SmoMeasure) {
    let i = 0;
    for (i = 0; i < this.vxMeasures.length; ++i) {
      const vm = this.vxMeasures[i];
      if (vm.smoMeasure.id === smoMeasure.id) {
        return vm;
      }
    }

    return null;
  }

  getVxNote(smoNote: SmoNote): Note | null {
    let i = 0;
    if (!smoNote) {
      return null;
    }
    for (i = 0; i < this.measures.length; ++i) {
      const mm = this.measures[i];
      if (mm.noteToVexMap[smoNote.attrs.id]) {
        return mm.noteToVexMap[smoNote.attrs.id];
      }
    }
    return null;
  }

  _updateChordOffsets(note: SmoNote) {
    var i = 0;
    for (i = 0; i < 3; ++i) {
      const chords = note.getLyricForVerse(i, SmoLyric.parsers.chord);
      chords.forEach((bchord) => {
        const chord = bchord as SmoLyric;
        const dom = this.context.svg.getElementById('vf-' + chord.attrs.id);
        if (dom) {
          dom.setAttributeNS('', 'transform', 'translate(' + chord.translateX + ' ' + (-1 * chord.translateY) + ')');
        }
      });
    }
  }
  _lowestYLowestVerse(lyrics: SmoLyric[], vxMeasures: VxMeasure[]) {
    // Move each verse down, according to the lowest lyric on that line/verse,
    // and the accumulation of the verses above it
    let lowestY = 0;
    for (var lowVerse = 0; lowVerse < 4; ++lowVerse) {
      let maxVerseHeight = 0;
      const verseLyrics = lyrics.filter((ll) => ll.verse === lowVerse);
      if (lowVerse === 0) {
        // first verse, go through list twice.  first find lowest points
        verseLyrics.forEach((lyric: SmoLyric) => {
          if (lyric.logicalBox) {
            // 'lowest' Y on screen is Y with largest value...
            const ly = lyric.logicalBox.y  - this.context.box.y;
            lowestY = Math.max(ly + lyric.musicYOffset, lowestY);
          }
        });
        // second offset all to that point
        verseLyrics.forEach((lyric: SmoLyric) => {
          if (lyric.logicalBox) {
            const ly = lyric.logicalBox.y  - this.context.box.y;
            const offset = Math.max(0, lowestY - ly);
            lyric.adjY = offset + lyric.translateY;
          }
        });
      } else {
        // subsequent verses, first find the tallest lyric
        verseLyrics.forEach((lyric: SmoLyric)=> {
          if (lyric.logicalBox) {
            maxVerseHeight = Math.max(lyric.logicalBox.height, maxVerseHeight);
          }
        });
        // adjust lowestY to be the verse height below the previous verse
        lowestY = lowestY + maxVerseHeight * 1.1; // 1.1 magic number?
        // and offset these lyrics
        verseLyrics.forEach((lyric: SmoLyric)=> {
          if (lyric.logicalBox) {
            const ly = lyric.logicalBox.y  - this.context.box.y;
            const offset = Math.max(0, lowestY - ly);
            lyric.adjY = offset + lyric.translateY;
          }
        });
      }
    }
  }

  // ### updateLyricOffsets
  // Adjust the y position for all lyrics in the line so they are even.
  // Also replace '-' with a longer dash do indicate 'until the next measure'
  updateLyricOffsets() {
    let i = 0;
    for (i = 0; i < this.score.staves.length; ++i) {
      const tmpI = i;
      const lyricsDash: SmoLyric[] = [];
      const lyricHyphens: SmoLyric[] = [];
      const lyricVerseMap: Record<number, SmoLyric[]> = {};
      const lyrics: SmoLyric[] = [];
      // is this necessary? They should all be from the current line
      const vxMeasures = this.vxMeasures.filter((vx) =>
        vx.smoMeasure.measureNumber.staffId === tmpI
      );

      // All the lyrics on this line
      // The vertical bounds on each line
      vxMeasures.forEach((mm) => {
        var smoMeasure = mm.smoMeasure;

        // Get lyrics from any voice.
        smoMeasure.voices.forEach((voice) => {
          voice.notes.forEach((note) => {
            this._updateChordOffsets(note);
            note.getTrueLyrics().forEach((ll: SmoLyric) => {
              const hasLyric = ll.getText().length > 0 || ll.isHyphenated();
              if (hasLyric && ll.logicalBox && !lyricVerseMap[ll.verse]) {
                lyricVerseMap[ll.verse] = [];
              }else if (hasLyric && !ll.logicalBox) {
                console.warn(
                  `unrendered lyric for note ${note.attrs.id} measure ${smoMeasure.measureNumber.staffId}-${smoMeasure.measureNumber.measureIndex}`);
              }
              if (hasLyric && ll.logicalBox) {
                lyricVerseMap[ll.verse].push(ll);
                lyrics.push(ll);
              }
            });
          });
        });
      });
      // calculate y offset so the lyrics all line up
      this._lowestYLowestVerse(lyrics, vxMeasures);
      const vkey: string[] = Object.keys(lyricVerseMap).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      vkey.forEach((sverse) => {
        const verse = parseInt(sverse, 10);
        let hyphenLyric: SmoLyric | null = null;
        const lastVerse = lyricVerseMap[verse][lyricVerseMap[verse].length - 1].attrs.id;
        lyricVerseMap[verse].forEach((ll: SmoLyric) => {
          if (hyphenLyric !== null && hyphenLyric.logicalBox !== null && ll.logicalBox !== null) {
            const x = ll.logicalBox.x - (ll.logicalBox.x -
              (hyphenLyric.logicalBox.x + hyphenLyric.logicalBox.width)) / 2;
            ll.hyphenX = x;
            lyricHyphens.push(ll);
          }
          if (ll.isHyphenated() && ll.logicalBox !== null) {
            if (ll.attrs.id === lastVerse) {
              // Last word on the system, place the hyphen after the word
              const fontSize = SmoScoreText.fontPointSize(ll.fontInfo.size);
              ll.hyphenX = ll.logicalBox.x + ll.logicalBox.width + fontSize / 2;
              lyricHyphens.push(ll);
            } else if (ll.getText().length) {
              // place the hyphen 1/2 between next word and this one.
              hyphenLyric = ll;
            }
          } else {
            hyphenLyric = null;
          }
        });
      });
      lyrics.forEach((lyric) => {
        const dom = this.context.svg.getElementById('vf-' + lyric.attrs.id) as SVGSVGElement;
        if (dom) {
          dom.setAttributeNS('', 'transform', 'translate(' + lyric.adjX + ' ' + lyric.adjY + ')');
          // Keep track of lyrics that are 'dash'
          if (lyric.isDash()) {
            lyricsDash.push(lyric);
          }
        }
      });
      lyricHyphens.forEach((lyric) => {
        const parent = this.context.svg.getElementById('vf-' + lyric.attrs.id);
        if (parent && lyric.logicalBox !== null) {
          const ly = lyric.logicalBox.y  - this.context.box.y;
          const text = document.createElementNS(SvgHelpers.namespace, 'text');
          text.textContent = '-';
          const fontSize = SmoScoreText.fontPointSize(lyric.fontInfo.size);
          text.setAttributeNS('', 'x', (lyric.hyphenX - fontSize / 3).toString());
          text.setAttributeNS('', 'y', (ly + (lyric.logicalBox.height * 2) / 3).toString());
          text.setAttributeNS('', 'font-size', '' + fontSize + 'pt');
          parent.appendChild(text);
        }
      });
      lyricsDash.forEach((lyric) => {
        const parent = this.context.svg.getElementById('vf-' + lyric.attrs.id);
        if (parent && lyric.logicalBox !== null) {
          const ly = lyric.logicalBox.y  - this.context.box.y;
          const line = document.createElementNS(SvgHelpers.namespace, 'line');
          const ymax = Math.round(ly + lyric.logicalBox.height / 2);
          const offset = Math.round(lyric.logicalBox.width / 2);
          line.setAttributeNS('', 'x1', (lyric.logicalBox.x - offset).toString());
          line.setAttributeNS('', 'y1', ymax.toString());
          line.setAttributeNS('', 'x2', (lyric.logicalBox.x + lyric.logicalBox.width + offset).toString());
          line.setAttributeNS('', 'y2', ymax.toString());
          line.setAttributeNS('', 'stroke-width', '1');
          line.setAttributeNS('', 'fill', 'none');
          line.setAttributeNS('', 'stroke', '#999999');
          parent.appendChild(line);
          const texts = parent.getElementsByTagName('text');
          // hide hyphen and replace with dash
          if (texts && texts.length) {
            const text = texts[0];
            text.setAttributeNS('', 'fill', '#fff');
          }
        }
      });
    }
  }

  // ### renderModifier
  // render a line-type modifier that is associated with a staff (e.g. slur)
  renderModifier(scroller: SuiScroller, modifier: StaffModifierBase,
    vxStart: Note | null, vxEnd: Note | null, smoStart: SmoSelection, smoEnd: SmoSelection) {
    const setSameIfNull = (a: any, b: any) => {
      if (typeof (a) === 'undefined' || a === null) {
        return b;
      }
      return a;
    };
    if (smoStart && smoStart.note && smoStart.note.noteType === '/') {
      return;
    } if (smoEnd && smoEnd.note && smoEnd.note.noteType === '/') {
      return;
    }
    // if (modifier.ctor === 'SmoPedalMarking' && (vxStart === null || vxEnd === null)) {
    //   return;
    // }
    let slurOffset = 0;

    // if it is split between lines, render one artifact for each line, with a common class for
    // both if it is removed.
    if (vxStart) {
      const toRemove = this.context.svg.getElementById('vf-' + modifier.attrs.id);
      if (toRemove) {
        toRemove.remove();
      }
    }
    const artifactId = modifier.attrs.id + '-' + this.lineIndex;
    const group = this.context.getContext().openGroup('slur', artifactId);
    group.classList.add(modifier.attrs.id);
    const measureMod = 'mod-' + smoStart.selector.staff + '-' + smoStart.selector.measure;
    const staffMod = 'mod-' + smoStart.selector.staff;
    group.classList.add(measureMod);
    group.classList.add(staffMod);
    if (modifier.ctor === 'SmoStaffHairpin') {
      const hp = modifier as SmoStaffHairpin;
      if (!vxStart && !vxEnd) {
        this.context.getContext().closeGroup();
      }
      vxStart = setSameIfNull(vxStart, vxEnd);
      vxEnd = setSameIfNull(vxEnd, vxStart);
      const smoVexHairpinParams = {
        vxStart,
        vxEnd,
        hairpinType: hp.hairpinType,
        height: hp.height,
        yOffset: hp.yOffset,
        leftShiftPx: hp.xOffsetLeft,
        rightShiftPx: hp.xOffsetRight
      };
      const hairpin = createHairpin(smoVexHairpinParams);
      hairpin.setContext(this.context.getContext()).setPosition(hp.position).draw();
    } else if (modifier.ctor === 'SmoSlur') {
      const startNote: SmoNote = smoStart!.note as SmoNote;
      const slur = modifier as SmoSlur;
      let startPosition = slur.position;
      let endPosition = slur.position_end;
      let openingDirection = 'up';
      let yOffset = slur.yOffset;
      let slurX = slur.xOffset;
      const svgPoint: SVGPoint[] = JSON.parse(JSON.stringify(slur.controlPoints));
      const lyric = startNote.longestLyric() as SmoLyric;
      // Find direction for slur based on beam/stem direction
      // Note: vex slur orientation follows beam direction, not slur direction.  Smo
      // orientation follows slur direction.
      if (vxStart !== null && vxEnd !== null) {
        if (slur.position === SmoSlur.positions.AUTO
           || slur.position_end === SmoSlur.positions.AUTO 
           || slur.orientation === SmoSlur.orientations.AUTO) {
          startPosition = SmoSlur.positions.HEAD;
          endPosition = SmoSlur.positions.HEAD;
          if (vxStart.hasStem()) {
            if (vxStart.getStemDirection() === VF.Stem.UP) {
              openingDirection = 'up';
            } else {
              openingDirection = 'down';
            }
            if (vxEnd.hasStem() && vxEnd.getStemDirection() !== vxStart.getStemDirection()) {
              endPosition = SmoSlur.positions.TOP;
            }
          } else {
            openingDirection = slur.orientation === SmoSlur.orientations.UP ? 'down' : 'up';
            startPosition = slur.position;
            endPosition = slur.position_end;
          }
        } else {
          openingDirection = slur.orientation === SmoSlur.orientations.UP ? 'down' : 'up';
          startPosition = slur.position;
          endPosition = slur.position_end;
        }        
      } else if (vxStart !== null && vxEnd === null) {
        slurX = 10;
        slurOffset = -5;
        if (slur.orientation === SmoSlur.orientations.AUTO && vxStart.hasStem()) {
          openingDirection = vxStart.getStemDirection() === VF.Stem.UP ? 'up' : 'down';
        } else {
          openingDirection = slur.orientation === SmoSlur.orientations.UP ? 'down' : 'up';
        }
        startPosition = SmoSlur.positions.HEAD;
        endPosition = SmoSlur.positions.HEAD;
      } else if (vxEnd !== null && vxStart === null) {
        slurX = 10;
        slurOffset = 5;
        if (slur.orientation === SmoSlur.orientations.AUTO && vxEnd.hasStem()) {
          openingDirection = vxEnd.getStemDirection() === VF.Stem.UP ? 'up' : 'down';
        } else {
          openingDirection = slur.orientation === SmoSlur.orientations.UP ? 'down' : 'up';
        }
        startPosition = SmoSlur.positions.HEAD;
        endPosition = SmoSlur.positions.HEAD;
      }
      // yoffset is always in the direction of the curve, not SVG.  Make sure the curve clears the yoffset
      // TODO: I think we should adjust this line vs. space
      if (openingDirection === 'up') {
        yOffset += 15;
      } else {
        yOffset += 10;
      }
      if (lyric && lyric.getText()) {
        // If there is a lyric, the bounding box of the start note is stretched to the right.
        // slide the slur left, and also make it a bit wider.
        const xtranslate = (-1 * lyric.getText().length * 6);
        slurX += (xtranslate / 2) - SmoSlur.defaults.xOffset;
      }
      if (SmoSelector.lt(smoEnd.selector, slur.endSelector)) {
        slurX += 15;
      }
      const smoVexSlurParams = {
        vxStart, vxEnd,
        thickness: slur.thickness,
        xShift: slurX,
        yShift: yOffset,
        openingDirection,
        cps: svgPoint,
        position: startPosition,
        positionEnd: endPosition
      };
      const curve = createSlur(smoVexSlurParams);
      curve.setContext(this.context.getContext()).draw();
    } else if (modifier.ctor === 'SmoPedalMarking') {
      const pedalMarking = modifier as SmoPedalMarking;
      const pedalAr: StaveNote[] = [];
      if (vxStart !== null) {
        pedalAr.push(vxStart as StaveNote);
      }
      if (SmoSelector.gt(smoEnd.selector, smoStart.selector) && vxEnd !== null) {
        // Add releases for the pedal marking
        pedalMarking.releases.forEach((selector: SmoSelector) => {
          if (SmoSelector.gt(selector, smoStart.selector) && SmoSelector.lt(selector, smoEnd.selector)
            && vxStart !== null) {
            const note = SmoSelection.noteSelection(this.score, selector.staff, selector.measure, selector.voice, selector.tick);
            if (note !== null && note.note !== null) {
              const vexNote = this.getVxNote(note.note);
              if (vexNote) {
                // incidate release and depress
                pedalAr.push(vexNote as StaveNote);
                pedalAr.push(vexNote as StaveNote);
              }
            }
          }
        });
        pedalAr.push(vxEnd as StaveNote);
        if (vxStart === null) {
          pedalAr.push(vxEnd as StaveNote);
        }
      }
      const vexPedal = new VF.PedalMarking(pedalAr);
      if (pedalMarking.releaseText.length > 0 || pedalMarking.depressText.length > 0) {
        vexPedal.setCustomText(pedalMarking.depressText, pedalMarking.releaseText);
      }
      if (!pedalMarking.startMark && pedalMarking.depressText.length < 1) {
        vexPedal.setCustomText(' ', pedalMarking.releaseText);
      }
      if (pedalMarking.bracket) {
        if (pedalMarking.startMark || pedalMarking.releaseMark) {
          vexPedal.setType(VF.PedalMarking.type.MIXED);
        } else {
          vexPedal.setType(VF.PedalMarking.type.BRACKET);
        }
      } else {
        vexPedal.setType(VF.PedalMarking.type.TEXT);
      }
      if (SmoSelector.gt(smoStart.selector, modifier.startSelector) && (pedalMarking.startMark)) {
        // If this is the completion of a pedal marking from a previous staff, don't print the depress
        // pedal again
        vexPedal.setType(VF.PedalMarking.type.MIXED);
        vexPedal.setCustomText(' ', pedalMarking.depressText);
      }
      if (SmoSelector.lt(smoEnd.selector, modifier.endSelector) && pedalMarking.releaseMark) {
        vexPedal.setType(VF.PedalMarking.type.MIXED);
        vexPedal.setCustomText(pedalMarking.depressText, ' ');
      }
      vexPedal.setContext(this.context.getContext());
      vexPedal.draw();
    }
    else if (modifier.ctor === 'SmoTie') {
      const ctie = modifier as SmoTie;
      const startNote: SmoNote = smoStart!.note as SmoNote;
      const endNote: SmoNote = smoEnd!.note as SmoNote;
      ctie.checkLines(startNote, endNote);
      if (ctie.lines.length > 0) {
        const fromLines = ctie.lines.map((ll) => ll.from);
        const toLines = ctie.lines.map((ll) => ll.to);
        const smoVexTieParams = {
          fromLines,
          toLines,
          firstNote: vxStart,
          lastNote: vxEnd,
          vexOptions:  vexOptions(ctie)
        }
        const tie = createTie(smoVexTieParams);
        tie.setContext(this.context.getContext()).draw();
      }
    } else if (modifier.ctor === 'SmoStaffTextBracket') {
      if (vxStart && !vxEnd) {
        vxEnd = vxStart;
      } else if (vxEnd && !vxStart) {
        vxStart = vxEnd;
      }
      if (vxStart  && vxEnd) {
        const smoBracket = (modifier as SmoStaffTextBracket);
        const bracket = new VF.TextBracket({
          start: vxStart, stop: vxEnd, text: smoBracket.text, superscript: smoBracket.superscript, position: smoBracket.position
        });
        bracket.setLine(smoBracket.line).setContext(this.context.getContext()).draw();
      }
    }

    this.context.getContext().closeGroup();
    if (slurOffset) {
      const slurBox = this.context.svg.getElementById('vf-' + artifactId) as SVGSVGElement;
      if (slurBox) {
        SvgHelpers.translateElement(slurBox, slurOffset, 0);
      }
    }
    modifier.element = group;
  }

  renderEndings(scroller: SuiScroller) {
    let j = 0;
    let i = 0;
    if (this.staves.length < 1) {
      return;
    }
    const voltas = this.staves[0].getVoltaMap(this.minMeasureIndex, this.maxMeasureIndex);
    voltas.forEach((ending) => {
      ending.elements.forEach((element: ElementLike) => {
        RemoveElementLike(element);
      });
      ending.elements = [];
    });
    for (j = 0; j < this.smoMeasures.length; ++j) {
      let pushed = false;
      const smoMeasure = this.smoMeasures[j];
      // Only draw volta on top staff of system
      if (smoMeasure.svg.rowInSystem > 0) {
        continue;
      }
      const vxMeasure = this.getVxMeasure(smoMeasure);
      const voAr: VoltaInfo[] = [];
      for (i = 0; i < voltas.length && vxMeasure !== null; ++i) {
        const ending = voltas[i];
        const mix = smoMeasure.measureNumber.measureIndex;
        if ((ending.startBar <= mix) && (ending.endBar >= mix) && vxMeasure.stave !== null) {
          const group = this.context.getContext().openGroup(undefined, ending.attrs.id);
          group.classList.add(ending.attrs.id);
          group.classList.add(ending.endingId ?? '');
          ending.elements.push(group);
          const vtype = toVexVolta(ending, smoMeasure.measureNumber.measureIndex);
          const vxVolta = new VF.Volta(vtype, ending.number.toString(), smoMeasure.staffX + ending.xOffsetStart, ending.yOffset);
          vxVolta.setContext(this.context.getContext()).draw(vxMeasure.stave, -1 * ending.xOffsetEnd);
          this.context.getContext().closeGroup();
          const height = parseInt(vxVolta.getFontSize(), 10) * 2;
          const width = smoMeasure.staffWidth;
          const y = smoMeasure.svg.logicalBox.y - (height + ending.yOffset);
          ending.logicalBox = { x: smoMeasure.svg.staffX, y, width, height };
          if (!pushed) {
            voAr.push({ smoMeasure, ending });
            pushed = true;
          }
          vxMeasure.stave.getModifiers().push(vxVolta);
        }
      }
      // Adjust real height of measure to match volta height
      for (i = 0; i < voAr.length; ++i) {
        const mm = voAr[i].smoMeasure;
        const ending = voAr[i].ending;
        if (ending.logicalBox !== null) {
          const delta = mm.svg.logicalBox.y - ending.logicalBox.y;
          if (delta > 0) {
            mm.setBox(SvgHelpers.boxPoints(
              mm.svg.logicalBox.x, mm.svg.logicalBox.y - delta, mm.svg.logicalBox.width, mm.svg.logicalBox.height + delta),
              'vxSystem adjust for volta');
          }
        }
      }
    }
  }

  getMeasureByIndex(measureIndex: number, staffId: number) {
    let i = 0;
    for (i = 0; i < this.smoMeasures.length; ++i) {
      const mm = this.smoMeasures[i];
      if (measureIndex === mm.measureNumber.measureIndex && staffId === mm.measureNumber.staffId) {
        return mm;
      }
    }
    return null;
  }

  // ## renderMeasure
  // ## Description:
  // Create the graphical (VX) notes and render them on svg.  Also render the tuplets and beam
  // groups
  renderMeasure(smoMeasure: SmoMeasure, printing: boolean) {
    if (smoMeasure.svg.hideMultimeasure) {
      return;
    }
    const measureIndex = smoMeasure.measureNumber.measureIndex;
    if (this.minMeasureIndex < 0 || this.minMeasureIndex > measureIndex) {
      this.minMeasureIndex = measureIndex;
    }
    if (this.maxMeasureIndex < measureIndex) {
      this.maxMeasureIndex = measureIndex;
    }
    let brackets = false;
    const staff = this.score.staves[smoMeasure.measureNumber.staffId];
    const staffId = staff.staffId;
    const systemIndex = smoMeasure.measureNumber.systemIndex;
    const selection = SmoSelection.measureSelection(this.score, staff.staffId, smoMeasure.measureNumber.measureIndex);
    this.smoMeasures.push(smoMeasure);
    if (this.staves.length <= staffId) {
      this.staves.push(staff);
    }
    if (selection === null) {
      return;
    }
    let softmax = selection.measure.format.proportionality;
    if (softmax === SmoMeasureFormat.defaultProportionality) {
      softmax = this.score.layoutManager?.getGlobalLayout().proportionality ?? 0;
    }
    const vxMeasure: VxMeasure = new VxMeasure(this.context, selection, printing, softmax);

    // create the vex notes, beam groups etc. for the measure
    vxMeasure.preFormat();
    this.vxMeasures.push(vxMeasure);

    const lastStaff = (staffId === this.score.staves.length - 1);
    const smoGroupMap: Record<string, SuiSystemGroup> = {};
    const adjXMap: Record<number, number> = {};
    const vxMeasures = this.vxMeasures.filter((mm) => !mm.smoMeasure.svg.hideEmptyMeasure);
    // If this is the last staff in the column, render the column with justification
    if (lastStaff) {
      vxMeasures.forEach((mm) => {
        if (typeof(adjXMap[mm.smoMeasure.measureNumber.systemIndex]) === 'undefined') {
          adjXMap[mm.smoMeasure.measureNumber.systemIndex] = mm.smoMeasure.svg.adjX;
        }
        adjXMap[mm.smoMeasure.measureNumber.systemIndex] = Math.max(adjXMap[mm.smoMeasure.measureNumber.systemIndex], mm.smoMeasure.svg.adjX);
      });
      vxMeasures.forEach((vv: VxMeasure) => {
        if (!vv.rendered && !vv.smoMeasure.svg.hideEmptyMeasure && vv.stave) {
          vv.stave.setNoteStartX(vv.stave.getNoteStartX() + adjXMap[vv.smoMeasure.measureNumber.systemIndex] - vv.smoMeasure.svg.adjX);
          const systemGroup = this.score.getSystemGroupForStaff(vv.selection);
          const justifyGroup: string = (systemGroup && vv.smoMeasure.format.autoJustify) ? systemGroup.attrs.id : vv.selection.staff.attrs.id;
          if (!smoGroupMap[justifyGroup]) {
            smoGroupMap[justifyGroup] = { firstMeasure: vv, voices: [] };
          }
          smoGroupMap[justifyGroup].voices =
            smoGroupMap[justifyGroup].voices.concat(vv.voiceAr);
          if (vv.tabVoice) {
            smoGroupMap[justifyGroup].voices.concat(vv.tabVoice);
          }
        }
      });
    }
    const keys = Object.keys(smoGroupMap);
    keys.forEach((key) => {
      smoGroupMap[key].firstMeasure.format(smoGroupMap[key].voices);
    });
    if (lastStaff) {
      vxMeasures.forEach((vv) => {
        if (!vv.rendered) {
          vv.render();
        }
      });
    }
    // Keep track of the y coordinate for the nth staff
    const renderedConnection: Record<string, number> = {};

    if (systemIndex === 0 && lastStaff) {
      if (staff.bracketMap[this.lineIndex]) {
        staff.bracketMap[this.lineIndex].forEach((element) => {
          RemoveElementLike(element);
        });
      }
      staff.bracketMap[this.lineIndex] = [];
      const group = this.context.getContext().openGroup();
      group.classList.add('lineBracket-' + this.lineIndex);
      group.classList.add('lineBracket');
      staff.bracketMap[this.lineIndex].push(group);
      vxMeasures.forEach((vv) => {
        const systemGroup = this.score.getSystemGroupForStaff(vv.selection);
        if (systemGroup && !renderedConnection[systemGroup.attrs.id] && 
          !vv.smoMeasure.svg.hideEmptyMeasure) {
          renderedConnection[systemGroup.attrs.id] = 1;
          const startSel = this.vxMeasures[systemGroup.startSelector.staff];
          const endSel = this.vxMeasures[systemGroup.endSelector.staff];
          if (startSel && startSel.rendered && 
             endSel && endSel.rendered) {
            const c1 = new VF.StaveConnector(startSel.stave!, endSel.stave!)
              .setType(leftConnectorVx(systemGroup));
            c1.setContext(this.context.getContext()).draw();
            brackets = true;
          }
        }
      });
      if (!brackets && vxMeasures.length > 1) {
        const c2 = new VF.StaveConnector(vxMeasures[0].stave!, vxMeasures[vxMeasures.length - 1].stave!);
        c2.setType(VF.StaveConnector.type.SINGLE_RIGHT);
        c2.setContext(this.context.getContext()).draw();
      }
        // draw outer brace on parts with multiple staves (e.g. keyboards)
      vxMeasures.forEach((vv) => {
        if (vv.selection.staff.partInfo.stavesAfter > 0) {
          if (this.vxMeasures.length > vv.selection.selector.staff + 1) {
            const endSel = this.vxMeasures[vv.selection.selector.staff + 1];
            const startSel = vv;
            if (startSel && startSel.rendered && 
              endSel && endSel.rendered) {
                const c1 = new VF.StaveConnector(startSel.stave!, endSel.stave!)
                .setType(VF.StaveConnector.type.BRACE);
              c1.setContext(this.context.getContext()).draw();                
            }
          }
        };
      });
      this.context.getContext().closeGroup();
    } else if (lastStaff && smoMeasure.measureNumber.measureIndex + 1 < staff.measures.length) {
      if (staff.measures[smoMeasure.measureNumber.measureIndex + 1].measureNumber.systemIndex === 0) {
        const endMeasure = vxMeasure;
        const startMeasure = vxMeasures.find((vv) => vv.selection.selector.staff === 0 &&
          vv.selection.selector.measure === vxMeasure.selection.selector.measure && 
          vv.smoMeasure.svg.hideEmptyMeasure === false);
        if (endMeasure && endMeasure.stave && startMeasure && startMeasure.stave) {
          const group: ElementLike = this.context.getContext().openGroup();
          group.classList.add('endBracket-' + this.lineIndex);
          group.classList.add('endBracket');
          staff.bracketMap[this.lineIndex].push(group);
          const c2 = new VF.StaveConnector(startMeasure.stave, endMeasure.stave)
            .setType(VF.StaveConnector.type.SINGLE_RIGHT);
          c2.setContext(this.context.getContext()).draw();
          this.context.getContext().closeGroup();
        }
      }
    }
    // keep track of left-hand side for system connectors
    if (systemIndex === 0) {
      if (staffId === 0) {
        this.leftConnector[0] = vxMeasure.stave;
      } else if (staffId > this.maxStaffIndex) {
        this.maxStaffIndex = staffId;
        this.leftConnector[1] = vxMeasure.stave;
      }
    } else if (smoMeasure.measureNumber.systemIndex > this.maxSystemIndex) {
      this.maxSystemIndex = smoMeasure.measureNumber.systemIndex;
    }
    this.measures.push(vxMeasure);
  }
}
