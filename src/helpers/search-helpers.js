import { get as _get } from 'lodash';
import TrieSearch from 'trie-search';
import { componentsWalk } from './enrich-helpers';

let elementsSearchIndex = [];
let searchIndex = [];

export const buildComponentsSearchIndex = (elements) => {
  searchIndex = [];

  componentsWalk([el => {
    searchIndex.push({
      nodeName: el.nodeName,
      id: el.id,
      _ref: el._ref,
    })
  }])(elements);

  elementsSearchIndex = new TrieSearch(['nodeName', 'id']);
  elementsSearchIndex.addAll(searchIndex);
};

export const searchComponents = (elements, searchValue) => {
  // faster, trie algorithm search
  let result = elementsSearchIndex
    .get(searchValue)
    .map(item => _get(elements, item._ref));

  // slower, search entire string
  if (result.length <= 0) {
    result = searchIndex
      .filter(({ nodeName, id }) => nodeName.includes(searchValue) || id.includes(searchValue))
      .map(item => _get(elements, item._ref));
  }

  return result;
};

export const searchComponentProperty = (properties, searchValue) =>
  Object
    .keys(properties)
    .filter(property => property.startsWith(searchValue))
    .reduce((acc, key) => ({
      ...acc,
      [key]: properties[key]
    }), {});
