export const componentsWalk = (fns) => {
  return function walk(components, parentEl) {
    components.forEach((component, index) => {
      fns.forEach(fn => fn(component, index, parentEl));

      if (component.children && component.children.length > 0) {
        walk(component.children, component);
      }
    })
  }
};

export const enrichWithRef = (component, index, parentComponent = {}) => {
  component._ref = parentComponent._ref ? `${ parentComponent._ref }.children.[${ index }]` : `[${ index }]`;
};

export const convertNodeNameToLowerCase = (component) => {
  component.nodeName = component.nodeName.toLowerCase();
};

const getQuerySelector = (element, selector = 'body') => {
  const nodeName = element.nodeName.toLowerCase();
  const query = `${ selector }>${ (element.inShadow ? `::shadowroot>${ nodeName }` : nodeName) }`;
  const ownIndex = element.ownIndex;

  if (ownIndex !== null) {
    return `${ query }:nth-child(${ ownIndex + 1 })`;
  }

  return query;
};

export const enrichWithSelector = (component, index, parentComponent = {}) => {
  component._selector = getQuerySelector(component, parentComponent._selector);
};
