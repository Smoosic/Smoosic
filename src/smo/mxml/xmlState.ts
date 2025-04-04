// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import {XmlDurationAlteration, XmlHelpers, XmlLyricData, XmlSlurType, XmlTieType, XmlTupletType} from './xmlHelpers';
import {SmoScore} from '../data/score';
import {SmoFormattingManager, SmoSystemGroup} from '../data/scoreModifiers';
import {SmoSystemStaff} from '../data/systemStaff';
import {
  SmoInstrument,
  SmoInstrumentParams,
  SmoSlur,
  SmoSlurParams,
  SmoStaffHairpin,
  SmoTie,
  TieLine
} from '../data/staffModifiers';
import {SmoBarline, SmoMeasureModifierBase, SmoRehearsalMark, SmoTempoText} from '../data/measureModifiers';
import {SmoPartInfo} from '../data/partInfo';
import {SmoMeasure} from '../data/measure';
import {SmoNote} from '../data/note';
import {SmoDynamicText, SmoGraceNote, SmoLyric} from '../data/noteModifiers';
import {SmoTuplet, SmoTupletTree} from '../data/tuplet';
import {Clef} from '../data/common';
import {SmoMusic} from '../data/music';
import {SmoSelection, SmoSelector} from '../xform/selections';

/**
 * @category serialization
 */
export interface XmlClefInfo {
  clef: string, staffId: number
}
/**
 * @category serialization
 */
export interface XmlVoiceInfo {
  notes: SmoNote[],
  ticksUsed: number
}
/**
 * @category serialization
 */
export interface XmlStaffInfo {
  clefInfo: XmlClefInfo,
  measure: SmoMeasure | null,
  voices: Record<string | number, XmlVoiceInfo>
}
/**
 * @category serialization
 */
export interface XmlBeamGroupInfo {
  ticks: number, notes: number
}
/**
 * @category serialization
 */
export interface XmlSystemInfo {
  startSelector: SmoSelector, endSelector: SmoSelector, leftConnector: number
}
/**
 * @category serialization
 */
export interface XmlStaffGroupInfo {
  start: number, length: number
}
/**
 * Wedge is a hairpin/cresc.
 */
export interface XmlWedgeInfo {
  type: string
}
/**
 * @category serialization
 */
export interface XmlWedgeState {
  type: string, start: number
}
/**
 * @category serialization
 */
export interface XmlHairpinInfo {
  type: string, start: number, end: number
}
/**
 * @category serialization
 */
export interface XmlDynamicInfo {
  dynamic: string, offset: number
}
/**
 * @category serialization
 */
export interface XmlCompletedTies {
  startSelector: SmoSelector,
  endSelector: SmoSelector,
  fromPitch: number,
  toPitch: number
}

/**
 * @category serialization
 */
export interface XmlCompletedTuplet {
  tuplet: SmoTuplet,
  staffId: number,
  voiceId: number
}
/**
 * @category serialization
 */
export class XmlTupletStateTreeNode {
  tupletState: XmlTupletState;
  children: XmlTupletStateTreeNode[];
  constructor(tupletState: XmlTupletState) {
    this.tupletState = tupletState;
    this.children = [];
  }
}

/**
 * @category serialization
 */
export interface XmlCompletedTupletState {
  tupletState: XmlTupletState,
  staffId: number,
  voiceId: number
}
/**
 * @category serialization
 */
export interface XmlTupletState {
  start: SmoSelector | null,
  end: SmoSelector | null,
  data: XmlTupletData | null,
}
/**
 * @category serialization
 */
export interface XmlTupletData {
  numNotes: number,
  notesOccupied: number,
  stemTicks: number,
}

/**
 * @category serialization
 */
export interface XmlEnding {
  start: number,
  end: number,
  number: number
}
/**
 * @category serialization
 */
export interface XmlPartGroup {
  partNum: number,
  group: SmoSystemGroup,
  parts: number[]
}
/**
 * Keep state of musical objects while parsing music xml
 * @category serialization
 * */
