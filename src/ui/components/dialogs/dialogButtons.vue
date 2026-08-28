<script setup lang="ts">
import { toRef, ref } from 'vue';
interface Props {
  commitCb: ()=>void,
  cancelCb: () => void,
  removeCb?: () => void,
  enable?: Boolean,
  enableCancelRemove?: Boolean
}
const props = defineProps<Props>();
const enable =  props.enable !== undefined ? toRef(props, 'enable') : ref(true);
const enableCancelRemove = props.enableCancelRemove !== undefined ? toRef(props, 'enableCancelRemove') : ref(true);
const commitCb = props.commitCb;
const cancelCb = props.cancelCb;
const removeCb = props.removeCb;

</script>
<template>
  <div class="buttonContainer">
    <button class="ok-button button-left btn btn-primary" :disabled="!enable" @click.prevent="commitCb">OK</button>
    <button class="cancel-button button-center btn btn-secondary" :disabled="!enableCancelRemove" @click.prevent="cancelCb">Cancel</button>
    <button v-if="removeCb" class="button-center btn btn-secondary" :disabled="!enableCancelRemove" @click.prevent="removeCb">Remove</button>
  </div>
</template>