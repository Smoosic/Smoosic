// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
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
import { SmoTextGroup, SmoTextBlock, SmoScoreText } from '../../../smo/data/scoreText';

/**
 * Convert a SmoTextGroup into a TipTap JSON document suitable for
 * `editor.commands.setContent`. The block whose id matches `activeBlockId`
 * becomes plain editable text; every other block becomes a non-editable
 * `textBlockAtom` node. Blocks are arranged one-paragraph-per-block when
 * `relativePosition` is ABOVE/BELOW, or joined into a single shared
 * paragraph when it is LEFT/RIGHT -- see research.md §3.
 */
export function textGroupToHtml(textGroup: SmoTextGroup, activeBlockId: string): JSONContent {
  const blocks: SmoTextBlock[] = textGroup.textBlocks.length > 0
    ? textGroup.textBlocks
    : [{ text: new SmoScoreText(SmoScoreText.defaults), position: textGroup.relativePosition, activeText: true }];

  const contentForBlock = (block: SmoTextBlock): JSONContent[] => {
    if (block.text.attrs.id === activeBlockId) {
      return block.text.text.length > 0 ? [{ type: 'text', text: block.text.text }] : [];
    }
    const fontInfo = block.text.fontInfo;
    return [{
      type: 'textBlockAtom',
      attrs: {
        blockId: block.text.attrs.id,
        text: block.text.text,
        fontFamily: SmoScoreText.familyString(fontInfo.family),
        fontSize: SmoScoreText.fontPointSize(fontInfo.size),
        fontWeight: SmoScoreText.weightString(fontInfo.weight),
        fontStyle: fontInfo.style ?? 'normal'
      }
    }];
  };

  const sameLine = textGroup.relativePosition === SmoTextGroup.relativePositions.LEFT
    || textGroup.relativePosition === SmoTextGroup.relativePositions.RIGHT;

  const paragraphs: JSONContent[] = sameLine
    ? [{ type: 'paragraph', content: blocks.flatMap(contentForBlock) }]
    : blocks.map((block): JSONContent => ({ type: 'paragraph', content: contentForBlock(block) }));

  return { type: 'doc', content: paragraphs };
}

/**
 * Convert a TipTap JSON document (`editor.getJSON()`) back into a
 * SmoTextGroup. Only the active block's text can have changed (there is no
 * formatting to read back, since the editor exposes no marks); every other
 * field -- including every non-active block, which is structurally
 * non-editable -- is carried over unchanged from `original`. The group
 * keeps its original attrs.id via SmoTextGroup.deserializePreserveId.
 */
export function htmlToTextGroup(editorJson: JSONContent, original: SmoTextGroup): SmoTextGroup {
  const result = SmoTextGroup.deserializePreserveId(original.serialize());
  const activeBlock = result.getActiveBlock();

  let activeText = '';
  const collectText = (node: JSONContent) => {
    if (node.type === 'text' && node.text) {
      activeText += node.text;
    }
    (node.content ?? []).forEach(collectText);
  };
  (editorJson.content ?? []).forEach(collectText);

  activeBlock.text = activeText;
  result.textBlocks.forEach((block) => {
    block.activeText = block.text.attrs.id === activeBlock.attrs.id;
  });
  return result;
}
