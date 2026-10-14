// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiDialogBase, SuiDialogParams, DialogDefinition, InstallDialog } from './dialog';
import { SmoScore } from '../../smo/data/score';
import { XmlToSmo } from '../../smo/mxml/xmlToSmo';
import { SmoToXml } from '../../smo/mxml/smoToXml';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiFileDownloadComponent } from './components/fileDownload';
import { SuiDialogAdapterBase, SuiComponentAdapter } from './adapter';
import { addFileLink } from '../../common/htmlHelpers';
import { SmoToMidi } from '../../smo/midi/smoToMidi';
import { MidiToSmo } from '../../smo/midi/midiToSmo';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { SmoToVex } from '../../render/vex/toVex';
import { parseMidi } from '../../common/midi-parser.js';
import { replaceVueRoot, modalContainerId } from '../common';
import { createApp, ref, Ref, watch } from 'vue';
import { SuiFileInput } from '../fileio/fileInput';
import { default as messageDialog } from '../components/dialogs/modalMessage.vue';
import { default as fileUploadApp } from '../components/dialogs/fileUpload.vue';
import { default as saveFileApp } from '../components/dialogs/save.vue';
import { SuiNavigationDom } from '../navigation';
import { SaveOutcome, nextStepAfterSave } from '../../render/sui/scoreChangeState';
import { askUnsavedChoice } from './unsavedChanges';
declare var $: any;

export const SuiFileUploadDialog = async (parameters: SuiDialogParams) => {
  const enable: Ref<boolean> = ref(false);
  let filename = '';
  let uploadedFile: any | null = null;
  let quantizeValue: number = 1024;
  const quantizeCb = (val: string) => {
    quantizeValue = parseInt(val, 10);
  }
  const uploadCb = async (evt: any) => {
    if (evt.target.files.length > 0) {
      filename = evt.target.files[0].name;
    }
    const localFile = new SuiFileInput(evt);
    await localFile.loadAsync();
    uploadedFile = localFile.value;
    enable.value = true;
  };
  // The score read from the file.  It replaces the open score only after the user has been
  // asked about unsaved changes, which has to wait until this dialog has closed.
  let pendingScore: SmoScore | null = null;
  const convertMidi = (): SmoScore | null => {
    try {
      // midi parser expects data in UintArray form
      const ar = new Uint8Array(uploadedFile);
      const midi: any = parseMidi(ar);
      const midiParser = new MidiToSmo(midi, quantizeValue);
      return midiParser.convert();
    } catch (e) {
      console.warn('unable to score ' + e);
    }
    return null;
  }
  const convertXml = (): SmoScore | null => {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(uploadedFile, 'text/xml');
      const score = XmlToSmo.convert(xml);
      score.layoutManager!.zoomToWidth($('body').width());
      return score;
    } catch (e) {
      console.warn('unable to score ' + e);
    }
    return null;
  }
  const convertJson = (): SmoScore | null => {
    if (uploadedFile && uploadedFile.length > 0) {
      try {
        return SmoScore.deserialize(uploadedFile);
      } catch (e) {
        console.warn('unable to score ' + e);
      }
    }
    return null;
  }
  const commitCb = async () => {
    pendingScore = null;
    if (filename.endsWith('.mid') || filename.endsWith('.midi')) {
      pendingScore = convertMidi();
    }
    else if (filename.endsWith('.xml') || filename.endsWith('.mxml') || filename.endsWith('.mxl')) {
      pendingScore = convertXml();
    }
    else if (filename.endsWith('.json')) {
      pendingScore = convertJson();
    }
  }
  const afterCloseCb = async () => {
    if (pendingScore && await confirmReplaceScore(parameters)) {
      await parameters.view.changeScore(pendingScore);
    }
  }
  const cancelCb = async () => {
  }
  const rootId = replaceVueRoot(modalContainerId);
  const appParams: any = { enable, uploadCb, domId: rootId };
  if (parameters.id === 'importMidi') {
    appParams['quantizeCb'] = quantizeCb;
  }
  InstallDialog({
    root: rootId,
    app: fileUploadApp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    afterCloseCb
  });
}

/**
 * Call before replacing the open score with another (New, Open, Import, Library).  If the score
 * has unsaved changes, ask the user whether to save first.  If they save in a lossy format
 * (MusicXML, MIDI...) the score is still unsaved, so ask again.  Must be called after any dialog
 * used to choose the new score has closed.
 * @param parameters dialog parameters, including the view
 * @returns true if it is OK to replace the score, false if the user cancelled
 */
