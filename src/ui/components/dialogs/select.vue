<script setup lang="ts">
import { ref, Ref, watch, reactive, onMounted, computed } from 'vue';
import { SelectOption } from '../../common';
interface Props {
  domId: string,
  label: string,
  initialValue: string,
  selections: SelectOption[],
  inline?: boolean,
  changeCb: (value: string) => void,
}
const props = defineProps<Props>();
const domId = props.domId;
const inline = props.inline ?? false;
const showDropdown = ref(false);
const collapsing = ref(false);
const selections: SelectOption[] = reactive([]);
props.selections.forEach((sel: SelectOption) => {
  sel.active = (sel.value === props.initialValue);
  selections.push(sel);
});
const selection: Ref<string> = ref(props.initialValue);
const handleSelect = (option: SelectOption) => {
  selections.forEach((sel) => {
    sel.active = false;
  });
  selection.value = option.value;
  option.active = true;
  props.changeCb(selection.value);
  showDropdown.value = false;
}
const getDomId = () => {
  return `attr-modal-dialog-${domId}`;
}
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
  if (!collapsing.value) {
    collapsing.value = true;
    setTimeout(() => {
      collapsing.value = false;
    }, 500);
  }  
}
const outsideClickListener = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const dropdown = document.getElementById(getId('select'));
  const button = document.getElementById(getId('select-button'));
  if (dropdown && !dropdown.contains(target) && button && !button.contains(target)) {
    showDropdown.value = false;
  }
}
const selectLabel = computed(() => {
  const sel = selections.find((s) => s.value === selection.value);
  return sel ? sel.label : props.label;
});
const ulClasses = computed(() => {
  const showString = showDropdown.value === true ? 'show' : '';
  const collapsingString = collapsing.value ? 'collapsing' : 'collapse';
  return `${showString} ${collapsingString}`.trim();
});

onMounted(() => {
  watch(showDropdown, (newVal) => {
    if (newVal) {
      document.addEventListener('click', outsideClickListener);
    } else {
      document.removeEventListener('click', outsideClickListener);
    }
  });
})
</script>
<template>
  <div :class="{'inline-row' : inline }" class="dropdown">
    <div class="spec-name">{{ label }}</div>
    <button :id="getId('select-button')" class="sel" type="button"
      :aria-expanded="showDropdown" data-bs-toggle="dropdown" @click="toggleDropdown">
      <span>{{ selectLabel }}</span>
      <span class="caret caret-lg" :class="{ 'caret-up': showDropdown, 'caret-down': !showDropdown }"></span>
    </button>
    <ul :id="getId('select')" class="dropdown-menu sel-panel" :class="ulClasses" >
      <li v-for="selection in selections" :key="selection.value" :value="selection.value" class="sel-opt"
      :class="{ 'is-active': selection.active }"  @click="handleSelect(selection)">
        {{ selection.label }}
        <span v-if="selection.icon" :class="selection.icon"></span>
      </li>
    </ul>
  </div>
</template>