export class XmlState {
  static get defaults() {
    return {
      divisions: 4096, tempo: new SmoTempoText(SmoTempoText.defaults), timeSignature: '4/4', keySignature: 'c',
      clefInfo: [], staffGroups: [], smoStaves: []
    };
  }
  clefInfo: XmlClefInfo[] = [];
  systems: XmlSystemInfo[] = [];
  staffGroups: XmlStaffGroupInfo[] = [];
  smoStaves: SmoSystemStaff[] = [];
  slurs: Record<number, XmlSlurType | null> = {};
  wedges: XmlWedgeState = {} as XmlWedgeState;
  hairpins: XmlHairpinInfo[] = [];
  instrument: SmoInstrumentParams = SmoInstrument.defaults;
  instrumentMap: Record<number, SmoInstrument> = {};
  globalCursor = 0;
  staffVoiceHash: Record<string | number, number[]> = {};
  endingMap: Record<number, XmlEnding[]> = {};
  startRepeatMap: Record<number, number> = {};
  endRepeatMap: Record<number, number> = {};
  startBarline: number = SmoBarline.barlines.singleBar;
  endBarline: number = SmoBarline.barlines.singleBar;
  measureIndex = -1;
  completedSlurs: SmoSlurParams[] = [];
  completedTies: XmlTieType[] = [];
  verseMap: Record<number | string, number> = {};
  measureNumber: number = 0;
  formattingManager = new SmoFormattingManager(SmoFormattingManager.defaults);

  completedTupletStates: XmlCompletedTupletState[] = [];
  tupletStatesInProgress: Record<number, XmlTupletState> = {};

