<script setup lang="ts">
import { reactive, Ref, ref, watch } from 'vue';
import { SmoSystemGroup } from '../../../smo/data/scoreModifiers'
import { SmoSystemStaff } from '../../../smo/data/systemStaff';
import { SmoScore } from '../../../smo/data/score';
import { SelectOption } from '../../common';
import selectComp from './select.vue';
import dialogContainer from './dialogContainer.vue';
import toggle from './toggle.vue';

interface Props {
  staffGroups: SmoSystemGroup[],
  score: SmoScore
  domId: string,
  label: string,
  setConnectorCb: (staffId: number, connectorType: string) => Promise<void>,
  removeFromGroupCb: (staffId: number) => Promise<void>,
  addToGroupCb: (staffId: number) => Promise<void>,
  createStaffGroupCb: (staffId: number) => Promise<void>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const connectorTypeOptions: SelectOption[] = [
  { label: 'Brace', value: '0' },
  { label: 'Bracket', value: '1' },
  { label: 'Single Line', value: '2' },
  { label: 'Double Line', value: '3' }
];

interface GroupChoice {
  staffId: number,
  staffName: string,
  options: SelectOption[],
  selectedValue: string,
  startsGroup: boolean,
  endsGroup: boolean,
  inGroup: boolean,
  createGroup: boolean,
  addToGroup: boolean,
  connectorCb: (value: string) => void,
  removeCb: () => void,
  addCb: () => void,
  createCb: () => void
}
const props = defineProps<Props>();
const { staffGroups, label, score, domId, setConnectorCb, removeFromGroupCb } = props;
const getDomId = () => {
  return `attr-modal-dialog-${domId}`;
}
const getId = (str: string, staffId: number) => {
  return `${domId}-${staffId}-${str}`;
}
const getGroupForStaff = (staffNum: number): SmoSystemGroup | undefined => {
  return staffGroups.find((sg) => sg.startSelector.staff <= staffNum && sg.endSelector.staff >= staffNum);
}
const startsGroup = (staffNum: number) => {
  const sg = getGroupForStaff(staffNum);
  if (sg && sg.startSelector.staff === staffNum) {
    return true;
  }
  return false;
};
const endsGroup = (staffNum: number) => {
  const sg = getGroupForStaff(staffNum);
  if (sg && sg.endSelector.staff === staffNum) {
    return true;
  }
  return false;
};

const staveChoices: Record<number, SelectOption[]> = reactive({})
score.staves.forEach((staff: SmoSystemStaff, ix: number) => {
  staveChoices[ix] = reactive([]);
});
const getChoicesForStaff = (staffNum: number): GroupChoice => {
  const rv = {
    options: [] as SelectOption[],
    selectedValue: '',
    staffId: staffNum,
    staffName: score.staves[staffNum].partInfo.partName,
    startsGroup: false,
    endsGroup: false,
    inGroup: false,
    addToGroup: false,
    createGroup: true,
    connectorCb: async (value: string) => {
      await setConnectorCb(staffNum, value);
    },
    removeCb: async () => {
      await removeFromGroupCb(staffNum);
    },
    addCb: async () => {
      await props.addToGroupCb(staffNum);
    },
    createCb: async () => {
      await props.createStaffGroupCb(staffNum);
    }
  };
  const lsg = (staffNum > 0) ? getGroupForStaff(staffNum - 1) : undefined;
  const sg = getGroupForStaff(staffNum);
  if (!sg) {
    if (lsg) {
      rv.addToGroup = true;
    }
    return rv;
  }
  rv.options = JSON.parse(JSON.stringify(connectorTypeOptions));
  rv.selectedValue = sg.leftConnector.toString();
  rv.startsGroup = startsGroup(staffNum);
  rv.endsGroup = endsGroup(staffNum);
  rv.inGroup = true;
  rv.createGroup = false;
  return rv;
};

const choices: GroupChoice[] = reactive([]);
const updateChoices = () => {
  choices.splice(0);
  score.staves.forEach((staff: SmoSystemStaff, ix: number) => {
    choices.push(getChoicesForStaff(ix));
  });
}
updateChoices();
watch(() => props.staffGroups, () => {
  updateChoices();
}, { deep: true });

</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb"
    :classes="'text-center container'">
    <div class="row nw-50">
      <div class="col col-4">
        <h4 class="h5">Connector Type</h4>
      </div>
      <div class="col col-2">
        <h4 class="h5">Stave</h4>
      </div>
      <div class="col col-2">
        <span class="fs-5">Add</span>
      </div>
      <div class="col col-2">
        <span class="fs-5">Create</span>
      </div>
      <div class="col col-2">
        <span class="fs-5">Remove</span>
      </div>
    </div>
    <div v-for="choice in choices" class="row">
      <div class="col col-4">
        <div v-if="choice.startsGroup">
          <selectComp :domId="getId('connectorSelect', choice.staffId)" :label="'Connector Type'"
            :initialValue="choice.selectedValue" :selections="choice.options" :changeCb="choice.connectorCb" />
        </div>
        <div v-if="choice.inGroup && !choice.startsGroup" class="group-line-container">
          <span class="show-group-line"></span>
        </div>
      </div>
      <div class="col col-2 ">{{ choice.staffName }}</div>
      <div class="col col-2">
        <span :class="{ hide: !choice.addToGroup }">
          <toggle :domId="getId('group-checkbox', choice.staffId)" :label="''" :initialValue="choice.inGroup"
            :changeCb="(value: boolean) => { choice.inGroup = value; choice.addCb(); }" />
        </span>
      </div>
      <div class="col col-2">
        <span :class="{ hide: !choice.createGroup }">
          <toggle :domId="getId('group-checkbox', choice.staffId)" :label="''" :initialValue="choice.inGroup"
            :changeCb="(value: boolean) => { choice.inGroup = value; choice.createCb(); }" />
        </span>
      </div>
      <div class="col col-2">
        <span :class="{ hide: !choice.endsGroup }">
          <toggle :domId="getId('group-checkbox', choice.staffId)" :label="''" :initialValue="choice.inGroup"
            :changeCb="(value: boolean) => { choice.inGroup = value; choice.removeCb(); }" />
        </span>
      </div>
      <div v-if="choice.inGroup && choice.endsGroup" class="col col-12 mb-2 border-bottom"></div>
    </div>
  </dialogContainer>
</template>