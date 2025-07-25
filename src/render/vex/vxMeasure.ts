// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
// ## Description:
// This file calls the vexflow routines that actually render a
// measure of music.  If multiple measures are justified in a
// column, the rendering is deferred until all the measures have been
// preformatted.
import { SmoNote } from '../../smo/data/note';
import { SmoMusic } from '../../smo/data/music';
import { layoutDebug } from '../sui/layoutDebug';
import { SmoRepeatSymbol, SmoMeasureText, SmoBarline, SmoMeasureModifierBase, SmoRehearsalMark } from '../../smo/data/measureModifiers';
import { SourceSerifProFont } from '../../styles/font_metrics/ssp-serif-metrics';
import { SmoOrnament, SmoDynamicText, 
  SmoNoteModifierBase, SmoTabNote } from '../../smo/data/noteModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoMeasure, MeasureTickmaps } from '../../smo/data/measure';
import { SvgHelpers } from '../sui/svgHelpers';
import { Clef, IsClef, ElementLike } from '../../smo/data/common';
import { SvgPage } from '../sui/svgPageMap';
import { SmoTabStave } from '../../smo/data/staffModifiers';
import { toVexBarlineType, vexBarlineType, vexBarlinePosition, toVexBarlinePosition, toVexSymbol,
  toVexTextJustification, toVexTextPosition, getVexChordBlocks, toVexStemDirection,
  VexTabNotePositions } from './smoAdapter';
import { VexFlow, Stave,StemmableNote, Note, Beam, Tuplet, Voice,
  Formatter, Accidental, Annotation, StaveNoteStruct, StaveText, StaveModifier,
  createStaveText, renderDynamics, applyStemDirection,
  getVexNoteParameters, defaultNoteScale, defaultCueScale, getVexTuplets,
  createStave, createVoice, getOrnamentGlyph, getSlashGlyph, getRepeatBar, getMultimeasureRest,
  createTextNote, TabStave, createTabStave, TabNotePosition, TabNoteStruct,
  CreateVexNoteParams, TabNote, PedalMarking
   } from '../../common/vex';

import { VxMeasureIf, VexNoteModifierIf, VxNote } from './vxNote';
import { SmoTuplet } from '../../smo/data/tuplet';
import { vexGlyph } from './glyphDimensions';
const VF = VexFlow;

declare var $: any;
// const VF = eval('Vex.Flow');

/**
 * This is the interface for VexFlow library that actually does the engraving.
 * @category SuiRender
 */
export class VxMeasure implements VxMeasureIf {
  context: SvgPage;
  printing: boolean;
  selection: SmoSelection;
  softmax: number;
  smoMeasure: SmoMeasure;
  smoTabStave?: SmoTabStave;
  tabStave?: TabStave;
  rendered: boolean = false;
  noteToVexMap: Record<string, Note> = {};
  beamToVexMap: Record<string, Beam> = {};
  tupletToVexMap: Record<string, Tuplet> = {};
  multimeasureRest: any | null = null;
  vexNotes: Note[] = [];
  vexBeamGroups: Beam[] = [];
  vexTuplets: Tuplet[] = [];
  tickmapObject: MeasureTickmaps | null = null;
  stave: Stave | null = null; // vex stave
  voiceNotes: Note[] = []; // notes for current voice, as rendering
  tabNotes: Note[] = [];
  voiceAr: Voice[] = [];
  tabVoice: Voice | null = null;
  formatter: Formatter | null = null;
  allCues: boolean = false;
  modifiersToBox: SmoNoteModifierBase[] = [];
  collisionMap: Record<number, SmoNote[]> = {};
  dbgLeftX: number = 0;
  dbgWidth: number = 0;

  constructor(context: SvgPage, selection: SmoSelection, printing: boolean, softmax: number) {
    this.context = context;
    this.rendered = false;
    this.selection = selection;
    this.smoMeasure = this.selection.measure;
    this.printing = printing;
    this.allCues = selection.staff.partInfo.displayCues;
    this.tupletToVexMap = {};
    this.vexNotes = [];
    this.vexBeamGroups = [];
    this.vexBeamGroups = [];
    this.beamToVexMap = {};
    this.softmax = softmax;
    this.smoTabStave = selection.staff.getTabStaveForMeasure(selection.selector);
  }

