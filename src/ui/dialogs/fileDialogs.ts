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
  const commitMidi = async () => {
    try {
      // midi parser expects data in UintArray form
      const ar = new Uint8Array(uploadedFile);
      const midi: any = parseMidi(ar);
      const midiParser = new MidiToSmo(midi, quantizeValue);
      await parameters.view.changeScore(midiParser.convert());
    } catch (e) {
      console.warn('unable to score ' + e);
    }
  }
  const commitXml = async () => {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(uploadedFile, 'text/xml');
      const score = XmlToSmo.convert(xml);
      score.layoutManager!.zoomToWidth($('body').width());
      await parameters.view.changeScore(score);
    } catch (e) {
      console.warn('unable to score ' + e);
    }
  }
  const commitCb = async () => {
    if (filename.endsWith('.mid') || filename.endsWith('.midi')) {
      await commitMidi();
    }
    else if (filename.endsWith('.xml') || filename.endsWith('.mxml')) {
      await commitXml();
    }
    else if (filename.endsWith('.json')) {
      if (uploadedFile && uploadedFile.length > 0) {
        try {
          const score = SmoScore.deserialize(uploadedFile);
          await parameters.view.changeScore(score);
        } catch (e) {
          console.warn('unable to score ' + e);
        }
      }
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
    cancelCb
  });
}

export const SuiFileSaveDialog  = async (parameters: SuiDialogParams) => {
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
  const commitCb = async () => {
  }
  const cancelCb = async () => {
  }
  const rootId = replaceVueRoot(modalContainerId);
  const appParams = { suggestedName, contents, extension, changeExtensionCb, domId: rootId };
  InstallDialog({
    root: rootId,
    app: saveFileApp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
}
export const SuiPrintDialog = async (parameters: SuiDialogParams) => {
  await parameters.view.renderer.renderForPrintPromise();
  window.print();
  const okCb = () => {
    $('body').removeClass('printing');
    parameters.view.renderer.restoreLayoutAfterPrint();
    window.dispatchEvent(new Event('resize'));
    SuiNavigationDom.instance.hideDialogModal();
  }
  const rootId = replaceVueRoot(modalContainerId);
  const appParams = { domId: rootId, okCb, message: 'Print complete!', headline: 'Printing' };
  createApp(messageDialog as any, appParams).mount('#' + rootId);
  SuiNavigationDom.instance.showDialogModal();  
}

