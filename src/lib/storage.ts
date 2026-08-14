import _ from 'lodash';
import { appError } from './logger.js';
import { REFACTOR_CONSTANTS } from '../constants/refactor.js';

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (_.eq(typeof window, REFACTOR_CONSTANTS.TYPE_UNDEFINED) || !window.indexedDB) {
      reject(new Error(REFACTOR_CONSTANTS.ERR_SAVE_CONFIG_LOCAL_STORAGE));
      return;
    }
    const request = window.indexedDB.open(REFACTOR_CONSTANTS.DB_NAME, REFACTOR_CONSTANTS.DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(REFACTOR_CONSTANTS.DB_STORE_NAME)) {
        db.createObjectStore(REFACTOR_CONSTANTS.DB_STORE_NAME);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
  return dbPromise;
};

export const storageUtils = {
  get: (key: string): string | null => { try { if (!_.eq(typeof window, REFACTOR_CONSTANTS.TYPE_UNDEFINED)) return window.localStorage.getItem(key); } catch (error) { appError(_.join([REFACTOR_CONSTANTS.LOG_ERROR_READ_LOCAL, key], REFACTOR_CONSTANTS.VD_EMPTY_STRING), error); } return null; },
  set: (key: string, value: string): void => { try { if (!_.eq(typeof window, REFACTOR_CONSTANTS.TYPE_UNDEFINED)) { window.localStorage.setItem(key, value); window.dispatchEvent(new Event(REFACTOR_CONSTANTS.DB_EVENT_STORAGE)); } } catch (error) { appError(_.join([REFACTOR_CONSTANTS.LOG_ERROR_WRITE_LOCAL, key], REFACTOR_CONSTANTS.VD_EMPTY_STRING), error); } },
  remove: (key: string): void => { try { if (!_.eq(typeof window, REFACTOR_CONSTANTS.TYPE_UNDEFINED)) { window.localStorage.removeItem(key); window.dispatchEvent(new Event(REFACTOR_CONSTANTS.DB_EVENT_STORAGE)); } } catch (error) { appError(_.join([REFACTOR_CONSTANTS.LOG_ERROR_REMOVE_LOCAL, key], REFACTOR_CONSTANTS.VD_EMPTY_STRING), error); } },
  getAsync: async (key: string): Promise<string | null> => {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(
          REFACTOR_CONSTANTS.DB_STORE_NAME,
          REFACTOR_CONSTANTS.DB_MODE_READONLY as IDBTransactionMode,
        );
        const request = transaction.objectStore(REFACTOR_CONSTANTS.DB_STORE_NAME).get(key);
        request.onsuccess = () => resolve(_.defaultTo(request.result, null));
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      appError(_.join([REFACTOR_CONSTANTS.LOG_ERROR_READ_IDB, key], REFACTOR_CONSTANTS.VD_EMPTY_STRING), error);
      return storageUtils.get(key);
    }
  },
  setAsync: async (key: string, value: string): Promise<void> => {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(
          REFACTOR_CONSTANTS.DB_STORE_NAME,
          REFACTOR_CONSTANTS.DB_MODE_READWRITE as IDBTransactionMode,
        );
        const request = transaction.objectStore(REFACTOR_CONSTANTS.DB_STORE_NAME).put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      if (!_.eq(typeof window, REFACTOR_CONSTANTS.TYPE_UNDEFINED)) {
        window.dispatchEvent(new Event(REFACTOR_CONSTANTS.DB_EVENT_STORAGE));
      }
    } catch (error) {
      appError(_.join([REFACTOR_CONSTANTS.LOG_ERROR_WRITE_IDB, key], REFACTOR_CONSTANTS.VD_EMPTY_STRING), error);
      storageUtils.set(key, value);
    }
  },
  removeAsync: async (key: string): Promise<void> => {
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(
          REFACTOR_CONSTANTS.DB_STORE_NAME,
          REFACTOR_CONSTANTS.DB_MODE_READWRITE as IDBTransactionMode,
        );
        const request = transaction.objectStore(REFACTOR_CONSTANTS.DB_STORE_NAME).delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      if (!_.eq(typeof window, REFACTOR_CONSTANTS.TYPE_UNDEFINED)) {
        window.dispatchEvent(new Event(REFACTOR_CONSTANTS.DB_EVENT_STORAGE));
      }
    } catch (error) {
      appError(_.join([REFACTOR_CONSTANTS.LOG_ERROR_REMOVE_IDB, key], REFACTOR_CONSTANTS.VD_EMPTY_STRING), error);
      storageUtils.remove(key);
    }
  },
};
