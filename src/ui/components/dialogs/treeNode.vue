<script setup lang="ts">
import { computed } from 'vue';
import { SmoLibrary } from '../../fileio/library';
import TreeNode from './treeNode.vue';

interface Props {
  node: SmoLibrary,
  selectedUrl: string,
  expanded: Record<string, boolean>,
  selectCb: (node: SmoLibrary) => void,
  toggleCb: (node: SmoLibrary) => void
}
const props = defineProps<Props>();

const isFolder = computed(() => props.node.format === 'library');
const hasChildren = computed(() => props.node.children.length > 0);
const isExpanded = computed(() => !!props.expanded[props.node.url ?? '']);
const isSelected = computed(() => !!props.node.url && props.node.url === props.selectedUrl);
</script>

<template>
  <li class="tree-branch" :class="{ selected: isSelected, collapsed: isFolder && hasChildren && !isExpanded }">
    <button v-if="isFolder && hasChildren" type="button" class="expander"
      :class="isExpanded ? 'expanded icon-minus' : 'collapsed icon-plus'"
      @click.prevent="toggleCb(node)"></button>
    <a class="tree-link" @click="selectCb(node)">{{ node.metadata.name }}</a>
    <span class="file-type" :class="isFolder ? 'icon-book' : 'icon-file-music'"></span>
    <ul v-if="isFolder && hasChildren && isExpanded">
      <TreeNode v-for="child in node.children" :key="child.url" :node="child"
        :selectedUrl="selectedUrl" :expanded="expanded" :selectCb="selectCb" :toggleCb="toggleCb" />
    </ul>
  </li>
</template>
