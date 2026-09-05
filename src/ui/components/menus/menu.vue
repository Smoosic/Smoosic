<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { SuiMenuParams, SuiConfiguredMenu, MenuChoiceDefinition, SuiConfiguredMenuOption } from '../../menus/menu';
import { EventHandler } from '../../eventSource';

interface MenuProps {
  domId: string,
  menuParams: SuiMenuParams,
  menuStructure: SuiConfiguredMenu,
}
const props = defineProps<MenuProps>();
const menuItems: SuiConfiguredMenuOption[] = props.menuStructure.menuOptions.filter(
  (x: SuiConfiguredMenuOption) => x.display(props.menuStructure));
menuItems.forEach((item, index) => {
  const vkey = (index < 10) ? String.fromCharCode(48 + index) : String.fromCharCode(87 + index);
  item.menuChoice.hotkey = vkey;
});
const focusIndex = ref(-1);
const miString = (item: MenuChoiceDefinition) => {
  return item.miIcon ?? '';
}
const itemId = (index: number) => `${props.domId}-item-${index}`;
const selectItem = async (option: SuiConfiguredMenuOption) => {
  await option.handler(props.menuStructure);
  props.menuStructure.complete();
}
const advanceFocus = (inc: number) => {
  if (menuItems.length === 0) {
    return;
  }
  focusIndex.value = (focusIndex.value + inc + menuItems.length) % menuItems.length;
  document.getElementById(itemId(focusIndex.value))?.focus();
}
let keydownHandler: EventHandler | null = null;
onMounted(() => {
  const handler = async (ev: any) => {
    if (ev.code === 'ArrowDown') {
      advanceFocus(1);
    } else if (ev.code === 'ArrowUp') {
      advanceFocus(-1);
    } else {
      const match = menuItems.find((item) => item.menuChoice.hotkey === ev.key);
      if (match) {
        await selectItem(match);
      }
    }
  };
  keydownHandler = props.menuParams.eventSource.bindKeydownHandler(handler);
  if (menuItems.length > 0) {
    focusIndex.value = menuItems.length - 1;
    document.getElementById(itemId(focusIndex.value))?.focus();
  }
});
onUnmounted(() => {
  if (keydownHandler) {
    props.menuParams.eventSource.unbindKeydownHandler(keydownHandler);
  }
});
</script>
<template>
  <div class="menu-layer">
  <div class="mdrop" :size="menuItems.length" role="menu">
    <div class="mdrop-head">
    <span>
      {{  menuStructure.label }}
    </span></div>
    <div v-for="item, index in menuItems" class="mitem" :id="itemId(index)" tabindex="-1"
      @click.prevent="selectItem(item)">
      <span :class="item.menuChoice.icon">{{ miString(item.menuChoice) }}</span>
      <span class="mitem-label">{{ item.menuChoice.text }}</span>
      <span class="mitem-key">{{ item.menuChoice.hotkey }}</span>
      </div>
    </div>
    </div>
</template>
