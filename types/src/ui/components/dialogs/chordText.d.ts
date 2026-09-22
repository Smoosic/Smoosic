/**
 * Pure encode/decode between a SmoLyric chord-parser text string (the
 * '^'/'%'/'@glyphKey@' token format tokenized by SmoLyric._tokenizeChordString
 * and consumed at real render time by getVexChordBlocks, src/render/vex/smoAdapter.ts)
 * and a neutral, ProseMirror-independent segment list.  See
 * specs/013-vue-chord-dialog/research.md §6.
 */
export type TextType = 0 | 1 | 2;
export type ChordSegment = {
    kind: 'text';
    text: string;
    textType: TextType;
} | {
    kind: 'glyph';
    glyphKey: string;
    textType: TextType;
};
/**
 * Tokenize a raw chord-text string into ChordSegments, tracking the active
 * superscript/subscript state exactly as SuiChordEditor._setSymbolModifier does.
 */
export declare function decodeChordText(raw: string): ChordSegment[];
/**
 * Serialize ChordSegments back into the raw chord-text string format,
 * emitting toggle characters for text-type transitions via the same
 * transition table SuiChordEditor.getText() uses.
 */
export declare function encodeChordText(segments: ChordSegment[]): string;