  tickCursor: number = 0;
  tempo: SmoTempoText = new SmoTempoText(SmoTempoText.defaults);
  staffArray: XmlStaffInfo[] = [];
  staffIndex: number = 0;
  graceNotes: SmoGraceNote[] = [];
  currentDuration: number = 0;
  beamGroups: Record<number, XmlBeamGroupInfo | null> = {};
  dynamics: XmlDynamicInfo[] = [];
  previousNote: SmoNote = new SmoNote(SmoNote.defaults);
  completedTuplets: XmlCompletedTuplet[] = [];
  newTitle: boolean = false;
  divisions: number = 4096;
  keySignature: string = 'c';
  timeSignature: string = '4/4';
  voiceIndex: number = 0;
  pixelsPerTenth: number = 0.4;
  musicFontSize: number = 16;
  partId: string = '';
  rehearsalMark = '';
  rehearsalMarks: Record<number, string> = {};
  parts: Record<string, SmoPartInfo> = {};  
  openPartGroup: XmlPartGroup | null = null;
  // Initialize things that persist throughout a staff
  // likc hairpins and slurs
  initializeForPart() {
    this.slurs = {};
    this.wedges = {} as XmlWedgeState;
    this.hairpins = [];
    this.globalCursor = 0;
    this.staffVoiceHash = {};
    this.measureIndex = -1;
    this.completedSlurs = [];
    this.verseMap = {};
    this.instrument.keyOffset = 0;
    this.instrumentMap = {};
    this.partId = '';
    this.clefInfo = [];
    this.formattingManager = new SmoFormattingManager(SmoFormattingManager.defaults);
  }
  // ### initializeForMeasure
  // reset state for a new measure:  beam groups, tuplets
  // etc. that don't cross measure boundaries
  initializeForMeasure(measureElement: Element) {
    const oldMeasure = this.measureNumber;
    this.measureNumber =
      parseInt(measureElement.getAttribute('number') as string, 10) - 1;
    if (isNaN(this.measureNumber)) {
      this.measureNumber = oldMeasure + 1;
    }
    this.tupletStatesInProgress = {};
    this.tickCursor = 0;
    this.tempo = SmoMeasureModifierBase.deserialize(this.tempo.serialize());
    this.tempo.display = false;
    this.staffArray = [];
    this.graceNotes = [];
    this.currentDuration = 0;
    this.beamGroups = {};
    this.completedTuplets = [];
    this.dynamics = [];
    this.startBarline = SmoBarline.barlines.singleBar;
    this.endBarline = SmoBarline.barlines.singleBar;
    this.previousNote = new SmoNote(SmoNote.defaults);
    this.measureIndex += 1;
    this.rehearsalMark = '';
  }
  // ### initializeStaff
  // voices are not sequential, seem to have artitrary numbers and
  // persist per part, so we treat them as a hash.
  // staff IDs persist per part but are sequential.
  initializeStaff(staffIndex: number, voiceIndex: number) {
    // If no clef is specified, default to treble
    if (typeof (this.staffArray[staffIndex]) === 'undefined') {
      this.staffArray.push({ clefInfo: { clef: 'treble', staffId: this.staffIndex }, measure: null, voices: {} });
    }
    if (typeof (this.staffArray[staffIndex].voices[voiceIndex]) === 'undefined') {
      this.staffArray[staffIndex].voices[voiceIndex] = { notes: [], ticksUsed: 0 };
      // keep track of 0-indexed voice for slurs and other modifiers
      if (!this.staffVoiceHash[staffIndex]) {
        this.staffVoiceHash[staffIndex] = [];
      }
      if (this.staffVoiceHash[staffIndex].indexOf(voiceIndex) < 0) {
        this.staffVoiceHash[staffIndex].push(voiceIndex);
      }
      // The smo 0-indexed voice index, used in selectors
      this.beamGroups[voiceIndex] = null;
    }
  }
  // ### updateStaffGroups
  // once everything is parsed, figure out how to group the staves
  updateStaffGroups() {
    this.systems = [];
    this.staffGroups.forEach((staffGroup) => {
      const len = this.smoStaves[staffGroup.start].measures.length;
      const startSelector = SmoSelector.default;
      startSelector.staff = staffGroup.start;
      startSelector.measure = 0;
      const endSelector = SmoSelector.default;
      endSelector.staff = staffGroup.start + (staffGroup.length - 1);
      endSelector.measure = len;
      const grpParams = SmoSystemGroup.defaults;
      grpParams.startSelector = startSelector;
      grpParams.endSelector = endSelector;
      grpParams.leftConnector = SmoSystemGroup.connectorTypes.brace;
      this.systems.push(
        new SmoSystemGroup(grpParams)
      );
    });
  }
  addLyric(note: SmoNote, lyricData: XmlLyricData) {
    if (typeof (this.verseMap[lyricData.verse]) === 'undefined') {
      const keys = Object.keys(this.verseMap);
      this.verseMap[lyricData.verse] = keys.length;
    }
    lyricData.verse = this.verseMap[lyricData.verse];
    const params = SmoLyric.defaults;
    params.text = lyricData._text;
    params.verse = lyricData.verse;
    if (lyricData.syllabic === 'begin' || lyricData.syllabic === 'middle') {
      params.text += '-';
    }
    const lyric = new SmoLyric(params);
    note.addLyric(lyric);
  }
  /**
   * process a wedge aka hairpin dynamic
   * @param wedgeInfo 
   */
  processWedge(wedgeInfo: XmlWedgeInfo) {
    if (wedgeInfo.type) {
      // If we already know about this wedge, it must have been
      // started, so complete it
      if (this.wedges.type) {
        this.hairpins.push({
          type: this.wedges.type,
          start: this.wedges.start,
          end: this.tickCursor + this.globalCursor
        });
        this.wedges = {} as XmlWedgeState;
      } else {
        this.wedges.type = wedgeInfo.type;
        this.wedges.start = this.tickCursor + this.globalCursor;
      }
    }
  }
  // ### backtrackHairpins
  // For the measure just parsed, find the correct tick for the
  // beginning and end of hairpins, if a hairpin stop directive
  // was received.  These are not associated with a staff or voice, so
  // we use the first one in the measure element for both
  backtrackHairpins(smoStaff: SmoSystemStaff, staffId: number) {
    this.hairpins.forEach((hairpin) => {
      let hpMeasureIndex = this.measureIndex;
      let hpMeasure = smoStaff.measures[hpMeasureIndex];
      let startTick = hpMeasure.voices[0].notes.length - 1;
      let hpTickCount = this.globalCursor; // All ticks read so far
      const endSelector = {
        staff: staffId - 1, measure: hpMeasureIndex, voice: 0,
        tick: -1, pitches: []
      };
      while (hpMeasureIndex >= 0 && hpTickCount > hairpin.start) {
        if (endSelector.tick < 0 && hpTickCount <= hairpin.end) {
          endSelector.tick = startTick;
        }
        hpTickCount -= hpMeasure.voices[0].notes[startTick].ticks.numerator;
        if (hpTickCount > hairpin.start) {
          startTick -= 1;
          if (startTick < 0) {
            hpMeasureIndex -= 1;
            hpMeasure = smoStaff.measures[hpMeasureIndex];
            startTick = hpMeasure.voices[0].notes.length - 1;
          }
        }
      }

      const params = SmoStaffHairpin.defaults;
      params.startSelector = {
        staff: staffId - 1, measure: hpMeasureIndex, voice: 0, tick: startTick, pitches: []
      };
      params.endSelector = endSelector;
      params.hairpinType = hairpin.type === 'crescendo' ? SmoStaffHairpin.types.CRESCENDO : SmoStaffHairpin.types.DECRESCENDO;
      const smoHp = new SmoStaffHairpin(params);
      smoStaff.modifiers.push(smoHp);
    });
    this.hairpins = [];
  }

