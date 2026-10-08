import { Note as VexNote, StaveNote as VexStaveNote, StemmableNote as VexStemmableNote, Beam as VexBeam, Tuplet as VexTuplet, Voice as VexVoice, Formatter as VexFormatter, Accidental as VexAccidental, Annotation as VexAnnotation, StaveNoteStruct as VexStaveNoteStruct, StaveText as VexStaveText, StaveModifier as VexStaveModifier, StaveSection as VexStaveSection, TextFormatter as VexTextFormatter, TextNote as VexTextNote, Stave as VexStave, StaveModifierPosition as VexStaveModifierPosition, Font as VexFont, FontInfo as VexFontInfo, FontStyle as VexFontStyle, FontWeight as VexFontWeight, TupletOptions as VexTupletOptions, Curve as VexCurve, StaveTie as VexStaveTie, ClefNote as VexClefNote, Music as VexMusic, ChordSymbol as VexChordSymbol, TabStave as VexTabStave, TabNote as VexTabNote, TabSlide as VexTabSlide, TabNotePosition as VexTabNotePosition, TabNoteStruct as VexTabNoteStruct, PedalMarking as VexPedalMarking, Stem as VexStem, Renderer as VexRenderer, RenderContext as VexRenderContext, SVGContext as VexSVGContext } from "vexflow_smoosic";
import { SvgBox } from "../smo/data/common";
export declare const VexFlow: typeof import("vexflow_smoosic").Flow;
export type Music = VexMusic;
export type Note = VexNote;
export type StaveNote = VexStaveNote;
export type Stem = VexStem;
export type StemmableNote = VexStemmableNote;
export type Beam = VexBeam;
export type Tuplet = VexTuplet;
export type TupletOptions = VexTupletOptions;
export type PedalMarking = VexPedalMarking;
export type Voice = VexVoice;
export type Accidental = VexAccidental;
export type Font = VexFont;
export type FontInfo = VexFontInfo;
export type FontStyle = VexFontStyle;
export type FontWeight = VexFontWeight;
export type Formatter = VexFormatter;
export type Annotation = VexAnnotation;
export type TextNote = VexTextNote;
export type StaveNoteStruct = VexStaveNoteStruct;
export type StaveModifier = VexStaveModifier;
export type StaveText = VexStaveText;
export declare const StaveSection: typeof VexStaveSection;
export declare const VexTextMetrics: typeof VexTextFormatter;
export type Stave = VexStave;
export type Curve = VexCurve;
export type StaveTie = VexStaveTie;
export type ClefNote = VexClefNote;
export type StaveModifierPosition = VexStaveModifierPosition;
export type TabStave = VexTabStave;
export type TabNote = VexTabNote;
export type TabSlide = VexTabSlide;
export type TabNotePosition = VexTabNotePosition;
export type TabNoteStruct = VexTabNoteStruct;
export type Renderer = VexRenderer;
export type RenderContext = VexRenderContext;
export type SVGContext = VexSVGContext;
/**
 * @internal
 */
export interface GlyphInfo {
    width: number;
    height: number;
    yTop: number;
    yBottom: number;
    spacingRight: number;
    vexGlyph: string | null;
}
/**
 * @internal
 */
export interface CreateVexNoteParams {
    isTuplet: boolean;
    measureIndex: number;
    clef: string;
    stemTicks: string;
    keys: string[];
    noteType: string;
    isCue?: boolean;
}
/**
 * @internal
 */
export interface SmoVexTupletParams {
    vexNotes: Note[];
    numNotes: number;
    notesOccupied: number;
    ratioed: boolean;
    bracketed: boolean;
    location: number;
}
export declare function chordSubscriptOffset(): number;
export declare function chordSuperscriptOffset(): number;
/**
 * @internal
 */
export interface SmoVexVoiceParams {
    actualBeats: number;
    beatDuration: number;
    notes: Note[];
}
export declare function createVoice(params: SmoVexVoiceParams): VexVoice;
/**
 * @internal
 */
