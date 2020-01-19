chrome.runtime.onMessage.addListener(message => {
  console.log('content-script on-message', message);

  if (message.type === 'popup-color-value') {
    document.body.style.backgroundColor = message.data;
  }
});
