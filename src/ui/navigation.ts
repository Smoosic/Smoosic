import { default as mainDom } from './components/mainDom.vue';
import { DomDialogNotifiers, DomDebugFlag, replaceVueRoot } from './common';
import { SuiPiano } from '../render/sui/piano';
import { SvgHelpers } from '../render/sui/svgHelpers';
import { SuiNavigation, scrollHandler, debugFlag } from '../render/sui/configuration';
import progressComponent from './components/progress.vue';
import helpDialog from './components/dialogs/helpContainer.vue';
import { createApp, ref, Ref,reactive } from 'vue';
declare var $: any;

export class SuiNavigationDom implements SuiNavigation {
  static _instance: SuiNavigationDom;
  static get instance() {
    return SuiNavigationDom._instance;
  }
  _displayMode: Ref<string> = ref('vertical');  
  crashUrl = 'https://github.com/Smoosic/Smoosic/issues';
  scrollHandlers: scrollHandler[] = [];
  _outerContainer?: HTMLElement; // container for entire UI, menus, controls, scrolling region
  _scrollContainer?: HTMLElement; // container for the score that contains the dimensions and scrolls
  _scoreContainer?: HTMLElement; // container for the score div elements and svg
  debugFlags: DomDebugFlag[] = reactive([]);
  initialized: boolean = false;
  showSplash: Ref<boolean> = ref(false);
  splashTimer: Ref<number> = ref(0);
  showHelpDialog: Ref<boolean> = ref(false);
  progressPercentValue: Ref<number> = ref(0);
  showAttributeDialog: Ref<boolean> = ref(false);
  crashReport: Ref<string> = ref('');
  showCrashReport: Ref<boolean> = ref(false);
  displayExceptionDialog(message: string) {
    this.crashReport.value = message;
    this.showCrashReport.value = true;
    this.showDialogModal();
  }
  showProgressModal(label: string) {
    $('body').addClass('progress-modal');
    const domId = replaceVueRoot($('#render-progress')[0]);
    createApp(progressComponent, { domId: domId, percent: this.progressPercentValue, label }).mount('#' + domId);
    this.progressPercentValue.value = 0;
  }
  hideProgressModal() {
    this.progressPercentValue.value = 100;
    setTimeout(() => {
      $('body').removeClass('progress-modal');
    }, 500);
  }
  setProgress(percent: number) {
    this.progressPercentValue.value = percent;
  }
  showHelpModal() {
    const domId = replaceVueRoot($('#help-dialog-container')[0]);
    const closeCb = () => this.showHelpDialog.value = false;
    this.showHelpDialog.value = true;
    createApp(helpDialog, { domId: domId, closeCb }).mount('#' + domId);
  }
  isInitialized() {
    return this.initialized;
  }
  createDebugFlags() {
    this.debugFlags.splice(0);
    this.debugFlags.push({ category: 'mouse', htmlString: ''});
    this.debugFlags.push({ category: 'drag', htmlString: '' });
    this.debugFlags.push({ category: 'scroll', htmlString: '' });
  }
  get displayMode() {
    return this._displayMode.value;
  }
  set displayMode(value: string) {
    this._displayMode.value = value;
  }
  get outerContainer() {
    return this._outerContainer;
  }
  set outerContainer(value: HTMLElement | undefined) {
    this._outerContainer = value;
  }
  get scrollContainer() {
    if (this._scrollContainer) {
      return this._scrollContainer;
    }
    const sc: HTMLElement = $(this.outerContainer).find('.scrollContainer')[0];
    if (!sc) {
      throw new Error('SuiNavigationDom: score container referenced before render');
    }
    this._scrollContainer = sc;
    return this._scrollContainer;
  }
  get scoreContainer() {
    if (this._scoreContainer) {
      return this._scoreContainer;
    }
    const sc: HTMLElement = $(this.scrollContainer).find('.score-container')[0];
    if (!sc) {
      throw new Error('SuiNavigationDom: score container referenced before render');
    }
    this._scoreContainer = sc;
    return this._scoreContainer;
  }
  constructor(uiDomContainer?: HTMLElement) {
    if (uiDomContainer) {
      this._outerContainer = uiDomContainer;
    }
  }
  initialize()  {
    if (!this.outerContainer) {
      throw new Error('SuiNavigationDom: DOM container not set');
    }
    if (!this.outerContainer.id) {
      this.outerContainer.id = 'smo-ui';
    }
    const domId = this.outerContainer.id || 'smo-ui';
    const mainDomInit = (pianoKeys: HTMLElement) => {
      const svg = document.createElementNS(SvgHelpers.namespace, 'svg');
      svg.id = 'piano-svg';
      svg.setAttributeNS('', 'width', '' + SuiPiano.owidth * SuiPiano.dimensions.octaves);
      svg.setAttributeNS('', 'height', '' + SuiPiano.dimensions.wheight);
      svg.setAttributeNS('', 'viewBox', '0 0 ' + SuiPiano.owidth * SuiPiano.dimensions.octaves + ' ' + SuiPiano.dimensions.wheight);
      pianoKeys.appendChild(svg);
    }
    SuiNavigationDom._instance = this;
    this.createDebugFlags();
    const getDialogNotifiers = (): DomDialogNotifiers => {
      return { debugFlags: this.debugFlags, showSplash: this.showSplash, splashTimer: this.splashTimer, 
        showAttributeDialog: this.showAttributeDialog,
        showHelpDialog: this.showHelpDialog,
        crashDialog: { url: this.crashUrl, bodyText: this.crashReport, 
          show: this.showCrashReport } };
    }
    createApp(mainDom as any, { 
      domId: domId, displayMode: this._displayMode, mainDomInit, getDialogNotifiers })
      .mount(this.outerContainer);
    $(this.scrollable)[0].onscroll = (ev: any) => {
      this.scrollHandlers.forEach((handler) => {
        handler(ev);
      });
    }
    this.initialized = true;
  }
  showDebugString(flag: debugFlag, htmlString: string) {
    this.debugFlags.forEach((df) => {
      if (df.category === flag) {
        df.htmlString = htmlString;
      }
    });
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
  showSplashModal(timeout: number = 0) {
    this.splashTimer.value = timeout;
    this.showSplash.value = true;
  }
  showDialogModal() {
    this.showAttributeDialog.value = true;
  }
  hideDialogModal() {
    this.showAttributeDialog.value = false;
  }
}