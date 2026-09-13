<script setup lang="ts">
import { ref, Ref, watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { createStyleTag, Extension, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { SmoScoreText } from '../../../smo/data/scoreText';
import { FontInfo, ChordSymbolGlyphs } from '../../../common/vex';
import { SuiInlineText } from '../../../render/sui/textRender';
import { ChordSegment, TextType, decodeChordText, encodeChordText } from './chordText';

// See lyricEditor.vue -- same rationale for injecting CSS via createStyleTag
// rather than a <style> block (no css-loader wired into this project's webpack build).
const BASE_EDITOR_CSS = '.chord-editor-content .ProseMirror p { margin: 0; } '
  + '.chord-editor-content .chord-glyph { opacity: 0.7; padding: 0 1px; }';
const editorStyleTag = createStyleTag(BASE_EDITOR_CSS, undefined, 'chord-editor');

interface Props {
  domId: string,
  text: string,
  fontInfo: FontInfo,
  textType: number
}
const props = defineProps<Props>();
const emit = defineEmits<{ preview: [], textTypeChange: [type: number] }>();

// Short, legible ASCII placeholders for glyphs with no single-character
// shortcut of their own (the Symbols dropdown only). Single-character
// shortcut glyphs (b, #, +, -, (, ), /) display as themselves. This is
// cosmetic only -- see FR-022 / research.md §4: the editor's own rendering
// of a glyph does not need to match the true Bravura symbol, only the
// glyphKey attribute (round-tripped byte-for-byte via chordText.ts) matters.
const GLYPH_DISPLAY: Record<string, string> = {
  diminished: 'dim',
  halfDiminished: 'hdim',
  majorSeventh: 'maj7'
};
const displayForGlyph = (glyphKey: string): string => GLYPH_DISPLAY[glyphKey] ?? glyphKey;

// Atomic, non-splittable inline node representing one music glyph
// (research.md §4). Its only meaningful data is the `glyphKey` attribute --
// the exact string chordText.ts wraps in '@...@' on serialization.
const ChordGlyph = Node.create({
  name: 'chordGlyph',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      glyphKey: { default: '' }
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-glyph-key]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      class: 'chord-glyph',
      'data-glyph-key': node.attrs.glyphKey
    }), displayForGlyph(node.attrs.glyphKey)];
  }
});

const textTypeMarks = (textType: number): { type: string }[] => {
  if (textType === SuiInlineText.textTypes.superScript) {
    return [{ type: 'superscript' }];
  }
  if (textType === SuiInlineText.textTypes.subScript) {
    return [{ type: 'subscript' }];
  }
  return [];
};

const glyphContent = (glyphKey: string, textType: number) => ({
  type: 'chordGlyph',
  attrs: { glyphKey },
  marks: textTypeMarks(textType)
});

// Toggle the typing text-position via SuiInlineText's existing three-way
// transition table (Normal <-> named mode; the *other* mode -> named mode
// directly) -- the same rule the Text Position dropdown uses (research.md
// §5), just reached via a different input.
const toggleTextType = (target: number): number => SuiInlineText.getTextTypeResult(props.textType, target);

// Recognize exactly the shortcut characters this feature names -- b, #, +,
// -, (, ), / -- via membership in the already-exported ChordSymbolGlyphs
// map (src/common/vex.ts), whose single-character keys are precisely this
// set (research.md §3). Each inserts a chordGlyph node (glyphKey = the
// typed character itself, matching what the legacy SuiChordEditor persists)
// instead of the literal character.
//
// '^' and '%' are also recognized here, but toggle the typing text-position
// instead of inserting a glyph -- per an explicit correction from the
// feature owner, '^' toggles toward Subscript and '%' toggles toward
// Superscript, the *reverse* of the persisted chord-text format's own
// '^'/'%' toggle-character convention (research.md §10); this local
// char->target mapping is intentionally its own thing, not a reuse of
// SuiTextEditor.textTypeFromChar.
const ChordGlyphShortcuts = Extension.create({
  name: 'chordGlyphShortcuts',
  addKeyboardShortcuts() {
    const shortcuts: Record<string, () => boolean> = {
      Enter: () => true,
      'Shift-Enter': () => true,
      '^': () => {
        emit('textTypeChange', toggleTextType(SuiInlineText.textTypes.subScript));
        return true;
      },
      '%': () => {
        emit('textTypeChange', toggleTextType(SuiInlineText.textTypes.superScript));
        return true;
      }
    };
    Object.keys(ChordSymbolGlyphs).forEach((key) => {
      if (key.length === 1) {
        shortcuts[key] = () => {
          this.editor.chain().focus().insertContent(glyphContent(key, props.textType)).run();
          return true;
        };
      }
    });
    return shortcuts;
  }
});

