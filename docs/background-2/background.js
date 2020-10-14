console.log('hello background script');

let voiceName = 'Google UK English Female';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    "id": "Woohoo",
    "title": "Woohoo hello world",
    "contexts": ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'Woohoo' && info.selectionText) {
    chrome.tts.speak(info.selectionText, { rate: 1, voiceName });
  }
});


chrome.runtime.onMessage.addListener(message => {
  if (message.type === 'send-voices') {
    chrome.tts.getVoices((voices) => {

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'voices',
          data: voices
        });
      });

      voices.map(({ voiceName, lang }) => {
        console.log('name:', voiceName, 'lang:', lang);
      });
    });

  } else if (message.type === 'selected-voice') {
    voiceName = message.data || 'Google UK English Male';
  }
});
