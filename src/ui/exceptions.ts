// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { buildDom, createTopDomContainer } from '../common/htmlHelpers';
import { SuiEventHandler } from '../application/eventHandler';
import { SuiScoreView } from '../render/sui/scoreView';
import { ExceptionParameters } from './common';
import crashApp from './components/crash.vue';
import { replaceVueRoot } from './common';
import { SuiNavigation} from '../render/sui/configuration';

import { createApp } from 'vue';
declare var $: any;

/**
 * @internal
 */
export class SuiExceptionHandler {
  view: SuiScoreView;
  navigation: SuiNavigation;
  thrown: boolean;
  static _instance: SuiExceptionHandler;
  constructor(params: ExceptionParameters) {
    this.view = params.view;
    this.navigation = params.navigation;
    this.thrown = false;
    SuiExceptionHandler._instance = this;
  }
  static get instance() {
    return SuiExceptionHandler._instance;
  }
  exceptionHandler(e: any) {
    let stack = '';
    let doing = '';
    let scoreString = '';
    $('body').removeClass('showVueDialog');  // make sure the user can reach the bug report
    if (this.thrown) {
      return;
    }
    this.thrown = true;
    if (SuiEventHandler.reentry) {
      return;
    }

    SuiEventHandler.reentry = true;
    scoreString = 'Could not serialize score.';
    try {
      scoreString = JSON.stringify(this.view.score.serialize(), null, ' ');
    } catch (e: any) {
      if (e.message) {
        scoreString += ' ' + e.message;
      }
    }
    const message = e.message;
    stack = 'No stack trace available';

    try {
      if (e.error && e.error.stack) {
        stack = e.error.stack;
      } else if (e.stack) {
        stack = e.stack;
      }
    } catch (e2: any) {
      stack = 'Error with stack: ' + e2.message;
    }
    doing = 'Last operation not available.';
    const bodyObject = JSON.stringify({
      message,
      stack,
      lastOperation: doing,
      scoreString
    }, null, ' ');
  this.navigation.displayExceptionDialog(bodyObject);
/*
    createTopDomContainer('.bugDialog');
    const b = buildDom;
    const r = b('div').classes('bug-modal').append(
      b('img').attr('src', '../styles/images/logo.png').classes('bug-logo'))
      .append(b('button').classes('icon icon-cross bug-dismiss-button'))
      .append(b('span').classes('bug-title').text('oh nooooo!  You\'ve found a bug'))
      .append(b('p').text('It would be helpful if you would submit a bug report, and copy the data below into an issue'))
      .append(b('div')
        .append(b('textarea').attr('id', 'bug-text-area').text(bodyObject))
        .append(
          b('div').classes('button-container').append(b('button').classes('bug-submit-button').text('Submit Report'))));

    $('.bugDialog').html('');
    $('.bugDialog').append(r.dom());

    // used to try to restore the last good score here...
    $('.bug-dismiss-button').off('click').on('click', () => {
      $('body').removeClass('bugReport');
    });
    $('.bug-submit-button').off('click').on('click', () => {
      $('#bug-text-area').select();
      document.execCommand('copy');
      window.open(url, 'Report Smoosic issues');
    });
    $('body').addClass('bugReport');
    if (!this.thrown) {
      this.thrown = true;
      throw (e);
    }
      */
  }
}
