<script setup lang="ts">
import { ref, Ref, onBeforeUnmount } from 'vue';
import { SmoSelector, SmoSelection } from '../../../smo/xform/selections';
import { SmoLyric } from '../../../smo/data/noteModifiers';
import { SmoScoreText } from '../../../smo/data/scoreText';
import { FontInfo } from '../../../common/vex';
import { SelectOption } from '../../common';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { SvgHelpers } from '../../../render/sui/svgHelpers';
import dialogContainer from './dialogContainer.vue';
import numberInputApp from './numberInput.vue';
import selectComp from './select.vue';
import fontPickerComp from './fontPicker.vue';
import lyricEditorComp from './lyricEditor.vue';

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
const verse = ref(0);
const currentLyric: Ref<SmoLyric | null> = ref(null);
let originalText = '';
const lyricText = ref('');
const translateY = ref(0);
const fontInfo: Ref<FontInfo> = ref({ family: 'Merriweather', size: 12, weight: 'normal', style: 'normal' });

const verseOptions: SelectOption[] = [
  { value: '0', label: '1' },
  { value: '1', label: '2' },
  { value: '2', label: '3' },
  { value: '3', label: '4' }
];

// Subtle position marker (012-lyric-live-preview-cursor): a plain-DOM
// element, not a Vue ref -- it's imperative SVG state, not template-bound.
let markerElement: SVGLineElement | null = null;

