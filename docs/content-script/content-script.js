function overrideAddBtn() {
  $('#add-btn').off();
  $('#add-btn').click(() => {
    const result = parseFloat($('#value1').val()) * parseFloat($('#value2').val());
    $('#result').html(result.toString());
  })
}

(function() {
  const el = document.createElement('script');
  el.textContent = `(${ overrideAddBtn.toString() })()`;
  document.documentElement.appendChild(el);
}());

