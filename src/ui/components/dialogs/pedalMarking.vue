<script setup lang="ts">
import toggle from './toggle.vue';
import dialogContainer from './dialogContainer.vue';

interface Props {
  domId: string,
  label: string,
  initialPosition?: { top: number, left: number },
  bracket: boolean,
  startMark: boolean,
  releaseMark: boolean,
  depressText: string,
  releaseText: string,
  updateBooleanCb: (param: 'bracket' | 'startMark' | 'releaseMark', value: boolean) => void,
  updateTextCb: (param: 'depressText' | 'releaseText', value: string) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>,
  removeCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb, removeCb } = { ...props };
const getId = (str: string) => {
  return `${domId}-${str}`;
}
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb" :removeCb="removeCb"
    :initialPosition="initialPosition" :classes="'text-center mw-40 nw-40'">
    <div class="row justify-content-start mb-2">
      <div class="checkbox-input-toggle-div">
        <toggle :domId="getId('bracket')" :label="'Bracket'" :initialValue="bracket"
          :changeCb="(value: boolean) => updateBooleanCb('bracket', value)" />
      </div>
      <div class="checkbox-input-toggle-div">
        <toggle :domId="getId('start-mark')" :label="'Start Mark'" :initialValue="startMark"
          :changeCb="(value: boolean) => updateBooleanCb('startMark', value)" />
      </div>
      <div class="checkbox-input-toggle-div">
        <toggle :domId="getId('release-mark')" :label="'ReleaseMark'" :initialValue="releaseMark"
          :changeCb="(value: boolean) => updateBooleanCb('releaseMark', value)" />
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-9">
        <input type="text" class="form-control" :id="getId('depress-text')" :value="depressText"
          @change="($event) => updateTextCb('depressText', ($event.target as HTMLInputElement).value)">
      </div>
      <div class="col col-3 text-start">
        <span :id="getId('depress-text-label')">Depress Text</span>
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-9">
        <input type="text" class="form-control" :id="getId('release-text')" :value="releaseText"
          @change="($event) => updateTextCb('releaseText', ($event.target as HTMLInputElement).value)">
      </div>
      <div class="col col-3 text-start">
        <span :id="getId('release-text-label')">Release Text</span>
      </div>
    </div>
  </dialogContainer>
</template>
