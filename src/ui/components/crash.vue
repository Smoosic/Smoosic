<script setup lang="ts">
import { Ref } from 'vue';
interface Props {
  url: string,
  bodyText: Ref<string>,
  domId: string,
  show: Ref<boolean>
}
const props = defineProps<Props>();
const { url, bodyText, domId, show } = { ...props };
const imageLoc = '../styles/images/logo.png';
const getId = (str: string) => {
  return `${domId}-${str}`;
}
</script>
<template>
  <div class="modal crash" :class="{ show: show }">
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <div class="modal-content">
        <div class="row align-items-center justify-content-center">
          <div class="col-md-2">
            <img :src="imageLoc" width="200px" height="200px" alt="Smoosic Logo" />
          </div>
          <div class="col-md-8 py-4">
            <div class="h4">Oh
              No<em class="small">oo</em><em>ooooooooo</em>!
            </div>
            <div class="col py-2">You've found a bug.</div>
            <div class="py-2">It would be helpful if you could copy and paste the information below into a new issue on our GitHub
              page.</div>
            <div class="container-fluid py-4">
              <textarea :id="getId('bug-text-area')" v-html="bodyText" class="col-12 long-text"></textarea>
            </div>
            <div class="py-4"><a :href="url" aria-label="Github link" target="_blank" tabindex="0">{{ url }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>