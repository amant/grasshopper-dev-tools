import { installHelpers, injectScript } from './helpers/content-script-helpers.js';

if (document instanceof HTMLDocument) {
  injectScript(installHelpers);
}
