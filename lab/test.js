function test(selectorQuery) {
  const sel = selectorQuery.split('>::shadowroot>');
  let result = document.querySelector(sel[0]);
  for (let i = 1, len = sel.length; i < len; i++) {
    if (result) {
      result = result.shadowRoot.querySelector(sel[i]);
    } else {
      break;
    }
  }
  return result;
}

console.log(test('body>fancy-tabs>::shadowroot>div#panels'));
