// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { Clef, Pitch } from '../data/common';
import { SmoNote } from '../data/note';
import { SmoMusic } from '../data/music';
import { SmoMeasure, SmoVoice } from '../data/measure';
import { SmoSystemStaff } from '../data/systemStaff';
import { SmoScore } from '../data/score';
import { SmoBarline, TimeSignature, SmoRehearsalMark, SmoMeasureModifierBase } from '../data/measureModifiers';
import { SmoStaffHairpin, SmoSlur, SmoTie } from '../data/staffModifiers';
import { SmoArticulation, SmoLyric, SmoOrnament } from '../data/noteModifiers';
import { SmoSelector } from '../xform/selections';
import { SmoTuplet, SmoTupletTree } from '../data/tuplet';

import { XmlHelpers } from './xmlHelpers';
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoTempoText } from '../data/measureModifiers';
import { XmlToSmo } from './xmlToSmo';
import { SmoSystemGroup } from '../data/scoreModifiers';
import { SuiSampleMedia } from '../../render/audio/samples';

/**
 * @category serialization
 */
export interface SlurXml {
  startSelector: SmoSelector,
  endSelector: SmoSelector,
  number: number
}
/**
 * Keep state of the xml document as we are generating it
 * @category serialization
 */
export interface SmoState {
  divisions: number,
  measureNumber: number,
  measureIndex: number,
  transposeOffset: number,
  tickCount: number,
  voiceIndex: number,
  keySignature: string,
  voiceTickIndex: number,
  voice?: SmoVoice,
  partStaves: SmoSystemStaff[],
  staffPartIx: number, // index of staff in part
  slurs: SlurXml[],
  ties: SlurXml[],
  tieds: SlurXml[],
  lyricState: Record<number, string>,
  measureTicks: number,
  note?: SmoNote,
  beamState: number,
  beamTicks: number,
  timeSignature?: TimeSignature,
  tempo?: SmoTempoText,
  currentTupletLevel: number, // not sure about the name
}

/**
 * Convert {@link SmoScore} object into a music XML serialization
 * 
 * usage: `xdoc: XmlDocument = SmoToXml.convert(score)`
 * @category serialization
 */