  static get fillStyle() {
    return '#000';
  }
  // Treat a rest like a whole rest if there is only a single rest in the measure
  // and the measure length is not a pickup
  isWholeRest() {
    return (this.smoMeasure.voices.length === 1 &&
      this.smoMeasure.voices[0].notes.length === 1 &&
      this.smoMeasure.voices[0].notes[0].isRest() &&
      this.smoMeasure.getMaxTicksVoice() > 4096
      );
  }
  createCollisionTickmap() {
    let i = 0;
    let j = 0;
    if (!this.tickmapObject) {
      return;
    }
    for (i = 0; i < this.smoMeasure.voices.length; ++i) {
      const tm = this.tickmapObject.tickmaps[i];
      for (j = 0; j < tm.durationMap.length; ++j) {
        if (typeof(this.collisionMap[tm.durationMap[j]]) === 'undefined') {
          this.collisionMap[tm.durationMap[j]] = [];
        }
        this.collisionMap[tm.durationMap[j]].push(this.smoMeasure.voices[i].notes[j]);
      }
    }
  }
  isCollision(voiceIx: number, tickIx: number): boolean {
    let i = 0;
    let j = 0;
    let k = 0;
    let staffLines: number[] = [];
    if (!this.tickmapObject) {
      return false;
    }
    const tick = this.tickmapObject.tickmaps[voiceIx].durationMap[tickIx];
    // Just one note, no collision
    if (this.collisionMap[tick].length < 2) {
      return false;
    }
    for (i = 0; i < this.collisionMap[tick].length; ++i) {
      const note = this.collisionMap[tick][i];
      for (j = 0; j < note.pitches.length; ++j) {
        const clef: Clef = IsClef(note.clef) ? note.clef : 'treble';
        const pitch = note.pitches[j];
        const curLine = SmoMusic.pitchToStaffLine(clef, pitch);
        for (k = 0;k < staffLines.length; ++k) {
          if (Math.abs(curLine - staffLines[k]) < 1) {
            return true;
          }
        }
        staffLines.push(curLine);
      }
    }
    return false;
  }

  /**
   * convert a smoNote into a vxNote so it can be rasterized
   * @param smoNote 
   * @param tickIndex - used to calculate accidental
   * @param voiceIx 
   * @returns 
   */
  createVexNote(smoNote: SmoNote, tickIndex: number, voiceIx: number) {
    let vexNote: Note | null = null;
    let smoTabNote: SmoTabNote | null = null;
    let timestamp = new Date().valueOf();
    const stemTicks = SmoMusic.ticksToDuration[smoNote.stemTicks];
    let tabNote: StemmableNote | null = null;
    const noteHead = smoNote.isRest() ? 'r' : smoNote.noteHead;
    const keys = SmoMusic.smoPitchesToVexKeys(smoNote.pitches, 0, noteHead);
    const smoNoteParams = {
      isTuplet: smoNote.isTuplet,
      measureIndex: this.smoMeasure.measureNumber.measureIndex,
      clef: smoNote.clef,
      stemTicks,
      keys,
      noteType: smoNote.noteType,
      isCue: smoNote.isCue
    };
    const { noteParams, duration } = getVexNoteParameters(smoNoteParams);
    if (this.tabStave && this.smoTabStave) {
      smoTabNote = this.smoTabStave.getTabNoteFromNote(smoNote, this.smoMeasure.transposeIndex);
      if (smoTabNote) {
        const positions: TabNotePosition[] = VexTabNotePositions(this.smoTabStave, smoTabNote, smoNote);
        if (positions.length) {
          if (!smoNote.isRest()) {
            tabNote = new VF.TabNote({ positions, duration: duration });
            if (this.smoTabStave.showStems) {
              tabNote.render_options.draw_stem = true;
              tabNote.render_options.draw_dots = true;
              tabNote.render_options.draw_stem_through_stave = smoTabNote.flagThrough;
            }
          } else {
            tabNote = new VF.StaveNote(noteParams);
          }
        }
      }
    }
    if (smoNote.noteType === '/') {
      // vexNote = new VF.GlyphNote('\uE504', { duration });
      vexNote = getSlashGlyph();
      smoNote.renderId = 'vf-' + vexNote.getAttribute('id'); // where does 'vf' come from?
    } else {
      const smoVexStemParams = {
        voiceCount: this.smoMeasure.voices.length,
        voiceIx,
        isAuto: smoNote.flagState === SmoNote.flagStates.auto,
        isUp: smoNote.flagState === SmoNote.flagStates.up
      }
      applyStemDirection(smoVexStemParams, noteParams);
      if (smoTabNote && tabNote) {
        tabNote.setStemDirection(noteParams.stem_direction);
      }
      layoutDebug.setTimestamp(layoutDebug.codeRegions.PREFORMATA, new Date().valueOf() - timestamp);
      timestamp = new Date().valueOf();
      vexNote = new VF.StaveNote(noteParams);
      if (voiceIx > 0 && this.isCollision(voiceIx, tickIndex)) {
        vexNote.setXShift(-10);
      }
      if (this.isWholeRest()) {
        noteParams.duration = 'wr';
        vexNote = new VF.StaveNote(noteParams);
        vexNote.setCenterAlignment(true);
      }
      layoutDebug.setTimestamp(layoutDebug.codeRegions.PREFORMATB, new Date().valueOf() - timestamp);
      timestamp = new Date().valueOf();
      if (smoNote.fillStyle && !this.printing) {
        vexNote.setStyle({ fillStyle: smoNote.fillStyle });
      } else if (voiceIx > 0 && !this.printing) {
        vexNote.setStyle({ fillStyle: "#115511" });
      } else if (smoNote.isHidden() && this.printing) {
        vexNote.setStyle({ fillStyle: "#ffffff00" });
      }
      smoNote.renderId = 'vf-' + vexNote.getAttribute('id'); // where does 'vf' come from?
    }
    const noteData: VexNoteModifierIf = {
      smoMeasure: this.smoMeasure,
      vxMeasure: this,
      smoNote: smoNote,
      staveNote: vexNote,
      voiceIndex: voiceIx,
      tickIndex: tickIndex
    }
    if (tabNote) {
      noteData.tabNote = tabNote;
      this.tabNotes.push(tabNote);
    }
    const modObj = new VxNote(noteData);
    modObj.addModifiers();
    layoutDebug.setTimestamp(layoutDebug.codeRegions.PREFORMATC, new Date().valueOf() - timestamp);

    return modObj;
  }

