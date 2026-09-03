<script setup lang="ts">
import { SuiMenuParams, SuiConfiguredMenu, MenuChoiceDefinition, SuiConfiguredMenuOption } from '../../menus/menu';

interface MenuProps {
  domId: string,
  menuParams: SuiMenuParams,
  menuStructure: SuiConfiguredMenu,
}
const props = defineProps<MenuProps>();
const menuItems = props.menuStructure.menuOptions.filter((x: SuiConfiguredMenuOption) => x.display);
const miString = (item: MenuChoiceDefinition) => {
  return item.miIcon ?? '';
}
</script>
<template>
  <div class="mdrop" :size="menuItems.length" role="menu">
    <div class="mdrop-head">
    <span>
      {{  menuStructure.label }}
    </span></div>
    <div v-for="item, index in menuItems" class="mitem"
      @click.prevent="item.handler(menuStructure)">
      <span :class="item.menuChoice.icon">{{ miString(item.menuChoice) }}</span>
      <span class="miitem-label">{{ item.menuChoice.text }}</span>
      <span class="mitem-key">{{ item.menuChoice.hotkey }}</span>
      </div>
    </div>
</template>