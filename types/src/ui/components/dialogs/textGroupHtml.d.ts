/**
 * Conversion between SmoTextGroup (the score's rich-text data model) and the
 * TipTap JSON document representation used by textGroupEditor.vue. Exactly
 * one block (the active block, identified by id) is represented as plain
 * editable text; every other block is represented as a read-only
 * `textBlockAtom` node (see textBlockAtomNode.ts) carrying its own text and
 * font/weight/style.
 * @module /ui/components/dialogs/textGroupHtml
 */
import { JSONContent } from '@tiptap/core';
import { SmoTextGroup } from '../../../smo/data/scoreText';
/**
 * Convert a SmoTextGroup into a TipTap JSON document suitable for
 * `editor.commands.setContent`. The block whose id matches `activeBlockId`
 * becomes plain editable text; every other block becomes a non-editable
 * `textBlockAtom` node. Blocks are arranged one-paragraph-per-block when
 * `relativePosition` is ABOVE/BELOW, or joined into a single shared
 * paragraph when it is LEFT/RIGHT -- see research.md §3.
 */
export declare function textGroupToHtml(textGroup: SmoTextGroup, activeBlockId: string): JSONContent;
/**
 * Convert a TipTap JSON document (`editor.getJSON()`) back into a
 * SmoTextGroup. Only the active block's text can have changed (there is no
 * formatting to read back, since the editor exposes no marks); every other
 * field -- including every non-active block, which is structurally
 * non-editable -- is carried over unchanged from `original`. The group
 * keeps its original attrs.id via SmoTextGroup.deserializePreserveId.
 */
export declare function htmlToTextGroup(editorJson: JSONContent, original: SmoTextGroup): SmoTextGroup;
