// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SmoLyric } from '../../../smo/data/noteModifiers';
import { SuiInlineText } from '../../../render/sui/textRender';
import { SuiTextEditor } from '../../../render/sui/textEdit';

/**
 * Pure encode/decode between a SmoLyric chord-parser text string (the
 * '^'/'%'/'@glyphKey@' token format tokenized by SmoLyric._tokenizeChordString
 * and consumed at real render time by getVexChordBlocks, src/render/vex/smoAdapter.ts)
 * and a neutral, ProseMirror-independent segment list.  See
 * specs/013-vue-chord-dialog/research.md §6.
 */
export type TextType = 0 | 1 | 2; // SuiInlineText.textTypes.{normal, superScript, subScript}

export type ChordSegment =
  | { kind: 'text', text: string, textType: TextType }
  | { kind: 'glyph', glyphKey: string, textType: TextType };

/**
 * Tokenize a raw chord-text string into ChordSegments, tracking the active
 * superscript/subscript state exactly as SuiChordEditor._setSymbolModifier does.
 */
export function decodeChordText(raw: string): ChordSegment[] {
  const segments: ChordSegment[] = [];
  const tokens: string[] = SmoLyric._tokenizeChordString(raw);
  let textType = SuiInlineText.textTypes.normal as TextType;
  let isGlyph = false;
  let glyphKey = '';
  tokens.forEach((token) => {
    if (token === '^' || token === '%') {
      textType = SuiInlineText.getTextTypeResult(textType, SuiTextEditor.textTypeFromChar(token)) as TextType;
    } else if (token === '@') {
      if (!isGlyph) {
        isGlyph = true;
        glyphKey = '';
      } else {
        segments.push({ kind: 'glyph', glyphKey, textType });
        isGlyph = false;
      }
    } else if (token.length) {
      if (isGlyph) {
        glyphKey += token;
      } else {
        segments.push({ kind: 'text', text: token, textType });
      }
    }
  });
  return segments;
}

/**
 * Serialize ChordSegments back into the raw chord-text string format,
 * emitting toggle characters for text-type transitions via the same
 * transition table SuiChordEditor.getText() uses.
 */
export function encodeChordText(segments: ChordSegment[]): string {
  let text = '';
  let previousType = SuiInlineText.textTypes.normal as TextType;
  segments.forEach((segment) => {
    if (segment.textType !== previousType) {
      text += SuiTextEditor.textTypeToChar(SuiInlineText.getTextTypeTransition(previousType, segment.textType));
      previousType = segment.textType;
    }
    if (segment.kind === 'glyph') {
      text += '@' + segment.glyphKey + '@';
    } else {
      text += segment.text;
    }
  });
  return text;
}