  // ### updateDynamics
  // Based on note just parsed, put the dynamics on the closest
  // note, based on the offset of dynamic
  updateDynamics() {
    const smoNote = this.previousNote;
    const tickCursor = this.tickCursor;
    const newArray: XmlDynamicInfo[] = [];
    this.dynamics.forEach((dynamic) => {
      if (tickCursor >= dynamic.offset) {
        const modParams = SmoDynamicText.defaults;
        modParams.text = dynamic.dynamic;
        // TODO: change the smonote name of this interface
        smoNote.addDynamic(new SmoDynamicText(modParams));
      } else {
        newArray.push(dynamic);
      }
    });
    this.dynamics = newArray;
  }
  // For the given voice, beam the notes according to the
  // note beam length
  backtrackBeamGroup(voice: XmlVoiceInfo, beamGroup: XmlBeamGroupInfo) {
    let i = 0;
    for (i = 0; i < beamGroup.notes; ++i) {
      const note = voice.notes[voice.notes.length - (i + 1)];
      if (!note) {
        console.warn('no note for beam group');
        return;
      }
      note.endBeam = i === 0;
      note.beamBeats = beamGroup.ticks;
    }
  }
  // ### updateBeamState
  // Keep track of beam instructions found while parsing note element
  // includes time alteration from tuplets
  updateBeamState(beamState: number, alteration: XmlDurationAlteration, voice: XmlVoiceInfo, voiceIndex: number) {
    const note = voice.notes[voice.notes.length - 1];
    if (beamState === XmlHelpers.beamStates.BEGIN) {
      this.beamGroups[voiceIndex] = {
        ticks: (note.tickCount * alteration.noteCount) / alteration.noteDuration,
        notes: 1
      };
    } else if (this.beamGroups[voiceIndex]) {
      (this.beamGroups[voiceIndex] as XmlBeamGroupInfo).ticks += note.tickCount;
      (this.beamGroups[voiceIndex] as XmlBeamGroupInfo).notes += 1;
      if (beamState === XmlHelpers.beamStates.END) {
        this.backtrackBeamGroup(voice, this.beamGroups[voiceIndex] as XmlBeamGroupInfo);
        this.beamGroups[voiceIndex] = null;
      }
    }
  }
  updateTieStates(tieInfos: XmlTieType[]) {
    tieInfos.forEach((tieInfo) => {
      // tieInfo = { number, type, orientation, selector, pitchIndex }
      if (tieInfo.type === 'start') {
        this.completedTies.push(tieInfo);
      }
    });
  }
  updateEndings(barlineNode: Element) {
    const findStartEnding = (endingNumber: number, ix: number): XmlEnding | null | undefined => {
      const endingIx = Object.keys(this.endingMap).map((xx) => parseInt(xx, 10));
      let gt = -1;
      let rv: XmlEnding | null = null;
      endingIx.forEach((ee) => {
        if (ee > gt && ee <= ix) {
          const endings = this.endingMap[ee];
          const txt = endings.find((xx: XmlEnding) => xx.number === endingNumber);
          if (txt) {
            gt = ee;
            rv = txt;
          }
          if (endings.findIndex((xx: XmlEnding) => xx.number === endingNumber) >= 0) {
            gt = ee;
          }
        }
      });
      if (gt >= 0) {
        return rv;
      } else {
        return null;
      }
    };
    const ending = XmlHelpers.getEnding(barlineNode);
    if (ending) {
      if (ending.type === 'start') {
        const numbers = ending.numbers;
        numbers.forEach((nn) => {
          const endings: XmlEnding[] | undefined = this.endingMap[this.measureIndex];
          if (!endings) {
            this.endingMap[this.measureIndex] = [];
          }
          const inst = this.endingMap[this.measureIndex].find((ee) => ee.number === nn);
          if (!inst) {
            this.endingMap[this.measureIndex].push({
              start: this.measureIndex,
              end: -1,
              number: nn
            });
          }
        });
      } else {
        ending.numbers.forEach((nn) => {
          const inst = findStartEnding(nn, this.measureIndex);
          if (!inst) {
            console.warn('bad ending ' + nn + ' at ' + this.measureIndex);
          } else {
            inst.end = this.measureIndex;
          }
        });
      }
    }
    const barline = XmlHelpers.getBarline(barlineNode);
    if (barline === SmoBarline.barlines.startRepeat) {
      this.startBarline = barline;
    } else {
      this.endBarline = barline;
    }
  }

