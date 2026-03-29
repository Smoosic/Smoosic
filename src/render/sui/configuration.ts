
import { SuiAudioAnimationParams } from '../audio/musicCursor';
/**
 * An application can use attach the scroll container to the scroll handler to get scroll events.
 */
export type scrollHandler = (ev: any) => void;
export type debugFlag = 'mouse' | 'drag' | 'scroll';
export type debugFlags = ['mouse', 'drag', 'scroll'];
/**
 * Base class for score DOM navigation.
 * 
 * - scrollContainer is the container that scrolls and contains the score
 * - outerContainer is the container for the entire UI, including menus, controls, and the scroll container.
 *   in library mode, outerContainer is just the container for the score.
 * - scoreContainer is inside the scrollContainer.  It contains the container div and svg for the score pages
 * - displayMode is a string that can be used to switch between different display modes (e.g. vertical, horizontal)
 * - initialize is called by the application to create the DOM
 * - isInitialized is a sanity check, if you try to use the DOM and it is not initialized it will throw an error
 * - pushScrollHandler and popScrollHandler are used to manage scroll handlers for the scroll container.  The most recently added handler will be called on scroll events.
 * - showSplashModal and hideSplashModal are used to show and hide the 'about' dialog
 * - showDialogModal and hideDialogModal do you you'd expect, they are called as part of the dialog management functions
 * - showDebugString is used to set and display debug flags.  Calling with an empty string hides the debug region.
 * @category SuiRender
 */
export interface SuiNavigation {
  scrollContainer:  HTMLElement,
  outerContainer: string | HTMLElement | undefined,
  scoreContainer: HTMLElement,
  displayMode: string,
  initialize: () => void,
  isInitialized: () => boolean,
  pushScrollHandler: (handler: scrollHandler) => void,
  popScrollHandler: () => scrollHandler | undefined,
  showSplashModal: (timer: number) => void,
  showProgressModal: (label: string) => void,
  showHelpModal: () => void,
  setProgress: (percent: number) => void,
  hideProgressModal: () => void,
  showDialogModal: () => void,
  hideDialogModal: () => void,
  displayExceptionDialog: (message: string) => void,
  showDebugString: (flag: debugFlag, htmlString: string) => void
}

/**
 * Define configurable rendering options
 * @category SuiRender
 * @module /render/sui/configuration
 */
export interface SmoRenderConfiguration {
  demonPollTime: number,
  idleRedrawTime: number,
  audioAnimation: SuiAudioAnimationParams,
  navigation: SuiNavigation
}
