// Smoosic relies on dynamic creation of almost everything.  This class exports all the symbols
// that need to be created via reflection.
// ui application components
// vexflow interface
import { TextFormatter } from '../common/textformatter';
import { VexFlow } from '../common/vex';
import { parseMidi } from '../common/midi-parser';
import { SuiApplication } from './application';
import { SuiEventHandler } from './eventHandler';
import { SuiExceptionHandler } from '../ui/exceptions';
import { Qwerty } from '../ui/qwerty';
import { SuiPiano } from '../render/sui/piano';
import { SuiDom } from './dom';
import { SuiHelp } from '../ui/help';
import { CollapseRibbonControl, ExtendedCollapseParent } from '../ui/buttons/collapsable';
import { DisplaySettings } from '../ui/buttons/display';
import { SmoTranslationEditor } from '../ui/i18n/translationEditor';
import { SmoConfiguration } from './configuration';
import { RibbonLayout, ModalComponent, CompleteNotifier, RibbonDefinition, replaceVueRoot } from '../ui/common';
import { RibbonButtons } from '../ui/buttons/ribbon';
import { simpleRibbonLayout } from '../ui/ribbonLayout/default/tabletRibbon';
import { ModalEventHandler } from './common';
// Language strings
import { cardKeysHtmlEn, cardNotesLetterHtmlEn, cardNotesChromaticHtmlEn, cardNotesChordsHtmlEn,
  cardNotesRestsHtmlEn, cardDurationNotesHtmlEn, cardDurationTupletsHtmlEn,
  cardSelectionsNotesHtmlEn, cardSelectionsModifiersHtmlEn, cardSelectionsNonSelectableHtmlEn, cardSelectionsSlashHtmlEn,
  cardBeamsAndStemsDirectionHtmlEn, cardBeamsAndStemsGroupingHtmlEn,
  cardMeasuresAddDeleteHtmlEn, cardVoicesCreateDeleteHtmlEn, cardPartAddDeleteHtmlEn
} from '../ui/i18n/language_en';
import { dynamicCtorInit } from './dynamicInit';
// ui dialogs and menus
// Dialogs
import { SuiDialogBase, createAndDisplayDialog } from '../ui/dialogs/dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from '../ui/dialogs/adapter';
import { SuiGraceNoteDialog } from '../ui/dialogs/gracenote';
import { SuiModifierDialogFactory } from '../ui/dialogs/factory';
import { SuiTransposeScoreDialogVue} from '../ui/dialogs/transposeScore';
import { SuiMeasureFormatDialogVue } from '../ui/dialogs/measureFormat';
import { SuiInsertMeasuresVue } from '../ui/dialogs/addMeasure';
import { SuiInstrumentDialogVue } from '../ui/dialogs/instrument';
import { SuiTimeSignatureDialog } from '../ui/dialogs/timeSignature';
import { SuiTempoDialog } from '../ui/dialogs/tempo';
import { SuiNoteHeadDialog } from '../ui/dialogs/noteHead';
import { SuiEndingsDialogVue } from '../ui/dialogs/endings';
import { SuiScoreIdentificationDialogVue } from '../ui/dialogs/scoreId';
import { SuiScorePreferencesDialogVue } from '../ui/dialogs/preferences';
import { SuiPageLayoutDialogVue } from '../ui/dialogs/pageLayout';
import { SuiTextBracketDialog } from '../ui/dialogs/textBracket';
import { SuiScoreFontDialogVue } from '../ui/dialogs/fonts';
import { SuiGlobalLayoutDialogVue } from '../ui/dialogs/globalLayout';
import { SuiScoreViewDialogVue } from '../ui/dialogs/scoreView';import { SuiLibraryDialog } from '../ui/dialogs/library';
import { SuiChordChangeDialog } from '../ui/dialogs/chordChange';
import { SuiLyricDialog } from '../ui/dialogs/lyric';
import { SuiTextBlockDialog, helpModal } from '../ui/dialogs/textBlock';
import { SuiDynamicModifierDialog } from '../ui/dialogs/dynamics';
import { SuiSlurAttributesDialog } from '../ui/dialogs/slur';
import { SuiPedalMarkingDialog } from '../ui/dialogs/pedalMarking';
import { SuiTieAttributesDialog } from '../ui/dialogs/tie';
import { SuiVoltaAttributeDialog } from '../ui/dialogs/volta';
import { SuiHairpinAttributesDialog } from '../ui/dialogs/hairpin';
import { SuiStaffGroupDialogVue } from '../ui/dialogs/staffGroup';
import { SuiOrnamentDialogVue } from '../ui/dialogs/ornament';
import { SuiArticulationDialogVue } from '../ui/dialogs/articulation';
import { SuiMicrotoneDialogVue } from '../ui/dialogs/microtones';
import { SuiArpeggioDialog } from '../ui/dialogs/arpeggio';
import { SuiClefChangeDialog } from '../ui/dialogs/clefChange';
import { SuiPartInfoDialogVue } from '../ui/dialogs/partInfo';
import { SuiNavigationDom } from '../ui/navigation';
import { SuiFileUploadDialog, SuiFileSaveDialog, SuiPrintDialog } from '../ui/dialogs/fileDialogs';
    // Dialog components

