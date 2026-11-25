// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScore } from '../data/score';
import { SmoMeasure, SmoVoice } from '../data/measure';
import { SmoNote } from '../data/note';
import { SmoMusic } from '../data/music';
import { SmoTimeSignature, SmoBarline } from '../data/measureModifiers';
import { SmoTupletTree } from '../data/tuplet';
import { SmoTuplet } from '../data/tuplet';
import { SmoTie, StaffModifierBase } from '../data/staffModifiers';
import { SmoSelector } from './selections';
import { Clef } from '../data/common';

/**
 * What {@link rebarMeasures} did
 * @category SmoTransform
 */
export interface RebarResult {
  /** the first re-barred measure */
  firstMeasure: number,
  /** how many measures are now in the range: the ones it had, plus those that were added */
  measureCount: number,
  /** how many measures were added after the old last measure of the range */
  added: number
}

/**
 * Which measures a time signature change applies to: only the selected ones, from the first selected one to the
 * end of the score, or the whole score.
 * @category SmoTransform
 */
export type TimeSignatureApplyTo = 'Selected' | 'Remaining' | 'Score';

/**
 * The range of measures a time signature change applies to.
 * @param applyTo which measures
 * @param selectedMeasures the measure index of each selected note or measure, in any staff, in any order
 * @param measureCount the number of measures in the score
 * @returns the first and last measure, or null if there is no selection (and the choice is not the whole score) or no measures
 */
export const timeSignatureRange = (applyTo: TimeSignatureApplyTo, selectedMeasures: number[],
  measureCount: number): { firstMeasure: number, lastMeasure: number } | null => {
  if (measureCount < 1) {
    return null;
  }
  if (applyTo === 'Score') {
    return { firstMeasure: 0, lastMeasure: measureCount - 1 };
  }
  if (selectedMeasures.length < 1) {
    return null;
  }
  const firstMeasure = Math.max(0, Math.min(...selectedMeasures));
  const lastSelected = Math.min(measureCount - 1, Math.max(...selectedMeasures));
  return { firstMeasure, lastMeasure: applyTo === 'Remaining' ? measureCount - 1 : lastSelected };
}

/** A position in the re-barred measures: the measure counted from the start of the range, and the note in the voice */
interface Pos {
  k: number,
  tick: number
}
/** Where a source note went.  The same position if the note was not split into tied pieces. */
interface Placement {
  first: Pos,
  last: Pos
}
interface SourceNote {
  note: SmoNote,
  /** the old location of the note, from {@link SmoSelector.getNoteKey} */
  key: string
}
/** One thing that is laid out whole: a note or rest, a tuplet, or a stretch of rest for a measure that has no such voice */
interface LayoutUnit {
  notes: SourceNote[],
  ticks: number,
  tuplet: SmoTupletTree | null,
  filler: boolean
}
interface LaidMeasure {
  notes: SmoNote[],
  trees: SmoTupletTree[],
  used: number,
  /** true if any note of the source music is in it, as opposed to only rests added to fill */
  hasSource: boolean
}
interface PendingTie {
  from: Pos,
  to: Pos,
  fromNote: SmoNote,
  toNote: SmoNote
}
interface VoiceLayout {
  measures: LaidMeasure[],
  placements: Record<string, Placement>,
  ties: PendingTie[]
}

/** Tick totals are sums of note lengths, which can be fractions for tuplets */
const EPSILON = 0.001;
const fits = (ticks: number, space: number) => ticks <= space + EPSILON;

/**
 * The length in ticks of the measure k places after the first of a range that gets a time signature.  A time
 * signature with several parts (3/4+2/4) alternates its parts from measure to measure.
 * @param timeSignature the new time signature
 * @param k how many measures after the first re-barred measure
 * @param startIndex which part the first re-barred measure has
 */
export const rebarMeasureTicks = (timeSignature: SmoTimeSignature, k: number, startIndex: number): number => {
  const part = timeSignature.times[(startIndex + k) % timeSignature.times.length];
  return SmoMusic.timeSignatureToTicks(part.actualBeats, part.beatDuration);
}

