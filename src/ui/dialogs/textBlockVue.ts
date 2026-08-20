// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { ref, Ref } from 'vue';
import { SmoScoreText, SmoTextGroup } from '../../smo/data/scoreText';
import { RemoveElementLike, ElementLike } from '../../smo/data/common';
import { SvgHelpers } from '../../render/sui/svgHelpers';
import { SuiDialogParams, InstallDialog } from './dialog';
import textBlockComp from '../components/dialogs/textBlock.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiTextBlockDialog (src/ui/dialogs/textBlock.ts),
 * following the SuiTimeSignatureDialogVue creation-function pattern.
 * SuiTextBlockDialog and its call sites are unchanged; nothing wires callers
 * over to this function yet (see specs/001-text-block-dialog-vue).
 */
export const SuiTextBlockDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const view = parameters.view;
  const tracker = view.tracker;
  ['staffModifier', 'suggestion'].forEach((outlineType) => {
    if ((tracker.outlines as any)[outlineType]) {
      SvgHelpers.eraseOutline((tracker.outlines as any)[outlineType]);
    }
  });

  let isNew = false;
  let workingGroup: SmoTextGroup;
  if (!parameters.modifier) {
    isNew = true;
    const textParams = SmoScoreText.defaults;
    const newText = new SmoScoreText(textParams);
    const svgScroll = tracker.renderer.pageMap.clientToSvg(SvgHelpers.smoBox(tracker.scroller.scrollState));
    newText.y += svgScroll.y;
    newText.x += svgScroll.x;
    if (tracker.selections.length > 0) {
      const sel = tracker.selections[0].measure.svg;
      if (typeof (sel.logicalBox) !== 'undefined') {
        if (sel.logicalBox.y >= newText.y) {
          newText.y = sel.logicalBox.y;
          newText.x = sel.logicalBox.x;
        }
      }
    }
    const grpParams = SmoTextGroup.defaults;
    grpParams.textBlocks = [{ text: newText, position: SmoTextGroup.relativePositions.LEFT, activeText: true }];
    workingGroup = new SmoTextGroup(grpParams);
    parameters.modifier = workingGroup;
    workingGroup.setActiveBlock(newText);
    view.groupUndo(true);
    view.addTextGroup(workingGroup);
  } else {
    const og = (parameters.modifier as SmoTextGroup);
    og.elements.forEach((el: ElementLike) => RemoveElementLike(el));
    og.elements = [];
    workingGroup = SmoTextGroup.deserializePreserveId(parameters.modifier);
    workingGroup.setActiveBlock(workingGroup.textBlocks[0].text);
    view.groupUndo(true);
  }
  if (!workingGroup.logicalBox) {
    view.renderer.renderTextGroup(workingGroup);
  }

  const modifier: Ref<SmoTextGroup> = ref(workingGroup) as Ref<SmoTextGroup>;
  let edited = isNew;
  const markEdited = () => {
    edited = true;
  };

  const finish = () => {
    modifier.value.setActiveBlock(null);
    view.tracker.updateMap();
    view.renderer.setDirty();
  };

  const commitCb = async () => {
    modifier.value.elements.forEach((el:ElementLike) => RemoveElementLike(el));
    modifier.value.elements = [];
    modifier.value.trimEmptyBlocks();
    await view.updateTextGroup(modifier.value);
    view.groupUndo(false);
    finish();
  };
  const cancelCb = async () => {
    if (edited) {
      modifier.value.elements.forEach((element: ElementLike) => {
        RemoveElementLike(element);
      });
      modifier.value.elements = [];
      await view.undo();
    }
    view.groupUndo(false);
    finish();
  };
  const removeCb = async () => {
    modifier.value.elements.forEach((element: ElementLike) => {
      RemoveElementLike(element);
    });
    modifier.value.elements = [];
    await view.removeTextGroup(modifier.value);
    view.groupUndo(false);
    finish();
  };

  const appParams = {
    domId: rootId,
    label: 'Text Properties',
    modifier,
    view,
    markEdited
  };

  InstallDialog({
    root: rootId,
    app: textBlockComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    removeCb
  });
};
