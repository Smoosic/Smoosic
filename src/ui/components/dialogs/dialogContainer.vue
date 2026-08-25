<script setup lang="ts">
import DialogButtons from './dialogButtons.vue';
import draggableComp from './draggableComp.vue';
import { draggableSession } from '../../composable/draggable';
import { Ref, toRef, ref, watch } from 'vue';
interface Props {
  domId: string,
  label: string,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>,
  removeCb?: () => Promise<void>,
  classes?: string,
  enable?: Boolean
};
const props = defineProps<Props>();
const enable = props.enable !== undefined ? toRef(props, 'enable') : ref(true);
const { domId } = { ...props };
const classes = props.classes ? props.classes : 'text-center'
const getDomId = () => {
  return `attr-modal-dialog-${domId}`;
}
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const draggable = draggableSession(getDomId());
</script>
<template>
  <div class="dlg spec attributeModal" :id="getDomId()" :style="draggable.getLocString()">
    <div :class="classes" :id="getId('modal-content')">
      <draggableComp :draggableSession="draggable" />
      <div class="row mb-2 dlg-bar">
        <h2 class="dialog-label">{{ label }}</h2>
      </div>
      <slot></slot>
      <DialogButtons :enable="enable" :commitCb="props.commitCb" :cancelCb="props.cancelCb"
       :removeCb="props.removeCb" />
    </div>
  </div>
</template>