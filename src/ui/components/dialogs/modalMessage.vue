<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
interface Props {
  domId: string,
  headline: string,
  message: string,
  commitCb: () => void,
  cancelCb: () => void
}
const props = defineProps<Props>();
  const { domId, headline, message, commitCb, cancelCb } = { ...props };
  const top = '100';
  const left = '100';
  const getDomId = () => {
    return `attr-modal-dialog-${domId}`;
  }
  const getId = (str: string) => {
    return `${domId}-${str}`;
  }
  const getLocString = () => {
    return `top: ${top}px; left: ${left}px;`;
  }

</script>
<template>
  <div class="attributeModal" :id="getDomId()" :style="getLocString()">
    <div class="container text-center" id="smo-dialog-container">
      <span class="draggable-button">
        <span class="icon icon-move jsDbMove"></span></span>
      <div class="row">
        <h2 class="dialog-label">{{ headline }}</h2>
      </div>
      <div class="text-input" id="save-saveFileName" data-param="saveFileName">
        <p>{{ message }} </p>
      </div>
      <div class="buttonContainer">
        <button class="ok-button button-left btn btn-primary" @click.prevent="commitCb">OK</button>
        <button v-if="cancelCb" class="cancel-button button-right btn btn-secondary hide" @click.prevent="cancelCb">Cancel</button>
      </div>
    </div>
    </div>
</template>