  renderNoteGlyph(smoNote: SmoNote, textObj: SmoDynamicText) {
    var x = this.noteToVexMap[smoNote.attrs.id].getAbsoluteX() + textObj.xOffset;
    // the -3 is copied from vexflow textDynamics
    var y = this.stave!.getYForLine(textObj.yOffsetLine - 3) + textObj.yOffsetPixels;
    let maxh = 0;
    const minx = x;
    var group: ElementLike = this.context.getContext().openGroup();
    group.classList.add(textObj.attrs.id + '-' + smoNote.attrs.id);
    group.classList.add(textObj.attrs.id);
    // const duration = SmoMusic.closestVexDuration(smoNote.tickCount);
    for (var i = 0; i < textObj.text.length; i += 1 ) {
      const { width , height } = renderDynamics(this.context.getContext(), VF.TextDynamics.GLYPHS[textObj.text[i]].code,
        textObj.fontSize, x, y);
      /* const { width , height } = renderDynamics(this.context.getContext(), VF.TextDynamics.GLYPHS[textObj.text[i]],
        textObj.fontSize, x, y); */
      x += width;
      maxh = Math.max(height, maxh);      
    }
    textObj.logicalBox = SvgHelpers.boxPoints(minx, y + this.context.box.y, x - minx, maxh);
    textObj.element = group;
    this.modifiersToBox.push(textObj);
    this.context.getContext().closeGroup();
  }

