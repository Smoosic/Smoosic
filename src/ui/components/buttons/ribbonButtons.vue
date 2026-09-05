<script setup lang="ts">
import { ButtonDefinition } from '../../buttons/button';
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
</script>
<template>
  <button :id="getId(buttonProps.id)" 
    :class="buttonProps.classes"
    :aria-label="getLabelText()"
    v-if="buttonProps.callback"
    @click.prevent="buttonProps.callback(buttonProps, getId(buttonProps.id))">
    <span class="left-text"><span class="text-span">{{ buttonProps.leftText }}</span>
    <span :class="buttonProps.icon"></span></span>
    <span class="right-text">{{ buttonProps.rightText }}</span></button>
</template>
