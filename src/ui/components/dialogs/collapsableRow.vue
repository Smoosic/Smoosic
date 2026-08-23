<script setup lang="ts">
import { onMounted, ref, Ref } from 'vue';
interface Props {
  domId: string,
  initialState: boolean,
  containerClasses?: string,
  label?: string,
  hint?: string
}

const props = defineProps<Props>();
const { domId, initialState } = { ...props };
const containerClasses = props.containerClasses ?? '';
const isCollapsed = ref(props.initialState);
const hint = props.hint ?? '';
const label = props.label ?? '';
const collapsing = ref(false);
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  if (!collapsing.value) {
    collapsing.value = true;
    setTimeout(() => {
      collapsing.value = false;
    }, 500);
  }
}

const getId = (str: string) => {
  return `${domId}-${str}`;
}
</script>
<template>
  <div class="sect" :class="{ 'is-open': !isCollapsed }">
    <div class="sect-head" @click.prevent="toggleCollapse" role="button" :aria-expanded="!isCollapsed">
      <span :class="{ hide: label.length === 0 }">{{ label }}</span>
      <span class="caret" data-bs-toggle="collapse" 
        :class="{ 'caret-right': isCollapsed, 'caret-open': !isCollapsed }" :aria-controls="getId('collapsable')"
        ></span>
      <span :class="{ hide: hint.length === 0 || !isCollapsed }" class="hint"> {{ hint }}</span>
    </div>
    <div class="sect-body collapse collapsable-row" :class="{ show: !isCollapsed, collapsing: collapsing }">
      <slot></slot>
    </div>
  </div>
</template>