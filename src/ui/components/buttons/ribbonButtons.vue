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
// Get the button icon in correct format for mi, or just the string
const miString = () => {
  const sp = buttonProps.icon.split(' ');
  if (sp.length > 1 && sp[0] === 'mi') {
    return sp[1];
  }
  return '';
}
const isSeparator = buttonProps.classes.indexOf('sep-before') >= 0;
const isSpacer = buttonProps.classes.indexOf('spacer-before') >= 0;
const hasText = (buttonProps.leftText.length && buttonProps.rightText.length === 0);
const isPart = (buttonProps.leftText.length === 0 && buttonProps.rightText.length);
</script>
<template>
  <span v-if="isSeparator || isSpacer" :class="{ 'ribbon-sep': isSeparator, 'ribbon-spacer': isSpacer }"></span>
  <button :id="getId(buttonProps.id)" 
    :aria-label="getLabelText()"
    :class="{ rbtn: !isPart, rpart: isPart, 'has-text': hasText }"
    v-if="buttonProps.callback"
    @click.prevent="buttonProps.callback(buttonProps, getId(buttonProps.id))">
    <span :class="buttonProps.icon">{{  miString() }}</span>
    <span :class="{ 'rbtn-label': !isPart, 'rpart-label': isPart }" >{{ buttonProps.leftText }}</span>
    <span class="right-text">{{ buttonProps.rightText }}</span>
    <span v-if="isPart" class="caret caret-down caret-lg"></span>
    </button>
</template>
