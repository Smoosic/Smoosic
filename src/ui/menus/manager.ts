// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { buildDom, createTopDomContainer } from '../../common/htmlHelpers';
import { SvgBox } from '../../smo/data/common';
import { UndoBuffer } from '../../smo/xform/undo';
import { SuiBeamMenu, SuiBeamMenuOptions } from './beams';
import { layoutDebug } from '../../render/sui/layoutDebug';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiKeySignatureDialog } from '../dialogs/keySignature';
import { SuiTracker } from '../../render/sui/tracker';
import { CompleteNotifier, ModalComponent } from '../common';
import { BrowserEventSource, EventHandler } from '../eventSource';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { KeyBinding } from '../../application/common';
import { Qwerty } from '../qwerty';
import { SuiLanguageMenu } from './language';
import { SuiFileMenu } from './file';

import { SuiMenuBase, SuiMenuParams, suiMenuTranslation, 
  MenuTranslations, suiConfiguredMenuTranslate } from './menu';
import { SuiScoreMenu } from './score';
import { SuiStaffModifierMenu } from './staffModifier';
import { SuiMeasureMenu } from './measure';
import { SuiVoiceMenu } from './voices';
import { SuiNoteMenu } from './note';
import { SuiHelpMenu } from './help';
import { SuiEditMenu } from './edit';
import { SuiTextMenu } from './text';
import { SuiPartSelectionMenu } from './partSelection';
import { SuiPartMenu } from './parts';
import {SuiTupletMenu} from "./tuplets";
declare var $: any;

/**
 * @category SuiMenu
 */
export interface SuiMenuManagerParams {
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  completeNotifier: CompleteNotifier;
  undoBuffer: UndoBuffer;
  menuContainer?: HTMLElement;
}

/**
 * Handle key-binding that map to menus
 * @category SuiMenu
 */
export class SuiMenuManager {
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  completeNotifier: CompleteNotifier;
  undoBuffer: UndoBuffer;
  menuContainer: HTMLElement;
  bound: boolean = false;
  hotkeyBindings: Record<string, string> = {};
  closeMenuPromise: Promise<void> | null = null;
  menu: SuiMenuBase | null = null;
  keydownHandler: EventHandler | null = null;
  menuPosition: SvgBox = { x: 250, y: 40, width: 1, height: 1 };
  tracker: SuiTracker;
  menuBind: KeyBinding[] = SuiMenuManager.menuKeyBindingDefaults;
  debug: layoutDebug;
  constructor(params: SuiMenuManagerParams) {
    this.eventSource = params.eventSource;
    this.debug = params.view.debug;
    this.view = params.view;
    this.bound = false;    
    this.menuContainer = params.menuContainer ?? createTopDomContainer('.menuContainer');
    this.completeNotifier = params.completeNotifier;
    this.undoBuffer = params.undoBuffer;
    this.tracker = params.view.tracker;
  }

  static get defaults() {
    return {
      menuBind: SuiMenuManager.menuKeyBindingDefaults,
      menuContainer: '.menuContainer'
    };
  }

  get closeModalPromise() {
    return this.closeMenuPromise;
  }

  setController(c: CompleteNotifier) {
    this.completeNotifier = c;
  }

  get score() {
    return this.view.score;
  }

  // ### Description:
  // slash ('/') menu key bindings.  The slash key followed by another key brings up
  // a menu.
  static get menuKeyBindingDefaults(): KeyBinding[] {
    return [
      {
        event: 'keydown',
        key: 'p',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiPartMenu'
      }, {
        event: 'keydown',
        key: 'l',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiStaffModifierMenu'
      }, {
        event: 'keydown',
        key: 'd',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiDynamicsMenu'
      }, {
        event: 'keydown',
        key: 'f',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiFileMenu'
      }, {
        event: 'keydown',
        key: 'm',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiTimeSignatureMenu'
      }, {
        event: 'keydown',
        key: 'a',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiMeasureMenu'
      },  {
        event: 'partSelection',
        key: '',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiPartSelectionMenu'
      }
    ];
  }
  get optionElements() {
    return $('.menuContainer ul.menuElement li.menuOption');
  }
  _advanceSelection(inc: number) {
    if (!this.menu) {
      return;
    }
    const options = this.optionElements;
    inc = inc < 0 ? options.length - 1 : 1;
    this.menu.focusIndex = (this.menu.focusIndex + inc) % options.length;
    $(options[this.menu.focusIndex]).find('a').trigger('focus');
  }