  renderDynamics() {
    this.smoMeasure.voices.forEach((voice) => {
      voice.notes.forEach((smoNote) => {
        const mods = smoNote.textModifiers.filter((mod) =>
          mod.attrs.type === 'SmoDynamicText'
        );
        mods.forEach((btm) => {
          const tm = btm as SmoDynamicText;
          this.renderNoteGlyph(smoNote, tm);
        });
      });
    });
  }
  createRepeatSymbol() {
    this.voiceNotes = [];
    // const vexNote = new VF.GlyphNote('\uE500', { duration: 'w' }, { line: 2 });
    const vexNote = getRepeatBar();
    vexNote.setCenterAlignment(true);
    this.vexNotes.push(vexNote);
    this.voiceNotes.push(vexNote);
  }
  /**
   * create an a array of VF.StaveNote objects to render the active voice.
   * @param voiceIx 
   */
  createVexNotes(voiceIx: number) {
    let i = 0;
    this.voiceNotes = [];
    const voice = this.smoMeasure.voices[voiceIx];
    let clefNoteAdded = false;

    for (i = 0;
      i < voice.notes.length; ++i) {
      const smoNote = voice.notes[i];
      const textNotes = smoNote.getTextOrnaments();
      const vexNote = this.createVexNote(smoNote, i, voiceIx);
      this.noteToVexMap[smoNote.attrs.id] = vexNote.noteData.staveNote;
      this.vexNotes.push(vexNote.noteData.staveNote);

      if (vexNote.noteData.smoNote.clefNote && !clefNoteAdded) {
        const cf = new VF.ClefNote(vexNote.noteData.smoNote.clefNote.clef, 'small');
        this.voiceNotes.push(cf);
        clefNoteAdded = true; // ignore 2nd in a measure
      }
      this.voiceNotes.push(vexNote.noteData.staveNote);
      textNotes.forEach((tn) => {
        this.voiceNotes.push(createTextNote(SmoOrnament.textNoteOrnaments[tn.ornament]));
      });
      if (isNaN(smoNote.ticks.numerator) || isNaN(smoNote.ticks.denominator)
        || isNaN(smoNote.ticks.remainder)) {
        throw ('vxMeasure: NaN in ticks');
      }
    }
  }

  /**
   * Group the notes for beaming and create Vex beam objects
   * @param vix - voice index
   * @returns 
   */
  createVexBeamGroups(vix: number) {
    let keyNoteIx = -1;
    let i = 0;
    let j = 0;
    let stemDirection = VF.Stem.DOWN;
    for (i = 0; i < this.smoMeasure.beamGroups.length; ++i) {
      const bg = this.smoMeasure.beamGroups[i];
      if (bg.voice !== vix) {
        continue;
      }
      const vexNotes: StemmableNote[] = [];
      keyNoteIx = bg.notes.findIndex((nn) => nn.noteType === 'n');

      // Fix stem bug: key off first non-rest note.
      keyNoteIx = (keyNoteIx >= 0) ? keyNoteIx : 0;
      for (j = 0; j < bg.notes.length; ++j) {
        const note = bg.notes[j];
        if (note.noteType === '/') {
          continue;
        }
        const vexNote = this.noteToVexMap[note.attrs.id];
        // some type of redraw condition?
        if (!(vexNote instanceof VF.StaveNote || vexNote instanceof VF.GraceNote)) {
          return;
        }
        if (note.tickCount >= 4096 || vexNote.getIntrinsicTicks() >= 4096) {
          console.warn('bad length in beam group');
          return;
        }
        if (keyNoteIx === j) {
          stemDirection = note.flagState === SmoNote.flagStates.auto ?
            vexNote.getStemDirection() : toVexStemDirection(note);
        }
        vexNote.setStemDirection(stemDirection);
        vexNotes.push(vexNote);  
      }
      const vexBeam = new VF.Beam(vexNotes);
      vexBeam.breakSecondaryAt(bg.secondaryBeamBreaks);
      this.beamToVexMap[bg.attrs.id] = vexBeam;
      this.vexBeamGroups.push(vexBeam);
    }
  }

  createVexTuplets(vix: number) {
    this.vexTuplets = [];
    this.tupletToVexMap = {};
    for (let i = 0; i < this.smoMeasure.tupletTrees.length; ++i) {
      const tupletTree = this.smoMeasure.tupletTrees[i];
      if (tupletTree.voice !== vix) {
        continue;
      }
      const traverseTupletTree = ( parentTuplet: SmoTuplet): void => {
        const vexNotes: Note[] = [];
        for (let smoNote of this.smoMeasure.tupletNotes(parentTuplet)) {
          vexNotes.push(this.noteToVexMap[smoNote.attrs.id]);
        }
        // If the tuplet has been deleted, the measure might not be updated.
        if (vexNotes.length < 2) {
          return;
        }
        const location = this.smoMeasure.getStemDirectionForTuplet(parentTuplet) === SmoNote.flagStates.up ?
          VF.Tuplet.LOCATION_TOP : VF.Tuplet.LOCATION_BOTTOM;
        const smoTupletParams = {
          vexNotes,
          numNotes: parentTuplet.numNotes,
          notesOccupied: parentTuplet.notesOccupied,
          ratioed: parentTuplet.ratioed,
          bracketed: parentTuplet.bracketed,
          location
        }
        const vexTuplet = getVexTuplets(smoTupletParams);

        this.tupletToVexMap[parentTuplet.attrs.id] = vexTuplet;
        this.vexTuplets.push(vexTuplet);
        for (let i = 0; i < parentTuplet.childrenTuplets.length; i++) {
          const tuplet = parentTuplet.childrenTuplets[i];
          traverseTupletTree(tuplet);
        }
      }
      traverseTupletTree(tupletTree.tuplet);
    }
  }

