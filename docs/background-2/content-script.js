(function() {
  chrome.runtime.sendMessage({ type: 'send-voices' });

  chrome.runtime.onMessage.addListener(message => {
    if (message.type === 'voices') {
      let options = message
        .data
        .map(({voiceName, lang}) => `<option value="${voiceName}">${voiceName} - ${lang}</option>`)
        .join('');

      let select = `<select><option value="">select voice</option>${options}</select>`;
      document.querySelector('#voices').innerHTML = select;

      document.querySelector('#voices > select').addEventListener('change', (event) => {
        chrome.runtime.sendMessage({ type: 'selected-voice', data: event.target.value });
      })
    }
  });

}());

