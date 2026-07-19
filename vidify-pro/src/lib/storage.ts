import _ from 'lodash';
import { appError } from './logger';

export const storageUtils = {
  get: (key: string): string | null => {
    try {
      if (!_.eq(typeof window, 'undefined')) {
        return window.localStorage.getItem(key);
      }
    } catch (error) {
      appError(`ERROR_READING_STORAGE_KEY: ${key}`, error);
    }
    return null;
  },

  set: (key: string, value: string): void => {
    try {
      if (!_.eq(typeof window, 'undefined')) {
        window.localStorage.setItem(key, value);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      appError(`ERROR_WRITING_STORAGE_KEY: ${key}`, error);
    }
  },

  remove: (key: string): void => {
    try {
      if (!_.eq(typeof window, 'undefined')) {
        window.localStorage.removeItem(key);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      appError(`ERROR_REMOVING_STORAGE_KEY: ${key}`, error);
    }
  },
};
