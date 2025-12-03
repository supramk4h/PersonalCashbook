import { AppState, BackupMetadata } from '../types';

const STORAGE_KEY = 'personal_ledger_react_v1';
const BACKUP_KEY_PREFIX = 'ledger_backup_';
const MAX_BACKUPS = 20;

export const loadState = (): AppState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  return null;
};

export const saveState = (state: AppState): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('Failed to save state', e);
    return false;
  }
};

export const createBackup = (state: AppState, type: 'manual' | 'auto' = 'manual'): string | null => {
  try {
    const timestamp = new Date().toISOString();
    const backupKey = BACKUP_KEY_PREFIX + timestamp;
    const backupData = {
      ...state,
      _backupTime: timestamp,
      _version: '2.0',
      _backupType: type
    };
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    cleanupOldBackups();
    return backupKey;
  } catch (e) {
    console.error('Failed to create backup', e);
    return null;
  }
};

const cleanupOldBackups = () => {
  try {
    const backups: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BACKUP_KEY_PREFIX)) {
        backups.push(key);
      }
    }
    if (backups.length > MAX_BACKUPS) {
      backups.sort().reverse(); // Newest first
      const toRemove = backups.slice(MAX_BACKUPS);
      toRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (e) {
    console.error('Failed to cleanup backups', e);
  }
};

export const listBackups = (): BackupMetadata[] => {
  const backups: BackupMetadata[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BACKUP_KEY_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const data = JSON.parse(raw);
          backups.push({
            key,
            timestamp: data._backupTime,
            type: data._backupType || 'manual',
            accountsCount: data.accounts?.length || 0,
            transactionsCount: data.transactions?.length || 0
          });
        }
      }
    }
  } catch (e) {
    console.error('Failed to list backups', e);
  }
  return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const restoreBackup = (key: string): AppState | null => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const data = JSON.parse(raw);
      // Strip backup metadata
      const { _backupTime, _version, _backupType, ...cleanState } = data;
      return cleanState as AppState;
    }
  } catch (e) {
    console.error('Failed to restore backup', e);
  }
  return null;
};
