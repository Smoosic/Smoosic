<script setup lang="ts">
import { ref, Ref, computed, onBeforeUnmount } from 'vue';
import { SmoSelector, SmoSelection } from '../../../smo/xform/selections';
import { SmoLyric } from '../../../smo/data/noteModifiers';
import { SmoScoreText } from '../../../smo/data/scoreText';
import { FontInfo, getChordSymbolGlyphFromCode } from '../../../common/vex';
import { SelectOption } from '../../common';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { SvgHelpers } from '../../../render/sui/svgHelpers';
import { SuiInlineText } from '../../../render/sui/textRender';
import dialogContainer from './dialogContainer.vue';
import numberInputApp from './numberInput.vue';
import selectComp from './select.vue';
import fontPickerComp from './fontPicker.vue';
import toggleComp from './toggle.vue';
import chordEditorComp from './chordEditor.vue';

interface Props {
  domId: string,
  label: string,
  view: SuiScoreViewOperations,
  initialSelector: SmoSelector,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const getId = (str: string) => `${props.domId}-${str}`;
const score = props.view.score;

type DialogMode = 'editing' | 'dialog';
const mode: Ref<DialogMode> = ref('editing');

const currentSelector: Ref<SmoSelector> = ref(JSON.parse(JSON.stringify(props.initialSelector)));
const ordinality = ref(0);
const currentChord: Ref<SmoLyric | null> = ref(null);
let originalText = '';
const currentTextType = ref<number>(SuiInlineText.textTypes.normal);
const translateY = ref(0);
const fontInfo: Ref<FontInfo> = ref({ family: 'Roboto Slab', size: 14, weight: 'normal', style: 'normal' });
const adjustWidth = ref(false);

const chordText = computed(() => currentChord.value?.getText() ?? '');

// Subtle position marker (012-lyric-live-preview-cursor's pattern, reused
// for chord symbols): a plain-DOM element, not a Vue ref -- it's imperative
// SVG state, not template-bound.
let markerElement: SVGLineElement | null = null;

// Mirrors the lyric dialog's computeMarkerPosition: if the chord symbol has
// already been rendered (existing text), use its bounding box; otherwise
// fall back to a position near the note itself.
const computeMarkerPosition = (): { x: number, y: number, height: number } | null => {
  const chord = currentChord.value;
  if (!chord) {
    return null;
  }
  if (chord.logicalBox) {
    const box = chord.logicalBox;
    return { x: box.x + box.width, y: box.y, height: box.height };
  }
  const selection = SmoSelection.noteFromSelector(score, currentSelector.value);
  const note = selection?.note;
  if (!note || !note.logicalBox) {
    return null;
  }
  const height = SmoScoreText.fontPointSize(chord.fontInfo.size);
  return {
    x: note.logicalBox.x,
    y: note.logicalBox.y + note.logicalBox.height + height,
    height
  };
};
const removeMarker = () => {
  if (markerElement) {
    markerElement.remove();
    markerElement = null;
  }
};
const updateMarker = () => {
  removeMarker();
  if (mode.value !== 'editing') {
    return;
  }
  const pos = computeMarkerPosition();
  if (!pos) {
    return;
  }
  const context = props.view.tracker.renderer.pageMap.getRenderer({ x: pos.x, y: pos.y });
  if (!context) {
    return;
  }
  markerElement = SvgHelpers.renderLyricPositionMarker(
    context.svg, pos.x - context.box.x, pos.y - context.box.y, pos.height
  );
};
onBeforeUnmount(() => removeMarker());

const ordinalityOptions: SelectOption[] = [
  { value: '0', label: '1' },
  { value: '1', label: '2' },
  { value: '2', label: '3' }
];
const symbolOptions: SelectOption[] = [
  { value: 'csymDiminished', label: 'Dim' },
  { value: 'csymHalfDiminished', label: 'Half dim' },
  { value: 'csymDiagonalArrangementSlash', label: 'Slash' },
  { value: 'csymMajorSeventh', label: 'Maj7' }
];
const textPositionOptions: SelectOption[] = [
  { value: String(SuiInlineText.textTypes.superScript), label: 'Superscript' },
  { value: String(SuiInlineText.textTypes.subScript), label: 'Subscript' },
  { value: String(SuiInlineText.textTypes.normal), label: 'Normal' }
];

// Mirrors SuiChordSession._setLyricForNote (src/render/sui/textEdit.ts):
// load the note's existing chord symbol for this ordinality, or build a
// default one seeded from the score's 'chords' font entry if none exists.
const loadNote = (selector: SmoSelector, ordinalityNum: number) => {
  const selection = SmoSelection.noteFromSelector(score, selector);
  if (!selection || !selection.note) {
    return;
  }
  const note = selection.note;
  const lar = note.getLyricForVerse(ordinalityNum, SmoLyric.parsers.chord);
  let chord: SmoLyric;
  if (lar.length) {
    chord = lar[0] as SmoLyric;
  } else {
    const scoreFont = score.fonts.find((fn) => fn.name === 'chords');
    const defaultFontInfo = JSON.parse(JSON.stringify(scoreFont));
    const chordD = SmoLyric.defaults;
    chordD.text = '';
    chordD.verse = ordinalityNum;
    chordD.parser = SmoLyric.parsers.chord;
    chordD.fontInfo = defaultFontInfo;
    chord = new SmoLyric(chordD);
  }
  currentChord.value = chord;
  originalText = chord.getText();
  translateY.value = chord.translateY;
  fontInfo.value = {
    family: chord.fontInfo.family,
    size: chord.fontInfo.size,
    weight: 'normal',
    style: chord.fontInfo.style ?? 'normal'
  };
  adjustWidth.value = chord.adjustNoteWidthChord;
  updateMarker();
};
// Auto-start editing on the initially selected note, unconditionally,
// matching SuiChordChangeDialog.bindElements()'s unconditional startEditSession().
loadNote(currentSelector.value, ordinality.value);

const chordEditorRef = ref<InstanceType<typeof chordEditorComp> | null>(null);

// Mirrors SuiChordSession's update-on-leave behavior: only write back if
// the text actually changed, and never re-add a chord symbol just deleted.
const commitIfChanged = async () => {
  const chord = currentChord.value;
  if (!chord) {
    return;
  }
  const text = chordEditorRef.value?.getText() ?? originalText;
  if (text !== originalText && !chord.deleted) {
    chord.setText(text);
    await props.view.addOrUpdateLyric(currentSelector.value, chord);
  }
};

// Mirrors the lyric dialog's navigate (010-vue-lyric-dialog): commit the
// current note, then move to the next/previous note (no-op at boundaries).
const navigate = async (direction: 'next' | 'previous') => {
  await commitIfChanged();
  const next = direction === 'next'
    ? SmoSelection.nextNoteSelectionFromSelector(score, currentSelector.value)
    : SmoSelection.lastNoteSelectionFromSelector(score, currentSelector.value);
  if (next) {
    currentSelector.value = next.selector;
    loadNote(currentSelector.value, ordinality.value);
  }
};
const goNext = () => navigate('next');
const goPrevious = () => navigate('previous');

// Mirrors the lyric dialog's deleteCurrent: remove, then advance forward
// without re-committing the now-deleted chord symbol.
const deleteCurrent = async () => {
  const chord = currentChord.value;
  if (!chord) {
    return;
  }
  await props.view.removeLyric(currentSelector.value, chord);
  const next = SmoSelection.nextNoteSelectionFromSelector(score, currentSelector.value);
  if (next) {
    currentSelector.value = next.selector;
    loadNote(currentSelector.value, ordinality.value);
  }
};

const enterDialogMode = async () => {
  await commitIfChanged();
  mode.value = 'dialog';
  removeMarker();
};
const enterEditingMode = () => {
  mode.value = 'editing';
};

// Reloads display state for the current note under the newly selected
// ordinality; does not write to the score (only takes effect once editing
// resumes and content is entered/committed).
const onOrdinalityChange = (value: string) => {
  ordinality.value = parseInt(value, 10);
  loadNote(currentSelector.value, ordinality.value);
};

const onYChange = async (value: number) => {
  translateY.value = value;
  const chord = currentChord.value;
  if (chord) {
    chord.translateY = value;
    await props.view.addOrUpdateLyric(currentSelector.value, chord);
  }
};

// Score-wide, matching legacy SuiChordChangeDialog.changed(): seeded from
// the current note's chord symbol, but committed via view.setChordFont
// (all chord symbols), with weight always forced to 'normal'.
const onFontChange = async (font: FontInfo) => {
  fontInfo.value = { ...font, weight: 'normal' };
  await props.view.setChordFont({ family: font.family, size: font.size, weight: 'normal' });
};

// Score-wide, matching legacy SuiChordChangeDialog.changed()'s direct
// view.score.setChordAdjustWidth(...) call (no SuiScoreViewOperations
// wrapper exists for this setting today).
const onAdjustWidthChange = (value: boolean) => {
  adjustWidth.value = value;
  props.view.score.setChordAdjustWidth(value);
};

// Symbols dropdown: resolve the dropdown's csymXxx code to the glyph key
// that actually gets persisted (research.md §3), then insert it.
const onSymbolSelect = (value: string) => {
  const glyphKey = getChordSymbolGlyphFromCode(value);
  chordEditorRef.value?.insertGlyph(glyphKey);
};

// Text Position dropdown: affects only content inserted after this point.
const onTextPositionChange = (value: string) => {
  currentTextType.value = parseInt(value, 10);
};

// Handles chordEditorComp's `textTypeChange` emit -- the '^'/'%' keyboard
// shortcuts (research.md §10) -- with the identical effect as the Text
// Position dropdown, so either input method leaves the same single source
// of truth (currentTextType) updated and reflected back in the dropdown.
const onEditorTextTypeChange = (type: number) => {
  currentTextType.value = type;
};

// Handles chordEditorComp's debounced `preview` emit (012-lyric-live-preview-cursor's
// pattern, reused for chords): commitIfChanged() is the same write navigation/finish use.
const onEditorPreview = async () => {
  await commitIfChanged();
  updateMarker();
};

// OK and Cancel behave identically: commit the note currently being
// edited (if any), then close -- matches SuiChordChangeDialog wiring both
// buttons to the same _complete() with no groupUndo.
const finish = async () => {
  if (mode.value === 'editing') {
    await commitIfChanged();
  }
  removeMarker();
};
const handleCommit = async () => {
  await finish();
  await props.commitCb();
};
const handleCancel = async () => {
  await finish();
  await props.cancelCb();
};
</script>

<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="handleCommit" :cancelCb="handleCancel" classes="text-left">
    <template v-if="mode === 'editing'">
      <div class="row mb-2 ms-2">
        <div class="col">
          <chordEditorComp ref="chordEditorRef" :domId="getId('editor')" :text="chordText" :fontInfo="fontInfo"
            :textType="currentTextType" @preview="onEditorPreview" @textTypeChange="onEditorTextTypeChange" />
        </div>
      </div>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col col-6">
          <selectComp :domId="getId('symbol')" label="Symbols" :selections="symbolOptions"
            :initialValue="symbolOptions[0].value" :changeCb="onSymbolSelect" />
        </div>
        <div class="col col-6">
          <selectComp :key="currentTextType" :domId="getId('text-position')" label="Text Position"
            :selections="textPositionOptions" :initialValue="currentTextType.toString()" :changeCb="onTextPositionChange" />
        </div>
      </div>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col-auto btn-group" role="group">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('previous-note')"
            title="Previous Note" @click.prevent="goPrevious"><span class="icon-arrow-left"></span></button>
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('next-note')"
            title="Next Note" @click.prevent="goNext"><span class="icon-arrow-right"></span></button>
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('delete-chord')"
            title="Delete Chord Symbol" @click.prevent="deleteCurrent"><span class="icon-cross"></span></button>
        </div>
        <div class="col-auto ms-2">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('done-editing')"
            @click.prevent="enterDialogMode"><span class="icon-checkmark"></span> Done Editing Chord Symbols</button>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="row mb-2 ms-2">
        <div class="col-auto">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('edit-chord')"
            @click.prevent="enterEditingMode"><span class="icon-pencil"></span> Edit Chord Symbols</button>
        </div>
      </div>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col col-6">
          <selectComp :key="ordinality" :domId="getId('ordinality')" label="Ordinality" :selections="ordinalityOptions"
            :initialValue="ordinality.toString()" :changeCb="onOrdinalityChange" />
        </div>
        <div class="col col-6">
          <numberInputApp :domId="getId('translate-y')" :precision="0" :minValue="-9999" :maxValue="9999"
            :initialValue="translateY" :changeCb="onYChange" label="Y Adjustment (Px)" />
        </div>
      </div>
      <div class="row mb-2 ms-2">
        <div class="col-auto">
          <toggleComp :domId="getId('adjust-width')" label="Adjust Note Width" :initialValue="adjustWidth"
            :changeCb="onAdjustWidthChange" />
        </div>
      </div>
      <fontPickerComp :domId="getId('font')" label="Font" :font="fontInfo" :changeCb="onFontChange" />
    </template>
  </dialogContainer>
</template>
