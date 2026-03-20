<script setup lang="ts">
import { onMounted, Ref, toRef } from 'vue';
interface Props {
  domId: string,
  percent: Ref<number>
  label: string
}
const props = defineProps<Props>();
const percent = toRef(props, 'percent');
const getId = (str: string) => {
  return `${props.domId}-${str}`;
}
</script>
<template>
  <div class="progress" :id="getId('progress')">    
    <div class="progress-bar" role="progressbar" :style="{ width: percent + '%' }" :aria-valuenow="percent" aria-valuemin="0"
     :aria-label="label"
      aria-valuemax="100">{{ label }} {{ percent }}%</div>
  </div>
</template>