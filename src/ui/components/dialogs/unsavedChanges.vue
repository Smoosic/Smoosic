<script setup lang="ts">
import { UnsavedChoice } from '../../../render/sui/scoreChangeState';
interface Props {
  domId: string,
  headline: string,
  message: string,
  choose: (choice: UnsavedChoice) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, headline, message, choose, commitCb, cancelCb } = { ...props };
const getDomId = () => {
  return `attr-modal-dialog-${domId}`;
}
const getId = (str: string) => {
  return `${domId}-${str}`;
}
// Record the choice, then close the dialog.  Cancel closes through cancelCb.
const pick = async (choice: UnsavedChoice) => {
  choose(choice);
  await commitCb();
}
</script>
<template>
  <div class="dlg spec attributeModal" :id="getDomId()">
    <div class="container text-center" :id="getId('modal-content')">
      <div class="row mb-2 dlg-bar">
        <h2 class="dlg-title">{{ headline }}</h2>
      </div>
      <div class="text-input">
        <p>{{ message }}</p>
      </div>
      <div class="buttonContainer">
        <button :id="getId('save')" class="ok-button button-left btn btn-primary"
          @click.prevent="pick('save')">Save</button>
        <button :id="getId('discard')" class="button-center btn btn-secondary"
          @click.prevent="pick('discard')">Don't save</button>
        <button :id="getId('cancel')" class="cancel-button button-center btn btn-secondary"
          @click.prevent="cancelCb">Cancel</button>
      </div>
    </div>
  </div>
</template>
