<script setup lang="ts">
import dialogContainer from './dialogContainer.vue';
import toggle from './toggle.vue';
import { computed } from 'vue';
interface DeleteKindRow {
  id: string,
  label: string
};
interface Props {
  domId: string,
  label: string,
  // the kinds of marking that can be deleted
  kinds: DeleteKindRow[],
  // which kinds are turned on, by id.  A reactive object owned by the dialog.
  selected: Record<string, boolean>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
};
const props = defineProps<Props>();

const { domId, selected } = { ...props };
// Delete is only allowed once something has been chosen
const canDelete = computed(() => props.kinds.some((kind) => selected[kind.id] === true));
const getId = (str: string) => {
  return `${domId}-${str}`;
}
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="props.commitCb" :cancelCb="props.cancelCb"
    :enable="canDelete">
      <div class="row mb-2" v-for="kind in kinds" :key="kind.id">
        <div class="col col-8 pe-0 me-n2">
          <toggle :domId="getId(kind.id + '-toggle')" :label="kind.label" :initialValue="false"
            :changeCb="(value: boolean) => { selected[kind.id] = value }" />
        </div>
      </div>
  </dialogContainer>
</template>
