export const enrichWith = (enrichFns) => {
  return function walk(elements, parentEl) {
    elements.forEach((el, index) => {
      enrichFns.forEach(fn => fn(el, index, parentEl));

      if (el.children && el.children.length > 0) {
        walk(el.children, el);
      }
    })
  }
};

export const enrichWithRef = (el, index, parentEl = {}) => {
  el._ref = `${parentEl._ref || ''}[${index}]`;
};

const getQuerySelector = (element, selector = 'body') => {
  const nodeName = element.nodeName.toLowerCase();
  return `${ selector }>${ (element.inShadow ? `::shadowroot>${ nodeName }` : nodeName) }`;
};

export const  enrichWithSelector = (el, index, parentEl = {}) => {
  el._selector = getQuerySelector(el, parentEl._selector);
};