export class SmoToXml {
  static get beamStates(): Record<string, number> {
    return {
      none: 1, start: 2, continue: 3, stop: 4
    };
  }
  static get defaultState(): SmoState {
    return JSON.parse(JSON.stringify({
      divisions: 0,
      measureNumber: 0,
      measureIndex: 0,
      transposeOffset: 0,
      tickCount: 0,
      voiceIndex: 0,
      keySignature: 'C',
      voiceTickIndex: 0,
      slurs: [],
      ties: [],
      partStaves: [],
      lyricState: {},
      measureTicks: 0,
      beamState: 0,
      beamTicks: 4096,
      currentTupletLevel: 0,
    }));
  }
  /**
   * see usage
   * @param score
   * @returns 
   */
  static convert(score: SmoScore): XMLDocument {
    let staffGroupIx = 0;
    let staffIx = 0;
    const nn = XmlHelpers.createTextElementChild;
    const dom = XmlHelpers.createRootElement();    
    const root = dom.children[0];
    const work = nn(root, 'work', null, '');
    nn(work, 'work-title', score.scoreInfo, 'title');
    const identification = nn(root, 'identification', null, '');
    const creator = nn(identification, 'creator', score.scoreInfo, 'composer');
    XmlHelpers.createAttributes(creator, { type: 'composer' });
    const encoding = nn(identification, 'encoding', null, '');
    nn(encoding, 'software', { software: 'Some pre-release version of Smoosic' }, 'software');
    const today = new Date();
    const dd = (n: number) => n < 10 ? '0' + n.toString() : n.toString()
    const dateString: string = today.getFullYear() + '-' + dd(today.getMonth() + 1) + '-' + dd(today.getDate());
    nn(encoding, 'encoding-date', dateString, 'date');
    const defaults = nn(root, 'defaults', null, '');
    const scaling = nn(defaults, 'scaling', null, '');
    const svgScale = score.layoutManager!.getGlobalLayout().svgScale;

    // music in vexflow is rendered at a font size of 38
    const mm = XmlToSmo.mmPerPixel * 42 * svgScale;
    nn(scaling, 'millimeters', { mm }, 'mm');
    nn(scaling, 'tenths', { tenths: 40 }, 'tenths');
    const pageLayout = nn(defaults, 'page-layout', null, '');
    const musicFont = nn(defaults, 'music-font', null, '');
    const engrave = score.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
    XmlHelpers.createAttribute(musicFont, 'font-size', 38 * svgScale );
    if (engrave) {
      XmlHelpers.createAttribute(musicFont, 'font-family', engrave.family);
    }
    const tenthConversion = (25.2 / 96) * (40 / mm);
    const pageDims = {
      'page-height': score.layoutManager!.globalLayout.pageHeight * tenthConversion,
      'page-width' : score.layoutManager!.globalLayout.pageWidth * tenthConversion
    };
    Object.keys(pageDims).forEach((dim) => {
      nn(pageLayout, dim, pageDims, dim);
    });
    const margins =  { 'left-margin': score.layoutManager!.pageLayouts[0].leftMargin * tenthConversion,
      'right-margin': score.layoutManager!.pageLayouts[0].rightMargin * tenthConversion,
      'top-margin': score.layoutManager!.pageLayouts[0].topMargin * tenthConversion,
      'bottom-margin': score.layoutManager!.pageLayouts[0].bottomMargin * tenthConversion };
    const pageMargins = nn(pageLayout, 'page-margins', null, '');
    Object.keys(margins).forEach((margin) => {
      nn(pageMargins, margin, margins, margin);
    });
    const partList = nn(root, 'part-list', null, '');
    score.staves.forEach((staff) => {
      score.systemGroups.forEach((sg) => {
        if (sg.startSelector.staff === staff.staffId && sg.startSelector.staff < sg.endSelector.staff ) {
          const partGroup = nn(partList, 'part-group', null, '');
          XmlHelpers.createAttributes(partGroup, { number: staffGroupIx, type: 'start' });
          const groupSymbol = nn(partGroup, 'group-symbol', null, '');
          let symbolText = 'line';
          if (sg.leftConnector === SmoSystemGroup.connectorTypes['brace']) {
            symbolText = 'brace';
          } else if (sg.leftConnector === SmoSystemGroup.connectorTypes['bracket']) {
            symbolText = 'bracket';
          } else if (sg.leftConnector === SmoSystemGroup.connectorTypes['double']) {
            symbolText = 'square';
          }
          groupSymbol.textContent = symbolText;
        } else if (sg.endSelector.staff === staff.staffId && sg.startSelector.staff < sg.endSelector.staff ) {
          const partGroup = nn(partList, 'part-group', null, '');
          XmlHelpers.createAttributes(partGroup, { number: staffGroupIx, type: 'stop' });
        }
      });
      if (!staff.partInfo.stavesBefore) {
        const id = 'P' + staff.staffId;
        const scorePart = nn(partList, 'score-part', null, '');
        XmlHelpers.createAttributes(scorePart, { id });
        nn(scorePart, 'part-name', { name: staff.measureInstrumentMap[0].instrumentName }, 'name');
        nn(scorePart, 'part-abbreviation', { name: staff.measureInstrumentMap[0].abbreviation }, 'name');
        const staffInsts = staff.getInstrumentList();
        staffInsts.forEach((inst, ix) => {
          const scoreInstrument = nn(scorePart, 'score-instrument', null, '');
          XmlHelpers.createAttributes(scoreInstrument, { id: `${id}-${ix}` });
          const iname = nn(scoreInstrument, 'instrument-name', null, '');
          iname.textContent = inst.instrumentName;
          const iinst = nn(scoreInstrument, 'instrument-sound', null, '');
          // Hack: family is in the sample library, breaks dependency direction
          const family = SuiSampleMedia.getFamilyForInstrument(inst.instrument);
          iinst.textContent = `${family}.${inst.instrument}`;
        });
      }
    });
    const smoState: SmoState = SmoToXml.defaultState;
    for (staffIx = 0; staffIx < score.staves.length; ++staffIx) {
      smoState.partStaves = [];
      // If this is the second staff in a part, we've already output the music with the
      // first stave
      if (score.staves[staffIx].partInfo.stavesBefore > 0) {
        continue;
      }
      smoState.partStaves.push(score.staves[staffIx]);
      if (smoState.partStaves[0].partInfo.stavesAfter > 0 && staffIx < score.staves.length + 1) {
        smoState.partStaves.push(score.staves[staffIx + 1]);
      }      
      const part = nn(root, 'part', null, '');
      const id = 'P' + smoState.partStaves[0].staffId;
      XmlHelpers.createAttributes(part, { id });
      smoState.measureNumber = 1;
      smoState.tickCount = 0;
      smoState.transposeOffset = 0;
      smoState.slurs = [];
      smoState.ties = [];
      smoState.tieds = [];
      smoState.lyricState = {};
      for (smoState.measureIndex = 0; smoState.measureIndex < smoState.partStaves[0].measures.length; ++smoState.measureIndex) {
        const measureElement = nn(part, 'measure', null, '');
        for (smoState.staffPartIx = 0; smoState.staffPartIx < smoState.partStaves.length; ++smoState.staffPartIx) {
          smoState.measureTicks = 0;
          // each staff in a part goes in the same measure element.  If this is a subsequent part, we've already 
          SmoToXml.measure(measureElement, smoState);
        }
        smoState.measureNumber += 1;
      }
    }
    
    return smoSerialize.prettifyXml(dom);
  }  
  /**
   * /score-partwise/part/measure
   * @param measureElement 
   * @param smoState 
   * @returns 
   */
  static measure(measureElement: Element, smoState: SmoState) {
    const nn = XmlHelpers.createTextElementChild;
    const measure = smoState.partStaves[smoState.staffPartIx].measures[smoState.measureIndex];
    if (smoState.measureNumber === 1 && measure.isPickup()) {
      smoState.measureNumber = 0;
    }
    if (measure.getForceSystemBreak()) {
      const printElement = nn(measureElement, 'print', null, '');
      XmlHelpers.createAttributes(printElement, { 'new-system': 'yes' });
    }
    XmlHelpers.createAttributes(measureElement, { number: smoState.measureNumber });
    SmoToXml.attributes(measureElement, measure, smoState);
    smoState.voiceIndex = 1;
    smoState.beamState = SmoToXml.beamStates.none;
    smoState.beamTicks = 0;
    SmoToXml.barline(measureElement, smoState, true);
    measure.voices.forEach((voice) => {
      smoState.voiceTickIndex = 0;
      smoState.voice = voice;
      voice.notes.forEach((note) => {
        smoState.note = note;
        // Start wedge before note starts
        SmoToXml.direction(measureElement, smoState, true);
        SmoToXml.note(measureElement, measure, note, smoState);
        // End wedge on next tick
        SmoToXml.direction(measureElement, smoState, false);
      });
      // If this is the end of a voice, back up the time to align the voices
      if (measure.voices.length > smoState.voiceIndex) {
        smoState.voiceIndex += 1;
        const backupElement = nn(measureElement, 'backup', null, '');
        nn(backupElement, 'duration', { duration: smoState.measureTicks }, 'duration');
      } else {
        if (smoState.partStaves.length > 1 && smoState.staffPartIx + 1 < smoState.partStaves.length) {
        // If this is the end of a measure, and this is the first part in the staff, back it up for the second staff
        const backupElement = nn(measureElement, 'backup', null, '');
          nn(backupElement, 'duration', { duration: smoState.measureTicks }, 'duration');  
          smoState.tickCount += smoState.measureTicks;
        } else if (smoState.partStaves.length === 1) {
          smoState.tickCount += smoState.measureTicks;
        }
      }
      smoState.measureTicks = 0;
    });
    SmoToXml.barline(measureElement, smoState, false);
  }
  /**
   * /score-partwise/part/measure/barline
   * @param measureElement 
   * @param smoState 
   * @param start 
   */
  static barline(measureElement: Element, smoState: SmoState, start: boolean) {
    const nn = XmlHelpers.createTextElementChild;
    let barlineElement = null;
    const staff = smoState.partStaves[smoState.staffPartIx];
    const measure = staff.measures[smoState.measureIndex];
    if (start) {
      if (measure!.getStartBarline().barline === SmoBarline.barlines.startRepeat) {
        barlineElement = nn(measureElement, 'barline', null, '');
        const repeatElement = nn(barlineElement, 'repeat', null, '');
        XmlHelpers.createAttributes(repeatElement, { direction: 'forward' });
      }
    }
    const voltas = staff.getVoltasForMeasure(measure!.measureNumber.measureIndex);
    const numArray: number[] = [];
    voltas.forEach((volta) => {
      if ((start && volta?.startSelector?.measure === measure.measureNumber.measureIndex) || 
          (!start && volta?.endSelector?.measure === measure.measureNumber.measureIndex)) {
        numArray.push(volta.number);
      }
    });
    if (!start && measure!.getEndBarline().barline === SmoBarline.barlines.endBar) {
      barlineElement = barlineElement ?? nn(measureElement, 'barline', null, '');
      nn(barlineElement, 'bar-style', { style: 'light-heavy'} , 'style');
    } else if (!start && measure!.getEndBarline().barline === SmoBarline.barlines.doubleBar) {
      barlineElement = barlineElement ?? nn(measureElement, 'barline', null, '');
      nn(barlineElement, 'bar-style', { style: 'light-light'} , 'style');
    }
    if (numArray.length) {
      barlineElement = barlineElement ?? nn(measureElement, 'barline', null, '');
      const numstr = numArray.join(',');
      const endElement = nn(barlineElement, 'ending', null, '');
      const endString = start ? 'start' : 'stop';
      XmlHelpers.createAttributes(endElement, { type: endString, number: numstr });
    }
    if (!start && measure!.getEndBarline().barline === SmoBarline.barlines.endRepeat) {
      barlineElement = barlineElement ?? nn(measureElement, 'barline', null, '');
      const repeatElement = nn(barlineElement, 'repeat', null, '');
      XmlHelpers.createAttributes(repeatElement, { direction: 'backward' });
    }
  }