  unattach() {
    if (!this.keydownHandler) {
      return;
    }
    this.eventSource.unbindKeydownHandler(this.keydownHandler);
    $('body').removeClass('modal');
    $(this.menuContainer).html('');
    $('body').off('dismissMenu');
    this.bound = false;
    this.menu = null;
  }

  attach() {
    if (!this.menu) {
      return;
    }
    let hotkey = 0;

    $(this.menuContainer).html('');
    $(this.menuContainer).attr('z-index', '12');
    const b = buildDom;
    const r = b('ul').classes('menuElement dropdown-menu rounded-3 shadow w-220px show').attr('size', this.menu.menuItems.length.toString())
       .attr('role', 'menu')
      .css('left', '' + this.menuPosition.x + 'px')
      .css('top', '' + this.menuPosition.y + 'px');
    this.menu.menuItems.forEach((item) => {
      var vkey = (hotkey < 10) ? String.fromCharCode(48 + hotkey) :
        String.fromCharCode(87 + hotkey);

      r.append(
        b('li').classes('menuOption').append(
          b('a').attr('data-value', item.value).attr('href','#')
            .attr('role', 'menuItem').classes('dropdown-item').append(
            b('span').classes('menuText').text(item.text))
            .append(b('span').classes('icon icon-' + item.icon))
            .append(b('span').classes('menu-key').text('' + vkey))));
      item.hotkey = vkey;
      hotkey += 1;
    });
    $(this.menuContainer).append(r.dom());
    $('body').addClass('modal');
    this.bindEvents();
  }

  captureMenuEvents(completeNotifier: CompleteNotifier) {
    var self = this;
    if (this.closeMenuPromise) {
      console.log('menu already open, skipping');
      return;
    }
    this.bindEvents();
    this.debug.addDialogDebug('slash menu creating closeMenuPromise');
    // A menu asserts this event when it is done.
    this.closeMenuPromise = new Promise((resolve) => {
      $('body').off('menuDismiss').on('menuDismiss', () => {
        this.debug.addDialogDebug('menuDismiss received, resolve closeMenuPromise');
        self.unattach();
        $('body').removeClass('slash-menu d-block');
        self.closeMenuPromise = null;
        resolve();
      });
    });
    // take over the keyboard
    if (this.closeModalPromise) {
      completeNotifier.unbindKeyboardForModal(this as ModalComponent);
    }
  }

  dismiss() {
    $('body').trigger('menuDismiss');
  }
  displayMenu(menu: SuiMenuBase | null) {
    this.menu = menu;
    if (!this.menu) {
      return;
    }
    this.menu.preAttach();
    this.attach();
    this.menu!.menuItems.forEach((item) => {
      if (typeof(item.hotkey) !== 'undefined') {
        this.hotkeyBindings[item.hotkey] = item.value;
      }
    });
    setTimeout(() => {
      const options = this.optionElements;
      if (options.length > 0) {
        $(options[options.length - 1]).find('a').trigger('focus');
      }  
    }, 1);
  }

