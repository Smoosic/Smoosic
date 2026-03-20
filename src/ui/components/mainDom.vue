<script setup lang="ts">
import { onMounted, useTemplateRef, toRef, Ref, watch, ref, computed } from 'vue';
import modalSplash from './modalSplash.vue';
import { DomDialogNotifiers, CrashDialog } from '../common';
import { SuiNavigation, scrollHandler, debugFlag } from '../../render/sui/configuration';
import { default as crashComponent } from './crash.vue';
interface Props {
  domId: string,
  displayMode: Ref<string>,
  mainDomInit: (pianoKeys: HTMLElement | null) => void,
  getDialogNotifiers: () => DomDialogNotifiers
}
const props = defineProps<Props>();
const pianoKeys = useTemplateRef('pianoKeys');
const showSplash: Ref<boolean> = ref(false);
const dialogNotifiers = props.getDialogNotifiers();
const showAttributeDialog = dialogNotifiers.showAttributeDialog;
const crashDialog: CrashDialog = dialogNotifiers.crashDialog;
const showDebugRegion = computed(() => {
  return dialogNotifiers.debugFlags.some((flag) => flag.htmlString.length > 0);
});
const displayMode = props.displayMode;
const mainDomInit = props.mainDomInit;
const domId = props.domId;
const getId = (id: string) => {
  return `${domId}-${id}`;
}
onMounted(() => {
  mainDomInit(pianoKeys.value);
});

const closeSplash = () => {
  dialogNotifiers.showSplash.value = false;
}
const setSplashTimer = () => {
    setTimeout(() => {
      dialogNotifiers.showSplash.value = false;
    }, dialogNotifiers.splashTimer.value);
}
watch((dialogNotifiers.showSplash), (newVal) => {
  if (dialogNotifiers.splashTimer.value > 0) {
    setSplashTimer();
  }
  showSplash.value = newVal;
});
watch ((dialogNotifiers.splashTimer), (newVal) => {
  if (newVal > 0 && dialogNotifiers.showSplash.value) {
    setSplashTimer();
  }
});

</script>
<template>
  <modalSplash :closeFunction="closeSplash" :show="dialogNotifiers.showSplash"/>
  <crashComponent :url="crashDialog.url" :bodyText="crashDialog.bodyText" :domId="domId" :show="crashDialog.show"/>
  <div class="debug-region" :class="{ hide: !showDebugRegion }">
    <div v-for="flag in dialogNotifiers.debugFlags" :key="flag.category" class="debug-category">
      <div class="debug-category-header">{{ flag.category }}</div>
      <div class="debug-category-content" :class="flag.category" v-html="flag.htmlString"></div>
    </div>
  </div>
  <div class="draganime hide" style="width: 380px; height: 153.031px; left: 754px; top: 265px;"></div>
  <div class="dialogContainer attributeDialog" id="attribute-modal-container"></div>
  <div id="render-progress"></div>
  <div class="vueDialogContainer vue-modal-container" 
    :id="getId('vue-modal-container')" :class="{ hide: !showAttributeDialog }"></div>
  <div class="dom-container" :class="{ masked: dialogNotifiers.showSplash.value }">
    <div class="mask"></div>
    <div class="workspace language-dir">
      <div class="row navbar-expand justify-content-start ms-5 flex-md-fill" :id="getId('top-bar')">
        <sub class="col-1 hide" :id="getId('link-hdr')"><a href="https://github.com/Smoosic/smoosic" aria-label="Github link" 
          target="_blank" tabindex="0">Github
            site</a> |
          <a href="https://smoosic.github.io/Smoosic/changes.md" aria-label="Change notes" target="_blank" tabindex="0">change notes</a>
          |
          <a href="https://smoosic.github.io/Smoosic/release/html/smoosic.html" aria-label="application link"
            target="_blank" tabindex="0">application</a><button class="close-header" aria-label="Close"><span
              class="icon icon-cross"></span></button></sub>
        <h4 class="col-1 titleText">Smoosic</h4>
        <div class="hide piano-container">
          <div class="key-left-ctrl"></div>
          <div class="piano-keys" ref="pianoKeys">
          </div>
          <div class="key-right-ctrl"></div>
        </div>
        <div class="col-8 controls-top" id="controls-top">
        </div>
      </div>
      <div class="media" id="media">
        <div class="d-flex flex-column flex-shrink-0 p-3 sticky-top" id="controls-left">
        </div>
        <div class="flex-lg-column musicRelief scrollContainer" :class="{ horizontal: displayMode === 'horizontal' }" 
          :id="getId('scroll')">
          <div class="score-container" :id="getId('score')">
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
