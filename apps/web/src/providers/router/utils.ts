import { logger } from '~/lib/logger';

export interface SortOptions {
  sortBy: string
  order: 'asc' | 'desc'
}

type StorageKey = '__sort-options__';
type StoredValue<T extends StorageKey> = T extends '__sort-options__' ? SortOptions : never;

export function getStoredValue<T extends StorageKey>(key: T): StoredValue<T> | null {
  try {
    const itemValue = localStorage.getItem(key);
    if (typeof itemValue === 'string')
      return JSON.parse(itemValue);

    return null;
  } catch (error) {
    logger.warn({ key, error }, '获取搜索参数持久化值失败');
    return null;
  }
}

export function setStoredValue<T extends StorageKey>(key: T, value: StoredValue<T>): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.warn({ key, value, error }, '设置搜索参数持久化值失败');
  }
}
