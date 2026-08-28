// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiTextBracketAdapter } from './textBracket';
import { SmoTextBracketNumberType, SmoTextBracketStringType } from '../../smo/data/staffModifiers';
import { getModifierDialogPosition } from './adapter';
import textBracketComp from '../components/dialogs/textBracket.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiTextBracketDialog (src/ui/dialogs/textBracket.ts),
 * following the SuiTimeSignatureDialogVue creation-function pattern.
 * SuiTextBracketAdapter is reused unchanged; only the presentation layer is new.
 */
export const SuiTextBracketDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const adapter = new SuiTextBracketAdapter(parameters.view, parameters.modifier);

  const updateNumberCb = (param: SmoTextBracketNumberType, value: number) => {
    adapter[param] = value;
  };
  const updateTextCb = (param: SmoTextBracketStringType, value: string) => {
    adapter[param] = value;
  };
  const commitCb = async () => {
    await adapter.commit();
  };
  const cancelCb = async () => {
    await adapter.cancel();
  };
  const removeCb = async () => {
    await adapter.remove();
  };

  const appParams = {
    domId: rootId,
    label: 'Text Bracket Properties',
    initialPosition: getModifierDialogPosition(parameters.view, parameters.modifier),
    line: adapter.line,
    position: adapter.position,
    text: adapter.text,
    superscript: adapter.superscript,
    updateNumberCb,
    updateTextCb
  };

  InstallDialog({
    root: rootId,
    app: textBracketComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    removeCb
  });
};
