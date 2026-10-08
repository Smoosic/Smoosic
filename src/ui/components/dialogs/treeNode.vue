<script setup lang="ts">
import { computed, onMounted } from 'vue';
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
onMounted(async () => {
  if (isFolder.value && !props.node.loaded) {
    await props.node.load();
  }
});

</script>

<template>
  <div class="lt-node">
    <div class="lt-row" :class="{ 'is-lib': isFolder, 'is-selected': isSelected }"  @click.prevent="selectCb(node)">
      <span class="lt-twisty" :class="{ 'is-leaf': !isFolder }">
        <span v-if="isFolder" class="caret" :class="{ 'caret-open': isExpanded, 'caret-right': !isExpanded }">
        </span>
      </span>
      <span v-if="isExpanded" class="mi sm lt-icon">folder_open</span>
      <span v-if="!isExpanded && isFolder" class="mi sm lt-icon">folder</span>
      <span class="lt-name">
          <span v-if="!isFolder" class="bv sm bv-gclef lt-icon"></span>
          <span class="lt-name-label">{{ node.metadata.name }}</span>
          <span v-if="hasChildren" class="lt-count">{{ node.children.length }}</span>
      </span>
    </div>
    <div v-if="hasChildren && isFolder && isExpanded" class="lt-children">
        <TreeNode v-for="child in node.children" :key="child.url" :node="child"
          :selectedUrl="selectedUrl" :expanded="expanded" :selectCb="selectCb" :toggleCb="toggleCb" />

    </div>
  </div>
</template>
