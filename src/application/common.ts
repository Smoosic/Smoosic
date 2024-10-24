import { SuiScoreViewOperations } from "../render/sui/scoreViewOperations";
import { SuiTracker } from "../render/sui/tracker";
import { CompleteNotifier } from "../ui/common";
import { ModalComponent } from "../ui/common";
import { BrowserEventSource, EventHandler } from "../ui/eventSource";

/**
 * A binding of a key to some action performed by a module
 * @category SuiApplication
 */
export interface KeyBinding {
    event: string,
    key: string,
    ctrlKey: boolean,
    altKey: boolean,
    shiftKey: boolean,
    action: string,
    module?: string
}

/**
 * parameters for the key handlers
 * @param view
 * @param slashMode indicates that the dreaded 'slash' menus are up
 * @param completeNotifier notified  when modals close
 * @param tracker
 * @param eventSource register for event handlers
 * @category SuiApplication
 */
export interface KeyCommandParams {
  view: SuiScoreViewOperations;
  slashMode: boolean;
  completeNotifier: CompleteNotifier;
  tracker: SuiTracker;
  eventSource: BrowserEventSource;
}

/**
 * Shared interface for menus, dialogs, etc that can 
 * accept UI events
 * @category SuiApplication
 */
export abstract class ModalEventHandler {
  abstract mouseMove(ev: any): void;
  abstract mouseClick(ev: any): void;
  abstract evKey(evdata: any): void;
  abstract keyUp(evdata: any): void;
}
export type handler = (ev: any) => void;

/**
 * Dependency injection, sends events to a proxy object, gets around some 
 * cyclic dependencies when bootstrapping the application.
 * @category SuiApplication
 */
export class ModalEventHandlerProxy {
  _handler: ModalEventHandler | null = null;
  eventSource: BrowserEventSource;
  unbound: boolean = true;
  keydownHandler: EventHandler | null = null;
  keyupHandler: EventHandler | null = null;
  mouseMoveHandler: EventHandler | null = null;
  mouseClickHandler: EventHandler | null = null;
  constructor(evSource: BrowserEventSource) {
    this.eventSource = evSource;
    this.bindEvents();
  }
  set handler(value: ModalEventHandler) {
    this._handler = value;
    this.unbound = false;
  }
  evKey(ev: any) {
    if (this._handler) {
      this._handler.evKey(ev);
    }
  }
  keyUp(ev: any) {
    if (this._handler) {
      this._handler.keyUp(ev);
    }
  }

  mouseMove(ev: any) {
    if (this._handler) {
      this._handler.mouseMove(ev);
    }
  }
  mouseClick(ev: any) {
    if (this._handler) {
      this._handler.mouseClick(ev);
    }
  }
  bindEvents() {
    const mousemove = async (ev: any) => { this.mouseMove(ev); }
    const mouseclick = async (ev: any) => { this.mouseClick(ev); }
    const keydown = async (ev: any) => { this.evKey(ev); }
    const keyup = async (ev: any) => { this.keyUp(ev); }
    this.mouseMoveHandler = this.eventSource.bindMouseMoveHandler(mousemove);
    this.mouseClickHandler = this.eventSource.bindMouseClickHandler(mouseclick);
    this.keydownHandler = this.eventSource.bindKeydownHandler(keydown);
    this.keyupHandler = this.eventSource.bindKeyupHandler(keyup);
  }

  unbindKeyboardForModal(dialog: ModalComponent) {
    if (this.unbound) {
      console.log('received duplicate bind event');
      return;
    }
    if (!this.keydownHandler || !this.mouseMoveHandler || !this.mouseClickHandler) {
      console.log('received bind with no handlers');
      return;
    }
    this.unbound = true;
    const rebind = () => {
      this.unbound = false;
      this.bindEvents();
    }
    this.eventSource.unbindKeydownHandler(this.keydownHandler!);
    this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler!);
    this.eventSource.unbindMouseClickHandler(this.mouseClickHandler!);
    dialog.closeModalPromise.then(rebind);
  }
}