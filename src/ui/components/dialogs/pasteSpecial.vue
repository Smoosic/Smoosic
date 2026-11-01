<script setup lang="ts">
import dialogContainer from './dialogContainer.vue';
import toggle from './toggle.vue';
import { computed, Ref } from 'vue';
interface PasteKindRow {
  id: string,
  label: string
};
interface Props {
  domId: string,
  label: string,
  // the kinds of marking that can be pasted
  kinds: PasteKindRow[],
  // which kinds are turned on, by id.  A reactive object owned by the dialog.
  selected: Record<string, boolean>,
  getReplace: () => Ref<boolean>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
};
const props = defineProps<Props>();

const { domId, selected } = { ...props };
const replace: Ref<boolean> = props.getReplace();
const setReplace = (value: boolean) => {
  replace.value = value;
}
// Paste is only allowed once something has been chosen
const canPaste = computed(() => props.kinds.some((kind) => selected[kind.id] === true));
const getId = (str: string) => {
  return `${domId}-${str}`;
}
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="props.commitCb" :cancelCb="props.cancelCb"
    :enable="canPaste">
      <div class="row mb-2" v-for="kind in kinds" :key="kind.id">
        <div class="col col-8 pe-0 me-n2">
          <toggle :domId="getId(kind.id + '-toggle')" :label="kind.label" :initialValue="false"
            :changeCb="(value: boolean) => { selected[kind.id] = value }" />
        </div>
      </div>
      <div class="row mb-2">
        <div class="col col-10 pe-0 me-n2">
          <toggle :domId="getId('replace-toggle')" :label="'Replace existing (off adds to them)'" :initialValue="true"
            :changeCb="setReplace" />
        </div>
      </div>
  </dialogContainer>
</template>
