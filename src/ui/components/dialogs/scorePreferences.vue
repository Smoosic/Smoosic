<script setup lang="ts">
import { ref, Ref } from 'vue';
import { SmoScorePreferences } from '../../../smo/data/scoreModifiers';
import { SelectOption } from '../../common';
import selectComp from './select.vue';
import dialogContainer from './dialogContainer.vue';
import toggle from './toggle.vue';

interface Props {
  domId: string,
  getPreferences: () => SmoScorePreferences,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props: Props = defineProps<Props>();
const { domId, commitCb, cancelCb, getPreferences } = { ...props };
const preferences = getPreferences();

type numberTypes = 'defaultDupleDuration' | 'defaultTripleDuration';

const defaultDoubleDurations: SelectOption[] = [
  { label: '1/4', value: '4096' },
  { label: '1/8', value: '2048' }
];
const defaultTripleDurations: SelectOption[] = [
  { label: 'dotted 1/4', value: '6144' },
  { label: '1/8', value: '2048' }
];

const getDomId = () => {
  return `attr-modal-dialog-${domId}`;
}
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const updateNumber = (type: numberTypes) => {
  const cb = (value: string) => {
    (preferences as any)[type] = parseInt(value, 10);
  }
  return cb;
}

</script>
<template>
  <dialogContainer :domId="domId" :commitCb="commitCb" :cancelCb="cancelCb" :label="'Score Preferences'">
    <div class="row">
      <div class="col col-6">
        <toggle :domId="getId('autoAdvance')" :label="'Auto-advance on pitch change'" :initialValue="preferences.autoAdvance"
          :changeCb="(value: boolean) => { preferences.autoAdvance = value }" />
      </div>
      <div class="col col-6">
        <toggle :domId="getId('autoPlay')" :label="'Auto-play sounds for pitch change'" :initialValue="preferences.autoPlay"
          :changeCb="(value: boolean) => { preferences.autoPlay = value }" />
      </div>
    </div>
    <div class="row">
      <div class="col col-6">
        <toggle :domId="getId('showPiano')" :label="'Show piano widget'" :initialValue="preferences.showPiano"
          :changeCb="(value: boolean) => { preferences.showPiano = value }" />
      </div>
      <div class="col col-6">
        <toggle :domId="getId('transposeScore')" :label="'Transposing score'" :initialValue="preferences.transposingScore"
          :changeCb="(value: boolean) => { preferences.transposingScore = value }" />
      </div>
    </div>
    <div class="row">
      <div class="col col-6">
        <toggle :domId="getId('hideEmptyLines')" :label="'Hide empty staves'" :initialValue="preferences.hideEmptyLines"
          :changeCb="(value: boolean) => { preferences.hideEmptyLines = value }" />
      </div>
      <div class="col col-6">
        <toggle :domId="getId('partNames')" :label="'Show part names in Score'" :initialValue="preferences.showPartNames"
          :changeCb="(value: boolean) => { preferences.showPartNames = value }" />
      </div>
    </div>
    <div class="row">
      <div class="col col-6">
        <toggle :domId="getId('horizontalDisplay')" :label="'Horizontal Display'" :initialValue="preferences.horizontalDisplay"
          :changeCb="(value: boolean) => { preferences.horizontalDisplay = value }" />
      </div>
    </div>
    <div class="row align-items-baseline mt-3" :id="getId('arp-row')">
      <div class="col col-6 text-start">
        <selectComp :domId="getId('duration-select1')" label="Default Duration(even meter)"
          :initialValue="preferences.defaultDupleDuration.toString()" :selections="defaultDoubleDurations"
          :changeCb="updateNumber('defaultDupleDuration')" />
      </div>
      <div class="col col-6 text-start">
        <selectComp :domId="getId('duration-select2')" label="Default Duration (triple meter)"
          :initialValue="preferences.defaultTripleDuration.toString()" :selections="defaultTripleDurations"
          :changeCb="updateNumber('defaultTripleDuration')" />
      </div>
    </div>
  </dialogContainer>
</template>