  createMenu(action: string, notifier: CompleteNotifier) {
    this.captureMenuEvents(notifier);
    if (!this.completeNotifier) {
      return;
    }
    this.menuPosition = { x: 250, y: 40, width: 1, height: 1 };
    // If we were called from the ribbon, we notify the controller that we are
    // taking over the keyboard.  If this was a key-based command we already did.
    this.debug.addDialogDebug('createMenu creating ' + action);

    const params: SuiMenuParams = 
    {
      tracker: this.tracker,
      score: this.score,
      completeNotifier: this.completeNotifier,
      closePromise: this.closeMenuPromise,
      view: this.view,
      eventSource: this.eventSource,
      undoBuffer: this.undoBuffer,
      ctor: action
    };
    if (action === 'SuiHelpMenu') {
      this.displayMenu(new SuiHelpMenu(params));
    } else if (action === 'SuiLanguageMenu') {
      this.displayMenu(new SuiLanguageMenu(params));
    } else if (action === 'SuiFileMenu') {
      this.displayMenu(new SuiFileMenu(params));
    } else if (action === 'SuiEditMenu') {
      this.displayMenu(new SuiEditMenu(params));
    } else if (action === 'SuiScoreMenu') {
      this.displayMenu(new SuiScoreMenu(params));
    } else if (action === 'SuiPartSelectionMenu') {
      this.displayMenu(new SuiPartSelectionMenu(params));
    } else if (action === 'SuiPartMenu') {
      this.displayMenu(new SuiPartMenu(params));
    } else if (action === 'SuiStaffModifierMenu') {
      this.displayMenu(new SuiStaffModifierMenu(params));
    } else if (action === 'SuiMeasureMenu') {
      this.displayMenu(new SuiMeasureMenu(params));
    } else if (action === 'SuiVoiceMenu') {
      this.displayMenu(new SuiVoiceMenu(params));
    } else if (action === 'SuiBeamMenu') {
      this.displayMenu(new SuiBeamMenu(params));
    } else if (action === 'SuiTupletMenu') {
      this.displayMenu(new SuiTupletMenu(params));
    } else if (action === 'SuiNoteMenu') {
      this.displayMenu(new SuiNoteMenu(params));
    } else if (action === 'SuiTextMenu') {
      this.displayMenu(new SuiTextMenu(params));
    }
  }
  // ### evKey
  // We have taken over menu commands from controller.  If there is a menu active, send the key
  // to it.  If there is not, see if the keystroke creates one.  If neither, dismissi the menu.
  evKey(event: any) {
    Qwerty.handleKeyEvent(event);
    if (['Tab', 'Enter'].indexOf(event.code) >= 0) {
      return;
    }
    event.preventDefault();
    if (event.code === 'Escape') {
      this.dismiss();
    }
    if (this.menu) {
      if (event.code === 'ArrowUp') {
        this._advanceSelection(-1);
      } else if (event.code === 'ArrowDown') {
        this._advanceSelection(1);
      } else  if (this.hotkeyBindings[event.key]) {
        $('a[data-value="' + this.hotkeyBindings[event.key] + '"]').click();
      } else {
        this.menu.keydown();
      }
      return;
    }
    const binding = this.menuBind.find((ev) =>
      ev.key === event.key
    );
    if (!binding) {
      // TODO: find a better place for the slash menus
      if (event.key === 'k') {
        createAndDisplayDialog(SuiKeySignatureDialog, {
          view: this.view,
          completeNotifier: this.completeNotifier,
          startPromise: null,
          eventSource: this.eventSource,
          tracker: this.view.tracker,
          ctor: 'SuiKeySignatureDialog',
          id: 'key-signature-dialog',
          modifier: null
        });
      }
      this.dismiss();
      return;
    }
    // this.createMenu(binding.action);
  }

  bindEvents() {
    this.hotkeyBindings = { };
    $('body').addClass('slash-menu d-block');
    // We need to keep track of is bound, b/c the menu can be created from
    // different sources.
    if (!this.bound) {
      const evkey = async (ev: any) => { this.evKey(ev); }
      this.keydownHandler = this.eventSource.bindKeydownHandler(evkey);
      this.bound = true;
    }
    $(this.menuContainer).find('a.dropdown-item').off('click').on('click', async (ev: any) => {
      if ($(ev.currentTarget).attr('data-value') === 'cancel') {
        this.menu!.complete();
        return;
      }
      await this.menu!.selection(ev);
    });
  }
}
export const menuTranslationsInit = () => {  
  MenuTranslations.push(suiConfiguredMenuTranslate(SuiBeamMenuOptions, 'Beam', 'SuiBeamMenu'));
}



