import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, Account, Transaction, MetaData } from '../types';
import * as Storage from '../services/storage';

const INITIAL_STATE: AppState = {
  accounts: [],
  transactions: [],
  meta: {
    nextAccountSerial: 1,
    nextVoucherNo: 1,
    lastPostedSnapshot: null,
    saveCount: 0
  }
};

export const useLedger = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Load on mount
  useEffect(() => {
    const loaded = Storage.loadState();
    if (loaded) {
      setState(loaded);
    }
    setIsLoaded(true);
  }, []);

  // Auto-save & backup logic
  useEffect(() => {
    if (!isLoaded) return;
    
    // Save to local storage
    const success = Storage.saveState(state);
    
    // Simple status update
    if (success) {
      // Logic for auto-backup every 10 changes/saves could go here, 
      // but strictly we'd need to track changes. For now, we update saveCount.
    }
  }, [state, isLoaded]);

  const showStatus = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus(null), 3000);
  };

  const addAccount = (account: Omit<Account, 'id' | 'serial'>) => {
    const newAccount: Account = {
      ...account,
      id: `acc_${Math.random().toString(36).substr(2, 9)}`,
      serial: state.meta.nextAccountSerial
    };
    
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAccount],
      meta: { ...prev.meta, nextAccountSerial: prev.meta.nextAccountSerial + 1 }
    }));
    showStatus('Account created', 'success');
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
    showStatus('Account updated', 'success');
  };

  const deleteAccount = (id: string) => {
    if (state.transactions.some(t => t.lines.some(l => l.accountId === id))) {
      showStatus('Cannot delete account used in transactions', 'error');
      return;
    }
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id)
    }));
    showStatus('Account deleted', 'success');
  };

  const saveTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'> & { id?: string }) => {
    const timestamp = Date.now();
    
    setState(prev => {
      let nextVoucherNo = prev.meta.nextVoucherNo;
      let newTxList = [...prev.transactions];

      if (tx.id) {
        // Update existing
        newTxList = newTxList.map(t => t.id === tx.id ? { ...t, ...tx, timestamp } as Transaction : t);
      } else {
        // Create new
        const newTx: Transaction = {
          ...tx,
          id: `tx_${Math.random().toString(36).substr(2, 9)}`,
          timestamp,
          posted: tx.posted
        };
        newTxList.push(newTx);
        // Only increment voucher if we are using the auto-generated one
        if (tx.voucherNo >= nextVoucherNo) {
          nextVoucherNo = tx.voucherNo + 1;
        }
      }
      
      return {
        ...prev,
        transactions: newTxList,
        meta: { ...prev.meta, nextVoucherNo }
      };
    });
    showStatus(tx.posted ? 'Transaction posted' : 'Draft saved', 'success');
  };

  const deleteTransaction = (id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
    showStatus('Transaction deleted', 'success');
  };

  const importData = (data: AppState) => {
    Storage.createBackup(state, 'manual'); // Backup before overwrite
    setState(data);
    showStatus('Data imported successfully', 'success');
  };

  const clearAllData = () => {
    Storage.createBackup(state, 'manual');
    setState(INITIAL_STATE);
    showStatus('All data cleared', 'info');
  };

  const performBackup = () => {
    const key = Storage.createBackup(state, 'manual');
    if (key) showStatus('Backup created successfully', 'success');
    else showStatus('Backup failed', 'error');
  };

  const performRestore = (key: string) => {
    const backup = Storage.restoreBackup(key);
    if (backup) {
      Storage.createBackup(state, 'manual'); // Backup current before restore
      setState(backup);
      showStatus('System restored from backup', 'success');
    } else {
      showStatus('Failed to restore backup', 'error');
    }
  };

  // Derived state: Account Balances
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    state.accounts.forEach(a => {
      balances[a.id] = a.openingBalance;
    });
    
    state.transactions.filter(t => t.posted).forEach(t => {
      t.lines.forEach(l => {
        if (balances[l.accountId] !== undefined) {
          balances[l.accountId] += (l.dr - l.cr);
        }
      });
    });
    return balances;
  }, [state.accounts, state.transactions]);

  return {
    state,
    isLoaded,
    status,
    addAccount,
    updateAccount,
    deleteAccount,
    saveTransaction,
    deleteTransaction,
    importData,
    clearAllData,
    performBackup,
    performRestore,
    accountBalances
  };
};
