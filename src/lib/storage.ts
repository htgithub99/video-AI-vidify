import _ from "lodash";
import { appError } from "./logger.js";
import { REFACTOR_CONSTANTS } from "../constants/refactor.js";

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
  get: (key: string): string | null => {
    try {
      const storage = typeof window !== "undefined" ? window.localStorage : typeof globalThis !== "undefined" ? (globalThis as any).localStorage : null;
      if (storage) return storage.getItem(key);
    } catch (error) {
      appError(_.join([REFACTOR_CONSTANTS.LOG_ERROR_READ_LOCAL, key], REFACTOR_CONSTANTS.VD_EMPTY_STRING), error);
    }
    return null;
  },
  set: (key: string, value: string): void => {
    try {
      const storage = typeof window !== "undefined" ? window.localStorage : typeof globalThis !== "undefined" ? (globalThis as any).localStorage : null;
      if (storage) {
        storage.setItem(key, value);
        if (typeof window !== "undefined") window.dispatchEvent(new Event(REFACTOR_CONSTANTS.DB_EVENT_STORAGE));
      }
    } catch (error) {
      appError(_.join([REFACTOR_CONSTANTS.LOG_ERROR_WRITE_LOCAL, key], REFACTOR_CONSTANTS.VD_EMPTY_STRING), error);
    }
  },
  remove: (key: string): void => {
    try {
      const storage = typeof window !== "undefined" ? window.localStorage : typeof globalThis !== "undefined" ? (globalThis as any).localStorage : null;
      if (storage) {
        storage.removeItem(key);
        if (typeof window !== "undefined") window.dispatchEvent(new Event(REFACTOR_CONSTANTS.DB_EVENT_STORAGE));
      }
    } catch (error) {
      appError(_.join([REFACTOR_CONSTANTS.LOG_ERROR_REMOVE_LOCAL, key], REFACTOR_CONSTANTS.VD_EMPTY_STRING), error);
    }
  },
  getAsync: async (key: string): Promise<string | null> => {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(REFACTOR_CONSTANTS.DB_STORE_NAME, REFACTOR_CONSTANTS.DB_MODE_READONLY as IDBTransactionMode);
        const request = transaction.objectStore(REFACTOR_CONSTANTS.DB_STORE_NAME).get(key);
        request.onsuccess = () => resolve(_.defaultTo(request.result, null));
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      appError(REFACTOR_CONSTANTS.LOG_ERROR_READ_IDB, error);
      return null;
    }
  },
  setAsync: async (key: string, value: string): Promise<void> => {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(REFACTOR_CONSTANTS.DB_STORE_NAME, REFACTOR_CONSTANTS.DB_MODE_READWRITE as IDBTransactionMode);
        const request = transaction.objectStore(REFACTOR_CONSTANTS.DB_STORE_NAME).put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      appError(REFACTOR_CONSTANTS.LOG_ERROR_WRITE_IDB, error);
    }
  },
  removeAsync: async (key: string): Promise<void> => {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(REFACTOR_CONSTANTS.DB_STORE_NAME, REFACTOR_CONSTANTS.DB_MODE_READWRITE as IDBTransactionMode);
        const request = transaction.objectStore(REFACTOR_CONSTANTS.DB_STORE_NAME).delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      appError(REFACTOR_CONSTANTS.LOG_ERROR_REMOVE_IDB, error);
    }
  },
  clearAsync: async (): Promise<void> => {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(REFACTOR_CONSTANTS.DB_STORE_NAME, REFACTOR_CONSTANTS.DB_MODE_READWRITE as IDBTransactionMode);
        const request = transaction.objectStore(REFACTOR_CONSTANTS.DB_STORE_NAME).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      appError(REFACTOR_CONSTANTS.LOG_ERROR_CLEAR_IDB, error);
    }
  },
};
