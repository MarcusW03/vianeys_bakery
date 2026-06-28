import type { StorageAdapter } from './types';
import { LocalStorageAdapter } from './local';
import { BlobStorageAdapter } from './blob';

let _adapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!_adapter) {
    _adapter =
      process.env.STORAGE_PROVIDER === 'local'
        ? new LocalStorageAdapter()
        : new BlobStorageAdapter();
  }
  return _adapter;
}
