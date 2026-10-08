<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { SuiMenuParams, SuiConfiguredMenu, MenuChoiceDefinition, SuiConfiguredMenuOption, SuiMenuLevel } from '../../menus/menu';
import { EventHandler } from '../../eventSource';
import MenuLevel from './menuLevel.vue';

interface MenuProps {
  domId: string,
  menuParams: SuiMenuParams,
  menuStructure: SuiConfiguredMenu,
}
const props = defineProps<MenuProps>();
/**
 * The chain of currently-open submenu-triggering choices, root-first. An
 * item at path[n] is the one whose subMenu is displayed as levels[n + 1],
 * shown beside levels[n] rather than replacing it.
 */
const path = ref<SuiConfiguredMenuOption[]>([]);
const levels = ref<SuiConfiguredMenuOption[][]>([]);
const focusIndexPerLevel = ref<number[]>([]);
const assignHotkeys = (items: SuiConfiguredMenuOption[]) => {
  items.forEach((item, index) => {
    const vkey = (index < 10) ? String.fromCharCode(48 + index) : String.fromCharCode(87 + index);
    item.menuChoice.hotkey = vkey;
  });
}
/**
 * Recompute the displayed levels (root + one per open entry in `path`) from
 * scratch: filter each level by `display`, assign its hotkeys, and default
 * its focus to the last item. Called on mount and whenever `path` changes.
 */
const rebuildLevels = () => {
  const newLevels: SuiConfiguredMenuOption[][] = [];
  const newFocus: number[] = [];
  const addLevel = (options: SuiConfiguredMenuOption[]) => {
    const items = options.filter((x: SuiConfiguredMenuOption) => x.display(props.menuStructure));
    assignHotkeys(items);
    newLevels.push(items);
    newFocus.push(items.length > 0 ? items.length - 1 : -1);
  }
  addLevel(props.menuStructure.menuOptions);
  path.value.forEach((opened) => addLevel(opened.subMenu ?? []));
  levels.value = newLevels;
  focusIndexPerLevel.value = newFocus;
}
rebuildLevels();
const miString = (item: MenuChoiceDefinition) => {
  const sp = item.icon.split(' ');
  if (sp.length > 1 && sp[0] === 'mi') {
    return sp[1];
  }
  return '';
}
const itemId = (level: number, index: number) => `${props.domId}-L${level}-item-${index}`;
const selectItem = async (level: number, option: SuiConfiguredMenuOption) => {
  if (option.subMenu && option.subMenu.length > 0) {
    path.value = [...path.value.slice(0, level), option];
    rebuildLevels();
    await nextTick();
    const deepest = levels.value.length - 1;
    document.getElementById(itemId(deepest, focusIndexPerLevel.value[deepest]))?.focus();
    return;
  }
  await option.handler(props.menuStructure);
  props.menuStructure.complete();
}
const advanceFocus = (level: number, inc: number) => {
  const items = levels.value[level];
  if (!items || items.length === 0) {
    return;
  }
  const next = (focusIndexPerLevel.value[level] + inc + items.length) % items.length;
  focusIndexPerLevel.value[level] = next;
  document.getElementById(itemId(level, next))?.focus();
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
/**
 * Build the props for the first nested MenuLevel (levels[1] onward), each
 * one linking to the next via `child`, so an arbitrarily deep chain of
 * submenus renders as nested .msub panels to the right of their parent.
 */
const buildChildLevel = (level: number): SuiMenuLevel | null => {
  if (level >= levels.value.length) {
    return null;
  }
  return {
    items: levels.value[level],
    domId: `${props.domId}-L${level}`,
    focusIndex: focusIndexPerLevel.value[level],
    isDeepest: level === levels.value.length - 1,
    openValue: (level < path.value.length) ? path.value[level].menuChoice.value : null,
    selectFn: (item: SuiConfiguredMenuOption) => selectItem(level, item),
    child: buildChildLevel(level + 1)
  };
}
const childLevel = computed(() => buildChildLevel(1));
let keydownHandler: EventHandler | null = null;
onMounted(() => {
  const handler = async (ev: any) => {
    const deepest = levels.value.length - 1;
    if (ev.code === 'ArrowDown') {
      advanceFocus(deepest, 1);
    } else if (ev.code === 'ArrowUp') {
      advanceFocus(deepest, -1);
    } else {
      const match = levels.value[deepest].find((item) => item.menuChoice.hotkey === ev.key);
      if (match) {
        await selectItem(deepest, match);
      }
    }
  };
  keydownHandler = props.menuParams.eventSource.bindKeydownHandler(handler);
  if (levels.value[0]?.length > 0) {
    document.getElementById(itemId(0, focusIndexPerLevel.value[0]))?.focus();
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
  <div class="mdrop" :size="levels[0] ? levels[0].length : 0" role="menu">
    <div class="mdrop-head">
    <span>
      {{  menuStructure.label }}
    </span></div>
    <div v-for="item, index in levels[0]" class="mitem" :id="itemId(0, index)" tabindex="-1"
      :class="{ 'is-open': path[0] === item }"
      @click.prevent="selectItem(0, item)">
      <span :class="menuIcon(item)">{{ miString(item.menuChoice) }}</span>
      <span class="mitem-label">{{ item.menuChoice.text }}</span>
      <span class="mitem-key">{{ item.menuChoice.hotkey }}</span>
      <span v-if="item.subMenu && item.subMenu.length" class="caret caret-right"></span>
      </div>
    <MenuLevel v-if="childLevel" v-bind="childLevel" />
    </div>
    </div>
</template>