  /**
   * While parsing a measure,
   * on a slur element, either complete a started
   * slur or start a new one.
   * @param slurInfos 
   */
  updateSlurStates(slurInfos: XmlSlurType[]) {
    const clef: Clef = this.staffArray[this.staffIndex].clefInfo.clef as Clef;
    const note = this.previousNote;
    const getForcedSlurDirection = (smoParams: SmoSlurParams, xmlStart: XmlSlurType, xmlEnd: XmlSlurType | null) => {
      // If the slur direction is specified, otherwise use autor.
      if (xmlStart.placement === 'above' || xmlEnd?.placement === 'above') {
        smoParams.position_end = SmoSlur.positions.ABOVE;
        smoParams.position = SmoSlur.positions.ABOVE;
        if (xmlStart.orientation === 'over') {
          smoParams.orientation = SmoSlur.orientations.DOWN;
        } else if (xmlStart.orientation === 'under') {
          smoParams.orientation = SmoSlur.orientations.UP;
        }
      } else if (xmlStart.placement === 'below' || xmlEnd?.placement === 'below') {
        smoParams.position_end = SmoSlur.positions.BELOW;
        smoParams.position = SmoSlur.positions.BELOW;
        if (xmlStart.orientation === 'over') {
          smoParams.orientation = SmoSlur.orientations.DOWN;
        } else if (xmlStart.orientation === 'under') {
          smoParams.orientation = SmoSlur.orientations.UP;
        }
      }
    };
    slurInfos.forEach((slurInfo) => {
      // slurInfo = { number, type, selector }
      if (slurInfo.type === 'start') {
        const slurParams = SmoSlur.defaults;
        // if start and stop come out of order
        if (this.slurs[slurInfo.number] && (this.slurs[slurInfo.number] as XmlSlurType).type === 'stop') {
          slurParams.endSelector = JSON.parse(JSON.stringify((this.slurs[slurInfo.number] as XmlSlurType).selector));
          slurParams.startSelector = slurInfo.selector;
          slurParams.cp1x = slurInfo.controlX;
          slurParams.cp1y = slurInfo.controlY;
          const slurType = this.slurs[slurInfo.number];
          getForcedSlurDirection(slurParams, slurInfo, slurType);
          this.completedSlurs.push(slurParams);
          this.slurs[slurInfo.number] = null;
        } else {
          // We no longer try to pick the slur direction until the score is complete.
          this.slurs[slurInfo.number] = JSON.parse(JSON.stringify(slurInfo));
        }
      } else if (slurInfo.type === 'stop') {
        if (this.slurs[slurInfo.number] && (this.slurs[slurInfo.number] as XmlSlurType).type === 'start') {
          const slurData = this.slurs[slurInfo.number] as XmlSlurType;
          const slurParams = SmoSlur.defaults;
          slurParams.startSelector = JSON.parse(JSON.stringify((this.slurs[slurInfo.number] as XmlSlurType).selector));
          slurParams.endSelector = slurInfo.selector;
          slurParams.cp2x = slurInfo.controlX;
          slurParams.cp2y = slurInfo.controlY;
          slurParams.yOffset = slurData.yOffset;
          const slurType = this.slurs[slurInfo.number];
          getForcedSlurDirection(slurParams, slurInfo, slurType);
          // console.log('complete slur ' + slurInfo.number + JSON.stringify(slurParams, null, ' '));
          this.completedSlurs.push(slurParams);
          this.slurs[slurInfo.number] = null;
        } else {
          this.slurs[slurInfo.number] = JSON.parse(JSON.stringify(slurInfo));
        }
      }
    });
  }
  assignRehearsalMarks() {
    Object.keys(this.rehearsalMarks).forEach((rm) => {
      const measureIx = parseInt(rm, 10);
      this.smoStaves.forEach((staff) => {
        const mark = new SmoRehearsalMark(SmoRehearsalMark.defaults);
        staff.addRehearsalMark(measureIx, mark);
      });
    });
  }
  /**
   * After reading in a measure, update any completed slurs and make them
   * into SmoSlur and add them to the SmoSystemGroup objects.
   * staffIndexOffset is the offset from the xml staffId and the score staff Id
   * (i.e. the staves that have already been parsed in other parts)
   */
  completeSlurs() {
    this.completedSlurs.forEach((slur) => {      
      const smoSlur = new SmoSlur(slur);
      this.smoStaves[slur.startSelector.staff].addStaffModifier(smoSlur);
    });
  }
  /**
   * Go through saved start ties, try to find the endpoint of the tie.  Ties in music xml
   * are a little ambiguous, we assume we are tying to the same pitch
   * @param score 
   */
  completeTies(score: SmoScore) {
    this.completedTies.forEach((tieInfo) => {
      const startSelection: SmoSelection | null = SmoSelection.noteFromSelector(score, tieInfo.selector);
      if (startSelection && startSelection.note) {
        const startNote = startSelection.note;
        const endSelection = SmoSelection.nextNoteSelectionFromSelector(score, startSelection.selector);
        const endNote = endSelection?.note;
        const pitches: TieLine[] = [];
        if (endSelection && endNote) {
          startNote.pitches.forEach((spitch, ix) => {
            endNote.pitches.forEach((epitch, jx) => {
              if (SmoMusic.smoPitchToInt(spitch) === SmoMusic.smoPitchToInt(epitch)) {
                pitches.push({ from: ix, to: jx });
              }
            });
          });
        }
        if (pitches.length && endSelection) {
          const params = SmoTie.defaults;
          params.startSelector = startSelection.selector;
          params.endSelector = endSelection.selector;
          params.lines = pitches;
          const smoTie = new SmoTie(params);
          score.staves[smoTie.startSelector.staff].addStaffModifier(smoTie);
        }
      }
    });
  }



