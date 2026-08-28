import { Ref } from "vue";
export interface DraggableSession {
    domId: string;
    top: Ref<number>;
    left: Ref<number>;
    getCoordsCb: () => {
        topRef: Ref<number>;
        leftRef: Ref<number>;
    };
    getLocString: () => string;
}
export declare const draggableSession: (domId: string, cssClass?: string, initialPosition?: {
    top: number;
    left: number;
}) => DraggableSession;
