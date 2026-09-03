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
    class="mbtn"
    :aria-label="getLabelText()"
    v-if="buttonProps.callback"
    @click.prevent="buttonProps.callback(buttonProps)">
    <span :class="buttonProps.classes" >{{buttonProps.icon}} </span>    
    <span class="mbtn-label">{{ buttonProps.leftText }}</span>
    <span class="mbtn-key">{{  buttonProps.rightText }}</span>
    </button>
</template>
