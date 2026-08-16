// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
/**
 * Conversion between SmoTextGroup (the score's rich-text data model) and the
 * HTML / TipTap JSON representation used by textGroupEditor.vue.
 * @module /ui/components/dialogs/textGroupHtml
 */
import { JSONContent } from '@tiptap/core';
import { SmoTextGroup, SmoTextBlock, SmoScoreText, SmoScoreTextParams } from '../../../smo/data/scoreText';
import { FontInfo } from '../../../common/vex';

type SuperState = 'normal' | 'sup' | 'sub';

const escapeHtmlChar = (ch: string): string => {
  switch (ch) {
    case '&': return '&amp;';
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '"': return '&quot;';
    case '\'': return '&#39;';
    default: return ch;
  }
};

// The score text encodes superscript/subscript as literal toggle characters
// embedded in the plain string ('^' for superscript, '%' for subscript),
// consumed invisibly when rendering -- see SuiTextEditor.textTypeToChar /
// textTypeFromChar (src/render/sui/textEdit.ts).  Reproduce that convention
// here so this editor stays compatible with the SVG renderer.
const markupToInlineHtml = (raw: string): string => {
  let mode: SuperState = 'normal';
  let out = '';
  const closeTag = () => {
    if (mode === 'sup') { out += '</sup>'; }
    else if (mode === 'sub') { out += '</sub>'; }
  };
  const openTag = (target: 'sup' | 'sub') => {
    out += target === 'sup' ? '<sup>' : '<sub>';
  };
  for (let i = 0; i < raw.length; ++i) {
    const ch = raw[i];
    if (ch === '^' || ch === '%') {
      const target: 'sup' | 'sub' = ch === '^' ? 'sup' : 'sub';
      if (mode === target) {
        closeTag();
        mode = 'normal';
      } else {
        if (mode !== 'normal') {
          closeTag();
        }
        openTag(target);
        mode = target;
      }
      continue;
    }
    out += escapeHtmlChar(ch);
  }
  closeTag();
  return out;
};

const justificationToTextAlign = (justification: number): string => {
  if (justification === SmoTextGroup.justifications.CENTER) {
    return 'center';
  }
  if (justification === SmoTextGroup.justifications.RIGHT) {
    return 'right';
  }
  return 'left';
};

const textAlignToJustification = (textAlign: string | undefined): number => {
  if (textAlign === 'center') {
    return SmoTextGroup.justifications.CENTER;
  }
  if (textAlign === 'right') {
    return SmoTextGroup.justifications.RIGHT;
  }
  return SmoTextGroup.justifications.LEFT;
};

// Only paragraph-level attrs (text-align, via the TextAlign extension) survive
// on the <p> style itself -- TipTap's schema strips any style property that
// isn't backed by a node/mark attribute. Font family/size/weight/style are
// mark attributes (textStyle/bold/italic), so they must be expressed as
// inline elements wrapping the run: a <span style="font-family...;font-size...">
// (textStyle's parseHTML only matches a `span` tag) plus <strong>/<em>.
const fontInfoToRunStyle = (fontInfo: FontInfo): string => {
  const family = SmoScoreText.familyString(fontInfo.family);
  const size = SmoScoreText.fontPointSize(fontInfo.size);
  return `font-family: ${family}; font-size: ${size}px;`;
};

/**
 * Convert a SmoTextGroup into an HTML string suitable for TipTap's initial
 * `content` option.  Each SmoTextBlock becomes a paragraph carrying its own
 * font/weight/style, since SmoScoreText stores one font per block.
 */
export function textGroupToHtml(textGroup: SmoTextGroup): string {
  const textAlign = justificationToTextAlign(textGroup.justification);
  if (textGroup.textBlocks.length === 0) {
    return `<p style="text-align: ${textAlign};"></p>`;
  }
  return textGroup.textBlocks.map((block: SmoTextBlock) => {
    const scoreText = block.text;
    const fontInfo = scoreText.fontInfo;
    const inner = markupToInlineHtml(scoreText.text);
    if (inner.length === 0) {
      return `<p style="text-align: ${textAlign};"><br></p>`;
    }
    let content = inner;
    if (SmoScoreText.weightString(fontInfo.weight) === 'bold') {
      content = `<strong>${content}</strong>`;
    }
    if ((fontInfo.style ?? 'normal') === 'italic') {
      content = `<em>${content}</em>`;
    }
    content = `<span style="${fontInfoToRunStyle(fontInfo)}">${content}</span>`;
    return `<p style="text-align: ${textAlign};">${content}</p>`;
  }).join('');
}