  // ### updateTupletStates
  // react to a tuplet start or stop directive
  // we need to handle start and stop directives that appear out of order
  updateTupletStates(tupletInfos: XmlTupletType[], voice: XmlVoiceInfo, staffIndex: number, voiceIndex: number) {
    // this.tickCursor;
    const tick = voice.notes.length - 1;
    tupletInfos.forEach((tupletInfo) => {
      let tupletState: XmlTupletState | undefined = this.tupletStatesInProgress[tupletInfo.number];
      if (tupletState == undefined) {
        tupletState = {
          start: null,
          end: null,
          data: null,
        };
        this.tupletStatesInProgress[tupletInfo.number] = tupletState;
      }
      if (tupletInfo.type === 'start') {
        tupletState.start = {
          staff: staffIndex, measure: this.measureNumber, voice: voiceIndex, tick, pitches: []
        };
        tupletState.data = tupletInfo.data;
      } else if (tupletInfo.type === 'stop') {
        tupletState.end = {
          staff: staffIndex, measure: this.measureNumber, voice: voiceIndex, tick, pitches: []
        };
      }
      if (tupletState.start != null && tupletState.end != null) {
        this.completedTupletStates.push({
          tupletState: tupletState,
          staffId: staffIndex,
          voiceId: voiceIndex
        });
        delete this.tupletStatesInProgress[tupletInfo.number];
      }
    });
  }
  addTupletsToMeasure(smoMeasure: SmoMeasure, staffId: number, voiceId: number) {
    const tupletStates = this.findAndRemoveCompletedTupletStatesByStaffAndVoice(staffId, voiceId);
    const xmlTupletStateTrees = this.buildXmlTupletStateTrees(tupletStates);
    const notes: SmoNote[] = smoMeasure.voices[voiceId].notes;
    smoMeasure.tupletTrees = this.buildSmoTupletTreesFromXmlTupletStateTrees(xmlTupletStateTrees, notes);
  }
  private findAndRemoveCompletedTupletStatesByStaffAndVoice(staffId: number, voiceId: number): XmlTupletState[] {
    const remainingXmlTupletStates: XmlCompletedTupletState[] = [];
    const tupletStatesForReturn: XmlTupletState[] = [];
    this.completedTupletStates.forEach((completedTupletState) => {
      if (completedTupletState.staffId === staffId && completedTupletState.voiceId === voiceId) {
        tupletStatesForReturn.push(completedTupletState.tupletState);
      } else {
        remainingXmlTupletStates.push(completedTupletState)
      }
    });
    this.completedTupletStates = remainingXmlTupletStates;
    return tupletStatesForReturn;
  }
  private buildXmlTupletStateTrees(tupletStates: XmlTupletState[]): XmlTupletStateTreeNode[] {
    let sortedTupletStates = this.sortTupletStates(tupletStates);
    let roots: XmlTupletStateTreeNode[] = [];
    let activeNodes: XmlTupletStateTreeNode[] = [];
    for (let tupletState of sortedTupletStates) {
      let node = new XmlTupletStateTreeNode(tupletState);
      let placed = false;
      while (activeNodes.length > 0) {
        let lastNode = activeNodes[activeNodes.length - 1];
        if (tupletState.start!.tick <= lastNode.tupletState.end!.tick) {
          lastNode.children.push(node);
          placed = true;
          break;
        } else {
          activeNodes.pop();
        }
      }
      if (!placed) {
        roots.push(node);
      }
      activeNodes.push(node);
    }
    return roots;
  }
  private sortTupletStates(tupletStates: XmlTupletState[]): XmlTupletState[] {
    return tupletStates.sort((a, b) => {
      if (a.start === b.start) {
        return a.end!.tick - b.end!.tick;
      }
      return a.start!.tick - b.start!.tick;
    });
  }
  /**
   * Create SmoTuplets out of completedTupletStates
   */
  buildSmoTupletTreesFromXmlTupletStateTrees(xmlTupletStateTrees: XmlTupletStateTreeNode[], notes: SmoNote[]): SmoTupletTree[] {
    const smoTupletTrees: SmoTupletTree[] = [];
    const traverseXmlTupletStateTree = (xmlTupletStateTreeNode: XmlTupletStateTreeNode): SmoTuplet => {
      const smoTupletParams = SmoTuplet.defaults;
      const xmlTupletState = xmlTupletStateTreeNode.tupletState;
      if (xmlTupletState.data) {
        smoTupletParams.numNotes = xmlTupletState.data.numNotes;
        smoTupletParams.notesOccupied = xmlTupletState.data.notesOccupied;
        smoTupletParams.stemTicks = xmlTupletState.data.stemTicks;
      }
      smoTupletParams.startIndex = xmlTupletState.start!.tick;
      smoTupletParams.endIndex = xmlTupletState.end!.tick;
      for (let i = smoTupletParams.startIndex; i <= smoTupletParams.endIndex; i++) {
        smoTupletParams.totalTicks += notes[i].tickCount;
      }
      smoTupletParams.voice = xmlTupletState.start!.voice;
      const smoTuplet = new SmoTuplet(smoTupletParams);
      for (let i = 0; i < xmlTupletStateTreeNode.children.length; i++) {
        const childSmoTuplet = traverseXmlTupletStateTree(xmlTupletStateTreeNode.children[i]);
        childSmoTuplet.parentTuplet = {id: smoTuplet.attrs.id};
        smoTuplet.childrenTuplets.push(childSmoTuplet);
      }
      return smoTuplet;
    };

    for (let i = 0; i < xmlTupletStateTrees.length; i++) {
      const xmlTupletStateTreeNode = xmlTupletStateTrees[i];
      const tuplet: SmoTuplet = traverseXmlTupletStateTree(xmlTupletStateTreeNode);
      smoTupletTrees.push(new SmoTupletTree({tuplet: tuplet}));
    }
    return smoTupletTrees;
  }


  getSystems(): SmoSystemGroup[] {
    const rv: SmoSystemGroup[] = [];
    this.systems.forEach((system: { startSelector: SmoSelector; endSelector: SmoSelector; leftConnector: number; }) => {
      const params = SmoSystemGroup.defaults;
      params.startSelector = system.startSelector;
      params.endSelector = system.endSelector;
      params.leftConnector = system.leftConnector;
      rv.push(new SmoSystemGroup(params));
    });
    return rv;
  }
}
