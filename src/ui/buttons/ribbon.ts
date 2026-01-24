// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { buildDom, getDomContainer } from '../../common/htmlHelpers';
import { KeyEvent } from '../../smo/data/common';
import { ButtonDefinition, ButtonAction } from './button';
import { BrowserEventSource } from '../eventSource';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { CompleteNotifier, RibbonLayout, replaceVueRoot } from '../common';
import { SuiTracker } from '../../render/sui/tracker';
import { SuiMenuManager } from '../menus/manager';
import { SuiLibraryDialog } from '../dialogs/library';
import { SuiTempoDialog } from '../dialogs/tempo';
import { ButtonLabel } from './button';
import { CollapseRibbonControl } from './collapsable';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiHelp } from '../help';
import { SmoUiConfiguration } from '../configuration';
import { createApp, ref, reactive, watch } from 'vue';
import { SuiKeySignatureDialog } from '../dialogs/keySignature';
import { default as ribbonApp } from '../components/buttons/ribbon.vue';
import { default as ribbonSidebarApp } from '../components/buttons/sidebar.vue';
import { SuiTimeSignatureDialog } from '../dialogs/timeSignature';

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
  static ribbonButtonHtml(containerClass: string, buttonId: string, buttonClass: string, buttonText: string, buttonIcon: string, buttonKey: string) {
    const b = buildDom;
    const r = b('div').classes(containerClass).append(b('button').attr('id', buttonId).classes(buttonClass).append(
      b('span').classes('left-text').append(
        b('span').classes('text-span').text(buttonText)).append(
          b('span').classes('ribbon-button-text icon ' + buttonIcon))).append(
            b('span').classes('ribbon-button-hotkey').text(buttonKey)));
    return r.dom();
  }
  static menuButtonHtml(buttonId: string, buttonClass: string, buttonText: string, buttonIcon: string, buttonKey: string) {
    const b = buildDom;
    const r = b('li').classes('nav-item')
      .append(b('button').classes(buttonClass).attr('id', buttonId).classes('nav-link').append(
        b('span').classes('left-text').append(
          b('span').classes('text-span').text(buttonText))).append(
            b('span').classes('ribbon-button-text icon ' + buttonIcon)).append(
              b('span').classes('ribbon-button-hotkey').text(buttonKey)));
    return r.dom();
  }
  static translateButtons: ButtonLabel[] = [];
  controller: CompleteNotifier;
  config: SmoUiConfiguration;
  eventSource: BrowserEventSource;
  view: SuiScoreViewOperations;
  menus: SuiMenuManager;
  ribbons: RibbonLayout;
  ribbonButtons: ButtonDefinition[];
  collapsables: CollapseRibbonControl[] = [];
  collapseChildren: any[] = [];

  constructor(params: SuiRibbonParams) {
    this.controller = params.completeNotifier;
    this.config = params.config;
    this.eventSource = params.eventSource;
    this.view = params.view;
    this.menus = params.menus;
    this.ribbonButtons = params.ribbonButtons;
    this.ribbons = params.ribbons;
    this.collapsables = [];
    this.collapseChildren = [];
  }
  async executeQuickButton(button: ButtonDefinition) {
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
      createAndDisplayDialog(SuiKeySignatureDialog, {
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
      createAndDisplayDialog(SuiTimeSignatureDialog, {
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
      createAndDisplayDialog(SuiTempoDialog,
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
      this.menus.createMenu('SuiPartSelectionMenu', this.controller);
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
        createAndDisplayDialog(SuiTempoDialog, params);
      }
    } else if (buttonData.ctor === 'helpModal') {
      SuiHelp.displayHelp();
    }
  }
  executeButtonMenu(buttonElement: string, buttonData: ButtonDefinition) {
    this.menus.createMenu(buttonData.ctor, this.controller);
  }

  async executeButton(buttonElement: string, buttonData: ButtonDefinition) {
    if (buttonData.action === 'modal') {
      await this.executeButtonModal(buttonElement, buttonData);
      return;
    }
    if (buttonData.action === 'menu' || buttonData.action === 'collapseChildMenu') {
      this.executeButtonMenu(buttonElement, buttonData);
    }
  }

  bindButton(buttonElement: string, buttonData: ButtonDefinition) {
    const cb = async () => {
      await this.executeButton(buttonElement, buttonData);
    };
    this.eventSource.domClick(buttonElement, cb);
  }
  createCollapsibleButtonGroups(selector: string | HTMLElement) {
    let containerClass: string = '';
    // Now all the button elements have been bound.  Join child and parent buttons
    // For all the children of a button group, add it to the parent group
    this.collapseChildren.forEach((b) => {
      containerClass = 'ribbonButtonContainer';
      if (b.action === 'collapseGrandchild') {
        containerClass = 'ribbonButtonContainerMore';
      }
      const buttonHtml = RibbonButtons.ribbonButtonHtml(
        containerClass, b.id, b.classes, b.leftText, b.icon, b.rightText);
      if (b.dataElements) {
        const bkeys = Object.keys(b.dataElements);
        bkeys.forEach((bkey) => {
          var de = b.dataElements[bkey];
          $(buttonHtml).find('button').attr('data-' + bkey, de);
        });
      }
      // Bind the child button actions
      const parent = $(selector).find('.collapseContainer[data-group="' + b.group + '"]');
      $(parent).append(buttonHtml);
      const el = $(selector).find('#' + b.id);
      this.bindButton(el, b);
    });

    this.collapsables.forEach((cb) => {
      // Bind the events of the parent button
      cb.bind();
    });
  }
  _createSidebarButtonGroups(selector: string | HTMLElement) {
    let containerClass: string = '';
    // Now all the button elements have been bound.  Join child and parent buttons
    // For all the children of a button group, add it to the parent group
    this.collapseChildren.forEach((b) => {
      containerClass = 'ribbonButtonContainer';
      if (b.action === 'collapseGrandchild') {
        containerClass = 'ribbonButtonContainerMore';
      }
      const buttonHtml = RibbonButtons.ribbonButtonHtml(
        containerClass, b.id, b.classes, b.leftText, b.icon, b.rightText);
      if (b.dataElements) {
        const bkeys = Object.keys(b.dataElements);
        bkeys.forEach((bkey) => {
          var de = b.dataElements[bkey];
          $(buttonHtml).find('button').attr('data-' + bkey, de);
        });
      }
      // Bind the child button actions
      const parent = $(selector).find('.collapseContainer[data-group="' + b.group + '"]');
      $(parent).append(buttonHtml);
      const el = $(selector).find('#' + b.id);
      this.bindButton(el, b);
    });

    this.collapsables.forEach((cb) => {
      // Bind the events of the parent button
      cb.bind();
    });
  }
  static isCollapsible(action: ButtonAction) {
    return ['collapseChild', 'collapseChildMenu', 'collapseGrandchild', 'collapseMore'].indexOf(action) >= 0;
  }

  // ### _createButtonHtml
  // For each button, create the html and bind the events based on
  // the button's configured action.
  createRibbonHtml(buttonAr: string[], selector: string | HTMLElement) {
    const dataArray: ButtonDefinition[] = reactive([]);
    const buttonCallback = async (button: ButtonDefinition) => {
      return await this.executeQuickButton(button);
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
    const executeButton = async (buttonData: ButtonDefinition) => {
      await this.executeButton(buttonData.id, buttonData);
    };    
    buttonAr.forEach((buttonId) => {
      const buttonData = this.ribbonButtons.find((e) =>
        e.id === buttonId
      );
      if (buttonData) {
        buttonData.callback = executeButton;
        buttonData.icon += ' menu-icon';
        buttonList.push(buttonData);
        /* if (buttonData.leftText) {
          RibbonButtons.translateButtons.push({ buttonId: buttonData.id, buttonText: buttonData.leftText });
        }
        // collapse child is hidden until the parent button is selected, exposing the button group
        if (RibbonButtons.isCollapsible(buttonData.action)) {
          this.collapseChildren.push(buttonData);
        }
        if (buttonData.action !== 'collapseChild') {
          // else the button has a specific action, such as a menu or dialog, or a parent button
          // for translation, add the menu name to the button class
          buttonClass = buttonData.classes;
          if (buttonData.action === 'menu' || buttonData.action === 'modal') {
            buttonClass += ' ' + buttonData.ctor;
          }
          const buttonHtml = RibbonButtons.menuButtonHtml(
            buttonData.id, buttonClass, buttonData.leftText, buttonData.icon, buttonData.rightText);
          $(buttonHtml).attr('data-group', buttonData.group);
          $(selector).append(buttonHtml);
          const buttonElement = $('#' + buttonData.id);
          // If this is a collabsable button, create it, otherwise bind its execute function.
          if (buttonData.action === 'collapseParent') {
            $(buttonHtml).addClass('collapseContainer');
            // collapseParent
            this.collapsables.push(new CollapseRibbonControl({
              ctor: buttonData.ctor,
              buttons: this.ribbonButtons,
              view: this.view,
              menus: this.menus,
              eventSource: this.eventSource,
              completeNotifier: this.controller,
              buttonId: buttonData.id,
              buttonElement,
              buttonData
            }));
          } else {
            const cb = async () => {
              await this.executeButton(buttonElement, buttonData);
            };
            this.eventSource.domClick(buttonElement, cb);
          }
        }*/
      }
    });
    createApp(ribbonSidebarApp as any, { buttonProps: buttonList, domId: selector instanceof HTMLElement ? selector.id : selector }).mount(selector);
  }
  createRibbon(buttonDataArray: string[], parentElement: string | HTMLElement) {
    this.createRibbonHtml(buttonDataArray, parentElement);
    this.createCollapsibleButtonGroups(parentElement);
  }
  createSidebarRibbon(buttonDataArray: string[], parentElement: string | HTMLElement, containerClasses: string) {
    this.createSidebarMenuHtml(buttonDataArray, parentElement);
    // this._createCollapsibleButtonGroups(parentElement); needed?
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


