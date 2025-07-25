// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SvgHelpers } from '../../render/sui/svgHelpers';
import { buildDom, InputTrapper, draggable, createTopDomContainer } from '../../common/htmlHelpers';
// import { SmoTranslator } from '../i18n/language';
import { SmoModifier } from '../../smo/data/score';
import { SvgBox } from '../../smo/data/common';
import { SuiTracker } from '../../render/sui/tracker';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { CompleteNotifier } from '../common';
import { BrowserEventSource } from '../eventSource';
import { UndoBuffer } from '../../smo/xform/undo';
import { SuiDialogNotifier, DialogDefinitionElement, 
  SuiComponentBase, DialogDefinitionOption, SuiBaseComponentParams, SmoDynamicComponentCtor } from './components/baseComponent';
import { SuiScroller } from '../../render/sui/scroller';
import { SmoNote } from '../../smo/data/note';
import { EventHandler } from '../eventSource';
import { SmoUiConfiguration } from '../configuration';
import { PromiseHelpers } from '../../common/promiseHelpers';

declare var $: any;
/**
 * The JSON dialog template is a declaritive structore for the html of the dialog
 * and components.  
 * @param label for the dialog itself
 * @param elements a series of elements that define the component
 * @param staticText a hash of text for the dialog and components to use
 * @category SuiDialog
 */
export interface DialogDefinition {
  label: string,
  elements: DialogDefinitionElement[],
  staticText: Record<string, string>[]
}
/**
 * A translation of the labels in DialogDefintionElement
 * @param label the component label
 * @param id used as a key in translation tool
 * @param options options for dropdown and other array components
 * @category SuiDialog
 */
export interface DialogTranslationElement {
  label: string,
  id: string,
  options?: DialogDefinitionOption[]
}
/**
 * A translation of all the strings in the dialog itself, used 
 * when switching languages.
 * @param ctor the constructor for the dialog class, used to call static methods
 * @param label the translated label
 * @param dialogElements the translated component json
 * @param staticText translated misc text 
 * @category SuiDialog
 */
export interface DialogTranslation {
  ctor: string,
  label: string,
  dialogElements: DialogTranslationElement[],
  staticText: Record<string, string>
}

export const DialogTranslations: DialogTranslation[] = [];

/**
 * Dialog params always contain basic information about the runtime
 * for modal functionality
 * @param ctor dialog constructor
 * @param id DOM id for the dialog
 * @param tracker to get and set selections
 * @param completeNotifier used to take over key/mouse control
 * @param startPromise used if this is called from another modal element
 * @param view the MVVM object to change the score
 * @param eventSource event source to register for additional events like mouseup
 * @param undoBuffer used to create undo
 * @category SuiDialog
 */
export interface SuiDialogParams {
  ctor: string,
  id: string,
  tracker: SuiTracker,
  completeNotifier: CompleteNotifier,
  startPromise: Promise<void> | null
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  // definition: DialogDefinition,
  modifier?: any,
  config?: SmoUiConfiguration
}

/**
 * internal interface used to create the DOM
 * @internal
 */
export interface SuiDomParams {
  id: string,
  top: number,
  left: number,
  label: string
}
/**
 * DOM interface for the dialog
 * @internal
 * @param element parent element
 * @param trapper used to trap focus events for the dialog
 */