// If the current note's lyric has already been rendered (existing text),
// approximate "end of existing text" with the whole run's bounding box
// (no per-character layout is available without the legacy inline-SVG
// editor this dialog deliberately does not use -- see 010 research.md §3).
// Otherwise, fall back to a position near the note itself, mirroring the
// legacy SuiLyricSession._startSessionForNote fallback.
const computeMarkerPosition = (): { x: number, y: number, height: number } | null => {
  const lyric = currentLyric.value;
  if (!lyric) {
    return null;
  }
  if (lyric.logicalBox) {
    const box = lyric.logicalBox;
    return { x: box.x + box.width, y: box.y, height: box.height };
  }
  const selection = SmoSelection.noteFromSelector(score, currentSelector.value);
  const note = selection?.note;
  if (!note || !note.logicalBox) {
    return null;
  }
  const height = SmoScoreText.fontPointSize(lyric.fontInfo.size);
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

// Mirrors SuiLyricSession._setLyricForNote (src/render/sui/textEdit.ts):
// load the note's existing lyric for this verse, or build a default one
// seeded from the score's 'lyrics' font entry if none exists yet.
const loadNote = (selector: SmoSelector, verseNum: number) => {
  const selection = SmoSelection.noteFromSelector(score, selector);
  if (!selection || !selection.note) {
    return;
  }
  const note = selection.note;
  const lar = note.getLyricForVerse(verseNum, SmoLyric.parsers.lyric);
  let lyric: SmoLyric;
  if (lar.length) {
    lyric = lar[0] as SmoLyric;
  } else {
    const scoreFont = score.fonts.find((fn) => fn.name === 'lyrics');
    const defaultFontInfo = JSON.parse(JSON.stringify(scoreFont));
    const lyricD = SmoLyric.defaults;
    lyricD.text = '';
    lyricD.verse = verseNum;
    lyricD.fontInfo = defaultFontInfo;
    lyric = new SmoLyric(lyricD);
  }
  currentLyric.value = lyric;
  originalText = lyric.getText();
  lyricText.value = originalText;
  translateY.value = lyric.translateY;
  fontInfo.value = {
    family: lyric.fontInfo.family,
    size: lyric.fontInfo.size,
    weight: 'normal',
    style: lyric.fontInfo.style ?? 'normal'
  };
  updateMarker();
};
// Auto-start editing on the initially selected note, unconditionally,
// matching SuiLyricDialog.bindElements()'s unconditional startEditSession().
loadNote(currentSelector.value, verse.value);

const lyricEditorRef = ref<InstanceType<typeof lyricEditorComp> | null>(null);

// Mirrors SuiLyricSession._updateLyricFromEditor: only write back if the
// text actually changed, and never re-add a lyric that was just deleted.
const commitIfChanged = async () => {
  const lyric = currentLyric.value;
  if (!lyric) {
    return;
  }
  const text = lyricEditorRef.value?.getText() ?? lyricText.value;
  lyricText.value = text;
  if (text !== originalText && !lyric.deleted) {
    lyric.setText(text);
    await props.view.addOrUpdateLyric(currentSelector.value, lyric);
  }
};

// Mirrors SuiLyricSession.advanceSelection: commit the current note, then
// move to the next/previous note in the score (no-op at score boundaries).
const navigate = async (direction: 'next' | 'previous') => {
  await commitIfChanged();
  const next = direction === 'next'
    ? SmoSelection.nextNoteSelectionFromSelector(score, currentSelector.value)
    : SmoSelection.lastNoteSelectionFromSelector(score, currentSelector.value);
  if (next) {
    currentSelector.value = next.selector;
    loadNote(currentSelector.value, verse.value);
  }
};
const goNext = () => navigate('next');
const goPrevious = () => navigate('previous');

// Handles lyricEditorComp's `advance` emit (011-lyric-editor-auto-advance):
// typing '-' or Space in the editor. 'commit' reuses navigate('next') verbatim
// (hyphen already inserted, or Space with existing text). 'skip' (Space with no
// text) advances without ever calling commitIfChanged/addOrUpdateLyric, so
// skipping empty notes with the space bar never persists an empty lyric.
const onEditorAdvance = async (mode: 'commit' | 'skip') => {
  if (mode === 'commit') {
    await navigate('next');
    return;
  }
  const next = SmoSelection.nextNoteSelectionFromSelector(score, currentSelector.value);
  if (next) {
    currentSelector.value = next.selector;
    loadNote(currentSelector.value, verse.value);
  }
};

// Mirrors SuiLyricSession.removeLyric: remove, then advance forward
// without re-committing the now-deleted lyric.
const deleteCurrent = async () => {
  const lyric = currentLyric.value;
  if (!lyric) {
    return;
  }
  await props.view.removeLyric(currentSelector.value, lyric);
  const next = SmoSelection.nextNoteSelectionFromSelector(score, currentSelector.value);
  if (next) {
    currentSelector.value = next.selector;
    loadNote(currentSelector.value, verse.value);
  }
};

const enterDialogMode = async () => {
  await commitIfChanged();
  mode.value = 'dialog';
  removeMarker();
};

// Handles lyricEditorComp's `preview` emit (012-lyric-live-preview-cursor):
// a debounced pause in typing. Reuses commitIfChanged() unchanged -- there
// is no separate draft state in this dialog, so the periodic preview write
// and the eventual persisted state are the same operation (see 012
// research.md §5) -- then repositions the marker to the newly-rendered text.
const onEditorPreview = async () => {
  await commitIfChanged();
  updateMarker();
};
const enterEditingMode = () => {
  mode.value = 'editing';
};

// Reloads display state for the current note under the newly selected
// verse; does not write to the score (verse only takes effect once
// editing resumes and text is entered/committed).
const onVerseChange = (value: string) => {
  verse.value = parseInt(value, 10);
  loadNote(currentSelector.value, verse.value);
};

const onYChange = async (value: number) => {
  translateY.value = value;
  const lyric = currentLyric.value;
  if (lyric) {
    lyric.translateY = value;
    await props.view.addOrUpdateLyric(currentSelector.value, lyric);
  }
};

// Score-wide, matching legacy SuiLyricDialog.changed(): seeded from the
// current note's lyric, but committed via view.setLyricFont (all lyrics),
// with weight always forced to 'normal'.
const onFontChange = async (font: FontInfo) => {
  fontInfo.value = { ...font, weight: 'normal' };
  await props.view.setLyricFont({ family: font.family, size: font.size, weight: 'normal' });
};

// OK and Cancel behave identically: commit the note currently being
// edited (if any), then close. Lyric edits/deletions/navigation already
// wrote to the score incrementally, so there is nothing else to persist
// or revert here -- matches SuiLyricDialog wiring both buttons to the
// same _complete() with no groupUndo.
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
          <lyricEditorComp ref="lyricEditorRef" :domId="getId('editor')" :text="lyricText" :fontInfo="fontInfo"
            @advance="onEditorAdvance" @preview="onEditorPreview" />
        </div>
      </div>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col-auto btn-group" role="group">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('previous-note')"
            title="Previous Note" @click.prevent="goPrevious"><span class="icon-arrow-left"></span></button>
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('next-note')"
            title="Next Note" @click.prevent="goNext"><span class="icon-arrow-right"></span></button>
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('delete-lyric')"
            title="Delete Lyric" @click.prevent="deleteCurrent"><span class="icon-cross"></span></button>
        </div>
        <div class="col-auto ms-2">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('done-editing')"
            @click.prevent="enterDialogMode"><span class="icon-checkmark"></span> Done Editing Lyrics</button>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="row mb-2 ms-2">
        <div class="col-auto">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('edit-lyrics')"
            @click.prevent="enterEditingMode"><span class="icon-pencil"></span> Edit Lyrics</button>
        </div>
      </div>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col col-6">
          <selectComp :key="verse" :domId="getId('verse')" label="Verse" :selections="verseOptions"
            :initialValue="verse.toString()" :changeCb="onVerseChange" />
        </div>
        <div class="col col-6">
          <numberInputApp :domId="getId('translate-y')" :precision="0" :minValue="-9999" :maxValue="9999"
            :initialValue="translateY" :changeCb="onYChange" label="Y Adjustment (Px)" />
        </div>
      </div>
      <fontPickerComp :domId="getId('font')" label="Font" :font="fontInfo" :changeCb="onFontChange" />
    </template>
  </dialogContainer>
</template>
