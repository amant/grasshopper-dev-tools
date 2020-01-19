document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#color-picker')
    .addEventListener('change', (event) => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {

        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'popup-color-value',
          data: event.target.value
        });
      });
    });
});