const toDoc = (segments: ChordSegment[]) => ({
  type: 'doc',
  content: [{
    type: 'paragraph',
    content: segments.map((segment) => segment.kind === 'glyph'
      ? glyphContent(segment.glyphKey, segment.textType)
      : { type: 'text', text: segment.text, marks: textTypeMarks(segment.textType) })
  }]
});

const nodeTextType = (marks: readonly { type: { name: string } }[]): TextType => {
  if (marks.some((m) => m.type.name === 'superscript')) {
    return SuiInlineText.textTypes.superScript as TextType;
  }
  if (marks.some((m) => m.type.name === 'subscript')) {
    return SuiInlineText.textTypes.subScript as TextType;
  }
  return SuiInlineText.textTypes.normal as TextType;
};

const editor = useEditor({
  content: toDoc(decodeChordText(props.text)),
  onUpdate: schedulePreview,
  extensions: [
    StarterKit.configure({
      blockquote: false,
      bold: false,
      bulletList: false,
      code: false,
      codeBlock: false,
      hardBreak: false,
      heading: false,
      horizontalRule: false,
      italic: false,
      link: false,
      listItem: false,
      listKeymap: false,
      orderedList: false,
      strike: false,
      underline: false
    }),
    Superscript,
    Subscript,
    ChordGlyph,
    ChordGlyphShortcuts
  ]
});

// Debounced live preview (012-lyric-live-preview-cursor's pattern, reused
// verbatim for chords per research.md §9).
const PREVIEW_DEBOUNCE_MS = 400;
let previewTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePreview() {
  if (previewTimer !== null) {
    clearTimeout(previewTimer);
  }
  previewTimer = setTimeout(() => {
    previewTimer = null;
    emit('preview');
  }, PREVIEW_DEBOUNCE_MS);
}

const computeFontStyle = () => {
  const fontInfo = props.fontInfo;
  return {
    fontFamily: SmoScoreText.familyString(fontInfo.family),
    fontSize: `${SmoScoreText.fontPointSize(fontInfo.size)}pt`,
    fontWeight: SmoScoreText.weightString(fontInfo.weight),
    fontStyle: fontInfo.style ?? 'normal'
  };
};
const activeFontStyle: Ref<Record<string, string>> = ref(computeFontStyle());
watch(activeFontStyle, (f) => {
  editorStyleTag.textContent = BASE_EDITOR_CSS
    + `.chord-editor-content .ProseMirror p { font-family: ${f.fontFamily}; font-size: ${f.fontSize}; `
    + `font-weight: ${f.fontWeight}; font-style: ${f.fontStyle}; }`;
}, { immediate: true });

watch(() => props.fontInfo, () => {
  activeFontStyle.value = computeFontStyle();
});

// Re-initialize the document whenever the parent loads a different
// note/ordinality's chord symbol into this editor (navigate/delete/ordinality change).
watch(() => props.text, (next) => {
  editor.value?.commands.setContent(toDoc(decodeChordText(next)), { emitUpdate: false });
});

// Whenever the parent's Text Position dropdown changes, arrange for
// subsequently-typed plain text to carry the matching mark (FR-011).
// ProseMirror's stored-mark mechanism (the same one that makes "toggle
// bold, then type" work in any rich editor) applies this to ordinary
// typing automatically; explicit glyph insertion (above, and insertGlyph
// below) attaches marks directly instead, since stored marks are not
// guaranteed to propagate onto inserted atomic nodes.
watch(() => props.textType, (textType) => {
  if (!editor.value) {
    return;
  }
  const chain = editor.value.chain().focus();
  if (textType === SuiInlineText.textTypes.superScript) {
    chain.unsetSubscript().setSuperscript().run();
  } else if (textType === SuiInlineText.textTypes.subScript) {
    chain.unsetSuperscript().setSubscript().run();
  } else {
    chain.unsetSuperscript().unsetSubscript().run();
  }
});

const getText = (): string => {
  if (!editor.value) {
    return props.text;
  }
  const segments: ChordSegment[] = [];
  editor.value.state.doc.forEach((paragraph) => {
    paragraph.forEach((node) => {
      if (node.isText) {
        segments.push({ kind: 'text', text: node.text ?? '', textType: nodeTextType(node.marks) });
      } else if (node.type.name === 'chordGlyph') {
        segments.push({ kind: 'glyph', glyphKey: node.attrs.glyphKey, textType: nodeTextType(node.marks) });
      }
    });
  });
  return encodeChordText(segments);
};

const insertGlyph = (glyphKey: string): void => {
  editor.value?.chain().focus().insertContent(glyphContent(glyphKey, props.textType)).run();
};

defineExpose({ getText, insertGlyph });

onBeforeUnmount(() => {
  if (previewTimer !== null) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
});
</script>
<template>
  <div v-if="editor" class="chord-editor">
    <EditorContent :editor="editor" :id="domId"
      class="form-control chord-editor-content tiptap-editor"
      style="overflow-y: auto;" :style="activeFontStyle" />
  </div>
</template>