/**
 * Which part of a compound time signature the first re-barred measure has.  If the measure before the range has
 * the same time signature, the pattern carries on from it, the way {@link SmoScore.updateCompoundTimeSignature}
 * does; otherwise it starts at the first part.
 */
const rebarStartIndex = (score: SmoScore, firstMeasure: number, timeSignature: SmoTimeSignature): number => {
  if (firstMeasure < 1 || timeSignature.times.length < 2) {
    return 0;
  }
  const before = score.staves[0].measures[firstMeasure - 1];
  if (before && SmoTimeSignature.equal(before.timeSignature, timeSignature)) {
    return (before.timeSignature.index + 1) % timeSignature.times.length;
  }
  return 0;
}

const makeRest = (ticks: number, clef: Clef): SmoNote => {
  const params = SmoNote.defaults;
  params.pitches = [JSON.parse(JSON.stringify(SmoMeasure.defaultPitchForClef[clef]))];
  params.noteType = 'r';
  params.clef = clef;
  params.ticks.numerator = ticks;
  params.stemTicks = ticks;
  return new SmoNote(params);
}

/** A split-off piece of a note keeps the pitches, not the things attached to the note */
const stripMarkings = (note: SmoNote) => {
  note.textModifiers = [];
  note.articulations = [];
  note.ornaments = [];
  note.graceNotes = [];
  note.arpeggio = undefined;
}

const shiftTuplet = (tuplet: SmoTuplet, delta: number) => {
  tuplet.startIndex += delta;
  tuplet.endIndex += delta;
  tuplet.childrenTuplets.forEach((child) => shiftTuplet(child, delta));
}

/**
 * Read one voice of the measures in a range as a list of things to lay out, in time order.  A measure that
 * has no such voice counts as a stretch of rest the length of the measure, so the voice stays in time with the others.
 */
const flattenVoice = (score: SmoScore, staffIndex: number, voice: number, firstMeasure: number, lastMeasure: number): LayoutUnit[] => {
  const units: LayoutUnit[] = [];
  const staff = score.staves[staffIndex];
  for (let m = firstMeasure; m <= lastMeasure; ++m) {
    const measure = staff.measures[m];
    if (voice >= measure.voices.length) {
      let ticks = measure.getMaxTicksVoice();
      if (ticks < 1) {
        ticks = SmoMusic.timeSignatureToTicks(measure.timeSignature.actualBeats, measure.timeSignature.beatDuration);
      }
      units.push({ notes: [], ticks, tuplet: null, filler: true });
      continue;
    }
    const notes = measure.voices[voice].notes;
    for (let j = 0; j < notes.length; ++j) {
      const key = SmoSelector.getNoteKey({ staff: staffIndex, measure: m, voice, tick: j, pitches: [] });
      const tree = SmoTupletTree.getTupletTreeForNoteIndex(measure.tupletTrees, voice, j);
      if (tree) {
        if (tree.startIndex !== j) {
          continue; // part of the tuplet that was taken at its first note
        }
        const members: SourceNote[] = [];
        let ticks = 0;
        for (let t = tree.startIndex; t <= tree.endIndex && t < notes.length; ++t) {
          members.push({
            note: notes[t],
            key: SmoSelector.getNoteKey({ staff: staffIndex, measure: m, voice, tick: t, pitches: [] })
          });
          ticks += notes[t].tickCount;
        }
        units.push({ notes: members, ticks, tuplet: tree, filler: false });
      } else {
        units.push({ notes: [{ note: notes[j], key }], ticks: notes[j].tickCount, tuplet: null, filler: false });
      }
    }
  }
  return units;
}

/**
 * Lay the units of one voice out again, measure by measure.  See research.md R2 for the rules.
 * @param units from {@link flattenVoice}
 * @param lengthOf the length in ticks of the k-th measure
 * @param clef the clef for any rests that are added
 */
