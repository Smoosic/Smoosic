<script setup lang="ts">
import { ref, Ref } from 'vue';
import { SmoScorePreferences } from '../../../smo/data/scoreModifiers';
import { SelectOption } from '../../common';
import selectComp from './select.vue';
import dialogContainer from './dialogContainer.vue';

interface Props {
  domId: string,
  getPreferences: () => SmoScorePreferences,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props: Props = defineProps<Props>();
const { domId, commitCb, cancelCb, getPreferences } = { ...props };
const preferences = getPreferences();

type booleanTypes = 'autoPlay' | 'autoAdvance' | 'showPiano' | 'hideEmptyLines' | 'autoScrollPlayback' | 'transposingScore' 
  | 'showPartNames' | 'horizontalDisplay';
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
const updateBool = (type: booleanTypes) => {
  const cb = (value: boolean) => {
    (preferences as any)[type] = value;
  }
  return cb;
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
      <div class="col col-1">
        <input class="form-check-input" type="checkbox" v-model="preferences.autoAdvance" :id="getId('autoAdvance')"
          @change="updateBool('autoAdvance')"></input>
      </div>
      <div class="col col-5">
        <label class="form-check-label" :for="getId('autoAdvance')">Auto-advance on pitch change</label>
      </div>
      <div class="col col-1">
        <input class="form-check-input" type="checkbox" v-model="preferences.autoPlay" :id="getId('autoPlay')"
          @change="updateBool('autoPlay')"></input>
      </div>
      <div class="col col-5">
        <label class="form-check-label" :for="getId('autoPlay')">Auto-play sounds for pitch change</label>
      </div>
    </div>
    <div class="row">
      <div class="col col-1">
        <input class="form-check-input" type="checkbox" v-model="preferences.showPiano" :id="getId('showPiano')"
          @change="updateBool('showPiano')"></input>
      </div>
      <div class="col col-5">
        <label class="form-check-label" :for="getId('showPiano')">Show piano widget</label>
      </div>
      <div class="col col-1">
        <input class="form-check-input" type="checkbox" v-model="preferences.transposingScore"
          :id="getId('transposeScore')" @change="updateBool('transposingScore')"></input>
      </div>
      <div class="col col-5">
        <label class="form-check-label" :for="getId('transposeScore')">Transposing score</label>
      </div>
    </div>
    <div class="row">
      <div class="col col-1">
        <input class="form-check-input" type="checkbox" v-model="preferences.hideEmptyLines"
          :id="getId('hideEmptyLines')" @change="updateBool('hideEmptyLines')"></input>
      </div>
      <div class="col col-5">
        <label class="form-check-label" :for="getId('hideEmptyLines')">Hide empty staves</label>
      </div>
      <div class="col col-1">
        <input class="form-check-input" type="checkbox" v-model="preferences.showPartNames" :id="getId('partNames')"
          @change="updateBool('showPartNames')"></input>
      </div>
      <div class="col col-5">
        <label class="form-check-label" :for="getId('partNames')">Show part names in Score</label>
      </div>
    </div>
    <div class="row">
      <div class="col col-1">
        <input class="form-check-input" type="checkbox" v-model="preferences.horizontalDisplay"
          :id="getId('horizontalDisplay')" @change="updateBool('horizontalDisplay')"></input>
      </div>
      <div class="col col-5">
        <label class="form-check-label" :for="getId('hideEmptyLines')">Horizontal Display</label>
      </div>
    </div>
    <div class="row align-items-baseline mt-3" :id="getId('arp-row')">
      <div class="col col-3 float-end pe-0">
        <span :for="getId('duration-select1')" class="form-label">Default Duration (even meter):</span>
      </div>
      <div class="col col-3 text-start">
        <selectComp :domId="getId('duration-select1')" label="Select"
          :initialValue="preferences.defaultDupleDuration.toString()" :selections="defaultDoubleDurations"
          :changeCb="updateNumber('defaultDupleDuration')" />
      </div>
      <div class="col col-3 float-end pe-0">
        <span :for="getId('duration-select2')" class="form-label">Default Duration (triple meter):</span>
      </div>
      <div class="col col-3 text-start">
        <selectComp :domId="getId('duration-select2')" label="Select"
          :initialValue="preferences.defaultTripleDuration.toString()" :selections="defaultTripleDurations"
          :changeCb="updateNumber('defaultTripleDuration')" />
      </div>
    </div>
  </dialogContainer>
</template>