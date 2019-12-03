import { get as _get } from 'lodash';
import TrieSearch from 'trie-search';
import { componentsWalk } from './enrich-helpers';

let elementsSearchIndex = [];

export const buildComponentsSearchIndex = (elements) => {
  const searchIndex = [];

  componentsWalk([el => {
    searchIndex.push({
      nodeName: el.nodeName,
      _ref: el._ref,
    })
  }])(elements);

  elementsSearchIndex = new TrieSearch('nodeName', {});
  elementsSearchIndex.addAll(searchIndex);
};

export const searchComponents = (elements, searchValue) =>
  elementsSearchIndex
    .get(searchValue)
    .map(item => _get(elements, item._ref));

export const searchComponentProperty = (properties, searchValue) =>
  Object
    .keys(properties)
    .filter(property => property.startsWith(searchValue))
    .reduce((acc, key) => ({
      ...acc,
      [key]: properties[key]
    }), {});