  /**
   * create the modifiers for the stave itself, bar lines etc.
   */
  createMeasureModifiers() {
    const sb = this.smoMeasure.getStartBarline();
    const eb = this.smoMeasure.getEndBarline();
    const sym = this.smoMeasure.getRepeatSymbol();
    if (!this.stave) {
      return;
    }

    // don't create a begin bar for any but the 1st measure.
    if (this.smoMeasure.measureNumber.systemIndex !== 0 && sb.barline === SmoBarline.barlines.singleBar
      && this.smoMeasure.format.padLeft === 0) {
      this.stave.setBegBarType(VF.Barline.type.NONE);
    } else {
      this.stave.setBegBarType(toVexBarlineType(sb));
    }
    if (this.smoMeasure.svg.multimeasureLength > 0 && !this.smoMeasure.svg.hideMultimeasure) {
      this.stave.setEndBarType(vexBarlineType[this.smoMeasure.svg.multimeasureEndBarline]);
    } else if (eb.barline !== SmoBarline.barlines.singleBar) {
      this.stave.setEndBarType(toVexBarlineType(eb));
    }
    if (sym && sym.symbol !== SmoRepeatSymbol.symbols.None) {
      const rep = new VF.Repetition(toVexSymbol(sym), sym.xOffset + this.smoMeasure.staffX, sym.yOffset);
      this.stave.getModifiers().push(rep);
    }
    const tms = this.smoMeasure.getMeasureText();
    // TODO: set font
    tms.forEach((tmb: SmoMeasureModifierBase) => {
      const tm = tmb as SmoMeasureText;
      const offset = tm.position === SmoMeasureText.positions.left ? this.smoMeasure.format.padLeft : 0;
      const staveText = createStaveText(tm.text, toVexTextPosition(tm), 
      {
        shiftX: tm.adjustX + offset, shiftY: tm.adjustY, justification: toVexTextJustification(tm)
      }
      );
      this.stave?.addModifier(staveText);

      // hack - we can't create staveText directly so this is the only way I could set the font
      const ar = this.stave!.getModifiers();
      const vm = ar[ar.length - 1];
      vm.setFont(tm.fontInfo);
    });
    if (this.smoMeasure.svg.rowInSystem === 0) {
      const rmb = this.smoMeasure.getRehearsalMark();
      const rm = rmb as SmoRehearsalMark;
      if (rm) {
        this.stave.setSection(rm.symbol, 0);
      }
    }

    const tempo = this.smoMeasure.getTempo();
    if (tempo && this.smoMeasure.svg.forceTempo) {
      this.stave.setTempo(tempo.toVexTempo(), -1 * tempo.yOffset);
      const vexTempo = this.stave.getModifiers().find((mod: StaveModifier) => mod.getAttribute('type') === 'StaveTempo');
      if (vexTempo) {
        vexTempo.setFont({ family: SourceSerifProFont.fontFamily, size: 13, weight: 'bold' });
      }
    }
  }

