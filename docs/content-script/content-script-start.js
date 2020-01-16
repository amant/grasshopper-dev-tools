function overrideOpen() {
  const orgOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function() {
    console.log( arguments );

    arguments[1] = 'https://reqres.in/api/users/2';

    return orgOpen.apply(this, [].slice.call(arguments));
  };
}

(function () {
  const el = document.createElement('script');
  el.textContent = `(${ overrideOpen.toString() })()`;
  document.documentElement.appendChild(el);
}());