const layoutVoice = (units: LayoutUnit[], lengthOf: (k: number) => number, clef: Clef): VoiceLayout => {
  const measures: LaidMeasure[] = [];
  const placements: Record<string, Placement> = {};
  const ties: PendingTie[] = [];
  // The measure being filled.  A new one is started only when there is something to put in it.
  const current = (): LaidMeasure => {
    let m = measures[measures.length - 1];
    if (!m || m.used >= lengthOf(measures.length - 1) - EPSILON) {
      m = { notes: [], trees: [], used: 0, hasSource: false };
      measures.push(m);
    }
    return m;
  };
  const space = (): number => {
    const m = current();
    return lengthOf(measures.length - 1) - m.used;
  };
  const push = (note: SmoNote, source: boolean): Pos => {
    const m = current();
    m.notes.push(note);
    m.used += note.tickCount;
    if (source) {
      m.hasSource = true;
    }
    return { k: measures.length - 1, tick: m.notes.length - 1 };
  };
  const addRests = (ticks: number) => {
    let remaining = ticks;
    while (remaining > EPSILON) {
      const take = Math.min(space(), remaining);
      SmoMusic.gcdMap(Math.round(take)).forEach((duration) => {
        push(makeRest(duration, clef), false);
      });
      remaining -= take;
    }
  };
  const addNote = (source: SourceNote) => {
    const note = source.note;
    const total = note.tickCount;
    if (fits(total, space())) {
      const pos = push(SmoNote.clone(note), true);
      placements[source.key] = { first: pos, last: pos };
      return;
    }
    // The note crosses a bar line: split it at each one.  The pieces of a note are tied.
    const pieces: { pos: Pos, note: SmoNote }[] = [];
    let remaining = total;
    while (remaining > EPSILON) {
      const take = Math.min(space(), remaining);
      SmoMusic.gcdMap(Math.round(take)).forEach((duration) => {
        const piece = SmoNote.cloneWithDuration(note, duration);
        if (pieces.length > 0) {
          stripMarkings(piece);
        }
        pieces.push({ pos: push(piece, true), note: piece });
      });
      remaining -= take;
    }
    placements[source.key] = { first: pieces[0].pos, last: pieces[pieces.length - 1].pos };
    if (note.noteType !== 'r') {
      for (let i = 0; i < pieces.length - 1; ++i) {
        ties.push({ from: pieces[i].pos, to: pieces[i + 1].pos, fromNote: pieces[i].note, toNote: pieces[i + 1].note });
      }
    }
  };
  const addTuplet = (unit: LayoutUnit) => {
    const m = current();
    const base = m.notes.length;
    const k = measures.length - 1;
    const tree = SmoTupletTree.clone(unit.tuplet!);
    shiftTuplet(tree.tuplet, base - tree.startIndex);
    unit.notes.forEach((source, j) => {
      push(SmoNote.clone(source.note), true);
      const pos = { k, tick: base + j };
      placements[source.key] = { first: pos, last: pos };
    });
    m.trees.push(tree);
  };
  // A tuplet longer than a measure cannot be kept: its notes are written out at the lengths they are written with
  const addUnmadeTuplet = (unit: LayoutUnit) => {
    unit.notes.forEach((source) => {
      const length = source.note.stemTicks > 0 ? source.note.stemTicks : Math.round(source.note.tickCount);
      const plain = SmoNote.cloneWithDuration(source.note, length);
      plain.tupletId = null;
      addNote({ note: plain, key: source.key });
    });
  };
  units.forEach((unit) => {
    if (unit.filler) {
      addRests(unit.ticks);
      return;
    }
    if (!unit.tuplet) {
      addNote(unit.notes[0]);
      return;
    }
    const spaceNow = space();
    if (fits(unit.ticks, spaceNow)) {
      addTuplet(unit);
      return;
    }
    const m = current();
    const k = measures.length - 1;
    if (m.used > EPSILON && fits(unit.ticks, lengthOf(k + 1))) {
      // starts the next measure; the rest of this one is rests
      addRests(spaceNow);
      addTuplet(unit);
    } else {
      addUnmadeTuplet(unit);
    }
  });
  // the last measure is filled out with rests
  if (measures.length > 0) {
    const last = measures[measures.length - 1];
    const left = lengthOf(measures.length - 1) - last.used;
    if (left > EPSILON) {
      addRests(left);
    }
  }
  return { measures, placements, ties };
}

