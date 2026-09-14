<script setup lang="ts">
import { ref, computed, reactive, Ref } from 'vue';
import { SmoLibrary } from '../../fileio/library';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import dialogContainer from './dialogContainer.vue';
import TreeNode from './treeNode.vue';

interface Props {
  domId: string,
  label: string,
  view: SuiScoreViewOperations,
  topLib: SmoLibrary,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();

// Which entry (by url) is currently selected, and which folder entries
// (by url) are currently expanded. Centralized here and drilled down
// through every level of treeNode.vue via selectCb/toggleCb, rather than
// bubbling Vue emits through N recursive levels (see specs/015-vue-library-dialog
// research.md §5).
const selectedUrl: Ref<string> = ref('');
const expanded: Record<string, boolean> = reactive({});

const findNodeByUrl = (node: SmoLibrary, url: string): SmoLibrary | null => {
  if (node.url === url) {
    return node;
  }
  for (const child of node.children) {
    const found = findNodeByUrl(child, url);
    if (found) {
      return found;
    }
  }
  return null;
};
const selectedNode = computed<SmoLibrary | null>(() => {
  if (!selectedUrl.value) {
    return null;
  }
  return findNodeByUrl(props.topLib, selectedUrl.value);
});
// Load is only meaningful for a song (leaf) entry, never a folder.
const canLoad = computed<boolean>(() => selectedNode.value !== null && selectedNode.value.format !== 'library');

// Fetches a folder entry's own remote contents the first time it's
// selected. props.topLib is reactive() (see libraryVue.ts), so the
// in-place mutation SmoLibrary.load()/initialize() makes to node.children
// is picked up automatically -- SmoLibrary itself is unmodified.
const loadChildrenIfNeeded = async (node: SmoLibrary): Promise<void> => {
  if (node.format === 'library' && !node.loaded) {
    await node.load();
  }
};

const selectNode = async (node: SmoLibrary) => {
  selectedUrl.value = node.url ?? '';
  if (node.format === 'library') {
    await loadChildrenIfNeeded(node);
    if (node.url) {
      expanded[node.url] = true;
    }
  }
};

// Independent of selection: shows/hides a folder's already-known children
// with no fetch and no change to the current selection.
const toggleExpand = (node: SmoLibrary) => {
  if (!node.url) {
    return;
  }
  expanded[node.url] = !expanded[node.url];
};

const confirmLoad = async () => {
  if (canLoad.value && selectedNode.value && selectedNode.value.url) {
    await props.view.loadRemoteScore(selectedNode.value.url);
  }
};
// Matches SuiLibraryAdapter.cancel(): no-op.
const cancel = async () => {};

const handleCommit = async () => {
  await confirmLoad();
  await props.commitCb();
};
const handleCancel = async () => {
  await cancel();
  await props.cancelCb();
};
</script>

<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="handleCommit" :cancelCb="handleCancel" :enable="canLoad">
    <ul class="tree tree-root">
      <TreeNode v-for="child in topLib.children" :key="child.url" :node="child"
        :selectedUrl="selectedUrl" :expanded="expanded" :selectCb="selectNode" :toggleCb="toggleExpand" />
    </ul>
  </dialogContainer>
</template>
