const $ = document.querySelector.bind(document);

$('#add-btn').addEventListener('click', () => {
  const result = parseFloat($('#value1').value) * parseFloat($('#value2').value);
  $('#result').textContent = result.toString();
});

