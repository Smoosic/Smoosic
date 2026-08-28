import { SmoSystemGroup } from '../../smo/data/scoreModifiers';
import { SmoBarline, SmoMeasureText, SmoRepeatSymbol, SmoVolta } from '../../smo/data/measureModifiers';
import { SmoTabStave, SmoTie } from '../../smo/data/staffModifiers';
import { SmoLyric, VexAnnotationParams, SmoTabNote } from '../../smo/data/noteModifiers';
import { SmoNote } from '../../smo/data/note';
import { TabNotePosition } from '../../common/vex';
/**
 * convert from Smo library values to Vex values
 * @module
 *
 **/
export declare function VexTabNotePositions(stave: SmoTabStave, tabNote: SmoTabNote, smoNote: SmoNote): TabNotePosition[];
/**
 *
 *
 * @export
 * @param {SmoSystemGroup} athis
 * @return {*}
 */
export declare function leftConnectorVx(athis: SmoSystemGroup): 0 | 1 | 4 | 2 | 3 | 5 | 8 | 6 | 7;
/**
 * convert from a SmoSystemGroup connector to Vex enumeration
 * @param athis
 * @returns
 */
export declare function rightConnectorVx(athis: SmoSystemGroup): 0 | 1 | 4 | 2 | 3 | 5 | 8 | 6 | 7;
export declare const vexBarlineType: import("vexflow_smoosic").BarlineType[];
export declare const vexBarlinePosition: import("vexflow_smoosic").StaveModifierPosition[];
export declare function toVexBarlineType(athis: SmoBarline): number;
export declare function toVexBarlinePosition(athis: SmoBarline): number;
export declare function toVexRepeatBracket(at: number): 0 | 1 | 2;
export declare const vexSymbol: number[];
export declare function toVexSymbol(athis: SmoRepeatSymbol): number;
export declare function toVexVolta(volta: SmoVolta, measureNumber: number): import("vexflow_smoosic").VoltaType;
export declare const vexTextPosition: import("vexflow_smoosic").ModifierPosition[];
export declare const vexTextJustification: import("vexflow_smoosic").TextJustification[];
export declare function toVexTextJustification(athis: SmoMeasureText): import("vexflow_smoosic").TextJustification;
export declare function toVexTextPosition(athis: SmoMeasureText): import("vexflow_smoosic").ModifierPosition;
export declare function vexOptions(athis: SmoTie): any;
export declare function vexAnnotationPosition(chordPos: number): import("vexflow_smoosic").SymbolModifiers;
/**
 * Parse the SmoLyric text and convert it to a VEX chord symbol
 * @param athis
 * @returns
 */
export declare function getVexChordBlocks(athis: SmoLyric): VexAnnotationParams[];
export declare function toVexStemDirection(note: SmoNote): number;
