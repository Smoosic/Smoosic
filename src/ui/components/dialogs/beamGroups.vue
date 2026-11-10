<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import selectComp from './select.vue';
import numberInputApp from './numberInput.vue';
import dialogContainer from './dialogContainer.vue';
import { SelectOption } from '../../common';

interface Props {
  domId: string,
  label: string,
  initialGroups: number[],
  applyTo: string,
  /** called with the whole grouping every time a group is added, removed or changed */
  setGroupsCb: (groups: number[]) => void,
  setApplyToCb: (value: string) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const getId = (str: string) => {
  return `${props.domId}-${str}`;
}
const applyToOptions: SelectOption[] = [
  { value: 'selections', label: 'Selected measures' },
  { value: 'all', label: 'Whole score' }
];
const maxGroups = 16;
const defaultFirstGroup = 3;
// Each row has its own id so that removing one does not hand its number to the row below it.
let nextId = 0;
const newRow = (value: number) => ({ id: nextId++, value });
const rows = ref(props.initialGroups.map((value) => newRow(value)));
const canAdd = computed(() => rows.value.length < maxGroups);
const addGroup = () => {
  if (!canAdd.value) {
    return;
  }
  const last = rows.value.length > 0 ? rows.value[rows.value.length - 1].value : defaultFirstGroup;
  rows.value.push(newRow(last));
}
const removeGroup = (id: number) => {
  rows.value = rows.value.filter((row) => row.id !== id);
}
const clear = () => {
  rows.value = [];
}
const updateGroupCb = (id: number) => {
  return async (value: number) => {
    const row = rows.value.find((rr) => rr.id === id);
    if (row) {
      row.value = value;
    }
  }
}
watch(rows, (newVal) => {
  props.setGroupsCb(newVal.map((row) => row.value));
}, { immediate: true, deep: true });
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb"
    :classes="'text-center mw-40 nw-40'">
    <div class="row mb-2 ms-2">
      <div class="col col-12 text-start">
        <small>
          Each group is the longest beam group, in eighth notes (sixteenth notes in x/16 time).
          For 3 + 2 in 5/8, add two groups and set them to 3 and 2.
          The groups start over if the measure has more of them. With no groups, the default for the meter is used.
        </small>
      </div>
    </div>
    <div class="row mb-2 ms-2 align-items-center" v-for="(row, ix) in rows" :key="row.id">
      <div class="col col-9">
        <numberInputApp :domId="getId('group-' + row.id)" :initialValue="row.value" :precision="0"
          :minValue="1" :maxValue="4" :label="'Group ' + (ix + 1)" :changeCb="updateGroupCb(row.id)" />
      </div>
      <div class="col col-3">
        <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('remove-' + row.id)"
          :title="'Remove group ' + (ix + 1)" @click.prevent="removeGroup(row.id)">&times;</button>
      </div>
    </div>
    <div class="row mb-2 ms-2" v-if="rows.length === 0">
      <div class="col col-12 text-start"><em>Default for the meter</em></div>
    </div>
    <div class="row mb-3 ms-2">
      <div class="col-auto">
        <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('add-group')" title="Add a group"
          :disabled="!canAdd" @click.prevent="addGroup"><span class="icon-plus"></span> Add group</button>
      </div>
      <div class="col-auto">
        <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('clear')" title="Use the default"
          :disabled="rows.length === 0" @click.prevent="clear">Clear</button>
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-12">
        <selectComp :domId="getId('apply-to')" :label="'Apply to:'" :selections="applyToOptions"
          :initialValue="applyTo" :changeCb="(value: string) => setApplyToCb(value)" />
      </div>
    </div>
    <div class="row mb-2 ms-2">
      <div class="col col-12 text-start">
        <small>Applying replaces any hand-placed beams in those measures.</small>
      </div>
    </div>
  </dialogContainer>
</template>
