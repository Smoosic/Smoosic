import { SmoNote } from '../../smo/data/note';
import { layoutDebug } from '../sui/layoutDebug';
import { SmoDynamicText, SmoNoteModifierBase } from '../../smo/data/noteModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoMeasure, MeasureTickmaps } from '../../smo/data/measure';
import { Pitch } from '../../smo/data/common';
import { SvgPage } from '../sui/svgPageMap';
import { SmoTabStave } from '../../smo/data/staffModifiers';
import { Stave, Note, Beam, Tuplet, Voice, Formatter, TabStave } from '../../common/vex';
import { VxMeasureIf, VxNote } from './vxNote';
/**
 * This is the interface for VexFlow library that actually does the engraving.
 * @category SuiRender
 */
export declare class VxMeasure implements VxMeasureIf {
    context: SvgPage;
    printing: boolean;
    selection: SmoSelection;
    softmax: number;
    smoMeasure: SmoMeasure;
    smoTabStave?: SmoTabStave;
    tabStave?: TabStave;
    rendered: boolean;
    firstInColumn: boolean;
    noteToVexMap: Record<string, Note>;
    beamToVexMap: Record<string, Beam>;
    tupletToVexMap: Record<string, Tuplet>;
    multimeasureRest: any | null;
    vexNotes: Note[];
    vexBeamGroups: Beam[];
    vexTuplets: Tuplet[];
    tickmapObject: MeasureTickmaps | null;
    stave: Stave | null;
    voiceNotes: Note[];
    tabNotes: Note[];
    voiceAr: Voice[];
    tabVoice: Voice | null;
    formatter: Formatter | null;
    allCues: boolean;
    modifiersToBox: SmoNoteModifierBase[];
    collisionMap: Record<number, SmoNote[]>;
    dbgLeftX: number;
    dbgWidth: number;
    hideAccidentals: boolean;
    tiedOverPitches: Pitch[];
    debug: layoutDebug;
    constructor(context: SvgPage, selection: SmoSelection, printing: boolean, softmax: number, tiedOverPitches: Pitch[]);
    static get fillStyle(): string;
    setFirstInColumn(val: boolean): void;
    isWholeRest(): boolean;
    createCollisionTickmap(): void;
    isCollision(voiceIx: number, tickIx: number): boolean;
    /**
     * convert a smoNote into a vxNote so it can be rasterized
     * @param smoNote
     * @param tickIndex - used to calculate accidental
     * @param voiceIx
     * @returns
     */
    createVexNote(smoNote: SmoNote, tickIndex: number, voiceIx: number): VxNote;
    renderNoteGlyph(smoNote: SmoNote, textObj: SmoDynamicText): void;
    renderDynamics(): void;
    createRepeatSymbol(): void;
    /**
     * create an a array of VF.StaveNote objects to render the active voice.
     * @param voiceIx
     */
    createVexNotes(voiceIx: number): void;
    /**
     * Group the notes for beaming and create Vex beam objects
     * @param vix - voice index
     * @returns
     */
    createVexBeamGroups(vix: number): void;
    createVexTuplets(vix: number): void;
    /**
     * create the modifiers for the stave itself, bar lines etc.
     */
    createMeasureModifiers(): void;
    /**
     * Create all Vex notes and modifiers.  We defer the format and rendering so
     * we can align across multiple staves
     */
    preFormat(): void;
    /**
     * Create the Vex formatter that calculates the X and Y positions of the notes.  A formatter
     * may actually span multiple staves for justified staves.  The notes are drawn in their
     * individual vxMeasure objects but formatting is done once for all justified staves
     * @param voices Voice objects from VexFlow
     * @returns
     */
    format(voices: Voice[]): void;
    /**
     * render is called after format.  Actually draw the things.
     */
    render(): void;
}