export const confirmReplaceScore = async (parameters: SuiDialogParams): Promise<boolean> => {
  while (parameters.view.scoreChanged.value) {
    const choice = await askUnsavedChoice(parameters);
    if (choice === 'discard') {
      return true;
    }
    if (choice === 'cancel') {
      return false;
    }
    const outcome = await new Promise<SaveOutcome>((resolve) => {
      SuiFileSaveDialog(parameters, (result: SaveOutcome) => resolve(result));
    });
    const next = nextStepAfterSave(outcome);
    if (next === 'load') {
      return true;
    }
    if (next === 'abort') {
      return false;
    }
  }
  return true;
}

/**
 * Save the score to a file.
 * @param parameters dialog parameters
 * @param onClosed optional, called when the dialog closes with how it ended: the score was saved
 * in full, exported to a lossy format, or the dialog was cancelled.
 */
export const SuiFileSaveDialog  = async (parameters: SuiDialogParams, onClosed?: (outcome: SaveOutcome) => void) => {
  const page = 0;
  const contents: Ref<any> = ref('');
  const getSmoContent = () => {
    const json = parameters.view.storeScore.serialize();
    const jsonText = JSON.stringify(json);
    return jsonText;
  }
  const getSmoValidationContent = () => {
    const json = parameters.view.storeScore.serialize({ useDictionary: false, skipStaves: false, preserveStaffIds: false });
    const jsonText = JSON.stringify(json);
    return jsonText;
  }
  const getMusicXmlContent = () => {
    const dom = SmoToXml.convert(parameters.view.storeScore);
    const ser = new XMLSerializer();
    const xmlText = ser.serializeToString(dom);
    return xmlText;
  }
  const getMidiContent = () => {
    const bytes = SmoToMidi.convert(parameters.view.storeScore);
    return bytes;
  }
  const getVexContent = () => {
    const vexText = SmoToVex.convert(parameters.view.storeScore, { div: 'smoo', page });
    return vexText;
  };
  contents.value = getSmoContent();
  const extension: Ref<string> = ref('.json');
  const suggestedName = parameters.view.score.scoreInfo.name;
  const changeExtensionCb = (ext: string) => {
    if (ext === '.json') {
      contents.value = getSmoContent();
    } else if (ext === '.xml') {
      contents.value = getMusicXmlContent();
    } else if (ext === '.mid' || ext === '.midi') {
      contents.value = getMidiContent();      
    } else if (ext === '.js') {
      contents.value = getVexContent();
    } else if (ext === '.smojson') {
      contents.value = getSmoValidationContent();
      extension.value = '.json';
      return;
    } else {
      contents.value = getSmoContent();
    }
    extension.value = ext;
  }
  let committedOutcome: SaveOutcome = 'cancelled';
  const commitCb = async () => {
    // The view knows which formats hold the whole score, and clears the changed flag only for those.
    committedOutcome = parameters.view.recordSave(extension.value) ? 'saved' : 'exported';
  }
  const cancelCb = async () => {
    if (onClosed) {
      onClosed('cancelled');
    }
  }
  // Report a committed save only after the dialog has closed, so a caller can open another dialog.
  const afterCloseCb = async () => {
    if (onClosed) {
      onClosed(committedOutcome);
    }
  }
  const rootId = replaceVueRoot(modalContainerId);
  const appParams = { suggestedName, contents, extension, changeExtensionCb, domId: rootId };
  InstallDialog({
    root: rootId,
    app: saveFileApp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    afterCloseCb
  });
}
export const SuiPrintDialog = async (parameters: SuiDialogParams) => {
  await parameters.view.renderer.renderForPrintPromise();
  window.print();
  $('body').removeClass('printing');
  const okCb = async () => {
    parameters.view.renderer.restoreLayoutAfterPrint();
    window.dispatchEvent(new Event('resize'));
  }
  const rootId = replaceVueRoot(modalContainerId);
  const appParams = { domId: rootId, okCb, message: 'Print complete!', headline: 'Printing' };  
  InstallDialog({
    root: rootId,
    app: messageDialog,
    dialogParams: parameters,
    appParams,
    commitCb: okCb, cancelCb: okCb});
}