  /**
   * /score-partwise/part/measure/note/tie
   * @param notationsElement 
   * @param smoState 
   */
  static tied(notationsElement: Element, smoState: SmoState) {
    const nn = XmlHelpers.createTextElementChild;
    const staff = smoState.partStaves[smoState.staffPartIx];
    const measure = staff.measures[smoState.measureIndex];
    const getNumberForTie = ((ties: SlurXml[]) => {
      let rv = 1;
      const hash: Record<number, boolean> = {};
      ties.forEach((ss) => {
        hash[ss.number] = true;
      });
      while (rv < 100) {
        if (typeof(hash[rv]) === 'undefined') {
          break;
        }
        rv += 1;
      }
      return rv;
    });
    const selector: SmoSelector = {
      staff: staff.staffId,
      measure: measure.measureNumber.measureIndex,
      voice: smoState.voiceIndex - 1,
      tick: smoState.voiceTickIndex,
      pitches: []
    };
    const starts = staff.getTiesStartingAt(selector) as SmoTie[];
    const ends = staff.getTiesEndingAt(selector) as SmoTie[];
    const remove: SlurXml[] = [];
    const newTies: SlurXml[] = [];
    ends.forEach((tie) => {
      const match = smoState.tieds.find((ss: any) => SmoSelector.eq(ss.startSelector, tie.startSelector) &&
        SmoSelector.eq(ss.endSelector, tie.endSelector));
      if (match) {
        remove.push(match);
        const tieElement = nn(notationsElement, 'tied', null, '');
        XmlHelpers.createAttributes(tieElement, { type: 'stop' });
      }
    });
    smoState.tieds.forEach((tie: any) => {
      if (remove.findIndex((rr) => rr.number === tie.number) < 0) {
        newTies.push(tie);
      }
    });
    smoState.tieds = newTies;
    starts.forEach((tie) => {
      const number = getNumberForTie(smoState.ties);
      smoState.tieds.push({
        startSelector: tie.startSelector,
        endSelector: tie.endSelector,
        number
      });
      const tieElement = nn(notationsElement, 'tied', null, '');
      XmlHelpers.createAttributes(tieElement, { type: 'start' });
    });
  }
  /**
   * /score-partwise/part/measure/note/tie
   * @param noteElement
   * @param smoState 
   */
  static tie(noteElement: Element, smoState: SmoState) {
    const nn = XmlHelpers.createTextElementChild;
    const staff = smoState.partStaves[smoState.staffPartIx];
    const measure = staff.measures[smoState.measureIndex];
    const getNumberForTie = ((ties: SlurXml[]) => {
      let rv = 1;
      const hash: Record<number, boolean> = {};
      ties.forEach((ss) => {
        hash[ss.number] = true;
      });
      while (rv < 100) {
        if (typeof(hash[rv]) === 'undefined') {
          break;
        }
        rv += 1;
      }
      return rv;
    });
    const selector: SmoSelector = {
      staff: staff.staffId,
      measure: measure.measureNumber.measureIndex,
      voice: smoState.voiceIndex - 1,
      tick: smoState.voiceTickIndex,
      pitches: []
    };
    const starts = staff.getTiesStartingAt(selector) as SmoTie[];
    const ends = staff.getTiesEndingAt(selector) as SmoTie[];
    const remove: SlurXml[] = [];
    const newTies: SlurXml[] = [];
    ends.forEach((tie) => {
      const match = smoState.ties.find((ss: any) => SmoSelector.eq(ss.startSelector, tie.startSelector) &&
        SmoSelector.eq(ss.endSelector, tie.endSelector));
      if (match) {
        remove.push(match);
        const tieElement = nn(noteElement, 'tie', null, '');
        XmlHelpers.createAttributes(tieElement, { type: 'stop' });
      }
    });
    smoState.ties.forEach((tie: any) => {
      if (remove.findIndex((rr) => rr.number === tie.number) < 0) {
        newTies.push(tie);
      }
    });
    smoState.ties = newTies;
    starts.forEach((tie) => {
      const number = getNumberForTie(smoState.ties);
      smoState.ties.push({
        startSelector: tie.startSelector,
        endSelector: tie.endSelector,
        number
      });
      const tieElement = nn(noteElement, 'tie', null, '');
      XmlHelpers.createAttributes(tieElement, { type: 'start' });
    });
  }
    /**
   * /score-partwise/part/measure/note/notations/slur
   * @param notationsElement 
   * @param smoState 
   */
  static slur(notationsElement: Element, smoState: SmoState) {
    const nn = XmlHelpers.createTextElementChild;
    const staff = smoState.partStaves[smoState.staffPartIx];
    const measure = staff.measures[smoState.measureIndex];
    const getNumberForSlur = ((slurs: SlurXml[]) => {
      let rv = 1;
      const hash: Record<number, boolean> = {};
      slurs.forEach((ss) => {
        hash[ss.number] = true;
      });
      while (rv < 100) {
        if (typeof(hash[rv]) === 'undefined') {
          break;
        }
        rv += 1;
      }
      return rv;
    });
    const selector: SmoSelector = {
      staff: staff.staffId,
      measure: measure.measureNumber.measureIndex,
      voice: smoState.voiceIndex - 1,
      tick: smoState.voiceTickIndex,
      pitches: []
    };
    const starts = staff.getSlursStartingAt(selector) as SmoSlur[];
    const ends = staff.getSlursEndingAt(selector) as SmoSlur[];
    const remove: SlurXml[] = [];
    const newSlurs: SlurXml[] = [];
    ends.forEach((slur) => {
      const match = smoState.slurs.find((ss: any) => SmoSelector.eq(ss.startSelector, slur.startSelector) &&
        SmoSelector.eq(ss.endSelector, slur.endSelector));
      if (match) {
        remove.push(match);
        const slurElement = nn(notationsElement, 'slur', null, '');
        XmlHelpers.createAttributes(slurElement, { number: match.number, type: 'stop' });
      }
    });
    smoState.slurs.forEach((slur: any) => {
      if (remove.findIndex((rr) => rr.number === slur.number) < 0) {
        newSlurs.push(slur);
      }
    });
    smoState.slurs = newSlurs;
    starts.forEach((slur) => {
      const number = getNumberForSlur(smoState.slurs);
      smoState.slurs.push({
        startSelector: slur.startSelector,
        endSelector: slur.endSelector,
        number
      });
      const slurElement = nn(notationsElement, 'slur', null, '');
      XmlHelpers.createAttributes(slurElement, { number: number, type: 'start' });
    });
  }
  /**
   * /score-partwise/measure/note/time-modification
   * /score-partwise/measure/note/tuplet
   */
  static tupletTime(noteElement: Element, note: SmoNote, measure: SmoMeasure, smoState: SmoState) {
    const tuplets: SmoTuplet[] = SmoTupletTree.getTupletHierarchyForNoteIndex(measure.tupletTrees, smoState.voiceIndex - 1, smoState.voiceTickIndex);
    let actualNotes: number = 1;
    let normalNotes: number = 1;
    for (let i = 0; i < tuplets.length; i++) {
      const tuplet = tuplets[i];
      actualNotes *= tuplet.numNotes;
      normalNotes *= tuplet.notesOccupied;
    }
    const nn = XmlHelpers.createTextElementChild;
    const obj = {
      actualNotes: actualNotes, normalNotes: normalNotes
    };
    const timeModification = nn(noteElement, 'time-modification', null, '');
    nn(timeModification, 'actual-notes', obj, 'actualNotes');
    nn(timeModification, 'normal-notes', obj, 'normalNotes');
  }
  static tupletNotation(notationsElement: Element, note: SmoNote, measure: SmoMeasure, smoState: SmoState) {
    const tuplets: SmoTuplet[] = SmoTupletTree.getTupletHierarchyForNoteIndex(measure.tupletTrees, smoState.voiceIndex - 1, smoState.voiceTickIndex);
    for (let i = 0; i < tuplets.length; i++) {
      const tuplet: SmoTuplet = tuplets[i];
      const nn = XmlHelpers.createTextElementChild;

      if (tuplet.startIndex === smoState.voiceTickIndex) {//START
        const tupletElement = nn(notationsElement, 'tuplet', null, '');
        smoState.currentTupletLevel++;
        XmlHelpers.createAttributes(tupletElement, {
          number: smoState.currentTupletLevel, type: 'start'
        });

        const tupletType = XmlHelpers.ticksToNoteTypeMap[tuplet.stemTicks];

        const tupletActual = nn(tupletElement, 'tuplet-actual', null, '');
        nn(tupletActual, 'tuplet-number', tuplet, 'numNotes');
        nn(tupletActual, 'tuplet-type', tupletType, '');

        const tupletNormal = nn(tupletElement, 'tuplet-normal', null, '');
        nn(tupletNormal, 'tuplet-number', tuplet, 'notesOccupied');
        nn(tupletNormal, 'tuplet-type', tupletType, '');
      } else if (tuplet.endIndex === smoState.voiceTickIndex) {//STOP
        const tupletElement = nn(notationsElement, 'tuplet', null, '');
        XmlHelpers.createAttributes(tupletElement, {
          number: smoState.currentTupletLevel, type: 'stop'
        });
        smoState.currentTupletLevel--;
      }
    }
  }