export interface SmoVexStaveParams {
    x: number;
    y: number;
    padLeft: number;
    id: string;
    staffX: number;
    staffY: number;
    staffWidth: number;
    forceClef: boolean;
    clef: string;
    forceKey: boolean;
    key: string;
    canceledKey: string | null;
    startX: number;
    adjX: number;
    lines: number;
    context: any;
}
export declare function createTabStave(box: SvgBox, spacing: number, numLines: number): TabStave;
/**
 * Vex4 and Vex5 handle width differently.  Vex5, width comes directly from the
 * font glyph, vex4 the glyph is a path so it comes from the stored information about
 * the path.
 *
 * @param smoGlyph
 * @returns
 */
export declare function getGlyphWidth(smoGlyph: GlyphInfo): number;
/**
 * V4 uses the glyph name, V5 uses the unicode value
 * @returns
 */
export declare function getSlashGlyph(): import("vexflow_smoosic").GlyphNote;
export declare function getRepeatBar(): import("vexflow_smoosic").GlyphNote;
export declare function getMultimeasureRest(multimeasureLength: number): import("vexflow_smoosic").MultiMeasureRest;
export declare function pitchToLedgerLine(vexPitch: string, clef: string): number;
export declare function vexCanonicalNotes(): any;
export declare function createStave(params: SmoVexStaveParams): VexStave;
export declare function getVexTuplets(params: SmoVexTupletParams): VexTuplet;
export declare function getVexNoteParameters(params: CreateVexNoteParams): {
    noteParams: StaveNoteStruct;
    duration: string;
};
/**
 * @internal
 */
export interface SmoVexStemParams {
    voiceCount: number;
    voiceIx: number;
    isAuto: boolean;
    isUp: boolean;
}
export declare function applyStemDirection(params: SmoVexStemParams, vxParams: StaveNoteStruct): void;
export declare function createStaveText(text: string, position: number, options: any): VexStaveText;
/**
 * @internal
 */
export interface SmoVexHairpinParams {
    vxStart: Note | null;
    vxEnd: Note | null;
    hairpinType: number;
    height: number;
    yOffset: number;
    leftShiftPx: number;
    rightShiftPx: number;
}
export declare function createHairpin(params: SmoVexHairpinParams): import("vexflow_smoosic").StaveHairpin;
/**
 * @internal
 */
export interface SmoVexSlurParameters {
    vxStart: Note | null;
    vxEnd: Note | null;
    thickness: number;
    xShift: number;
    yShift: number;
    cps: DOMPoint[];
    openingDirection: string;
    position: number;
    positionEnd: number;
}
export declare const defaultMeasurePadding: number;
export declare function createSlur(params: SmoVexSlurParameters): Curve;
/**
 * @internal
 */
export interface SmoVexTieParams {
    fromLines: number[];
    toLines: number[];
    firstNote: Note | null;
    lastNote: Note | null;
    vexOptions: any;
}
export declare function createTie(params: SmoVexTieParams): StaveTie;
export declare const vexNoteScale: number;
export declare const defaultNoteScale: number;
export declare const defaultCueScale: number;
export declare function glyphPixels(): number;
export declare function setFontStack(font: string): void;
/**
 * Render a dynamics glyph.  Return the height of width/height of the glyph
 * @param context
 * @param text
 * @param fontSize
 * @param x
 * @param y
 * @returns
 */
export declare function renderDynamics(context: any, text: string, fontSize: number, x: number, y: number): {
    width: number;
    height: number;
};
export declare function getOrnamentGlyph(glyph: string): string;
export declare function addChordGlyph(cs: VexChordSymbol, symbol: string): void;
/**
 * get a glyph code to render
 * @param code
 * @returns
 */
export declare function getVexGlyphFromChordCode(code: string): string;
export declare function createTextNote(code: string): VexTextNote;
/**
 * Get the chord symbol glyph from the vex glyph
 * @export
 * @param {string} code
 * @return {*}
 */
export declare function getChordSymbolGlyphFromCode(code: string): string;
export declare function getChordSymbolMetricsForGlyph(code: string): import("vexflow_smoosic").ChordSymbolGlyphMetrics;
/**
 * Vex 5 compatibility.  yShift
 */
export declare function blockMetricsYShift(metrics: any): any;
export declare const ChordSymbolGlyphs: Record<string, {
    code: string;
}>;
export declare const vexOrnaments: Record<string, string>;