export interface DialogDom {
  element: any,
  trapper: any
}
export const suiDialogTranslate = (dialog: DialogDefinition, ctor: string): DialogTranslation => {
  const elements: DialogDefinitionElement[] = dialog.elements;
  const output: DialogTranslationElement[] = [];
  elements.forEach((element: DialogDefinitionElement) => {
    const component: Partial<DialogTranslationElement> = {};
    if (element.label) {
      component.label = element.label ?? '';
      component.id = element.smoName;
      if (element.options) {
        component.options = [];

        element.options.forEach((option) => {
          component.options!.push({ value: option.value, label: option.label, css: option.css });
        });
      }
      output.push(component as DialogTranslationElement);
    }
  });
  // convert static text from an array of name/value pairs to a record for translation
  const staticText: Record<string, string> = {};
  const dialogStaticText: Record<string, string>[] = dialog.staticText;
  if (dialogStaticText) {
    dialogStaticText.forEach((st) => {
      const key = Object.keys(st)[0];
      staticText[key]  = st[key];
    });
  }
  return { ctor, label: dialog.label, dialogElements: output, staticText };
}
/**
 * Note: Most dialogs will inherit from SuiDialogAdapter, not SuiDialogBase.
 * You will only want to inherit from SuiDialogBase under 2 conditions:
 * 1. the dialog is triviailly simple, like an alert box that makes no changes to the score, or
 * 2. the dialog is extremely complicated in how it interacts with the user, such that a form-based approach won't work
 * @category SuiDialog
 */
 export abstract class SuiDialogBase extends SuiDialogNotifier {
  static get displayOptions(): Record<string, string> {
    return {
      BINDCOMPONENTS: 'bindComponents', DRAGGABLE: 'makeDraggable',
      KEYBOARD_CAPTURE: 'captureKeyboardPromise', GLOBALPOS: 'positionGlobally',
      SELECTIONPOS: 'positionFromSelection', MODIFIERPOS: 'positionFromModifier',
      HIDEREMOVE: 'hideRemoveButton'
    };
  }  

  static getStaticText(staticText: Record<string, string>[]) {
    const rv: Record<string, string> = {};
    staticText.forEach((st) => {
      const key = Object.keys(st)[0];
      rv[key] = st[key];
    });
    return rv;
  }
  id: string;
  ctor: string;
  boundKeyboard: boolean;
  components: SuiComponentBase[] = [];
  boundComponents: SuiComponentBase[] = [];
  cmap: Record<string, SuiComponentBase> = {};
  scroller: SuiScroller;
  closeDialogPromise: Promise<void>;
  label: string;
  staticText: Record<string, string>[] = [];
  startPromise: Promise<void> | null;
  dialogElements: DialogDefinition;
  eventSource: BrowserEventSource;
  view: SuiScoreViewOperations;
  completeNotifier: CompleteNotifier;
  modifier: any;
  dgDom: DialogDom;
  displayOptions: string[] = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS', 'HIDEREMOVE'];
  keydownHandler: EventHandler | null = null;
  // ### SuiDialogBase ctor
  // Creates the DOM element for the dialog and gets some initial elements
  constructor(dialogElements: DialogDefinition, parameters: SuiDialogParams) {
    super();
    this.id = parameters.id;
    this.boundKeyboard = false;
    this.scroller = parameters.view.tracker.scroller;
    this.label = dialogElements.label;
    this.eventSource = parameters.eventSource;
    this.view = parameters.view;
    this.completeNotifier = parameters.completeNotifier;
    this.modifier = parameters.modifier;
    this.ctor = parameters.ctor;

    this.closeDialogPromise = new Promise<void>((resolve) => {
      $('body').off('dialogDismiss').on('dialogDismiss', () => {
        resolve();
      });
    });
    this.staticText = dialogElements.staticText;

    // If this dialog was spawned by a menu, wait for the menu to dismiss
    // before continuing.
    // this.startPromise = parameters.closeMenuPromise;
    this.startPromise = parameters.startPromise;

    this.dialogElements = dialogElements;

    const left = $('.musicRelief').offset().left + $('.musicRelief').width() / 2;
    const top = $('.musicRelief').offset().top + $('.musicRelief').height() / 2;

    this.dgDom = this._constructDialog(dialogElements, {
      id: 'dialog-' + this.id,
      top,
      left,
      label: this.label
    });

    // SmoTranslator.registerDialog(this.ctor);
  }
    // ### display
  // make3 the modal visible.  bind events and elements.
  display() {
    $('body').addClass('showAttributeDialog');
    this.bindComponents();
    this.bindElements();
    this.applyDisplayOptions();
    this.initialValue();
  }

    // ### bindElements
  // bing the generic controls in most dialogs.
  bindElements() {
    var dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.commit();
      this.complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      if (this.modifier) {
        this.modifier.cancel();
      }
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });
  }
  bindComponents() {
    this.components.forEach((component) => {
      component.bind();
    });
  }
  initialValue(){
    if (this.modifier === null) {
      return;
    }
    this.boundComponents.forEach((comp) => {
      (comp as any).setValue((this.modifier as any)[comp.smoName]);
    });
  }
  changed() {
    if (this.modifier === null) {
      return;
    }
    this.boundComponents.forEach((comp) => {
      if (comp.changeFlag) {
        (this.modifier as any)[comp.smoName] = (comp as any).getValue();
      }
    });
  }
  getId(): string {
    return this.id;
  }
  getModifier() : SmoModifier | null {
    return this.modifier ?? null;
  }
  getEventSource() {
    return this.eventSource;
  }
  getStaticText() {
    return SuiDialogBase.getStaticText(this.staticText);
  }
  async commit(): Promise<any> {
    return PromiseHelpers.emptyPromise();
  }
  get closeModalPromise(): Promise<any> {
    return this.closeDialogPromise;
  }
  // ### position
  // For dialogs based on selections, tries to place the dialog near the selection and also
  // to scroll so the dialog is in view
  static position(box: SvgBox, dgDom: DialogDom, scroller: SuiScroller) {
    let y = (box.y + box.height) - scroller.netScroll.y;
    let x = 0;

    // TODO: adjust if db is clipped by the browser.
    const dge = $(dgDom.element).find('.attributeModal');
    const dgeHeight: number = $(dge).height();
    const maxY: number = $('.musicRelief').height();
    const maxX: number = $('.musicRelief').width();
    const offset: any = $('.dom-container').offset();
    y = y - (offset.top as number);

    const offsetY = dgeHeight + y > window.innerHeight ? (dgeHeight + y) - window.innerHeight : 0;
    y = (y < 0) ? -y : y - offsetY;

    y = (y > maxY || y < 0) ? maxY / 2 : y;

    $(dge).css('top', '' + y + 'px');

    x = box.x - scroller.netScroll.x;
    x = x - (offset.left as number);
    const w: number = $(dge).width();
    x = (x > window.innerWidth / 2) ? x - (w + 25) : x + (w + 25);

    x = (x < 0 || x > maxX) ? maxX / 2 : x;
    $(dge).css('left', '' + x + 'px');
  }
  getView() {
    return this.view;
  }
  applyDisplayOptions() {
    $('body').addClass('showAttributeDialog');
    this.displayOptions.forEach((option) => {
      (this as any)[SuiDialogBase.displayOptions[option]]();
    });
  }
  // ### position
  // Position the dialog near a selection.  If the dialog is not visible due
  // to scrolling, make sure it is visible.
  position(box: SvgBox) {
    SuiDialogBase.position(box, this.dgDom, this.view.tracker.scroller);
  }
  hideRemoveButton() {
    $(this.dgDom.element).find('.remove-button').remove();
  }
  // ### positionModifier()
  positionFromModifier() {
    if (!this.modifier || this.modifier.logicalBox === null) {
      this.positionGlobally();
      return;
    }
    const pageContext = this.view.renderer.pageMap.getRendererFromModifier(this.modifier);
    const screenBox = this.view.renderer.pageMap.svgToClient(this.modifier.logicalBox);
    this.position(screenBox);
  }
  // ### positionGlobally
  // position the dialog box in the center of the current scroll region
  positionGlobally() {
    const box = SvgHelpers.boxPoints(250, 250, 1, 1);
    SuiDialogBase.position(box, this.dgDom, this.view.tracker.scroller);
  }
  // ### postionFromSelection
  // set initial position of dialog based on first selection
  positionFromSelection() {
    const note: SmoNote | null = this.view.tracker.selections[0].note;
    if (note && note.logicalBox) {
      const screenBox = this.view.renderer.pageMap.svgToClient(note.logicalBox);
      this.position(screenBox);
    }
  }
  // ### build the html for the dialog, based on the instance-specific components.
  _constructDialog(dialogElements: DialogDefinition, parameters: SuiDomParams) {
    createTopDomContainer('.attributeDialog');
    const id = parameters.id;
    const b = buildDom;
    const r = b('div').classes('attributeModal').attr('id', 'attr-modal-' + id)
      .css('top', parameters.top + 'px').css('left', parameters.left + 'px')
      .append(b('spanb').classes('draggable button').append(b('span').classes('icon icon-move jsDbMove')))
      .append(b('h2').classes('dialog-label').text(this.label));

    var ctrl = b('div').classes('smoControlContainer');
    dialogElements.elements.filter((de) => de.control).forEach((de) => {
      const classes = de.classes ? de.classes : '';
      const compParams: SuiBaseComponentParams = {
        classes, id: id + de.smoName, ...de
      }
      try {
        const control: SuiComponentBase = SmoDynamicComponentCtor[de.control](this, compParams);
        this.components.push(control);
        this.cmap[de.smoName + 'Ctrl'] = control;
        ctrl.append(control.html);
      } catch (exp) {
        console.error('bad ctor ' + de.smoName);
        throw(exp);
      }
    });
    r.append(ctrl);
    r.append(
      b('div').classes('buttonContainer').append(
        b('button').classes('ok-button button-left btn btn-primary').text('OK')).append(
        b('button').classes('cancel-button button-center btn btn-secondary').text('Cancel')).append(
        b('button').classes('remove-button button-right btn btn-secondary').text('Remove').append(
          b('span').classes('icon icon-cancel-circle'))));
    $('.attributeDialog').html('');

    $('.attributeDialog').append(r.dom());

    const trapper = new InputTrapper('.attributeDialog');
    trapper.trap();
    $('.attributeDialog').find('.cancel-button').focus();
    return {
      element: $('.attributeDialog'),
      trapper
    };
  }
  // ### Complete
  // Dialogs take over the keyboard, so release that and trigger an event
  // that the dialog is closing that can resolve any outstanding promises.
  complete() {
    if (this.boundKeyboard && this.keydownHandler) {
      this.eventSource.unbindKeydownHandler(this.keydownHandler);
    }
    $('body').removeClass('showAttributeDialog');
    $('body').trigger('dialogDismiss');
    this.dgDom.trapper.close();
  }
  // ### makeDraggable
  // generic code to make the dialog box draggable so it doesn't
  // get in front of stuff.
  makeDraggable() {
    createTopDomContainer('.draganime');
    const cb = () => { };
    draggable({
      parent: $(this.dgDom.element).find('.attributeModal'),
      handle: $(this.dgDom.element).find('.jsDbMove'),
      animateDiv: '.draganime',
      cb,
      moveParent: true
    });
  }
  // ### captureKeyboardPromise
  // capture keyboard events until the dialog closes,
  // then give control back to the current keyboard
  async captureKeyboardPromise() {
    if (!(this.startPromise)) {
      this.completeNotifier.unbindKeyboardForModal(this);
      this.bindKeyboard();
      return;
    }
    if (this.startPromise) {
      await this.startPromise;
      this.completeNotifier.unbindKeyboardForModal(this);
      this.bindKeyboard();
    }
  }

  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  evKey(evdata: any) {
    if (evdata.key === 'Escape') {
      $(this.dgDom.element).find('.cancel-button').click();
      evdata.preventDefault();
    }
  }

  // ### bindKeyboard
  // generic logic to grab keyboard elements for modal
  bindKeyboard() {
    const evkey = async (ev: any) => {
      this.evKey(ev); 
    }
    this.boundKeyboard = true;
    this.keydownHandler = this.eventSource.bindKeydownHandler(evkey);
  }
}
/**
 * Convenience functions
 * @param type 
 * @param parameters 
 * @returns a new dialog of type T
 * @category SuiDialog
 */
export function dialogConstructor<T extends SuiDialogBase>(type: { new(parameters: SuiDialogParams): T; }, parameters: SuiDialogParams ): T {
  return new type(parameters);
}
/**
 * Convenience function to display a dialog
 * @category SuiDialog
 * @param ctor 
 * @param parameters 
 * @returns 
 */
export function createAndDisplayDialog<T extends SuiDialogBase>(ctor: new (parameters: SuiDialogParams) => T, parameters: SuiDialogParams): T {
  const instance: T = dialogConstructor<T>(ctor, parameters);
  instance.display();
  return instance;
}
