<script setup lang="ts">
import dialogContainer from './dialogContainer.vue';
import { DialogButtonDefinition } from '../../buttons/button';
import buttonGroup from './buttonGroup.vue';
import collapsableRow from './collapsableRow.vue';
import { ref, Ref, reactive } from 'vue';
interface Props {
  domId: string,
  pitches: DialogButtonDefinition[],
  intervals: DialogButtonDefinition[],
  letters: DialogButtonDefinition[],
  pitchCb: (value: string) => Promise<void>,
  intervalCb: (value: string) => void,
  letterCb: (value: string) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, pitches, intervals, letters, commitCb, cancelCb } = { ...props };
const intervalSplit = intervals.length / 2;
const interval1 = reactive(intervals.slice(0, intervalSplit));
const interval2 = reactive(intervals.slice(intervalSplit));
const getId = (str: string) => {
  return `${domId}-${str}`;
}


const lines: string[] = [];
lines.push(`<span class="text-muted">Learn to use the shortcuts, they are much faster!</span>`);
lines.push(`<div class="col">A-G note letter</div> <div class="col"> - = half-step  </div> <div class="col">  _ and + octaves </div> <div class="col"> 2-8 intervals </div>  <div class="col">      arrow keys navigate       </div>`);

</script>
<template>
  <dialogContainer :domId="domId" label="Change Pitches" :commitCb="commitCb" :cancelCb="cancelCb"
    :classes="'text-center container'">
    <div class="row mb-1 nw-40">
      <buttonGroup :label="'Change Pitch'" :buttonDefs="pitches" :domId="getId('pitch-buttons')"
        :commonClasses="'btn btn-sm btn-outline-dark'" rowClasses="align-items-center row" />
    </div>
    <div class="row mb-1">
      <buttonGroup :label="'Intervals'" :buttonDefs="interval1" :domId="getId('interval-buttons1')"
        :commonClasses="'btn btn-sm btn-outline-dark me-1'" rowClasses="align-items-center row" />
    </div>
    <div class="row mb-1">
      <buttonGroup :label="''" :buttonDefs="interval2" :domId="getId('interval-buttons2')"
        :commonClasses="'btn btn-sm btn-outline-dark me-1'" rowClasses="align-items-center row" />
    </div>
    <div class="row mb-1">
      <buttonGroup :label="'Letter Notes'" :buttonDefs="letters" :domId="getId('letter-buttons')"
        :commonClasses="'btn btn-sm btn-outline-dark py-0  me-1'" rowClasses="align-items-center row " />
    </div>
    <collapsableRow :domId="getId('pitch-help')" :initialState="false" label="" hint="Help">
      <span class="text-muted">Learn to use the shortcuts, they are much faster!</span>
      <div class="col">A-G note letter</div> 
      <div class="col"> - = half-step  </div> 
      <div class="col">  _ and + octaves </div> 
      <div class="col"> 2-8 intervals </div>  
      <div class="col">      arrow keys navigate       </div>      
    </collapsableRow>

  </dialogContainer>
</template>