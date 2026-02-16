
import { SuiAudioAnimationParams } from '../audio/musicCursor';

export type scrollHandler = (ev: any) => void;
export interface SuiNavigation {
  scrollable: string | HTMLElement,
  container: string | HTMLElement | undefined,
  displayMode: string,
  initialize: () => void,
  isInitialized: () => boolean,
  pushScrollHandler: (handler: scrollHandler) => void,
  popScrollHandler: () => scrollHandler | undefined,
  showBugModal: () => void,
  hideBugModal: () => void,
  showDialogModal: () => void,
  hideDialogModal: () => void
}

/**
 * Define configurable rendering options
 * @category SuiRender
 * @module /render/sui/configuration
 */
export interface SmoRenderConfiguration {
  demonPollTime: number,
  idleRedrawTime: number,
  scoreDomContainer: string | HTMLElement,
  audioAnimation: SuiAudioAnimationParams,
  navigation: SuiNavigation
}
