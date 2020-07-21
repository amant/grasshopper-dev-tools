import { installHelpers, injectScript } from './helpers/content-script-helpers'

if (document instanceof HTMLDocument) {
  injectScript(installHelpers);
}
