<script setup lang="ts">
import { onMounted, ref, Ref } from 'vue';
import { DraggableSession, draggableSession } from '../../composable/draggable';
import { SuiHelp } from '../../help';
import draggableComp from './draggableComp.vue';
import { Draggable } from 'smoosic';
declare var $: any;
interface Props3 {
  domId: string,
  closeCb: () => void
}
const props = defineProps<Props3>();
const domId = props.domId;
const helpCards = SuiHelp.helpHtml;
helpCards[0].show.value = true;
const getId = (str: string) => {
  return `${domId}-${str}`;
}
let currentCard = 0;
const session: DraggableSession = draggableSession(getId('help-draggable'));
const showRow = (index: number) => {
  currentCard = index;
  helpCards.forEach((card, cardIx) => {
    card.show.value = cardIx === index;
  });
}
</script>
<template>
  <div class="helpDialog card-view" :id="getId('help-top')" :style="session.getLocString()">
    <draggableComp :draggableSession="session" />
    <div class="help-closer">
      <button class="icon-cross close" @click="props.closeCb"></button>
    </div>
    <div v-for="helpCard in helpCards" :key="helpCard.index" class="helpLine" :class="{ hide: !helpCard.show.value }">
      <h3>{{ helpCard.title }}</h3>
      <div class="help-content" v-html="helpCard.html"></div>
    </div>
    <div class="buttonContainer">
      <button class="prev-topic button-left btn btn-secondary" :class="{ invisible: currentCard === 0 }"
        @click="showRow((currentCard + helpCards.length - 1) % helpCards.length)">
        <span class="icon icon-arrow-left"></span>
        <span class="prev-topic-text">Previous</span></button>
      <button class="next-topic button-right btn btn-secondary" @click="showRow((currentCard + 1) % helpCards.length)" :class="{ invisible: currentCard === helpCards.length - 1 }">
        <span class="next-topic-text">Next</span><span class="icon icon-arrow-right"></span>
      </button>
    </div>
  </div>
</template>