<script setup lang="ts">
import MenuLevel from './menuLevel.vue';
import { MenuChoiceDefinition, SuiConfiguredMenuOption, SuiMenuLevel } from '../../menus/menu';

const props = defineProps<SuiMenuLevel>();
const itemId = (index: number) => `${props.domId}-item-${index}`;
const miString = (item: MenuChoiceDefinition) => {
  const sp = item.icon.split(' ');
  if (sp.length > 1 && sp[0] === 'mi') {
    return sp[1];
  }
  return '';
}
/**
 * align menu text if no icon present
 * @param item
 */
const menuIcon = (item: SuiConfiguredMenuOption) => {
  if (item.menuChoice.icon.length > 0) {
    return item.menuChoice.icon;
  }
  return "mi";
}
</script>
<template>
  <div class="mdrop msub" role="menu">
    <div v-for="item, index in items" class="mitem" :id="itemId(index)" tabindex="-1"
      :class="{ 'is-open': openValue === item.menuChoice.value }"
      @click.prevent="selectFn(item)">
      <span :class="menuIcon(item)">{{ miString(item.menuChoice) }}</span>
      <span class="mitem-label">{{ item.menuChoice.text }}</span>
      <span class="mitem-key">{{ item.menuChoice.hotkey }}</span>
      <span v-if="item.subMenu && item.subMenu.length" class="caret caret-right"></span>
      </div>
    <MenuLevel v-if="child" v-bind="child" />
  </div>
</template>
