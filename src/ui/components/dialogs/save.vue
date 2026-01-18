<script setup lang="ts">
import { ref, watch, Ref, onMounted, useTemplateRef, computed } from 'vue';
import dialogContainer from './dialogContainer.vue';

interface Props {
  domId: string,
  contents: Ref<string>,
  suggestedName: string,
  extension: Ref<string>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>,
  changeExtensionCb: (value: string) => void
}
const props = defineProps < Props > ();
const { domId, commitCb, contents, cancelCb, extension, suggestedName } = { ...props };

const url = ref('');
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const selectedExtension = ref(extension.value);
const extensions = [
  { text: 'Smoosic', value: '.json' },
  { text: 'MusicXML', value: '.xml' },
  { text: 'midi', value: '.mid' },
  { text: 'vex', value: '.js' },
  { text: 'Validation (large)', value: '.smojson' },
];
const filename = ref(suggestedName);
if (!filename.value.endsWith(extension.value)) {
  filename.value = filename.value + extension.value;
}
const mimeType = 'application/octet-stream'
const saveLink = useTemplateRef('saveLink');
const saveFileCb = async () => {
  if (!filename.value.endsWith(extension.value)) {
    filename.value = filename.value + extension.value;
  }
  setTimeout(async () => {
    if (saveLink.value) {
      (saveLink.value as any).click();
    }
    await commitCb();
  }, 100)
}
const enable = ref(true);
watch(contents, () => {
  url.value = URL.createObjectURL(new Blob([contents.value], { type: mimeType }));
});
watch(extension, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    if (typeof (oldVal) === 'string' && filename.value.endsWith(oldVal)) {
      filename.value = filename.value.slice(0, -oldVal.length);
    }
    if (!filename.value.endsWith(extension.value)) {
      filename.value = filename.value + extension.value;
    }
  }
});
onMounted(() => {
  if (saveLink.value === null) {
    console.warn('saveLink is null on mounted');
  }
  url.value = URL.createObjectURL(new Blob([contents.value], { type: mimeType }));
});
</script>
<template>
  <dialogContainer :domId="domId" :commitCb="saveFileCb" :cancelCb="cancelCb" :classes="'container text-center'" 
    label="Save File">
      <div class="input-group mb-3" id="save-saveFileName" data-param="saveFileName">
        <label class="input-group-text" for="save-saveFileName-input">File Name</label>
        <input type="text" class="form-control" id="save-saveFileName-input" v-model="filename" />
      </div>
      <div class="input-group mb-3" id="quantize-row">
        <label class="input-group-text" :for="getId('format-select')">File Format:</label>
        <div class="col-md-6">
          <select :id="getId('format-select')" v-model="selectedExtension"
            @change="changeExtensionCb(selectedExtension)" class="form-control">
            <option v-for="option in extensions" :key="option.value" :value="option.value">
              {{ option.text }}
            </option>
          </select>
        </div>
      </div>
      <div class="saveLink hide" aria-hidden="true">
        <a :href="url" :download="filename" class="btn btn-primary" id="save-download-link" ref="saveLink">Download File</a>
</div>
  </dialogContainer>
</template>