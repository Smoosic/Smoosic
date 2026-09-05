// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { buildDom, getDomContainer } from '../../common/htmlHelpers';
import { KeyEvent, SvgPoint } from '../../smo/data/common';
import { ButtonDefinition, ButtonAction } from './button';
import { BrowserEventSource } from '../eventSource';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { CompleteNotifier, RibbonLayout, replaceVueRoot } from '../common';
import { SuiTracker } from '../../render/sui/tracker';
import { SuiMenuManager } from '../menus/manager';
import { SuiLibraryDialog } from '../dialogs/library';
import { ButtonLabel } from './button';
import { SmoUiConfiguration } from '../configuration';
import { createApp, ref, reactive, watch } from 'vue';
import { SuiKeySignatureDialogVue } from '../dialogs/keySignatureVue';
import { SuiTempoDialogVue } from '../dialogs/tempoVue';
import { default as ribbonApp } from '../components/buttons/ribbon.vue';
import { default as ribbonSidebarApp } from '../components/buttons/sidebar.vue';
import { SuiTimeSignatureDialogVue } from '../dialogs/timeSignature';
import { SuiScoreViewDialogVue } from '../dialogs/scoreView';

declare var $: any;

export type SuiModalButtonTypes = 'SuiLibraryDialog' | 'SuiTempoDialog';
export var SuiModalButtonStrings = ['SuiLibraryDialog', 'SuiTempoDialog'];
export function isModalButtonType(but: string | SuiModalButtonTypes): but is SuiModalButtonTypes {
  return SuiModalButtonStrings.indexOf(but) >= 0;
}

/**
 * Parameters for creating the global button ribbon object.  The button ribbon supports a 
 * button panel in 'top' and 'left' areas, with support for R-to-L languages.  
 * Button groups in left and display menus are not collapsible.  They are just a ButtonDefinition
 * capsule but are not actually buttons - event handling is done by this 'ribbon' object.
 * Button groups (mostly obsolete) are collapsible and are first-class button objects and
 * are collapsible.  The content of ribbonButtons determines which buttons show up.  
 * ribbon layout determines which show up top vs. left
 * @param {BrowserEventSource} eventSource - buttons will use this to bind click events
 * @param {CompleteNotifier} completeNotifier - buttons that bring up menus and dialogs will pass this to the dialogs
 * @param {SuiTracker} tracker - some buttons act on the current selection
 * @param {SuiMenuManager} menus - some buttons invoke a menu
 * @param {ButtonDefinition[]} - the buttons
 * @param {RibbonLayout} ribbons - where the buttons appear
 * @category SuiButton
 * @see {ButtonDefinition} for how to create/modify buttons
 * @see {defaultRibbonLayout} for buttons supported from the demo application
 */
export interface SuiRibbonParams {
  config: SmoUiConfiguration
  eventSource: BrowserEventSource,
  view: SuiScoreViewOperations,
  completeNotifier: CompleteNotifier,
  tracker: SuiTracker,
  menus: SuiMenuManager,
  ribbonButtons: ButtonDefinition[],
  ribbons: RibbonLayout
}
/**
 * Render the ribbon buttons based on group, function, and underlying UI handler.
 * Also handles UI events.
 * @category SuiButton
 */
export class RibbonButtons {
  static get paramArray() {
    return ['ribbonButtons', 'ribbons', 'keyCommands', 'controller', 'menus', 'eventSource', 'view'];
  }  
  static translateButtons: ButtonLabel[] = [];
  controller: CompleteNotifier;
  config: SmoUiConfiguration;
  eventSource: BrowserEventSource;
  view: SuiScoreViewOperations;
  menus: SuiMenuManager;
  ribbons: RibbonLayout;
  ribbonButtons: ButtonDefinition[];

