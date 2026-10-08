<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { SmoSystemGroup } from '../../../smo/data/scoreModifiers';
import { SmoSystemStaff } from '../../../smo/data/systemStaff';
import { SmoScore } from '../../../smo/data/score';
import { SelectOption } from '../../common';
import selectComp from './select.vue';
import dialogContainer from './dialogContainer.vue';
import staffGroupRow from './staffGroupRow.vue';

interface Props {
  staffGroups: SmoSystemGroup[],
  score: SmoScore,
  domId: string,
  label: string,
  setConnectorCb: (staffId: number, connectorType: string) => Promise<void>,
  removeFromGroupCb: (staffId: number) => Promise<void>,
  addToGroupCb: (staffId: number, direction: 'above' | 'below') => Promise<void>,
  createStaffGroupCb: (staffId: number) => Promise<void>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { score, domId } = props;

const connectorTypeOptions: SelectOption[] = [
  { label: 'Brace', value: '0' },
  { label: 'Bracket', value: '1' },
  { label: 'Single line', value: '2' },
  { label: 'Double line', value: '3' }
];

interface StaveRow {
  staffId: number,
  name: string,
  bravura: boolean,
  icon: string,
  inGroup: boolean,
  actionLabel: string,
  canAddAbove: boolean,
  canAddBelow: boolean,
  canCreate: boolean,
  canRemove: boolean
}
interface GroupBlock {
  type: 'group',
  key: string,
  group: SmoSystemGroup,
  name: string,
  connectorValue: string,
  connectorOptions: SelectOption[],
  rows: StaveRow[]
}
interface LooseBlock {
  type: 'loose',
  key: string,
  row: StaveRow
}
type Block = GroupBlock | LooseBlock;

interface MenuAction {
  key: string,
  icon: string,
  label: string,
  danger: boolean,
  disabled: boolean,
  run: () => Promise<void>
}

const getId = (str: string, staffId?: number) => {
  return typeof staffId === 'number' ? `${domId}-${staffId}-${str}` : `${domId}-${str}`;
}

const getGroupForStaff = (staffId: number): SmoSystemGroup | undefined =>
  props.staffGroups.find((sg) => sg.startSelector.staff <= staffId && sg.endSelector.staff >= staffId);

const clefIcon = (staff: SmoSystemStaff): { bravura: boolean, icon: string } => {
  const clef = staff.measures.length > 0 ? staff.measures[0].clef : 'treble';
  if (clef === 'bass') {
    return { bravura: true, icon: 'bv-fclef' };
  }
  if (clef === 'alto' || clef === 'tenor') {
    return { bravura: true, icon: 'bv-cclef' };
  }
  if (clef === 'percussion') {
    return { bravura: false, icon: 'graphic_eq' };
  }
  return { bravura: true, icon: 'bv-gclef' };
}

const buildRow = (staffId: number): StaveRow => {
  const staff = score.staves[staffId];
  const sg = getGroupForStaff(staffId);
  const aboveGroup = staffId > 0 ? getGroupForStaff(staffId - 1) : undefined;
  const belowGroup = staffId < score.staves.length - 1 ? getGroupForStaff(staffId + 1) : undefined;
  const { bravura, icon } = clefIcon(staff);
  return {
    staffId,
    name: staff.partInfo.partName,
    bravura,
    icon,
    inGroup: !!sg,
    actionLabel: sg ? 'Grouped' : 'Ungrouped',
    canAddAbove: !sg && !!aboveGroup,
    canAddBelow: !sg && !!belowGroup,
    canCreate: !sg,
    canRemove: !!sg
  };
}

const staveCountLabel = (count: number) => count === 1 ? '1 stave' : `${count} staves`;

const groupLabel = (group: SmoSystemGroup) => {
  if (group.text && group.text.trim().length > 0) {
    return group.text;
  }
  const start = group.startSelector.staff + 1;
  const end = group.endSelector.staff + 1;
  return start === end ? `Staff ${start}` : `Staves ${start}–${end}`;
}

const blocks = computed<Block[]>(() => {
  const rv: Block[] = [];
  let i = 0;
  while (i < score.staves.length) {
    const sg = getGroupForStaff(i);
    if (sg && sg.startSelector.staff === i) {
      const rows: StaveRow[] = [];
      const end = Math.min(sg.endSelector.staff, score.staves.length - 1);
      for (let j = sg.startSelector.staff; j <= end; ++j) {
        rows.push(buildRow(j));
      }
      rv.push({
        type: 'group',
        key: `group-${sg.attrs.id}`,
        group: sg,
        name: groupLabel(sg),
        connectorValue: sg.leftConnector.toString(),
        connectorOptions: JSON.parse(JSON.stringify(connectorTypeOptions)),
        rows
      });
      i = end + 1;
    } else {
      rv.push({ type: 'loose', key: `loose-${i}`, row: buildRow(i) });
      i += 1;
    }
  }
  return rv;
});

const connectorClass = (group: SmoSystemGroup) => {
  const name = SmoSystemGroup.connectorTypeNames[group.leftConnector] ?? 'bracket';
  return `sg-${name}`;
}

const openStaffId = ref<number | null>(null);
const hasOpenMenu = computed(() => openStaffId.value !== null);

const toggleMenu = (staffId: number) => {
  openStaffId.value = openStaffId.value === staffId ? null : staffId;
}
const closeMenu = () => {
  openStaffId.value = null;
}

const menuActionsFor = (row: StaveRow): MenuAction[] => [
  {
    key: 'add-above',
    icon: 'vertical_align_top',
    label: 'Add above',
    danger: false,
    disabled: !row.canAddAbove,
    run: async () => { await props.addToGroupCb(row.staffId, 'above'); }
  },
  {
    key: 'add-below',
    icon: 'vertical_align_bottom',
    label: 'Add below',
    danger: false,
    disabled: !row.canAddBelow,
    run: async () => { await props.addToGroupCb(row.staffId, 'below'); }
  },
  {
    key: 'create',
    icon: 'add_box',
    label: 'Create new group',
    danger: false,
    disabled: !row.canCreate,
    run: async () => { await props.createStaffGroupCb(row.staffId); }
  },
  {
    key: 'remove',
    icon: 'link_off',
    label: 'Remove from group',
    danger: true,
    disabled: !row.canRemove,
    run: async () => { await props.removeFromGroupCb(row.staffId); }
  }
];

const runAction = async (action: MenuAction) => {
  if (action.disabled) {
    return;
  }
  closeMenu();
  await action.run();
}

const connectorChange = async (group: SmoSystemGroup, value: string) => {
  await props.setConnectorCb(group.startSelector.staff, value);
}

const outsideClickListener = (event: MouseEvent) => {
  if (openStaffId.value === null) {
    return;
  }
  const target = event.target as HTMLElement;
  if (target.closest('.sg-act') || target.closest('.sg-menu')) {
    return;
  }
  closeMenu();
}
const keydownListener = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && openStaffId.value !== null) {
    closeMenu();
  }
}
onMounted(() => {
  document.addEventListener('click', outsideClickListener, { capture: true });
  document.addEventListener('keydown', keydownListener);
});
onUnmounted(() => {
  document.removeEventListener('click', outsideClickListener, { capture: true });
  document.removeEventListener('keydown', keydownListener);
});
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb">
    <div class="dlg-body">
      <div class="sg-list" :class="{ 'has-menu': hasOpenMenu }">
        <div class="sg-head"><span>Group</span><span>Stave</span><span>Action</span></div>

        <template v-for="block in blocks" :key="block.key">
          <div v-if="block.type === 'group'" class="sg-group">
            <div class="sg-conn" :class="connectorClass(block.group)" style="top:33px;bottom:0"></div>
            <div class="sg-group-bar">
              <span></span>
              <span class="sg-group-name">{{ block.name }}<span class="sg-group-count">{{ staveCountLabel(block.rows.length) }}</span></span>
              <selectComp :domId="getId('connector', block.group.startSelector.staff)" :label="''"
                :initialValue="block.connectorValue" :selections="block.connectorOptions"
                :changeCb="(value: string) => connectorChange(block.group, value)" />
            </div>
            <staffGroupRow v-for="row in block.rows" :key="row.staffId" :domId="domId" :staffId="row.staffId"
              :name="row.name" :bravura="row.bravura" :icon="row.icon" :actionLabel="row.actionLabel"
              :isOpen="openStaffId === row.staffId" :isLoose="false" :actions="menuActionsFor(row)"
              :toggleCb="toggleMenu" :runActionCb="runAction" />
          </div>
          <staffGroupRow v-else :domId="domId" :staffId="block.row.staffId" :name="block.row.name"
            :bravura="block.row.bravura" :icon="block.row.icon" :actionLabel="block.row.actionLabel"
            :isOpen="openStaffId === block.row.staffId" :isLoose="true" :actions="menuActionsFor(block.row)"
            :toggleCb="toggleMenu" :runActionCb="runAction" />
        </template>
      </div>

      <div class="sg-legend">
        <span><span class="mi sm">info</span>Choose an action on any stave to change its grouping.</span>
      </div>
    </div>
  </dialogContainer>
</template>