  /**
   * /score-partwise/measure/note/pitch
   * @param pitch 
   * @param noteElement 
   */
  static pitch(pitch: Pitch, noteElement: Element) {
    const nn = XmlHelpers.createTextElementChild;
    const accidentalOffset = ['bb', 'b', 'n', '#', '##'];
    const alter = accidentalOffset.indexOf(pitch.accidental) - 2;
    const pitchElement = nn(noteElement, 'pitch', null, '');
    nn(pitchElement, 'step', { letter: pitch.letter.toUpperCase() }, 'letter');
    nn(pitchElement, 'alter', { alter }, 'alter');
    nn(pitchElement, 'octave', pitch, 'octave');
  }
  /**
   * /score-partwise/measure/beam
   * @param noteElement 
   * @param smoState 
   * @returns 
   */
  static beamNote(noteElement: Element, smoState: SmoState) {
    if (!smoState.note) {
      return;
    }
    if (!smoState.voice) {
      return;
    }
    const nn = XmlHelpers.createTextElementChild;
    const note = smoState.note;
    const nextNote = (smoState.voiceTickIndex + 1) >= smoState.voice.notes.length ?
      null : smoState.voice.notes[smoState.voiceTickIndex + 1];
    const exceedTicks = smoState.beamTicks + note.tickCount >= note.beamBeats;
    // don't start a beam on a rest
    if (note.isRest() && smoState.beamState === SmoToXml.beamStates.none) {
      return;
    }
    let toBeam = SmoToXml.beamStates.none;
    if (note.tickCount <= 2048 && !exceedTicks) {
      // Explicit end beam, or no more notes to beam, so stop beam
      if (note.endBeam || nextNote === null) {
        if (smoState.beamState !== SmoToXml.beamStates.none) {
          toBeam = SmoToXml.beamStates.stop;
        }
      } else {
        // else if the next note is beamable, start or continue the beam
        if (nextNote.tickCount <= 2048) {
          toBeam = smoState.beamState === SmoToXml.beamStates.continue ?
            SmoToXml.beamStates.continue : SmoToXml.beamStates.start;
        }
      }
    }
    if (toBeam === SmoToXml.beamStates.start || toBeam === SmoToXml.beamStates.continue) {
      smoState.beamTicks += smoState.note.tickCount;
    } else {
      smoState.beamTicks = 0;
    }
    // slur is start/stop, beam is begin, end, gf
    if (toBeam === SmoToXml.beamStates.start) {
      const beamElement = nn(noteElement, 'beam', { type: 'begin' }, 'type');
      XmlHelpers.createAttributes(beamElement, { number: 1 });
      smoState.beamState = SmoToXml.beamStates.continue;
    } else if (toBeam === SmoToXml.beamStates.continue) {
      const beamElement = nn(noteElement, 'beam', { type: 'continue' }, 'type');
      XmlHelpers.createAttributes(beamElement, { number: 1 });
    } else if ((toBeam === SmoToXml.beamStates.stop) ||
      (toBeam === SmoToXml.beamStates.none && smoState.beamState !== SmoToXml.beamStates.none)) {
      const beamElement = nn(noteElement, 'beam', { type: 'end' }, 'type');
      XmlHelpers.createAttributes(beamElement, { number: 1 });
      smoState.beamState = SmoToXml.beamStates.none;
    }
  }
  /**
   * /score-partwise/measure/direction/direction-type
   * @param measureElement 
   * @param smoState 
   * @param beforeNote 
   */
  static direction(measureElement: Element, smoState: SmoState, beforeNote: boolean) {
    let addDirection = false;
    const nn = XmlHelpers.createTextElementChild;
    const directionElement = measureElement.ownerDocument.createElement('direction');
    const staff = smoState.partStaves[smoState.staffPartIx];
    const measure = staff.measures[smoState.measureIndex];
    const directionChildren: Element[] = [];
    const tempo = measure.getTempo();
    let displayTempo = false;
    if (smoState.tempo) {
      if (tempo.display && measure.measureNumber.measureIndex === 0 && smoState.measureTicks === 0) {
        displayTempo = true;
      } else if (tempo.display && !SmoTempoText.eq(smoState.tempo, tempo)) {
        displayTempo = true;
      }
    } else {
      displayTempo = true;
    }
    smoState.tempo = new SmoTempoText(tempo);
    if (beforeNote === true && smoState.staffPartIx === 0 && smoState.measureTicks === 0 && smoState.partStaves[0].staffId === 0) {
      const mark: SmoMeasureModifierBase | undefined = measure.getRehearsalMark();
      if (mark) {
        const rmtype = nn(directionElement, 'direction-type', null, '');
        const xmark = (mark as SmoRehearsalMark);
        const rElement = nn(rmtype, 'rehearsal', { mark: xmark.symbol }, 'mark');
        XmlHelpers.createAttribute(rElement, 'enclosure', 'square');
        XmlHelpers.createAttribute(directionElement, 'placement', 'above');
        addDirection = true;
      }
    }
    if (beforeNote === true && displayTempo) {
      addDirection = true;
      const tempoBpm = Math.round(tempo.bpm * tempo.beatDuration / 4096);
      const tempoElement = nn(directionElement, 'direction-type', null, '');
      XmlHelpers.createAttribute(directionElement, 'placement', 'above');
      let tempoText = tempo.tempoText;
      if (tempo.tempoMode === SmoTempoText.tempoModes.customMode) {
        tempoText = tempo.customText;
      }
      if (tempo.tempoMode === SmoTempoText.tempoModes.textMode) {
        nn(tempoElement, 'words', { words: tempoText }, 'words');
      } else if (tempo.tempoMode === SmoTempoText.tempoModes.customMode || tempo.tempoMode === SmoTempoText.tempoModes.durationMode) {
        const metronomeElement = nn(tempoElement, 'metronome', null, '');
        let durationType = 'quarter';
        let dotType = false;
        if (tempo.bpm >= 8192) {
          durationType = 'half';
        } else if (tempo.bpm < 4096) {
          durationType = 'eighth';
        }
        if (tempo.bpm === 6144 || tempo.bpm === 12288 || tempo.bpm === 3072) {
          dotType = true;
        }
        nn(metronomeElement, 'beat-unit', { beatUnit: durationType}, 'beatUnit');
        if (dotType) {
          nn(metronomeElement, 'beat-unit-dot', null, '');
        }
        nn(metronomeElement, 'per-minute', { tempo }, 'bpm');
      }
      // Sound is supposed to come last under 'direction' element
      const soundElement = measureElement.ownerDocument.createElement('sound');
      soundElement.setAttribute('tempo', tempoBpm.toString());
      directionChildren.push(soundElement);
    }
    const selector: SmoSelector = {
      staff: staff.staffId,
      measure: measure.measureNumber.measureIndex,
      voice: smoState.voiceIndex - 1,
      tick: smoState.voiceTickIndex,
      pitches: []
    };
    if (!beforeNote) {
      selector.tick -= 1;
    }
    const startWedge = staff.modifiers.find((mod) =>
      SmoSelector.sameNote(mod.startSelector, selector) &&
      (mod.attrs.type === 'SmoStaffHairpin')) as SmoStaffHairpin;
    const endWedge = staff.modifiers.find((mod) =>
      SmoSelector.sameNote(mod.endSelector, selector) &&
      (mod.attrs.type === 'SmoStaffHairpin')) as SmoStaffHairpin;
    if (endWedge && !beforeNote) {
      const wedgeDirection = nn(measureElement, 'direction', null, '');
      const dtype = nn(wedgeDirection, 'direction-type', null, '');
      const wedgeElement = nn(dtype, 'wedge', null, '');
      XmlHelpers.createAttributes(wedgeElement, { type: 'stop', spread: '20' });
    }
    if (startWedge && beforeNote) {
      const wedgeDirection = nn(measureElement, 'direction', null, '');
      const dtype = nn(wedgeDirection, 'direction-type', null, '');
      const wedgeElement = nn(dtype, 'wedge', null, '');
      const wedgeType = startWedge.hairpinType === SmoStaffHairpin.types.CRESCENDO ?
        'crescendo' : 'diminuendo';
      XmlHelpers.createAttributes(wedgeElement, { type: wedgeType });
    }
    if (addDirection) {
      measureElement.appendChild(directionElement);
      directionChildren.forEach((el) => {
        directionElement.appendChild(el);
      })
    }
  }
  /**
   * /score-partwise/measure/note/lyric
   * @param noteElement 
   * @param smoState 
   */
  static lyric(noteElement: Element, smoState: SmoState) {
    const smoNote = smoState.note!;
    const nn = XmlHelpers.createTextElementChild;
    const lyrics = smoNote.getTrueLyrics() as SmoLyric[];
    lyrics.forEach((lyric) => {
      let syllabic = 'single';
      if (lyric.isHyphenated() === false && lyric.isDash() === false) {
        if (smoState.lyricState[lyric.verse] === 'begin') {
          syllabic = 'end';
        } // else stays single
      } else {
        if (lyric.isHyphenated()) {
          syllabic = smoState.lyricState[lyric.verse] === 'begin' ?
            'middle' : 'begin';
        } else if (lyric.isDash()) {
          syllabic = 'middle';
        }
      }
      smoState.lyricState[lyric.verse] = syllabic;
      const lyricElement = nn(noteElement, 'lyric', null, '');
      XmlHelpers.createAttribute(lyricElement, 'number', lyric.verse + 1);
      XmlHelpers.createAttribute(lyricElement, 'placement', 'below');
      XmlHelpers.createAttribute(lyricElement, 'default-y',
        -80 - 10 * lyric.verse);
      nn(lyricElement, 'syllabic', syllabic, '');
      nn(lyricElement, 'text', lyric.getText(), '');
    });
  }
  /**
   * /score-partwise/measure/note
   * @param measureElement 
   * @param smoState 
   */
  static note(measureElement: Element, measure: SmoMeasure, note: SmoNote, smoState: SmoState) {
    const nn = XmlHelpers.createTextElementChild;
    let i = 0;
    for (i = 0; i < note.pitches.length; ++i) {
      let j = 0;
      const noteElement = nn(measureElement, 'note', null, '');
      const isChord = i > 0;
      if (isChord) {
        nn(noteElement, 'chord', null, '');
      } else {
      }
      if (note.isRest()) {
        const restElement = nn(noteElement, 'rest', null, '');
        const step = { letter: note.pitches[i].letter.toUpperCase() };
        nn(restElement, 'display-step', step, 'letter');
        nn(restElement, 'display-octave', { ...note.pitches[i] }, 'octave');
      } else {
        SmoToXml.pitch(note.pitches[i], noteElement);
      }
      const duration = note.tickCount;
      smoState.measureTicks += duration;
      const tuplet = SmoTupletTree.getTupletForNoteIndex(measure.tupletTrees, smoState.voiceIndex - 1, smoState.voiceTickIndex);
      nn(noteElement, 'duration', { duration }, 'duration');
      SmoToXml.tie(noteElement, smoState);
      nn(noteElement, 'voice', { voice: smoState.voiceIndex }, 'voice');
      let typeTickCount = note.stemTicks;
      // if (tuplet) {
      // typeTickCount = tuplet.stemTicks;
      // }
      nn(noteElement, 'type', { type: XmlHelpers.closestStemType(typeTickCount) },
        'type');
      const dots = SmoMusic.smoTicksToVexDots(note.tickCount);
      for (j = 0; j < dots; ++j) {
        nn(noteElement, 'dot', null, '');
      }
      // time modification (tuplet) comes before notations which have tuplet beaming rules
      // also before stem
      if (tuplet) {
        SmoToXml.tupletTime(noteElement, note, measure, smoState);
      }
      if (note.flagState === SmoNote.flagStates.up) {
        nn(noteElement, 'stem', { direction: 'up' }, 'direction');
      }
      if (note.flagState === SmoNote.flagStates.down) {
        nn(noteElement, 'stem', { direction: 'down' }, 'direction');
      }
      // stupid musicxml requires beam to be last.
      const notationsElement = noteElement.ownerDocument.createElement('notations');
      // If a multi-part staff, we need to include 'staff' element
      if (smoState.partStaves.length > 1) {
        nn(noteElement, 'staff', { staffIx: smoState.staffPartIx + 1 }, 'staffIx');
      }
      if (!isChord) {
        SmoToXml.beamNote(noteElement, smoState);
      }
      if (!isChord) {
        SmoToXml.slur(notationsElement, smoState);
      }
      SmoToXml.tied(notationsElement, smoState);
      if (tuplet) {
        SmoToXml.tupletNotation(notationsElement, note, measure, smoState);
      }
      const ornaments = note.getOrnaments();
      if (ornaments.length) {
        const ornamentsElement = noteElement.ownerDocument.createElement('ornaments');
        ornamentsElement.textContent = '\n';
        ornaments.forEach((ornament) => {
          if (SmoOrnament.xmlOrnaments[ornament.ornament]) {
            const sub = nn(ornamentsElement, SmoOrnament.xmlOrnaments[ornament.ornament], null, '');
            XmlHelpers.createAttribute(sub, 'placement', 'above');
          }
        });
        if (ornamentsElement.children.length) {
          notationsElement.appendChild(ornamentsElement);
        }
      }
      const jazzOrnaments = note.getJazzOrnaments();
      const articulations = note.articulations;
      if (jazzOrnaments.length || articulations.length) {
        const articulationsElement = noteElement.ownerDocument.createElement('articulations');
        jazzOrnaments.forEach((ornament) => {
          if (SmoOrnament.xmlJazz[ornament.ornament]) {
            nn(articulationsElement, SmoOrnament.xmlJazz[ornament.ornament], null, '');
          }
        });
        articulations.forEach((articulation) => {
          if (SmoArticulation.xmlArticulations[articulation.articulation]) {
            nn(articulationsElement, SmoArticulation.xmlArticulations[articulation.articulation], null, '');
          }
        });
        if (articulationsElement.children.length) {
          notationsElement.append(articulationsElement);
        }
      }
      if (notationsElement.children.length) {
        noteElement.appendChild(notationsElement);
      }
      // stupid musicxml requires beam to be laster.
      if (!isChord) {
        SmoToXml.lyric(noteElement, smoState);
      }
    }
    smoState.voiceTickIndex += 1;
  }
  /**
   * /score-partwise/measure/attributes/key
   * @param attributesElement 
   * @param smoState 
   * @returns 
   */
  static key(attributesElement: Element, measure: SmoMeasure, smoState: SmoState) {
    let fifths = 0;
    if (smoState.keySignature && measure.keySignature === smoState.keySignature) {
      return; // no key change
    }
    const flats = SmoMusic.getFlatsInKeySignature(measure.keySignature);
    const nn = XmlHelpers.createTextElementChild;
    if (flats > 0) {
      fifths = -1 * flats;
    } else {
      fifths = SmoMusic.getSharpsInKeySignature(measure.keySignature);
    }
    const keyElement = nn(attributesElement, 'key', null, '');
    nn(keyElement, 'fifths', { fifths }, 'fifths');
    nn(keyElement, 'mode', { mode: 'major' }, 'major');
    smoState.keySignature = measure.keySignature;
  }
  /**
   * /score-partwise/part/measure/attributes/time
   * @param attributesElement 
   * @param smoState 
   * @returns 
   */
  static time(attributesElement: Element, smoState: SmoState) {
    const nn = XmlHelpers.createTextElementChild;
    const staff = smoState.partStaves[smoState.staffPartIx];
    const measure = staff.measures[smoState.measureIndex];
    const currentTs = (smoState.timeSignature as TimeSignature) ?? null;
    if (currentTs !== null && TimeSignature.equal(currentTs, measure.timeSignature)) {
      return;
    }
    smoState.timeSignature = measure.timeSignature;
    const time = { beats: measure.timeSignature.actualBeats, beatType: measure.timeSignature.beatDuration };
    const timeElement = nn(attributesElement, 'time', null, '');
    nn(timeElement, 'beats', time, 'beats');
    nn(timeElement, 'beat-type', time, 'beatType');
    smoState.timeSignature = measure.timeSignature;
  }
  /**
   * /score-partwise/part/measure/attributes/clef
   * @param attributesElement 
   * @param smoState 
   * @returns 
   */
  static clef(attributesElement: Element, smoState: SmoState) {    
    smoState.partStaves.forEach((staff, staffIx) => {
      const measure = staff.measures[smoState.measureIndex];
      let prevMeasure: SmoMeasure | null = null;
      let clefChange: Clef | null = null;
      if (smoState.measureIndex > 0) {
        prevMeasure = staff.measures[smoState.measureIndex - 1];
      }
      if (prevMeasure && prevMeasure.clef !== measure.clef) {
        clefChange = measure.clef;
      }
      // both clefs are defined in the first measure one time.
      if (smoState.measureIndex === 0 && smoState.staffPartIx === 0) {
        clefChange = measure.clef;
      }
      if (clefChange) {
        const nn = XmlHelpers.createTextElementChild;
        const xmlClef = SmoMusic.clefSigns[clefChange];
        const clefElement = nn(attributesElement, 'clef', null, '');
        nn(clefElement, 'sign', xmlClef.sign, 'sign');
        if (typeof(xmlClef.line) !== 'undefined') {
          nn(clefElement, 'line', xmlClef, 'line');
        }
        if (typeof(xmlClef.octave) !== 'undefined') {
          nn(clefElement, 'clef-octave-change', xmlClef, 'octave');
        }
        XmlHelpers.createAttribute(clefElement,  'number', (staffIx + 1).toString());
      }
    });
  }
  /**
   * /score-partwise/part/measure/attributes
   * @param measureElement 
   * @param smoState 
   */
  static attributes(measureElement: Element, measure: SmoMeasure, smoState: SmoState) {
    const nn = XmlHelpers.createTextElementChild;
    const attributesElement = measureElement.ownerDocument.createElement('attributes');
    if (smoState.divisions < 1) {
      nn(attributesElement, 'divisions', { divisions: 4096 }, 'divisions');
      smoState.divisions = 4096;
    }
    SmoToXml.key(attributesElement, measure, smoState);
    SmoToXml.time(attributesElement, smoState);
    // only call out number of staves in a part at the beginning of the part
    if (smoState.measureIndex === 0 && smoState.staffPartIx === 0) {
      SmoToXml.staves(attributesElement, smoState);
    }
    SmoToXml.clef(attributesElement, smoState);
    SmoToXml.transpose(attributesElement, smoState);
    if (attributesElement.children.length > 0) {
      // don't add an empty attributes element
      measureElement.appendChild(attributesElement);
    }
  }
  static staves(attributesElement: Element, smoState: SmoState) {
    const staff = smoState.partStaves[smoState.staffPartIx];
    const staffCount = staff.partInfo.stavesAfter > 0 ? 2 : 1;
    const nn = XmlHelpers.createTextElementChild;
    nn(attributesElement, 'staves', { staffCount: staffCount.toString() }, 'staffCount');
  }
  /**
   * /score-partwise/part/measure/attributes/transpose
   * @param attributesElement
   * @param smoState 
   * @returns 
   */
  static transpose(attributesElement: Element, smoState: SmoState) {
    const staff = smoState.partStaves[smoState.staffPartIx];
    const measure = staff.measures[smoState.measureIndex];
    if (measure.transposeIndex !== smoState.transposeOffset) {
      smoState.transposeOffset = measure.transposeIndex;
      const nn = XmlHelpers.createTextElementChild;
      const xposeElement = nn(attributesElement, 'transpose', null, '');
      const offset = (measure.transposeIndex * -1).toString();;
      nn(xposeElement, 'chromatic', { offset: offset }, 'offset');
    }
  }
}