interface RunMarks {
  bold: boolean,
  italic: boolean,
  superscript: boolean,
  subscript: boolean,
  fontFamily?: string,
  fontSize?: string
}

const marksForRun = (run: JSONContent): RunMarks => {
  const rv: RunMarks = { bold: false, italic: false, superscript: false, subscript: false };
  (run.marks ?? []).forEach((mark) => {
    if (mark.type === 'bold') {
      rv.bold = true;
    } else if (mark.type === 'italic') {
      rv.italic = true;
    } else if (mark.type === 'superscript') {
      rv.superscript = true;
    } else if (mark.type === 'subscript') {
      rv.subscript = true;
    } else if (mark.type === 'textStyle') {
      if (mark.attrs?.fontFamily) {
        rv.fontFamily = mark.attrs.fontFamily;
      }
      if (mark.attrs?.fontSize) {
        rv.fontSize = mark.attrs.fontSize;
      }
    }
  });
  return rv;
};

// Reproduce the '^'/'%' toggle-character markup, matching markupToInlineHtml's
// inverse: markers are only emitted at superscript/subscript state transitions.
const paragraphToMarkupText = (paragraph: JSONContent): string => {
  const runs = paragraph.content ?? [];
  let out = '';
  let lastState: 'normal' | 'sup' | 'sub' = 'normal';
  runs.forEach((run) => {
    if (run.type !== 'text' || !run.text) {
      return;
    }
    const marks = marksForRun(run);
    const state: 'normal' | 'sup' | 'sub' = marks.superscript ? 'sup' : marks.subscript ? 'sub' : 'normal';
    // Close/open toggle markers only at state transitions so adjacent runs
    // of the same super/subscript state don't get redundant markers.
    if (state !== lastState) {
      if (lastState !== 'normal') {
        out += lastState === 'sup' ? '^' : '%';
      }
      if (state !== 'normal') {
        out += state === 'sup' ? '^' : '%';
      }
      lastState = state;
    }
    out += run.text;
  });
  if (lastState !== 'normal') {
    out += lastState === 'sup' ? '^' : '%';
  }
  return out;
};

const paragraphFontInfo = (paragraph: JSONContent, fallback: FontInfo): FontInfo => {
  const runs = paragraph.content ?? [];
  const firstRun = runs.find((run) => run.type === 'text');
  if (!firstRun) {
    return fallback;
  }
  const marks = marksForRun(firstRun);
  return {
    family: marks.fontFamily ?? fallback.family,
    size: marks.fontSize ? SmoScoreText.fontPointSize(marks.fontSize) : fallback.size,
    weight: marks.bold ? 'bold' : 'normal',
    style: marks.italic ? 'italic' : 'normal'
  };
};

/**
 * Convert a TipTap/ProseMirror JSON document (`editor.getJSON()`) back into
 * a SmoTextGroup.  Group-level fields other than `justification` and
 * `textBlocks` are carried over unchanged from `original`; the group keeps
 * its original attrs.id via SmoTextGroup.deserializePreserveId.
 */
export function htmlToTextGroup(editorJson: JSONContent, original: SmoTextGroup): SmoTextGroup {
  // Clone (not mutate) `original` -- deserializePreserveId keeps attrs.id
  // stable while giving us fresh SmoScoreText block objects to update.
  const result = SmoTextGroup.deserializePreserveId(original.serialize());
  const clonedBlocks = result.textBlocks;
  const paragraphs = (editorJson.content ?? []).filter((node) => node.type === 'paragraph');
  const textBlocks: SmoTextBlock[] = [];
  paragraphs.forEach((paragraph, ix) => {
    const clonedBlock = clonedBlocks[ix];
    const fallbackFont: FontInfo = clonedBlock ? clonedBlock.text.fontInfo : SmoScoreText.defaults.fontInfo;
    const fontInfo = paragraphFontInfo(paragraph, fallbackFont);
    const text = paragraphToMarkupText(paragraph);
    if (clonedBlock) {
      clonedBlock.text.text = text;
      clonedBlock.text.fontInfo = fontInfo;
      textBlocks.push({ text: clonedBlock.text, position: clonedBlock.position, activeText: false });
    } else {
      const params: SmoScoreTextParams = {
        ...SmoScoreText.defaults,
        text,
        fontInfo
      };
      const scoreText = new SmoScoreText(params);
      textBlocks.push({ text: scoreText, position: SmoTextGroup.relativePositions.BELOW, activeText: false });
    }
  });
  result.textBlocks = textBlocks;
  if (paragraphs.length > 0) {
    result.justification = textAlignToJustification(paragraphs[0].attrs?.textAlign);
  }
  return result;
}
