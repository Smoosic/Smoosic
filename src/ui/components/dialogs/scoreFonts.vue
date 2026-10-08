<script setup lang="ts">
import { ref, Ref, watch, reactive } from 'vue';
import selectComp from './select.vue';
import fontPickerApp from './fontPicker.vue';
import { SelectOption } from '../../common';
import { FontInfo } from '../../../common/vex';
import dialogContainer from './dialogContainer.vue';

type scoreFontInfo = {
  lyricFont: FontInfo,
  chordFont: FontInfo,
  engravingFont: Ref<string>
}
interface Props {
  domId: string,
  label: string,
  getFonts: () => scoreFontInfo,
  updateLyricFontCb: (font: FontInfo) => void,
  updateChordFontCb: (font: FontInfo) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, getFonts, updateLyricFontCb, updateChordFontCb, commitCb, cancelCb } = { ...props };
const fontInfo = getFonts();
const engravingFontValue = fontInfo.engravingFont.value;
const engravingFonts: SelectOption[] = [{
  value: 'Bravura',
  label: 'Bravura'
}, {
  value: 'Gonville',
  label: 'Gonville'
}, {
  value: 'Petaluma',
  label: 'Petaluma'
}, {
  value: 'Leland',
  label: 'Leland'
}]
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const engravingFontChange = (val: string) => {
  fontInfo.engravingFont.value = val;
}
</script>
<template>
  <dialogContainer :domId="domId" :commitCb="commitCb" :cancelCb="cancelCb" :label="label">
      <div class="group">
        <div class="group-label">Engraving</div>
        <selectComp :domId="getId('score-font-select')" :label="''" :selections="engravingFonts" :initialValue="engravingFontValue"
          :changeCb="engravingFontChange" />
      </div>
      <fontPickerApp :domId="getId('chord-font-picker')" :font="fontInfo.chordFont" :label="'Chords'" />
      <fontPickerApp :domId="getId('lyric-font-picker')" :font="fontInfo.lyricFont" :label="'Lyrics'"/>
  </dialogContainer>
</template>