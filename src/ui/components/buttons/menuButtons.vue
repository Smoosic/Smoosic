<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { ButtonDefinition } from '../../buttons/button';
declare var $: any;
interface Props4 {
  domId: string,
  buttonProps: ButtonDefinition
}
const props = defineProps<Props4>();
const { domId, buttonProps } = { ...props };
  const getId = (str: string) => `${domId}-${str}`;
  const getLabelText = () => {
    return buttonProps.leftText || buttonProps.rightText || '';
  }
  const opensMenu = buttonProps.action === 'menu' || buttonProps.action === 'collapseChildMenu';
  const isOpen = ref(false);
  const onClick = () => {
    if (opensMenu) {
      isOpen.value = true;
    }
    setTimeout(async () => {
      await buttonProps.callback!(buttonProps);
      isOpen.value = false;
    }, 1);
  }
</script>
<template>
  <button :id="getId(buttonProps.id)"
    class="mbtn"
    :class="{ 'is-open': isOpen }"
    :aria-label="getLabelText()"
    v-if="buttonProps.callback"
    @click.prevent="onClick">
    <span :class="buttonProps.classes" >{{buttonProps.icon}} </span>
    <span class="mbtn-label">{{ buttonProps.leftText }}</span>
    <span class="mbtn-key">{{  buttonProps.rightText }}</span>
    </button>
</template>
