import { installBackendHelpers } from './helpers/backend-helpers'

const injectScript = (fn) => {
  const source = `;( ${fn.toString()} )(window)`;

  const script = document.createElement('script');

  script.textContent = source;
  document.documentElement.appendChild(script);
  script.parentNode.removeChild(script);
};

if (document instanceof HTMLDocument) {
  injectScript(installBackendHelpers);
}