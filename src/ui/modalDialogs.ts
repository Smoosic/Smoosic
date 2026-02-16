import { replaceVueRoot } from './common';
import { createApp } from 'vue';
import { default as someApp } from './components/modalSplash.vue';
import { SuiNavigationDom } from './navigation';

declare var $: any;

export const createModalSplash = (timer: number) => {
  const element = `#bug-modal`;
  const root = replaceVueRoot(element);
  const close = () => {
    SuiNavigationDom.instance.hideBugModal();
  }
  const app = createApp(someApp as any, { closeFunction: close, timer });
  app.mount('#' + root);
  SuiNavigationDom.instance.showBugModal();
  return app;
}

