import { default as mainDom } from './components/mainDom.vue';
import { SuiPiano } from '../render/sui/piano';
import { SvgHelpers } from '../render/sui/svgHelpers';
import { SuiNavigation, scrollHandler } from '../render/sui/configuration';
import { createApp, ref, Ref } from 'vue';
declare var $: any;

export class SuiNavigationDom implements SuiNavigation {
  static _instance: SuiNavigationDom;
  static get instance() {
    return SuiNavigationDom._instance;
  }
  bugModalView: Ref<boolean> = ref(false);
  _displayMode: Ref<string> = ref('vertical');  
  scrollHandlers: scrollHandler[] = [];
  _container?: HTMLElement;
  initialized: boolean = false;
  isInitialized() {
    return this.initialized;
  }
  get displayMode() {
    return this._displayMode.value;
  }
  set displayMode(value: string) {
    this._displayMode.value = value;
  }
  get container() {
    return this._container;
  }
  set container(value: HTMLElement | undefined) {
    this._container = value;
  }
  constructor(uiDomContainer?: HTMLElement) {
    if (uiDomContainer) {
      this._container = uiDomContainer;
    }
  }
  initialize()  {
    if (!this.container) {
      throw new Error('SuiNavigationDom: DOM container not set');
    }
    const mainDomInit = (pianoKeys: HTMLElement) => {
      const svg = document.createElementNS(SvgHelpers.namespace, 'svg');
      svg.id = 'piano-svg';
      svg.setAttributeNS('', 'width', '' + SuiPiano.owidth * SuiPiano.dimensions.octaves);
      svg.setAttributeNS('', 'height', '' + SuiPiano.dimensions.wheight);
      svg.setAttributeNS('', 'viewBox', '0 0 ' + SuiPiano.owidth * SuiPiano.dimensions.octaves + ' ' + SuiPiano.dimensions.wheight);
      pianoKeys.appendChild(svg);
    }
    SuiNavigationDom._instance = this;
    createApp(mainDom as any, { bugModalView: this.bugModalView, displayMode: this._displayMode, mainDomInit })
      .mount(this.container);
    $(this.scrollable)[0].onscroll = (ev: any) => {
      this.scrollHandlers.forEach((handler) => {
        handler(ev);
      });
    }
    this.initialized = true;
  }
  get scrollable() {
    return '.musicRelief';
  }
  pushScrollHandler(handler: scrollHandler) {
    this.scrollHandlers.push(handler);
  }
  popScrollHandler() {
    return this.scrollHandlers.pop();
  }
  showBugModal() {
    $('.dom-container').addClass('show-modal');
    this.bugModalView.value = true;
  }
  hideBugModal() {
    $('.dom-container').removeClass('show-modal');
    this.bugModalView.value = false;
  }
  showDialogModal() {
    $('body').addClass('showVueDialog');
  }
  hideDialogModal() {
    $('body').removeClass('showVueDialog');
  }
}