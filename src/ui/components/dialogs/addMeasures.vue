<script setup lang="ts">
import dialogContainer from './dialogContainer.vue';
import numberInputApp from './numberInput.vue';
import toggle from './toggle.vue';
import { ref, Ref, reactive, watch } from 'vue';
interface Props {
  domId: string,
  label: string,
  getNumberMeasures: () => Ref<number>,
  getAppend: () => Ref<boolean>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
};
const props = defineProps<Props>();

const { domId, getNumberMeasures, getAppend } = { ...props };

const numMeasures: Ref<number> = getNumberMeasures();
const append: Ref<boolean> = getAppend();
const updateNumber = async (value: number) => {
  numMeasures.value = value;
}
const getId = (str: string) => {
  return `${domId}-${str}`;
}
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="props.commitCb" :cancelCb="props.cancelCb">
      <div class="row mb-2 ms-2">
        <div class="col col-9 pe-0 me-n2">
          <numberInputApp :domId="getId('page-width-input')" :initialValue="numMeasures" :precision="0"
            :changeCb="updateNumber" :disabled="false"/>
        </div>
        <div class="col col-3 text-start ps-0 pe-0 ms-n4">
          <label class="form-label" :for="getId('page-width-input-text')">Measures to Add</label>
        </div>
      </div>
      <div class="row mb-2">
        <div class="col col-8 pe-0 me-n2">
          <toggle :domId="getId('append-checkbox')" :label="'Append to Selection'" :initialValue="append"
            :changeCb="(value: boolean) => { append = value }" />
        </div>
      </div>
  </dialogContainer>
</template>