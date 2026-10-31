<script setup lang="ts">
import { ref, Ref } from 'vue';
import dialogContainer from './dialogContainer.vue';
interface Props {
  domId: string,
  enable: any,
  quantizeCb?: (value: string) => void,
  uploadCb: (event: Event) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>,
};
const props = defineProps<Props>();
const { domId, uploadCb, quantizeCb, enable, commitCb, cancelCb } = { ...props };
const quantizeValue = ref('1024');
const quantizeValues = [
  { text: '1/8th note', value: '2048' },
  { text: '1/16th note', value: '1024' },
  { text: '1/32nd note', value: '512' }
];
const getDomId = () => {
  return `attr-modal-dialog-${domId}`;
}
const getId = (str: string) => {
  return `${domId}-${str}`;
}

</script>
<template>
  <dialogContainer :domId="domId" label="Load File" :commitCb="commitCb" :cancelCb="cancelCb"
    :classes="'text-center container'">
    <div class="row" :id="getId('loadFile')" data-param="loadFile" :class="{ hide: quantizeCb}">
      <div class="col">
        <input type="file" class="form-control" accept=".smz,.json,.mid,.midi,.xml,.mxl" @change="uploadCb"
          :id="getId('loadFile-input')">
      </div>
    </div>
    <div class="row align-items-baseline" :class="{ hide: !quantizeCb }" id="quantize-row">
      <div class="row">
        <h2 class="dialog-label">Load File</h2>
      </div>
      <div class="row" :id="getId('loadFile')" data-param="loadFile">
        <div class="col">
          <input type="file" class="form-control" accept=".smz,.json,.mid,.midi,.xml,.mxl" @change="uploadCb"
            :id="getId('loadFile-input')">
        </div>
      </div>
      <div class="row align-items-baseline" :class="{ hide: !quantizeCb }" id="quantize-row">
        <div class="col-md-6">
          <label :for="getId('quantize-select')" class="form-label">Quantize Midi:</label>
        </div>
        <div class="col-md-6" v-if="quantizeCb">
          <select :id="getId('quantize-select')" v-model="quantizeValue" @change="quantizeCb(quantizeValue)"
            class="form-control">
            <option v-for="option in quantizeValues" :key="option.value" :value="option.value">
              {{ option.text }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </dialogContainer>
</template>