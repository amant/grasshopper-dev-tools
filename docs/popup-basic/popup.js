document.addEventListener('DOMContentLoaded', () => {
  console.log('Yo added listener');

  document.querySelector('#color-picker')
    .addEventListener('change', (event) => {
      chrome.tabs.executeScript(null, {
        code: `document.body.style.backgroundColor="${ event.target.value }"`
      });
    });
});