  /**
   * Create all Vex notes and modifiers.  We defer the format and rendering so
   * we can align across multiple staves
   */
  preFormat() {
    var j = 0;
    if (this.smoMeasure.svg.element !== null) {
      this.smoMeasure.svg.element.remove();
      this.smoMeasure.svg.element = null;
      if (this.smoMeasure.svg.tabElement) {
        this.smoMeasure.svg.tabElement.remove();
        this.smoMeasure.svg.tabElement = undefined;
      }
    }
    if (this.smoMeasure.svg.hideEmptyMeasure) {
      return;
    }
    // Note: need to do this to get it into VEX KS format
    const staffX = this.smoMeasure.staffX + this.smoMeasure.format.padLeft;
    const staffY = this.smoMeasure.staffY - this.context.box.y;
    const key = SmoMusic.vexKeySignatureTranspose(this.smoMeasure.keySignature, 0);
    const canceledKey = SmoMusic.vexKeySignatureTranspose(this.smoMeasure.canceledKeySignature, 0);
    const smoVexStaveParams = {
      x: staffX,
      y: staffY,
      padLeft: this.smoMeasure.format.padLeft,
      id: this.smoMeasure.id,
      staffX: this.smoMeasure.staffX,
      staffY: this.smoMeasure.staffY,
      staffWidth: this.smoMeasure.staffWidth,
      forceClef: this.smoMeasure.svg.forceClef,
      clef: this.smoMeasure.clef,
      forceKey: this.smoMeasure.svg.forceKeySignature,
      key,
      canceledKey,
      startX: this.smoMeasure.svg.maxColumnStartX,
      adjX: this.smoMeasure.svg.adjX,
      lines: this.smoMeasure.lines,
      context: this.context.getContext()
    }
    this.stave = createStave(smoVexStaveParams);
    if (this.smoMeasure.svg.forceTimeSignature) {
      const ts = this.smoMeasure.timeSignature;
      let tsString = ts.timeSignature;
      if (this.smoMeasure.timeSignature.useSymbol && ts.actualBeats === 4 && ts.beatDuration === 4) {
        tsString = 'C';
      } else if (this.smoMeasure.timeSignature.useSymbol && ts.actualBeats === 2 && ts.beatDuration === 4) {
        tsString = 'C|';
      } else if (this.smoMeasure.timeSignature.displayString.length) {
        tsString = this.smoMeasure.timeSignature.displayString;
      }
      this.stave.addTimeSignature(tsString);
    }
    // Connect it to the rendering context and draw!
    this.stave.setContext(this.context.getContext());
    if (this.smoTabStave && this.smoMeasure.svg.tabStaveBox?.width) {
      const box = this.smoMeasure.svg.tabStaveBox;
      let tabWidth = 0;
      box.y -= this.context.box.y;
      box.x = staffX - this.context.box.x;
      box.width = this.smoMeasure.staffWidth;
      this.tabStave = createTabStave(box, this.smoTabStave.spacing, this.smoTabStave.numLines);
      if (this.smoMeasure.svg.forceClef) {
        this.tabStave.addTabGlyph();
        tabWidth = vexGlyph.dimensions['tab'].width;
      }
      this.tabStave.setNoteStartX(this.tabStave.getNoteStartX() + this.smoMeasure.svg.adjX - tabWidth);
      this.tabStave.setContext(this.context.getContext());
    }

    this.createMeasureModifiers();

    this.tickmapObject = this.smoMeasure.createMeasureTickmaps();
    this.createCollisionTickmap();

    this.voiceAr = [];
    this.vexNotes = [];
    this.noteToVexMap = {};

    // If there are multiple voices, add them all to the formatter at the same time so they don't collide
    for (j = 0; j < this.smoMeasure.voices.length; ++j) {
      const smoVexVoiceParams = {
        actualBeats: this.smoMeasure.timeSignature.actualBeats,
        beatDuration: this.smoMeasure.timeSignature.beatDuration,
        notes: this.vexNotes
      }
    if (!this.smoMeasure.svg.multimeasureLength && !this.smoMeasure.repeatSymbol) {
        this.createVexNotes(j);
        smoVexVoiceParams.notes = this.voiceNotes;
        this.createVexTuplets(j);
        this.createVexBeamGroups(j);

        // Create a voice in 4/4 and add above notes
        const voice = createVoice(smoVexVoiceParams);
        this.voiceAr.push(voice);
      }
      if (this.smoMeasure.repeatSymbol) {
        this.createRepeatSymbol();
        // Create a voice in 4/4 and add above notes
        const voice = createVoice(smoVexVoiceParams);
        this.voiceAr.push(voice);
      }
    }
    // Need to format for x position, then set y position before drawing dynamics.
    this.formatter = new VF.Formatter({ softmaxFactor: this.softmax, globalSoftmax: false });
    this.formatter.joinVoices(this.voiceAr);
    if (this.tabStave) {
      this.tabVoice = createVoice({
        actualBeats: this.smoMeasure.timeSignature.actualBeats,
        beatDuration: this.smoMeasure.timeSignature.beatDuration,
        notes: this.tabNotes
      });
      this.formatter.joinVoices([this.tabVoice]);
    }
  }
  /**
   * Create the Vex formatter that calculates the X and Y positions of the notes.  A formatter
   * may actually span multiple staves for justified staves.  The notes are drawn in their
   * individual vxMeasure objects but formatting is done once for all justified staves
   * @param voices Voice objects from VexFlow
   * @returns 
   */
  format(voices: Voice[]) {
    if (this.smoMeasure.svg.hideEmptyMeasure) {
      return;
    }

    if (this.smoMeasure.svg.multimeasureLength > 0) {
      this.multimeasureRest = getMultimeasureRest(this.smoMeasure.svg.multimeasureLength);
      this.multimeasureRest.setContext(this.context.getContext());
      this.multimeasureRest.setStave(this.stave);
      return;
    }
    if (!this.formatter) {
      return;
    }
    const timestamp = new Date().valueOf();
    const staffWidth = this.smoMeasure.staffWidth -
      (this.smoMeasure.svg.maxColumnStartX + this.smoMeasure.svg.adjRight + this.smoMeasure.format.padLeft) - 10;
    this.dbgLeftX = this.smoMeasure.staffX +  this.smoMeasure.format.padLeft + this.smoMeasure.svg.adjX;
    this.dbgWidth = staffWidth;
    this.formatter.format(voices, staffWidth);
    if (this.tabVoice && this.tabNotes.length) {
      this.formatter.format([this.tabVoice], staffWidth);
    }
    layoutDebug.setTimestamp(layoutDebug.codeRegions.FORMAT, new Date().valueOf() - timestamp);
  }
  /**
   * render is called after format.  Actually draw the things.
   */
  render() {
    if (this.smoMeasure.svg.hideEmptyMeasure) {
      return;
    }

    var group = this.context.getContext().openGroup() as SVGSVGElement;
    var mmClass = this.smoMeasure.getClassId();
    var j = 0;
    try {
      // bound each measure in its own SVG group for easy deletion and mapping to screen coordinate
      group.classList.add(this.smoMeasure.id);
      group.classList.add(mmClass);
      group.id = this.smoMeasure.id;
      this.stave!.draw();
      this.smoMeasure.svg.element = group;

      for (j = 0; j < this.voiceAr.length; ++j) {
        this.voiceAr[j].draw(this.context.getContext(), this.stave!);
      }
      this.vexBeamGroups.forEach((b) => {
        b.setContext(this.context.getContext()).draw();
      });

      this.vexTuplets.forEach((tuplet) => {
        tuplet.setContext(this.context.getContext()).draw();
      });
      if (this.multimeasureRest) {
        this.multimeasureRest.draw();
      }
      // this._updateLyricDomSelectors();
      this.renderDynamics();
      // this.smoMeasure.adjX = this.stave.start_x - (this.smoMeasure.staffX);

      this.context.getContext().closeGroup();
      if (this.tabStave) {
        const tabStaveId = `${this.smoMeasure.id}-tab`;
        const tabGroup = this.context.getContext().openGroup() as SVGSVGElement;
        tabGroup.classList.add(tabStaveId);
        this.tabStave.draw();
        this.tabVoice?.draw(this.context.getContext(), this.tabStave);
        this.context.getContext().closeGroup();
        this.smoMeasure.svg.tabElement = tabGroup;
      }
      // layoutDebug.setTimestamp(layoutDebug.codeRegions.RENDER, new Date().valueOf() - timestamp);

      this.rendered = true;
      if (layoutDebug.mask & layoutDebug.values['adjust']) {
        SvgHelpers.debugBoxNoText(this.context.getContext().svg,
        SvgHelpers.boxPoints(this.dbgLeftX, 
          this.smoMeasure.svg.staffY, this.dbgWidth, 40), 'render-x-dbg', 0);
      }
    } catch (exc) {
      console.warn('unable to render measure ' + this.smoMeasure.measureNumber.measureIndex);
      this.context.getContext().closeGroup();
    }
  }
}
