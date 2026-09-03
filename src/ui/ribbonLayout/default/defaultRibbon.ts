// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.

import { ButtonDefinition } from "../../buttons/button";
import { RibbonLayout } from "../../common";

/**
 * @internal
 */
export class defaultRibbonLayout {
  static get ribbons(): RibbonLayout {
    var left = defaultRibbonLayout.leftRibbonIds;
    var top = defaultRibbonLayout.displayIds;

    return {
      left: left,
      top: top
    };
  }

  static get ribbonButtons(): ButtonDefinition[] {
    return defaultRibbonLayout.leftRibbonButtons.concat(defaultRibbonLayout.displayButtons).concat(defaultRibbonLayout.debugRibbonButtons);
  }

  static get leftRibbonIds() {
    return ['helpDialog', 'languageMenu', 'fileMenu', 'editMenu',
    'scoreMenu', 'partMenu', 'staffModifierMenu', 'measureModal', 'voiceMenu', 'beamMenu',
    'tupletMenu', 'noteMenu', 'textMenu', 'libraryMenu',
    ];
  }
  static get debugIds() {
    return ['DebugGroup', 'DebugButton2'];
  }
  static get displayIds() {
    return ['selectPart', 'setView','refresh', 'zoomout', 'zoomin', 'playButton2', 'stopButton2', 'keySignature', 'ribbonTempo', 'ribbonTime'];
  }
  static get displayButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: 'Select Part',
      classes: 'drop-down',
      icon: 'icon-smo icon-circle-down menu-icon',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'selectPart'
    },  {
      leftText: 'View',
      rightText: '',
      classes: 'icon',
      icon: 'icon-smo icon-eye menu-icon fs-3',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'setView'
    }, {
      leftText: 'Refresh',
      rightText: '',
      classes: 'icon refresh-button',
      icon: 'icon-smo icon-refresh menu-icon',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'refresh'
    }, {
      leftText: 'Zoom In',
      rightText: '',
      classes: 'icon',
      icon: 'icon-smo icon-zoomplus menu-icon',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'zoomout'
    }, {
      leftText: 'Zoom Out',
      rightText: '',
      classes: 'icon',
      icon: 'icon-smo icon-zoomminus menu-icon',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'zoomin'
    }, {
      leftText: 'Play',
      rightText: '',
      classes: 'icon',
      icon: 'icon-smo icon-play3 menu-icon',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'playButton2'
    }, {
      leftText: 'Stop',
      rightText: '',
      classes: 'icon',
      icon: 'icon-smo icon-stop2 menu-icon',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'stopButton2'
    }, {
      leftText: 'Key',
      rightText: '',
      classes: 'text-icon',
      icon: 'icon-smo icon-key-sig-b menu-icon',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'keySignature'
    },  {
      leftText: 'Tempo',
      rightText: '',
      classes: 'text-icon',
      icon: 'icon-smo icon-metronome4 menu-icon',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'ribbonTempo'
    },  {
      leftText: 'Time',
      rightText: '',
      classes: 'text-icon',
      icon: 'icon-bravura icon-timeSigCommon menu-icon',
      action: 'collapseChild',
      ctor: 'DisplaySettings',
      group: 'quickButtons',
      id: 'ribbonTime'
    }
    ];
  }

  static get debugRibbonButtons(): ButtonDefinition[] {
    return [{
      leftText: '',
      rightText: '',
      classes: 'icon  collapseParent',
      icon: 'icon-new-tab',
      action: 'collapseParent',
      ctor: 'CollapseRibbonControl',
      group: 'debug',
      id: 'DebugGroup'
    }, {
      leftText: '',
      rightText: '',
      classes: 'icon  collapsed',
      icon: 'icon-new-tab',
      action: 'collapseChild',
      ctor: 'DebugButtons',
      group: 'debug',
      id: 'DebugButton2'
    }];
  }
 
  static get leftRibbonButtons(): ButtonDefinition[] {
    return [{
      icon: 'help ',
      leftText: 'Help',
      rightText: '?',
      classes: 'mi',
      action: 'menu',
      ctor: 'SuiHelpMenu',
      group: 'scoreEdit',
      id: 'helpDialog'
    }, {
      leftText: 'Language',
      rightText: 'Alt-u',
      icon: 'language',
      hotKey: 'u',
      classes: 'mi',
      action: 'menu',
      ctor: 'SuiLanguageMenu',
      group: 'scoreEdit',
      id: 'languageMenu'
    }, {
      leftText: 'Edit',
      rightText: 'Alt-e',
      hotKey: 'e',
      icon: 'undo',
      classes: 'mi',
      action: 'menu',
      ctor: 'SuiEditMenu',
      group: 'scoreEdit',
      id: 'editMenu'
    }, {
      leftText: 'File',
      rightText: 'Alt-f',
      hotKey: 'f',
      icon: 'description',
      classes: 'mi',
      action: 'menu',
      ctor: 'SuiFileMenu',
      group: 'scoreEdit',
      id: 'fileMenu'
    },  {
      leftText: 'Score',
      rightText: 'Alt-s',
      hotKey: 's',
      icon: '',
      classes: 'bv bv-gclef oversize',
      action: 'menu',
      ctor: 'SuiScoreMenu',
      group: 'scoreEdit',
      id: 'scoreMenu'
    },
    {
      leftText: 'Parts',
      rightText: 'Alt-p',
      hotKey: 'p',
      icon: 'list_alt',
      classes: 'mi',
      action: 'menu',
      ctor: 'SuiPartMenu',
      group: 'scoreEdit',
      id: 'partMenu'
    }, {
      leftText: 'Lines',
      rightText: 'Alt-l',
      hotKey: 'l',
      icon: '',
      classes: 'icon icon-ending',
      action: 'menu',
      ctor: 'SuiStaffModifierMenu',
      group: 'scoreEdit',
      id: 'staffModifierMenu'
    }, {
      leftText: 'Measure',
      rightText: 'Alt-m',
      hotKey: 'm',
      icon: '',
      classes: 'icon icon-single_bar ',
      action: 'menu',
      ctor: 'SuiMeasureMenu',
      group: 'scoreEdit',
      id: 'measureModal'
    }, {
      leftText: 'Voices',
      rightText: 'Alt-v',
      hotKey: 'v',
      icon: 'layers',
      classes: 'mi',
      action: 'menu',
      ctor: 'SuiVoiceMenu',
      group: 'scoreEdit',
      id: 'voiceMenu'
    }, {
      leftText: 'Beams',
      rightText: 'Alt-b',
      hotKey: 'b',
      icon: '',
      classes: 'icon icon-beamBreak',
      action: 'menu',
      ctor: 'SuiBeamMenu',
      group: 'scoreEdit',
      id: 'beamMenu'
    }, {
      leftText: 'Tuplets',
      rightText: 'Alt-t',
      hotKey: 't',
      icon: '',
      classes: 'bv bv-num3',
      action: 'menu',
      ctor: 'SuiTupletMenu',
      group: 'scoreEdit',
      id: 'tupletMenu'
    }, {
      leftText: 'Notes',
      rightText: 'Alt-n',
      hotKey: 'n',
      icon: '',
      classes: 'bv bv-quarter',
      action: 'menu',
      ctor: 'SuiNoteMenu',
      group: 'scoreEdit',
      id: 'noteMenu'
    },
    {
      leftText: 'Text',
      rightText: 'Alt-x',
      hotKey: 'x',
      icon: 'titles',
      classes: 'mi',
      action: 'menu',
      ctor: 'SuiTextMenu',
      group: 'scoreEdit',
      id: 'textMenu'
    }, {
      leftText: 'Library',
      rightText: 'Alt-y',
      hotKey: 'y',
      icon: 'library_music',
      classes: 'mi',
      action: 'modal',
      ctor: 'SuiLibraryDialog',
      group: 'scoreEdit',
      id: 'libraryMenu'
    },
    ];
  }
}