/** Move one end of a staff modifier to where its note went */
const remapSelector = (selector: SmoSelector, firstMeasure: number, lastMeasure: number,
  placements: Record<string, Placement>, which: 'first' | 'last'): SmoSelector => {
  if (selector.measure < firstMeasure || selector.measure > lastMeasure || typeof (selector.tick) !== 'number') {
    return selector;
  }
  const placement = placements[SmoSelector.getNoteKey(selector)];
  if (!placement) {
    return selector;
  }
  const pos = placement[which];
  return { staff: selector.staff, measure: firstMeasure + pos.k, voice: selector.voice, tick: pos.tick, pitches: selector.pitches };
}

/**
 * Re-bar the music of a range of measures into a new time signature, in every staff.  The notes keep their order
 * and their lengths.  Where the new measures are not long enough, measures are added after the range (in every
 * staff) so that all of the music fits; measures are never removed.  A note that crosses a new bar line is split and
 * tied.  A tuplet is kept whole, starting the next measure if it does not fit.  Things attached to a note stay with
 * it; if the note is split they stay with the first part.  Slurs, ties, hairpins and other things between notes
 * follow their notes.  Hand-placed beaming in the range is reset to automatic.
 * @param score the score to change
 * @param firstMeasure the first measure of the range
 * @param lastMeasure the last measure of the range
 * @param timeSignature the new time signature
 * @returns what was done.  Nothing is changed, and `added` is 0, if the range is not in the score.
 */
