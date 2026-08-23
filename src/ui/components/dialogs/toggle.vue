<script setup lang="ts">
import { ref, Ref, watch, reactive, onMounted, computed } from 'vue';
interface Props {
  domId: string,
  label: string,
  initialValue: boolean,
  disabled?: boolean,
  changeCb: (value: boolean) => void,
}
const props = defineProps<Props>();
const disabledInitial: boolean = props.disabled ?? false;
const disabledRef:Ref<boolean> = ref(disabledInitial);
const domId = props.domId;
const model:Ref<boolean> = ref(props.initialValue);

const flip = () => {
  model.value = !model.value;
  props.changeCb(model.value);
};
const onOff = computed(() => model.value ? 'on' : 'off');
</script>
<template>
  <div class="tgl-row">
    <span class="tgl" :class="{ 'is-on': model, 'disabled' : disabledRef }">
      <span class="tgl-knob" @click.prevent="flip" role="checkbox" :id="domId"></span>
    </span>
    <span>{{ label }}</span>
    <span class="hint">{{ onOff }}</span>
  </div>
</template>