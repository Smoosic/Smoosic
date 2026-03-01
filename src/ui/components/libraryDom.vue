<script setup lang="ts">
import { onMounted, useTemplateRef, toRef, Ref } from 'vue';
interface Props {
  displayMode: Ref<string>,
  onMounted: () => void,
}
const props = defineProps<Props>();
const pianoKeys = useTemplateRef('pianoKeys');
const displayMode = props.displayMode;
onMounted(() => {
  props.onMounted();
});

</script>