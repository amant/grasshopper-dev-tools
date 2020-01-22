console.log('hello background script');

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    "id": "Woohoo",
    "title": "Woohoo hello world",
    "contexts": ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'Woohoo' && info.selectionText) {
    chrome.tts.speak(info.selectionText, { rate: 1, voiceName: 'Google UK English Female' });
  }
});

chrome.tts.getVoices((voices) => {
  voices.map(({voiceName, lang}) => {
    console.log('name:', voiceName, 'lang:', lang);
  });
});
