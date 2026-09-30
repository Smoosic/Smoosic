<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { SmoTextGroup } from '../../../smo/data/scoreText';
import { ScaledPageLayout } from '../../../smo/data/scoreModifiers';
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
  debug: layoutDebug,
  pageLayout: ScaledPageLayout
}
const props = defineProps<Props>();
interface Emits {
  (e: 'stop'): void,
  (e: 'reposition'): void
}
const emit = defineEmits<Emits>();
const getId = (str: string) => `${props.domId}-${str}`;

let session: SuiDragSession | null = null;

// Direction-lock toggle (023-text-drag-controls). 'horizontal' means only horizontal movement
// is allowed (the vertical axis is frozen); 'vertical' means only vertical movement is allowed
// (the horizontal axis is frozen). The two act like a radio pair that can also both be off:
// picking the inactive one switches, picking the active one again clears back to 'none'.
// Resets to 'none' on every mount (a fresh drag session always starts unlocked).
const lockMode = ref<'none' | 'horizontal' | 'vertical'>('none');
const snapEnabled = ref(false);
const setLockMode = (mode: 'horizontal' | 'vertical') => {
  lockMode.value = lockMode.value === mode ? 'none' : mode;
  if (session) {
    session.lockHorizontal = lockMode.value === 'vertical';
    session.lockVertical = lockMode.value === 'horizontal';
  }
};
const onSnapChange = () => {
  if (session) {
    session.snapEnabled = snapEnabled.value;
  }
};

// One-click horizontal placement (023-text-drag-controls). Commits directly to the model
// (bypassing the drag session entirely) so it works whether or not a mouse-drag is in
// progress -- see specs/023-text-drag-controls/research.md §5 for why.
const onCenter = () => {
  props.textGroup.centerOnPage(props.pageLayout);
  emit('reposition');
};
const onRightJustify = () => {
  props.textGroup.rightJustifyOnPage(props.pageLayout);
  emit('reposition');
};

// The drag session renders directly onto the SVG canvas outside Vue's
// reactivity, so mouse handling is wired to raw window events rather than
// the app's eventSource, scoped to the lifetime of this dragging session.
const onMouseDown = (ev: MouseEvent) => {
  if (session && !session.dragging) {
    session.startDrag(ev);
  }
};
// Alt-held "slow mode" (023-text-drag-controls): while Alt is held, only process a drag
// position update once every 100ms; releasing Alt resumes full-speed processing immediately.
let lastMoveTime = 0;
const onMouseMove = (ev: MouseEvent) => {
  if (session && session.dragging) {
    if (ev.altKey) {
      const now = performance.now();
      if (now - lastMoveTime < 100) {
        return;
      }
      lastMoveTime = now;
    } else {
      lastMoveTime = 0;
    }
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
  <div class="row mb-2 ms-2" :id="getId('lock-container')">
    <div class="col-auto">
      <div class="sbtn-group" role="group" :id="getId('lock-group')">
        <button type="button" class="sbtn" :class="{ 'is-on': lockMode === 'horizontal' }"
          :id="getId('move-horizontal')" :aria-pressed="lockMode === 'horizontal'" aria-label="Move Horizontal"
          @click.prevent="setLockMode('horizontal')">
          <span class="mi" style="display: inline-block; transform: rotate(90deg);">import_export</span>
        </button>
        <button type="button" class="sbtn" :class="{ 'is-on': lockMode === 'vertical' }"
          :id="getId('move-vertical')" :aria-pressed="lockMode === 'vertical'" aria-label="Move Vertical"
          @click.prevent="setLockMode('vertical')">
          <span class="mi">import_export</span>
        </button>
      </div>
    </div>
  </div>
  <div class="row mb-2 ms-2" :id="getId('snap-container')">
    <div class="col-auto form-check">
      <input class="form-check-input" type="checkbox" :id="getId('snap')"
        v-model="snapEnabled" @change="onSnapChange">
      <label class="form-check-label" :for="getId('snap')">Snap to Grid</label>
    </div>
  </div>
  <div class="row mb-2 ms-2" :id="getId('placement-container')">
    <div class="col-auto">
      <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('center')" aria-label="Center"
        @click.prevent="onCenter">
        <span class="mi">format_align_center</span>
      </button>
    </div>
    <div class="col-auto">
      <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('right-justify')" aria-label="Right Justify"
        @click.prevent="onRightJustify">
        <span class="mi">format_align_right</span>
      </button>
    </div>
  </div>
  <div class="row mb-2 ms-2" :id="getId('container')">
    <div class="col">
      <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('button')" @click.prevent="stop">
        <span class="smo-icon icon-checkmark"></span>
        <label class="ms-1">{{ altLabel }}</label>
      </button>
    </div>
  </div>
</template>
