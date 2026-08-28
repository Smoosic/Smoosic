/**
 * TipTap Node extension rendering a non-active SmoScoreText block as an
 * atomic, non-editable, styled leaf inside the text group editor's document.
 * @module /ui/components/dialogs/textBlockAtomNode
 */
import { Node } from '@tiptap/core';
export interface TextBlockAtomAttrs {
    blockId: string;
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    fontStyle: string;
}
/**
 * Atomic, non-editable node representing one non-active SmoScoreText block.
 * Used by textGroupHtml.ts/textGroupEditor.vue -- see
 * contracts/textBlockAtomNode.contract.md for the full spec.
 */
export declare const TextBlockAtomNode: Node<any, any>;
