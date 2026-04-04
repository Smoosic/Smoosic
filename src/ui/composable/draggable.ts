import { ref, Ref} from "vue";
export interface DraggableSession {
  domId: string;
  top: Ref<number>;
  left: Ref<number>;
  getCoordsCb: () => { topRef: Ref<number>, leftRef: Ref<number> };
  getLocString: () => string;
}
export const draggableSession = (domId: string, cssClass?: string): DraggableSession => {
  const top = ref(100);
  const left = ref(100);
  cssClass = cssClass ?? 'draggable';
  const getCoordsCb = (): { topRef: Ref<number>, leftRef: Ref<number> } => {
    return { topRef: top, leftRef: left };
  }
  const getLocString = () => {
    return `top: ${top.value}px; left: ${left.value}px;`;
  }
  return { domId, top, left, getCoordsCb, getLocString };
}