import { SuiTextInputComponent, SuiTextInputComposite, SuiReadOnlyTextComponent } from '../ui/dialogs/components/textInput';
import { SuiDropdownComponent, SuiDropdownComposite } from '../ui/dialogs/components/dropdown';
import { SuiButtonComposite, SuiButtonComponent } from '../ui/dialogs/components/button';
import { SuiButtonArrayComponent, SuiButtonArrayMSComponent } from '../ui/dialogs/components/buttonArray';
import { SuiToggleComponent, SuiToggleComposite } from '../ui/dialogs/components/toggle';
import { SuiFileDownloadComponent } from '../ui/dialogs/components/fileDownload';
import { SuiRockerComponent, SuiRockerComposite } from '../ui/dialogs/components/rocker';
import { SuiFontComponent } from '../ui/dialogs/components/fontComponent';
import { SuiTextBlockComponent } from '../ui/dialogs/components/textInPlace';
import { SuiTreeComponent } from '../ui/dialogs/components/tree';
import { SuiPitchArrayComponent, SuiPitchArrayComponentTab, 
   SuiPitchComponent, SuiPitchComposite } from '../ui/dialogs/components/pitch';
import {
    SuiLyricComponent, SuiChordComponent,
    SuiNoteTextComponent
} from '../ui/dialogs/components/noteText';
import { SuiDragText } from '../ui/dialogs/components/dragText';
import { SuiTextInPlace } from '../ui/dialogs/components/textInPlace';
import { CheckboxDropdownComponent } from '../ui/dialogs/components/checkdrop';
import { TieMappingComponent } from '../ui/dialogs/components/tie';
import { StaffAddRemoveComponent,
    StaffCheckComponent} from '../ui/dialogs/components/staffComponents';
import { SuiKeySignatureDialog, SuiKeySignatureAdapter } from '../ui/dialogs/keySignature';
import { TextCheckComponent } from '../ui/dialogs/components/textCheck';
// menus
import { SuiMenuManager} from '../ui/menus/manager';
import { SuiMenuBase, SuiMenuCustomizer } from '../ui/menus/menu';
import { SuiScoreMenu } from '../ui/menus/score';
import { SuiEditMenu } from '../ui/menus/edit';
import { SuiTextMenu } from '../ui/menus/text';
import { SuiPartMenu } from '../ui/menus/parts';
import { SuiVoiceMenu } from '../ui/menus/voices';
import { SuiBeamMenu } from '../ui/menus/beams';
import { SuiPartSelectionMenu } from '../ui/menus/partSelection';
import { SuiTimeSignatureMenu } from '../ui/menus/timeSignature';
import { SuiKeySignatureMenu } from '../ui/menus/keySignature';
import { SuiStaffModifierMenu } from '../ui/menus/staffModifier';
import { SuiFileMenu } from '../ui/menus/file';
import { SuiLanguageMenu } from '../ui/menus/language';
import { SmoLanguage, SmoTranslator } from '../ui/i18n/language';
import { SuiMeasureMenu } from '../ui/menus/measure';
import { SuiNoteMenu } from '../ui/menus/note';
import { SuiHelpMenu } from '../ui/menus/help';
import { SuiXhrLoader } from '../ui/fileio/xhrLoader';
import { PromiseHelpers } from '../common/promiseHelpers';
// render library
import { SuiScoreView } from '../render/sui/scoreView';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { SuiScoreRender } from '../render/sui/scoreRender';
import { layoutDebug } from '../render/sui/layoutDebug';
import { SuiMapper } from '../render/sui/mapper';
import { SuiScroller } from '../render/sui/scroller';
import { SvgHelpers } from '../render/sui/svgHelpers';

