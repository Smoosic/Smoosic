<script setup lang="ts">
import { Ref } from 'vue';
import numberInputApp from './numberInput.vue';
import selectComp from './select.vue';
import toggle from './toggle.vue';
import dialogContainer from './dialogContainer.vue';
import { SelectOption } from '../../common';
import { SlurNumber } from '../../dialogs/slur';
import { SmoSlur } from '../../../smo/data/staffModifiers';

interface Props {
  domId: string,
  label: string,
  initialPosition?: { top: number, left: number },
  spacing: number,
  thickness: number,
  xOffset: number,
  yOffset: number,
  cp1x: number,
  cp1y: number,
  cp2x: number,
  cp2y: number,
  position: number,
  position_end: number,
  orientation: number,
  enable: Ref<boolean>,
  updateNumberCb: (param: SlurNumber, value: number) => void,
  updateSelectCb: (param: SlurNumber, value: number) => void,
  triggerDefaultsCb: () => void,
  triggerResetAllCb: () => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>,
  removeCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb, removeCb } = { ...props };
const enable = props.enable;
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const positionOptions: SelectOption[] = [
  { value: String(SmoSlur.positions.AUTO), label: 'Auto' },
  { value: String(SmoSlur.positions.HEAD), label: 'Head' },
  { value: String(SmoSlur.positions.TOP), label: 'Top' }
];
const orientationOptions: SelectOption[] = [
  { value: String(SmoSlur.orientations.AUTO), label: 'Auto' },
  { value: String(SmoSlur.orientations.UP), label: 'Up' },
  { value: String(SmoSlur.orientations.DOWN), label: 'Down' }
];
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb" :removeCb="removeCb"
    :initialPosition="initialPosition" :enable="enable" :enableCancelRemove="enable" :classes="'text-center mw-40 nw-40'">
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('spacing')" :initialValue="spacing" :precision="0" label="Spacing"
          :changeCb="(value: number) => updateNumberCb('spacing', value)" :inline="true" />
        <numberInputApp :domId="getId('thickness')" :initialValue="thickness" :precision="0" label="Thickness"
          :changeCb="(value: number) => updateNumberCb('thickness', value)" :inline="true" />
      </div>
    </div>
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('x-offset')" :initialValue="xOffset" :precision="0" label="X Offset"
          :changeCb="(value: number) => updateNumberCb('xOffset', value)" :inline="true" />
        <numberInputApp :domId="getId('y-offset')" :initialValue="yOffset" :precision="0" label="Y Offset"
          :changeCb="(value: number) => updateNumberCb('yOffset', value)" :inline="true" />
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-6">
        <selectComp :domId="getId('position')" :label="'Start Position'" :selections="positionOptions"
          :initialValue="String(position)" :changeCb="(value: string) => updateSelectCb('position', parseInt(value, 10))" />
      </div>
      <div class="col col-6">
        <selectComp :domId="getId('position-end')" :label="'End Position'" :selections="positionOptions"
          :initialValue="String(position_end)" :changeCb="(value: string) => updateSelectCb('position_end', parseInt(value, 10))" />
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-12">
        <selectComp :domId="getId('orientation')" :label="'Orientation'" :selections="orientationOptions"
          :initialValue="String(orientation)" :changeCb="(value: string) => updateSelectCb('orientation', parseInt(value, 10))" />
      </div>
    </div>
    <div class="row justify-content-start mb-2">
      <div class="checkbox-input-toggle-div">
        <toggle :domId="getId('defaults')" :label="'Defaults'" :initialValue="false"
          :changeCb="() => triggerDefaultsCb()" />
      </div>
      <div class="checkbox-input-toggle-div">
        <toggle :domId="getId('reset-all')" :label="'Reset All Slurs'" :initialValue="false"
          :changeCb="() => triggerResetAllCb()" />
      </div>
    </div>
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('cp1x')" :initialValue="cp1x" :precision="0" label="Control Point 1 X"
          :changeCb="(value: number) => updateNumberCb('cp1x', value)" :inline="true" />
        <numberInputApp :domId="getId('cp1y')" :initialValue="cp1y" :precision="0" label="Control Point 1 Y"
          :changeCb="(value: number) => updateNumberCb('cp1y', value)" :inline="true" />
      </div>
    </div>
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('cp2x')" :initialValue="cp2x" :precision="0" label="Control Point 2 X"
          :changeCb="(value: number) => updateNumberCb('cp2x', value)" :inline="true" />
        <numberInputApp :domId="getId('cp2y')" :initialValue="cp2y" :precision="0" label="Control Point 2 Y"
          :changeCb="(value: number) => updateNumberCb('cp2y', value)" :inline="true" />
      </div>
    </div>
  </dialogContainer>
</template>
