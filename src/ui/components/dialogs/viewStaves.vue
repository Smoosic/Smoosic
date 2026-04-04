<script setup lang="ts">
import { reactive, Ref, ref, watch } from 'vue';
import { SmoScore } from '../../../smo/data/score';
import { ViewMapEntry } from '../../../render/sui/scoreView';
import dialogContainer from './dialogContainer.vue';
import { SmoScorePreferences } from '../../../smo/data/scoreModifiers';
interface Props {
  domId: string,
  label: string,
  score: SmoScore,
  getViewMap: () => ViewMapEntry[],
  getPreferences: () => SmoScorePreferences
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { label, domId, score, getViewMap, getPreferences, commitCb, cancelCb } = props;
const viewMap = getViewMap();
const preferences = getPreferences();
const getDomId = () => {
  return `attr-modal-dialog-${domId}`;
}
const getStaffId = (str: string, staffId: number) => {
  return `${domId}-${staffId}-${str}`;
}
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const toggleStave = async (ix: number) => {
  // viewMap[ix].show = !viewMap[ix].show;
}

</script>
<template>
  <dialogContainer :domId="domId" :commitCb="commitCb" :cancelCb="cancelCb" :label="label">
    <div class="row nw-30">
      <div class="col col-6 text-end">
        <h4 class="h5">Stave</h4>
      </div>
      <div class="col col-6 text-start">
        <h4 class="h5">Visible</h4>
      </div>
    </div>
    <div class="row">
      <div class="col col-7 text-end">
        <input class="form-check-input" type="checkbox" v-model="preferences.horizontalDisplay"
          :id="getId('horizontalDisplay')" ></input>
      </div>
      <div class="col col-5">
        <label class="form-check-label" :for="getId('hideEmptyLines')">Horizontal Display</label>
      </div>
    </div>

    <div v-for="(stave, ix) in viewMap" class="row">
      <div class="col col-6 text-end ">{{ score.staves[ix].partInfo.partName }}</div>
      <div class="col col-6 text-start">
        <input class="form-check-input" type="checkbox" v-model="viewMap[ix].show" :id="getStaffId('group-checkbox', ix)"
          @change="toggleStave(ix)"></input>
      </div>
    </div>
  </dialogContainer>
</template>