// audio library
import { SuiAudioPlayer } from '../render/audio/player';
import { SuiOscillator, SuiSampler, SuiReverb } from '../render/audio/oscillator';
import { SuiSampleMedia } from '../render/audio/samples';


// SMO object model
import { SmoNamespace, SmoDynamicCtor, IsPitchLetter } from '../smo/data/common';
import { SmoScore, engravingFontTypes, isEngravingFont } from '../smo/data/score';
import { UndoBuffer } from '../smo/xform/undo';
import { SmoNote } from '../smo/data/note';
// import { SmoDuration } from '../smo/xform/tickDuration';
import { SmoStaffHairpin, StaffModifierBase, SmoInstrument, SmoSlur, SmoTie, SmoStaffTextBracket,
  SmoTabStave, SmoPedalMarking, staffModifierDynamicCtorInit
 } from '../smo/data/staffModifiers';
import { SmoMeasure } from '../smo/data/measure';
import { SmoMusic } from '../smo/data/music';
import { SmoAudioPitch } from '../smo/data/music';
import { SmoSelection, SmoSelector } from '../smo/xform/selections';
import { SmoBeamer } from '../smo/xform/beamers';
import { SmoOrnament, SmoArticulation, SmoDynamicText, SmoGraceNote, SmoMicrotone, SmoLyric,
  SmoArpeggio, SmoClefChange, noteModifierDynamicCtorInit } from '../smo/data/noteModifiers';
import { SmoSystemStaff } from '../smo/data/systemStaff';
import { SmoSystemGroup, SmoAudioPlayerSettings, SmoScorePreferences, scoreModifierDynamicCtorInit,
  GlobalLayoutNumberAttributesArray, displayMode
 } from '../smo/data/scoreModifiers';
import { SmoTextGroup, SmoTextGroupParams } from '../smo/data/scoreText';
import { SmoOperation } from '../smo/xform/operations';
import { ScoreRoadMapBuilder } from '../smo/xform/roadmap';
import {
    SmoRehearsalMark, SmoMeasureFormat, SmoBarline, SmoRepeatSymbol,
    SmoVolta, SmoMeasureText, SmoTempoText, TimeSignature, measureModifierDynamicCtorInit
} from '../smo/data/measureModifiers';
import { SmoToXml } from '../smo/mxml/smoToXml';
import { MidiToSmo } from '../smo/midi/midiToSmo';
import { SmoToMidi } from '../smo/midi/smoToMidi';
import { XmlToSmo } from '../smo/mxml/xmlToSmo';
import { SmoToVex } from '../render/vex/toVex';
// utilities
import { buildDom, addFileLink, InputTrapper, draggable, closeDialogPromise, getDomContainer, createTopDomContainer } from '../common/htmlHelpers';

