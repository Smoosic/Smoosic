<script setup lang="ts">
import { ref } from 'vue';
import buttonComp from './ribbonButtons.vue';
import{ ButtonDefinition } from '../../buttons/button'
interface Props {
  domId: string,
  buttonProps: ButtonDefinition[]
}
const props = defineProps<Props>();
const { domId, buttonProps } = { ...props };
const getId = (str: string) => `${domId}-${str}`;

</script>
<template>
  <div class="ribbon-host" :id="domId">
    <div class="ribbon">
    <buttonComp v-for="props in buttonProps" :buttonProps="props" :domId="getId(props.id)" :key="props.id">
    </buttonComp>
    </div>
  </div>
</template>