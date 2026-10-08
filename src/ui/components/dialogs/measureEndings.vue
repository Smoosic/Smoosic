<script setup lang="ts">
import dialogContainer from './dialogContainer.vue';
import { ref, Ref, watch, reactive } from 'vue';

import buttonGroup from './buttonGroup.vue';
import { SmoBarline } from '../../../smo/data/measureModifiers';
import { default as selectComponent } from './select.vue'
import { SelectDefinition } from '../../common';
import { DialogButtonDefinition } from '../../buttons/button';

interface Props {
  domId: string,
  label: string,
  startEndings: DialogButtonDefinition[],
  endEndings: DialogButtonDefinition[],
  startBrackets: SelectDefinition,
  endBrackets: SelectDefinition,
  repeatSymbols: DialogButtonDefinition[],
  repeatLandmarks: DialogButtonDefinition[],
  repeatText: DialogButtonDefinition[],
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, startEndings, endEndings, repeatSymbols, repeatLandmarks, repeatText, commitCb, cancelCb } = { ...props };
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const exposeBrackets = ref(false);

const exposeEndings = ()=> {
  const sid = props.startEndings.find((x) => x.id === 'startRepeat');
  const eid = props.endEndings.find((x) => x.id === 'endRepeat');
  if (sid && sid.state === 'selected') {
    exposeBrackets.value = true;
  } else if (eid && eid.state === 'selected') {
    exposeBrackets.value = true;
  } else {
    exposeBrackets.value = false;
  }
}

watch(props.startEndings, () => {
  exposeEndings();
});
exposeEndings();

</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb" :classes="'container text-center'">
    <div class="row nw-30 ms-2">
      <div class="col col-8">
      <buttonGroup :label="'Start Endings'" :buttonDefs="startEndings" :domId="getId('start-ending-buttons')"
        :commonClasses="'btn btn-sm btn-outline-dark me-2'" />
      </div>
      <div class="col col-4"
        :class="{ hide: !exposeBrackets }">
        <selectComponent :domId="getId('start-select')" :label="props.startBrackets.label" :selections="props.startBrackets.selections"
          :initialValue="props.startBrackets.initialValue" :changeCb="props.startBrackets.changeCb"
           />
      </div>
    </div>
    <div class="row nw-30 ms-2">
      <div class="col col-8">
      <buttonGroup :label="'End Endings'" :buttonDefs="endEndings" :domId="getId('end-ending-buttons')"
        :commonClasses="'btn btn-sm btn-outline-dark me-2'" />        
      </div>
      <div class="col col-4"  :class="{ hide: !exposeBrackets }">
      <selectComponent :domId="getId('end-select')" :label="props.endBrackets.label" :selections="props.endBrackets.selections"
        :initialValue="props.endBrackets.initialValue" :changeCb="props.endBrackets.changeCb" /> 
      </div>
      </div>

    <div class="row nw-30 ms-2">
      <buttonGroup :label="'Repeat Landmarks'" :buttonDefs="repeatLandmarks" :domId="getId('repeat-landmark-buttons')"
        :commonClasses="'btn btn-sm btn-outline-dark me-2 px-2'" />
    </div>
    <div class="row nw-30 ms-2">
      <buttonGroup :label="'Repeat Symbols'" :buttonDefs="repeatSymbols" :domId="getId('repeat-symbol-buttons')"
        :commonClasses="'btn btn-sm btn-outline-dark me-2'" />
    </div>
    <div class="row nw-30 ms-2">
      <buttonGroup :label="'Repeat Text'" :buttonDefs="repeatText" :domId="getId('repeat-text-buttons')"
        :commonClasses="'btn btn-sm btn-outline-dark me-2 px-2'" />
    </div>
  </dialogContainer>
</template>