  constructor(params: SuiRibbonParams) {
    this.controller = params.completeNotifier;
    this.config = params.config;
    this.eventSource = params.eventSource;
    this.view = params.view;
    this.menus = params.menus;
    this.ribbonButtons = params.ribbonButtons;
    this.ribbons = params.ribbons;
  }
  // Anchor point for a menu opened from a standard menu button: the button's top-right corner.
  resolveTopRightAnchor(elementId?: string): SvgPoint | undefined {
    if (!elementId) {
      return undefined;
    }
    const element = document.getElementById(elementId.replace(/^#/, ''));
    if (!element) {
      return undefined;
    }
    const rect = element.getBoundingClientRect();
    return { x: rect.right, y: rect.top };
  }
  // Anchor point for a menu opened from a quick-action button: the control's bottom-left corner.
  resolveBottomLeftAnchor(elementId?: string): SvgPoint | undefined {
    if (!elementId) {
      return undefined;
    }
    const element = document.getElementById(elementId.replace(/^#/, ''));
    if (!element) {
      return undefined;
    }
    const rect = element.getBoundingClientRect();
    return { x: rect.left, y: rect.bottom };
  }
  async executeQuickButton(button: ButtonDefinition, elementId?: string) {
    if (button.id === 'setView') {
    SuiScoreViewDialogVue(
      {
        completeNotifier: this.controller,
        view: this.view,
        eventSource: this.eventSource,
        id: 'scoreViewDialog',
        ctor: 'SuiScoreViewDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: null
      });
    }
    if (button.id === 'zoomin') {
      const globalLayout = this.view.score.layoutManager!.getGlobalLayout();
      globalLayout.zoomScale /= 1.1;
      await this.view.updateZoom(globalLayout.zoomScale);
    } else if (button.id === 'zoomout') {
      const globalLayout = this.view.score.layoutManager!.getGlobalLayout();
      globalLayout.zoomScale *= 1.1;
      this.view.updateZoom(globalLayout.zoomScale);
    } else if (button.id === 'refresh') {
      await this.view.refreshViewport();
    } else if (button.id === 'keySignature') {
      if (!this.controller) {
        return;
      }
      SuiKeySignatureDialogVue({
        view: this.view,
        completeNotifier: this.controller,
        startPromise: null,
        eventSource: this.eventSource,
        tracker: this.view.tracker,
        ctor: 'SuiKeySignatureDialog',
        id: 'key-signature-dialog',
        modifier: null
      });
    } else if (button.id === 'ribbonTime') {
      if (!this.controller) {
        return;
      }
      SuiTimeSignatureDialogVue({
        completeNotifier: this.controller,
        view: this.view,
        eventSource: this.eventSource,
        id: 'staffGroups',
        ctor: 'SuiStaffGroupDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: null
      });
    } else if (button.id === 'ribbonTempo') {
      if (!this.controller) {
        return;
      }
      const tempo = this.view.tracker.selections[0].measure.getTempo();
      SuiTempoDialogVue(
        {
          id: 'tempoDialog',
          ctor: 'SuiTempoDialog',
          completeNotifier: this.controller,
          view: this.view,
          eventSource: this.eventSource,
          tracker: this.view.tracker,
          startPromise: null,
          modifier: tempo
        }
      );
    } else if (button.id === 'playButton2') {
      this.view.playFromSelection();
    } else if (button.id === 'stopButton2') {
      this.view.stopPlayer();
    } else if (button.id === 'selectPart') {
      if (!this.controller) {
        return;
      }
      await this.view.renderPromise();
      const anchor = this.resolveBottomLeftAnchor(elementId);
      this.menus.createMenu('SuiPartSelectionMenu', this.controller, anchor);
    }
  }
  async executeButtonModal(buttonElement: string, buttonData: ButtonDefinition) {
    if (isModalButtonType(buttonData.ctor)) {
      const params = {
        eventSource: this.eventSource,
        completeNotifier: this.controller,
        view: this.view,
        ctor: buttonData.ctor,
        id: buttonData.id,
        startPromise: null,
        tracker: this.view.tracker
      };
      if (buttonData.ctor === 'SuiLibraryDialog') {
        await SuiLibraryDialog.createAndDisplay(params, this.config);
      } else {
        SuiTempoDialogVue(params);
      }
    } else if (buttonData.ctor === 'helpModal') {
      this.view.navigation.showHelpModal();
    }
  }

  async executeButton(buttonElement: string, buttonData: ButtonDefinition) {
    if (buttonData.action === 'modal') {
      await this.executeButtonModal(buttonElement, buttonData);
    }
    if (buttonData.action === 'menu' || buttonData.action === 'collapseChildMenu') {
      const anchor = this.resolveTopRightAnchor(buttonElement);
      await this.menus.createMenu(buttonData.ctor, this.controller, anchor);
    }
  }

  bindButton(buttonElement: string, buttonData: ButtonDefinition) {
    const cb = async () => {
      await this.executeButton(buttonElement, buttonData);
    };
    this.eventSource.domClick(buttonElement, cb);
  }
  static isCollapsible(action: ButtonAction) {
    return ['collapseChild', 'collapseChildMenu', 'collapseGrandchild', 'collapseMore'].indexOf(action) >= 0;
  }

  // ### _createButtonHtml
  // For each button, create the html and bind the events based on
  // the button's configured action.
  createRibbonHtml(buttonAr: string[], selector: string | HTMLElement) {
    const dataArray: ButtonDefinition[] = reactive([]);
    const buttonCallback = async (button: ButtonDefinition, elementId?: string) => {
      return await this.executeQuickButton(button, elementId);
    };
    buttonAr.forEach((buttonId) => {
      const buttonData = this.ribbonButtons.find((e) =>
        e.id === buttonId
      );
      if (buttonData) {
        buttonData.callback = buttonCallback;
        buttonData.classes += ' btn';
        dataArray.push(buttonData);        
      }
    });
    const partButton = dataArray.find((b) => b.id === 'selectPart');
    if (partButton) {
      watch(this.view.PartName, (newVal) => {
        if (newVal.length) {   
          partButton.rightText = newVal;
        } else {
          partButton.rightText = 'Select Part';
        }
      });
    }
    const root = replaceVueRoot(selector);
    createApp(ribbonApp as any, { buttonProps: dataArray, domId: root }).mount('#' + root);
  }
  // ### _createButtonHtml
  // For each button, create the html and bind the events based on
  // the button's configured action.
  createSidebarMenuHtml(buttonAr: string[], selector: string | HTMLElement) {
    let buttonClass = '';
    const buttonList: ButtonDefinition[] = [];
    const executeButton = async (buttonData: ButtonDefinition, elementId?: string) => {
      await this.executeButton(elementId ?? buttonData.id, buttonData);
    };
    buttonAr.forEach((buttonId) => {
      const buttonData = this.ribbonButtons.find((e) =>
        e.id === buttonId
      );
      if (buttonData) {
        buttonData.callback = executeButton;
        // buttonData.icon += ' menu-icon';
        buttonList.push(buttonData);        
      }
    });
    createApp(ribbonSidebarApp as any, { buttonProps: buttonList, domId: selector instanceof HTMLElement ? selector.id : selector }).mount(selector);
  }
  createRibbon(buttonDataArray: string[], parentElement: string | HTMLElement) {
    this.createRibbonHtml(buttonDataArray, parentElement);
  }
  async createSidebarRibbon(buttonDataArray: string[], parentElement: string | HTMLElement, containerClasses: string) {
    this.createSidebarMenuHtml(buttonDataArray, parentElement);
  }
  async handleKeyDown(ev: KeyEvent) {
    if (ev.altKey) {
      const keyButton = this.ribbonButtons.find((bb) => bb.hotKey && bb.hotKey === ev.key);
      if (keyButton) {
        const element = '#' + keyButton.id;
        await this.executeButton(element, keyButton);
      }
    }
  }
  display() {
    if (this.config.leftControls) {
      const leftControl = getDomContainer(this.config.leftControls);
      if (leftControl) {
        $(leftControl).html('');
        const lbuttons = this.ribbons.left;
        this.createSidebarRibbon(lbuttons, leftControl, 'nav-item');
      }
    }
    if (this.config.topControls) {
      const topControl = getDomContainer(this.config.topControls);
      if (topControl) {
        const tbuttons = this.ribbons.top;
        this.createRibbon(tbuttons, topControl);
      }
    }
    const kd = async (ev: any) => { this.handleKeyDown(ev); }
    this.eventSource.bindKeydownHandler(kd);
  }
}


