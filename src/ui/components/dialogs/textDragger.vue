<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { SmoTextGroup } from '../../../smo/data/scoreText';
import { SuiDragSession } from '../../../render/sui/textEdit';
import { SvgPageMap } from '../../../render/sui/svgPageMap';
import { SuiScroller } from '../../../render/sui/scroller';
import { layoutDebug } from '../../../render/sui/layoutDebug';

interface Props {
  domId: string,
  altLabel: string,
  textGroup: SmoTextGroup,
  pageMap: SvgPageMap,
  scroller: SuiScroller,
  debug: layoutDebug
}
const props = defineProps<Props>();
interface Emits {
  (e: 'stop'): void
}
const emit = defineEmits<Emits>();
const getId = (str: string) => `${props.domId}-${str}`;

let session: SuiDragSession | null = null;

// The drag session renders directly onto the SVG canvas outside Vue's
// reactivity, so mouse handling is wired to raw window events rather than
// the app's eventSource, scoped to the lifetime of this dragging session.
const onMouseDown = (ev: MouseEvent) => {
  if (session && !session.dragging) {
    session.startDrag(ev);
  }
};
const onMouseMove = (ev: MouseEvent) => {
  if (session && session.dragging) {
    session.mouseMove(ev);
  }
};
const onMouseUp = () => {
  if (session && session.dragging) {
    session.endDrag();
  }
};
const bindWindowHandlers = () => {
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};
const unbindWindowHandlers = () => {
  window.removeEventListener('mousedown', onMouseDown);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
};

const start = () => {
  session = new SuiDragSession({
    textGroup: props.textGroup,
    context: props.pageMap,
    scroller: props.scroller,
    debug: props.debug
  });
  bindWindowHandlers();
};
const stop = () => {
  if (session) {
    if (session.dragging) {
      session.endDrag();
    }
    session.unrender();
  }
  session = null;
  unbindWindowHandlers();
  emit('stop');
};
onBeforeUnmount(() => {
  unbindWindowHandlers();
});
defineExpose({ start, stop });
</script>
<template>
  <div class="row mb-2 ms-2" :id="getId('container')">
    <div class="col">
      <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('button')" @click.prevent="stop">
        <span class="smo-icon icon-checkmark"></span>
        <label class="ms-1">{{ altLabel }}</label>
      </button>
    </div>
  </div>
</template>
