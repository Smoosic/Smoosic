<script setup lang="ts">
interface MenuAction {
  key: string,
  icon: string,
  label: string,
  danger: boolean,
  disabled: boolean,
  run: () => Promise<void>
}
interface Props {
  domId: string,
  staffId: number,
  name: string,
  bravura: boolean,
  icon: string,
  actionLabel: string,
  isOpen: boolean,
  isLoose: boolean,
  actions: MenuAction[],
  toggleCb: (staffId: number) => void,
  runActionCb: (action: MenuAction) => Promise<void>
}
const props = defineProps<Props>();
const getId = (str: string) => `${props.domId}-${props.staffId}-${str}`;
</script>
<template>
  <div class="sg-row" :class="{ 'is-loose': isLoose, 'is-selected': isOpen }">
    <span></span>
    <span class="sg-name">
      <span class="sg-num">{{ staffId + 1 }}</span>
      <span v-if="bravura" class="bv sm" :class="icon"></span>
      <span v-else class="mi sm">{{ icon }}</span>
      <span class="sg-name-label">{{ name }}</span>
    </span>
    <div class="sg-act" :id="getId('act')" role="button" tabindex="0" :class="{ 'is-open': isOpen }"
      :aria-expanded="isOpen" aria-haspopup="menu"
      @click="toggleCb(staffId)" @keydown.enter.prevent="toggleCb(staffId)" @keydown.space.prevent="toggleCb(staffId)">
      <span class="sg-act-label">{{ actionLabel }}</span>
      <span class="caret" :class="isOpen ? 'caret-up' : 'caret-down'"></span>
    </div>
    <div v-if="isOpen" class="mdrop sg-menu" role="menu" :id="getId('menu')">
      <div class="mdrop-head"><span>{{ name }}</span><span class="hint">stave {{ staffId + 1 }}</span></div>
      <template v-for="action in actions" :key="action.key">
        <div class="mdrop-sep" v-if="action.key === 'remove'"></div>
        <div class="mitem" :class="{ 'is-danger': action.danger, 'is-disabled': action.disabled }"
          role="menuitem" :aria-disabled="action.disabled" tabindex="-1" @click="runActionCb(action)">
          <span class="mi check">&nbsp;</span>
          <span class="mi sm">{{ action.icon }}</span>
          <span class="mitem-label">{{ action.label }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
