/*!
 * make-conf
 *
 * Copyright 2017-2019 Josh Swan
 * Released under the MIT license
 * https://github.com/joshswan/make-conf/blob/master/LICENSE
 */

import { camelCase, get, set } from 'lodash';

interface Source {
  [key: string]: any;
}

/**
 * Convert values to particular type
 * @param  {Mixed}  value Value to convert
 * @param  {String} type  Type to convert to
 * @return {Mixed}        Converted value
 */
function convert(value: any, type: string): any {
  switch (type) {
    case 'boolean':
      return /^(?:true|1)$/i.test(value);
    case 'number':
      return parseFloat(value);
    case 'string':
      return String(value);
    default:
      return value;
  }
}

/**
 * Determine if value is an object (and not an array)
 * @param  {Mixed}   value Value to test
 * @return {Boolean}
 */
function isObject(value: any): boolean {
  return typeof value === 'object' && !Array.isArray(value);
}

/**
 * Recursively merge source into destination
 * @param  {Object} destination Object to merge source into
 * @param  {Object} source      Object to merge into destination
 * @return {Object}             Merged object
 */
function reduce(destination: object, source: Source): object {
  // Reduce source object keys, using destination as initial value
  return Object.keys(source).reduce((reduced: object, sourceKey: string) => {
    // Create config key
    const key = sourceKey
      // Remove non-word characters
      .replace(/\W/g, '')
      // Split on double-underscore for nesting
      .split('__')
      // Remove empty values
      .filter(Boolean)
      // Convert keys to camel-case
      .map(str => camelCase(str))
      // Convert to single string with dot notation
      .join('.');

    // Get current value at key
    const destValue = get(destination, key);
    // Value to be merged
    const sourceValue = source[sourceKey];

    // Check if new value is an object
    if (isObject(sourceValue)) {
      // If so, merge recursively, and use current value as destination if object
      set(reduced, key, reduce(isObject(destValue) ? destValue : {}, sourceValue));
    } else {
      // Otherwise, set new value at key
      set(reduced, key, convert(sourceValue, typeof destValue));
    }

    return reduced;
  }, destination);
}

/**
 * Make config function
 * @param  {Object} destination Default/destination object
 * @param  {Object} sources     One or more objects to merge in
 * @return {Object}             Merged config object
 */
export default function makeConf(destination: object, ...sources: Source[]): object {
  // Add process.env to sources, if not included in sources
  if (process && process.env && !sources.includes(process.env)) {
    sources.push(process.env);
  }

  // Merge sources into destination
  return sources.reduce(reduce, destination);
}