export const rebarMeasures = (score: SmoScore, firstMeasure: number, lastMeasure: number,
  timeSignature: SmoTimeSignature): RebarResult => {
  const nothing: RebarResult = { firstMeasure, measureCount: 0, added: 0 };
  if (score.staves.length < 1 || firstMeasure < 0 || lastMeasure < firstMeasure) {
    return nothing;
  }
  if (score.staves.some((staff) => staff.measures.length <= lastMeasure)) {
    return nothing;
  }
  const existing = lastMeasure - firstMeasure + 1;
  const startIndex = rebarStartIndex(score, firstMeasure, timeSignature);
  const lengthOf = (k: number) => rebarMeasureTicks(timeSignature, k, startIndex);

  // 1. Lay out every voice of every staff, and count the measures that are needed.
  const layouts: VoiceLayout[][] = [];
  let needed = 0;
  score.staves.forEach((staff, staffIndex) => {
    let voiceCount = 1;
    for (let m = firstMeasure; m <= lastMeasure; ++m) {
      voiceCount = Math.max(voiceCount, staff.measures[m].voices.length);
    }
    const clef = staff.measures[firstMeasure].clef;
    const staffLayouts: VoiceLayout[] = [];
    for (let v = 0; v < voiceCount; ++v) {
      const layout = layoutVoice(flattenVoice(score, staffIndex, v, firstMeasure, lastMeasure), lengthOf, clef);
      needed = Math.max(needed, layout.measures.length);
      staffLayouts.push(layout);
    }
    layouts.push(staffLayouts);
  });
  const size = Math.max(existing, needed);
  const added = size - existing;

  // 2. Add the measures, after the range, copying the last measure of the range.
  const oldEndBarline = score.staves.map((staff) => staff.measures[lastMeasure].getEndBarline());
  for (let i = 0; i < added; ++i) {
    score.addMeasure(lastMeasure + 1, lastMeasure);
  }

  // 3. Write the measures.  The end barline (repeat, double bar) goes with the end of the range.
  score.staves.forEach((staff, staffIndex) => {
    for (let k = 0; k < size; ++k) {
      const measure = staff.measures[firstMeasure + k];
      measure.timeSignature = new SmoTimeSignature(timeSignature);
      const voices: SmoVoice[] = [];
      const trees: SmoTupletTree[] = [];
      const hasSource: boolean[] = [];
      layouts[staffIndex].forEach((layout) => {
        const laid = layout.measures[k];
        if (laid) {
          voices.push({ notes: laid.notes });
          laid.trees.forEach((tree) => trees.push(tree));
          hasSource.push(laid.hasSource);
        } else {
          const notes: SmoNote[] = [];
          SmoMusic.gcdMap(lengthOf(k)).forEach((duration) => notes.push(makeRest(duration, measure.clef)));
          voices.push({ notes });
          hasSource.push(false);
        }
      });
      // A voice that only has rests added to fill is not kept, unless a later voice is
      while (voices.length > 1 && !hasSource[voices.length - 1]) {
        voices.pop();
        hasSource.pop();
      }
      measure.voices = voices;
      measure.tupletTrees = trees;
      measure.beamGroups = [];
      SmoTupletTree.syncTupletIds(trees, voices);
      if (measure.getActiveVoice() >= voices.length) {
        measure.setActiveVoice(0);
      }
    }
    if (added > 0) {
      const oldLast = staff.measures[lastMeasure];
      const newLast = staff.measures[lastMeasure + added];
      const barline = oldEndBarline[staffIndex];
      if (barline.barline !== SmoBarline.barlines.singleBar) {
        newLast.setBarline(new SmoBarline({ position: SmoBarline.positions.end, barline: barline.barline }));
        oldLast.setBarline(new SmoBarline({ position: SmoBarline.positions.end, barline: SmoBarline.barlines.singleBar }));
      }
    }
  });
  // measure k has part (startIndex + k) of a time signature with several parts
  score.updateCompoundTimeSignature();
  score.staves.forEach((staff) => {
    for (let k = 0; k < size; ++k) {
      const measure = staff.measures[firstMeasure + k];
      const triple = measure.timeSignature.actualBeats % 3 === 0;
      const beamBeats = triple ? score.preferences.defaultTripleDuration : score.preferences.defaultDupleDuration;
      measure.voices.forEach((voice) => {
        voice.notes.forEach((note) => {
          note.beamBeats = beamBeats;
          note.beamState = SmoNote.beamStates.auto;
          note.endBeam = false;
        });
      });
    }
  });

  // 4. Staff modifiers (slurs, ties, hairpins...).  addMeasure has already moved the ones that start after
  // the range.  The others are moved here: ends in the range go with their notes, ends after it move later.
  score.staves.forEach((staff, staffIndex) => {
    const placements: Record<string, Placement> = {};
    layouts[staffIndex].forEach((layout) => {
      Object.keys(layout.placements).forEach((key) => {
        placements[key] = layout.placements[key];
      });
    });
    const remap = (mod: StaffModifierBase) => {
      if (mod.startSelector.measure > lastMeasure) {
        return; // moved by addMeasure
      }
      const tie = mod.ctor === 'SmoTie';
      const start = remapSelector(mod.startSelector, firstMeasure, lastMeasure, placements, tie ? 'last' : 'first');
      let end = remapSelector(mod.endSelector, firstMeasure, lastMeasure, placements, tie ? 'first' : 'last');
      if (end === mod.endSelector && end.measure > lastMeasure) {
        end = JSON.parse(JSON.stringify(end));
        end.measure += added;
      }
      mod.startSelector = start;
      mod.endSelector = end;
    };
    staff.modifiers.forEach(remap);
    staff.textBrackets.forEach(remap);
    // the pieces of a split note are tied
    layouts[staffIndex].forEach((layout, voice) => {
      layout.ties.forEach((pending) => {
        const params = SmoTie.defaults;
        params.startSelector = { staff: staffIndex, measure: firstMeasure + pending.from.k, voice, tick: pending.from.tick, pitches: [] };
        params.endSelector = { staff: staffIndex, measure: firstMeasure + pending.to.k, voice, tick: pending.to.tick, pitches: [] };
        params.lines = SmoTie.createLines(pending.fromNote, pending.toNote);
        staff.addStaffModifier(new SmoTie(params));
      });
    });
  });
  return { firstMeasure, measureCount: size, added };
}
