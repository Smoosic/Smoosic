// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
/**
 * TipTap Node extension rendering a non-active SmoScoreText block as an
 * atomic, non-editable, styled leaf inside the text group editor's document.
 * @module /ui/components/dialogs/textBlockAtomNode
 */
import { Node, mergeAttributes } from '@tiptap/core';
import { DOMOutputSpec } from '@tiptap/pm/model';

export interface TextBlockAtomAttrs {
  blockId: string,
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: string,
  fontStyle: string
}

type SuperState = 'normal' | 'sup' | 'sub';
type TextSegment = string | [string, Record<string, string>, string];

// The score text encodes superscript/subscript as literal toggle characters
// embedded in the plain string ('^' for superscript, '%' for subscript),
// consumed invisibly when rendering -- see SuiTextEditor.textTypeToChar /
// textTypeFromChar (src/render/sui/textEdit.ts). This is purely a decorative
// preview here: the node's attrs (not its rendered HTML) are the source of
// truth when the document is read back into a SmoTextGroup.
const markupToSegments = (raw: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  let mode: SuperState = 'normal';
  let buffer = '';
  const flush = () => {
    if (buffer.length === 0) {
      return;
    }
    segments.push(mode === 'normal' ? buffer : [mode, {}, buffer]);
    buffer = '';
  };
  for (let i = 0; i < raw.length; ++i) {
    const ch = raw[i];
    if (ch === '^' || ch === '%') {
      const target: SuperState = ch === '^' ? 'sup' : 'sub';
      flush();
      mode = (mode === target) ? 'normal' : target;
      continue;
    }
    buffer += ch;
  }
  flush();
  return segments;
};

/**
 * Atomic, non-editable node representing one non-active SmoScoreText block.
 * Used by textGroupHtml.ts/textGroupEditor.vue -- see
 * contracts/textBlockAtomNode.contract.md for the full spec.
 */
export const TextBlockAtomNode = Node.create({
  name: 'textBlockAtom',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      blockId: { default: '' },
      text: { default: '' },
      fontFamily: { default: 'Roboto,sans-serif' },
      fontSize: { default: 12 },
      fontWeight: { default: 'normal' },
      fontStyle: { default: 'normal' }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-block-id]',
        getAttrs: (el) => {
          const element = el as HTMLElement;
          return {
            blockId: element.getAttribute('data-block-id') ?? '',
            text: element.getAttribute('data-text') ?? '',
            fontFamily: element.getAttribute('data-font-family') ?? 'Roboto,sans-serif',
            fontSize: parseFloat(element.getAttribute('data-font-size') ?? '12'),
            fontWeight: element.getAttribute('data-font-weight') ?? 'normal',
            fontStyle: element.getAttribute('data-font-style') ?? 'normal'
          };
        }
      }
    ];
  },

  renderHTML({ node }) {
    const attrs = node.attrs as TextBlockAtomAttrs;
    const style = `font-family: ${attrs.fontFamily}; font-size: ${attrs.fontSize}pt; `
      + `font-weight: ${attrs.fontWeight}; font-style: ${attrs.fontStyle};`;
    const domAttrs = mergeAttributes({
      'data-block-id': attrs.blockId,
      'data-text': attrs.text,
      'data-font-family': attrs.fontFamily,
      'data-font-size': String(attrs.fontSize),
      'data-font-weight': attrs.fontWeight,
      'data-font-style': attrs.fontStyle,
      contenteditable: 'false',
      class: 'text-block-atom',
      style
    });
    const children = markupToSegments(attrs.text);
    return ['span', domAttrs, ...children] as DOMOutputSpec;
  }
});