import { renderVexTests } from './generateVexTests';
import { SuiDurationNoteVue } from '../ui/dialogs/durations';
import { SuiPitchDialogVue } from '../ui/dialogs/pitch';
const getClass = (jsonString: string) => {
    return eval('Smo.' + jsonString);
};
export * from '../ui/modalDialogs';
export * from './application';
export * from './common';
export * from './configuration';
export * from './dynamicInit';
export * from './dom';
export * from './eventHandler';
export * from '../common/midi-parser';
export * from './generateVexTests';
export * from './keyCommands';
export * from '../common/htmlHelpers';
export * from '../common/promiseHelpers';
export * from '../common/textformatter';
export * from '../common/vex';
export * from '../render/audio/musicCursor';
export * from '../render/audio/oscillator';
export * from '../render/audio/player';
export * from '../render/audio/samples';
export * from '../render/sui/configuration';
export * from '../render/sui/formatter';
export * from '../render/sui/layoutDebug';
export * from '../render/sui/mapper';
export * from '../render/sui/piano';
export * from '../render/sui/renderState';
export * from '../render/sui/scoreRender';
export * from '../render/sui/scoreView';
export * from '../render/sui/scoreViewOperations';
export * from '../render/sui/scroller';
export * from '../render/sui/svgHelpers';
export * from '../render/sui/svgPageMap';
export * from '../render/sui/textEdit';
export * from '../render/sui/textRender';
export * from '../render/sui/tracker';
export * from '../render/vex/glyphDimensions';
export * from '../render/vex/smoAdapter';
export * from '../render/vex/toVex';
export * from '../render/vex/vxMeasure';
export * from '../render/vex/vxNote';
export * from '../render/vex/vxSystem';
export * from '../smo/data/common';
export * from '../smo/data/measure';
export * from '../smo/data/measureModifiers';
export * from '../smo/data/music';
export * from '../smo/data/note';
export * from '../smo/data/noteModifiers';
export * from '../smo/data/partInfo';
export * from '../smo/data/score';
export * from '../smo/data/scoreModifiers';
export * from '../smo/data/scoreText';
export * from '../smo/data/staffModifiers';
export * from '../smo/data/systemStaff';
export * from '../smo/data/tuplet';
export * from '../smo/midi/midiToSmo';
export * from '../smo/midi/smoToMidi';
export * from '../smo/mxml/smoToXml';
export * from '../smo/mxml/xmlHelpers';
export * from '../smo/mxml/xmlState';
export * from '../smo/mxml/xmlToSmo';
export * from '../smo/xform/beamers';
export * from '../smo/xform/copypaste';
export * from '../smo/xform/operations';
export * from '../smo/xform/selections';
export * from '../smo/xform/tickDuration';
export * from '../smo/xform/tickMap';
export * from '../smo/xform/undo';
export * from '../ui/buttons/button';
export * from '../ui/buttons/collapsable';
export * from '../ui/buttons/display';
export * from '../ui/buttons/ribbon';
export * from '../ui/common';
export * from '../ui/configuration';
export * from '../ui/dialogs/adapter';
export * from '../ui/dialogs/addMeasure';
export * from '../ui/dialogs/arpeggio';
export * from '../ui/dialogs/articulation';
export * from '../ui/dialogs/audioSettings';
export * from '../ui/dialogs/chordChange';
export * from '../ui/dialogs/clefChange';
export * from '../ui/dialogs/components/baseComponent';
export * from '../ui/dialogs/components/button';
export * from '../ui/dialogs/components/buttonArray';
export * from '../ui/dialogs/components/checkdrop';
export * from '../ui/dialogs/components/dragText';
export * from '../ui/dialogs/components/dropdown';
export * from '../ui/dialogs/components/fileDownload';
export * from '../ui/dialogs/components/fontComponent';
export * from '../ui/dialogs/components/noteText';
export * from '../ui/dialogs/components/pitch';
export * from '../ui/dialogs/components/rocker';
export * from '../ui/dialogs/components/staffComponents';
export * from '../ui/dialogs/components/textCheck';
export * from '../ui/dialogs/components/textInPlace';
export * from '../ui/dialogs/components/textInput';
export * from '../ui/dialogs/components/tie';
export * from '../ui/dialogs/components/toggle';
export * from '../ui/dialogs/components/tree';
export * from '../ui/dialogs/dialog';
export * from '../ui/dialogs/durations';
export * from '../ui/dialogs/dynamics';
export * from '../ui/dialogs/endings';
export * from '../ui/dialogs/factory';
export * from '../ui/dialogs/fileDialogs';
export * from '../ui/dialogs/fonts';
export * from '../ui/dialogs/globalLayout';
export * from '../ui/dialogs/gracenote';
export * from '../ui/dialogs/hairpin';
export * from '../ui/dialogs/instrument';
export * from '../ui/dialogs/keySignature';
export * from '../ui/dialogs/library';
export * from '../ui/dialogs/lyric';
export * from '../ui/dialogs/measureFormat';
export * from '../ui/dialogs/microtones';
export * from '../ui/dialogs/noteHead';
export * from '../ui/dialogs/ornament';
export * from '../ui/dialogs/pageLayout';
export * from '../ui/dialogs/partInfo';
export * from '../ui/dialogs/pedalMarking';
export * from '../ui/dialogs/pitch';
export * from '../ui/dialogs/preferences';
export * from '../ui/dialogs/scoreId';
export * from '../ui/dialogs/scoreView';
export * from '../ui/dialogs/slur';
export * from '../ui/dialogs/staffGroup';
export * from '../ui/dialogs/tabNote';
export * from '../ui/dialogs/tabStave';
export * from '../ui/dialogs/tempo';
export * from '../ui/dialogs/textBlock';
export * from '../ui/dialogs/textBracket';
export * from '../ui/dialogs/tie';
export * from '../ui/dialogs/timeSignature';
export * from '../ui/dialogs/transposeScore';
export * from '../ui/dialogs/volta';
export * from '../ui/eventSource';
export * from '../ui/exceptions';
export * from '../ui/fileio/fileInput';
export * from '../ui/fileio/library';
export * from '../ui/fileio/xhrLoader';
export * from '../ui/help';
export * from '../ui/common';
export * from '../ui/i18n/language';
export * from '../ui/i18n/language_en';
export * from '../ui/i18n/translationEditor';
export * from '../ui/keyBindings/default/editorKeys';
export * from '../ui/keyBindings/default/trackerKeys';
export * from '../ui/menus/beams';
export * from '../ui/menus/file';
export * from '../ui/menus/keySignature';
export * from '../ui/menus/language';
export * from '../ui/menus/manager';
export * from '../ui/menus/measure';
export * from '../ui/menus/menu';
export * from '../ui/menus/note';
export * from '../ui/menus/parts';
export * from '../ui/menus/partSelection';
export * from '../ui/menus/score';
export * from '../ui/menus/staffModifier';
export * from '../ui/menus/text';
export * from '../ui/menus/timeSignature';
export * from '../ui/menus/voices';
export * from '../ui/qwerty';
export * from '../ui/ribbonLayout/default/defaultRibbon';
export * from '../ui/ribbonLayout/default/tabletRibbon';

