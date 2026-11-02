<script setup lang="ts">
import { ref, Ref, computed } from 'vue';
import dialogContainer from './dialogContainer.vue';

interface RecoveryRow {
  id: number,
  time: number,
  title: string,
  available: boolean
}
interface Props {
  domId: string,
  label: string,
  /** newest first */
  entries: RecoveryRow[],
  storageAvailable: boolean,
  /** called with the id of the chosen snapshot when the user presses OK */
  selectedCb: (id: number) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const selectedId: Ref<number | null> = ref(null);
const canRecover = computed<boolean>(() => selectedId.value !== null);
const getId = (str: string) => {
  return `${props.domId}-${str}`;
}
const rowTitle = (row: RecoveryRow): string => {
  const title = (row.title ?? '').trim();
  return title.length > 0 ? title : 'Untitled';
}
const rowTime = (row: RecoveryRow): string => {
  return new Date(row.time).toLocaleString();
}
const choose = (row: RecoveryRow) => {
  if (row.available) {
    selectedId.value = row.id;
  }
}
const handleCommit = async () => {
  if (selectedId.value !== null) {
    props.selectedCb(selectedId.value);
  }
  await props.commitCb();
}
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="handleCommit" :cancelCb="cancelCb" :enable="canRecover">
    <div class="row mb-2" v-if="entries.length === 0" :id="getId('empty')">
      <div class="col text-start">
        <p>No autosaved scores are available.</p>
        <p v-if="!storageAvailable">Browser storage is not available.</p>
      </div>
    </div>
    <div class="list-group text-start mb-2" v-else :id="getId('list')">
      <button v-for="row in entries" :key="row.id" type="button"
        class="list-group-item list-group-item-action"
        :class="{ active: row.id === selectedId, disabled: !row.available }"
        :disabled="!row.available" :id="getId('entry-' + row.id)" @click.prevent="choose(row)">
        <span class="fw-bold">{{ rowTitle(row) }}</span>
        <span class="ms-2">{{ rowTime(row) }}</span>
        <span class="ms-2" v-if="!row.available">(unavailable)</span>
      </button>
    </div>
  </dialogContainer>
</template>
