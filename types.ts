export interface Account {
  id: string;
  serial: number;
  name: string;
  type: string;
  narration: string;
  openingBalance: number;
}

export interface TransactionLine {
  id: string;
  accountId: string;
  narration: string;
  dr: number;
  cr: number;
}

export interface Transaction {
  id: string;
  voucherNo: number;
  date: string;
  narration: string;
  lines: TransactionLine[];
  posted: boolean;
  timestamp: number;
}

export interface MetaData {
  nextAccountSerial: number;
  nextVoucherNo: number;
  lastPostedSnapshot: {
    timestamp: number;
    bank: number;
    cash: number;
  } | null;
  saveCount: number;
}

export interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  meta: MetaData;
}

export interface BackupMetadata {
  key: string;
  timestamp: string;
  type: 'manual' | 'auto';
  accountsCount: number;
  transactionsCount: number;
}