export const Smo = {
  // Application-level classes
  SmoConfiguration,
  SuiApplication,
  dynamicCtorInit,
  parseMidi,
  SuiDom,  SuiEventHandler, SuiExceptionHandler,
  Qwerty, SuiHelp, SmoTranslationEditor, ModalEventHandler,
  // Ribbon buttons
  simpleRibbonLayout,
  RibbonButtons,
  ModalComponent, CompleteNotifier,
  DisplaySettings,  ExtendedCollapseParent, CollapseRibbonControl,
  // Menus
  SuiMenuManager, SuiMenuBase, SuiMenuCustomizer, SuiScoreMenu, SuiFileMenu,
  SuiTimeSignatureMenu, SuiKeySignatureMenu, SuiStaffModifierMenu,
  SuiLanguageMenu, SuiMeasureMenu, SuiNoteMenu, SuiHelpMenu,SuiEditMenu, SmoLanguage, SmoTranslator, SuiPartMenu,
  SuiPartSelectionMenu, SuiTextMenu, SuiVoiceMenu, SuiBeamMenu,
  // Dialogs
  SuiGraceNoteDialog,  SuiDurationNoteVue,
  SuiComponentAdapter, SuiDialogAdapterBase,
  SuiTempoDialog, SuiInstrumentDialogVue, SuiModifierDialogFactory, SuiLibraryDialog,
  SuiTextBracketDialog, SuiKeySignatureDialog, SuiKeySignatureAdapter,
  SuiScoreViewDialogVue, SuiGlobalLayoutDialogVue, SuiScoreIdentificationDialogVue, 
  GlobalLayoutNumberAttributesArray,
  SuiTransposeScoreDialogVue,
  SuiScoreFontDialogVue, SuiPageLayoutDialogVue, SuiMeasureFormatDialogVue, SuiInsertMeasuresVue,
  SuiTimeSignatureDialog,SuiTextBlockDialog, SuiLyricDialog, SuiChordChangeDialog,
  SuiSlurAttributesDialog, SuiPedalMarkingDialog, SuiTieAttributesDialog, SuiVoltaAttributeDialog,
  SuiHairpinAttributesDialog, SuiStaffGroupDialogVue, helpModal,
  SuiScorePreferencesDialogVue,
  SuiPartInfoDialogVue, SuiOrnamentDialogVue, 
  SuiArticulationDialogVue, 
  SuiMicrotoneDialogVue,
  SuiNoteHeadDialog,    
  SuiEndingsDialogVue,  
  SuiFileSaveDialog, SuiPrintDialog,
  SuiDialogBase, createAndDisplayDialog,  SuiFileUploadDialog,
  SuiPitchDialogVue,
  // Dialog components
  SuiTreeComponent,
  SuiDropdownComponent,
  SuiRockerComponent, SuiFileDownloadComponent, SuiButtonArrayComponent, SuiButtonArrayMSComponent,
  SuiToggleComponent, SuiButtonComponent, SuiDropdownComposite,
  SuiToggleComposite, SuiButtonComposite, SuiRockerComposite, SuiTextInputComposite,
  SuiFontComponent, SuiTextInPlace, SuiLyricComponent, SuiChordComponent, SuiDragText,
  SuiNoteTextComponent, SuiTextBlockComponent, SuiTextInputComponent, SuiReadOnlyTextComponent,
  SuiDynamicModifierDialog, CheckboxDropdownComponent, TieMappingComponent, StaffAddRemoveComponent,
  StaffCheckComponent, TextCheckComponent, SuiArpeggioDialog, SuiClefChangeDialog,
  SuiPitchArrayComponent, SuiPitchArrayComponentTab, SuiPitchComponent,

SuiPitchComposite, 
  SuiXhrLoader,PromiseHelpers,
  // Rendering components
  SuiPiano, layoutDebug, SuiScoreView,SuiScroller, SvgHelpers, SuiMapper, SuiScoreRender,
  SuiScoreViewOperations, TextFormatter, VexFlow,

  // Audio components
  SuiAudioPlayer, SuiOscillator, SuiSampleMedia, SuiSampler, SuiReverb,

  // Smo Music Objects
  SmoScore,  SmoScorePreferences, scoreModifierDynamicCtorInit,  engravingFontTypes, isEngravingFont,
  XmlToSmo,  SmoToXml,  MidiToSmo,  SmoToMidi,  SmoMusic,  SmoAudioPitch,  SmoMeasure,  SmoNamespace, SmoDynamicCtor,
  SmoSystemStaff,  SmoNote, IsPitchLetter, ScoreRoadMapBuilder,
  // staff modifier
  SmoStaffHairpin, StaffModifierBase,  SmoStaffTextBracket, staffModifierDynamicCtorInit,
  SmoInstrument, SmoSlur, SmoPedalMarking, SmoTie, SmoTabStave, 
  // score modifiers
  SmoSystemGroup, SmoAudioPlayerSettings, SmoTextGroup,
  // measure modifiers
  SmoRehearsalMark, SmoMeasureFormat, SmoBarline, SmoRepeatSymbol,  SmoVolta, SmoMeasureText, SmoTempoText, TimeSignature,
  measureModifierDynamicCtorInit,
  // note modifiers
  SmoOrnament, noteModifierDynamicCtorInit,
  SmoArticulation, SmoDynamicText, SmoGraceNote, SmoMicrotone, SmoLyric, SmoArpeggio, SmoClefChange,
  // Smo Transformers
  SmoSelection, SmoSelector, /*SmoDuration,*/ UndoBuffer, SmoToVex, SmoOperation, SmoBeamer,
  // new score bootstrap
  // help strings
  cardKeysHtmlEn, cardNotesLetterHtmlEn, cardNotesChromaticHtmlEn, cardNotesChordsHtmlEn,
    cardNotesRestsHtmlEn, cardDurationNotesHtmlEn, cardDurationTupletsHtmlEn,
    cardSelectionsNotesHtmlEn, cardSelectionsModifiersHtmlEn, cardSelectionsNonSelectableHtmlEn, cardSelectionsSlashHtmlEn,
    cardBeamsAndStemsDirectionHtmlEn, cardBeamsAndStemsGroupingHtmlEn,
    cardMeasuresAddDeleteHtmlEn, cardVoicesCreateDeleteHtmlEn, cardPartAddDeleteHtmlEn,
    getClass,
  // utilities
  buildDom, addFileLink, InputTrapper, draggable, closeDialogPromise, getDomContainer, createTopDomContainer,
  renderVexTests, replaceVueRoot, SuiNavigationDom
}
export default Smo;