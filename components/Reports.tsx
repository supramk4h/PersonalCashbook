import React, { useState, useMemo } from 'react';
import { Account, Transaction } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Search } from 'lucide-react';

interface ReportsProps {
  accounts: Account[];
  transactions: Transaction[];
}

export const Reports: React.FC<ReportsProps> = ({ accounts, transactions }) => {
  const [filters, setFilters] = useState({
    accountId: '',
    startDate: '',
    endDate: ''
  });

  const reportData = useMemo(() => {
    // 1. Filter Posted Transactions
    let relevantTxs = transactions.filter(t => t.posted);

    // 2. Sort by date + voucher
    relevantTxs.sort((a, b) => {
       const d = new Date(a.date).getTime() - new Date(b.date).getTime();
       return d === 0 ? a.voucherNo - b.voucherNo : d;
    });

    // 3. Opening Balance Logic
    let openingBalance = 0;
    const targetAccount = accounts.find(a => a.id === filters.accountId);
    
    if (targetAccount) {
      openingBalance = targetAccount.openingBalance;
      
      // If start date is set, calculate balance up to that date
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        const preTxs = relevantTxs.filter(t => new Date(t.date).getTime() < start);
        preTxs.forEach(t => {
           t.lines.forEach(l => {
              if (l.accountId === filters.accountId) {
                openingBalance += (l.dr - l.cr);
              }
           });
        });
        
        // Filter visible transactions for the table
        relevantTxs = relevantTxs.filter(t => new Date(t.date).getTime() >= start);
      }
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      relevantTxs = relevantTxs.filter(t => new Date(t.date).getTime() <= end);
    }

    // 4. Build Rows
    const rows: any[] = [];
    let running = openingBalance;
    let totalDr = 0;
    let totalCr = 0;

    relevantTxs.forEach(t => {
       t.lines.forEach(l => {
         // If filtering by account, only show lines for that account
         if (filters.accountId && l.accountId !== filters.accountId) return;

         const dr = l.dr || 0;
         const cr = l.cr || 0;
         
         if (filters.accountId) {
           running = running + dr - cr;
         }
         
         totalDr += dr;
         totalCr += cr;

         rows.push({
           id: l.id,
           voucherNo: t.voucherNo,
           date: t.date,
           narration: l.narration || t.narration,
           accountName: filters.accountId ? '' : accounts.find(a=>a.id===l.accountId)?.name,
           dr,
           cr,
           balance: filters.accountId ? running : null
         });
       });
    });

    return { rows, openingBalance, totalDr, totalCr, finalBalance: running };

  }, [transactions, accounts, filters]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
           <div className="md:col-span-1">
             <label className="text-xs font-medium text-gray-500 mb-1 block">Account</label>
             <select 
               className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
               value={filters.accountId}
               onChange={e => setFilters({...filters, accountId: e.target.value})}
             >
               <option value="">-- All Transactions --</option>
               {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
             </select>
           </div>
           <Input type="date" label="From" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
           <Input type="date" label="To" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
           <Button onClick={() => {}} className="md:col-span-1 h-[38px]"><Search className="w-4 h-4 mr-2"/> Refresh</Button>
        </div>
      </Card>

      <Card title="Report Result">
        {filters.accountId && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg flex justify-between font-medium text-sm">
             <span>Opening Balance: {reportData.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
             <span>Closing Balance: {reportData.finalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
             <thead className="bg-gray-50 text-gray-500">
               <tr>
                 <th className="p-2 text-left">Date</th>
                 <th className="p-2 text-left">Voucher</th>
                 {!filters.accountId && <th className="p-2 text-left">Account</th>}
                 <th className="p-2 text-left">Narration</th>
                 <th className="p-2 text-right">Debit</th>
                 <th className="p-2 text-right">Credit</th>
                 {filters.accountId && <th className="p-2 text-right">Balance</th>}
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {reportData.rows.length === 0 && (
                 <tr><td colSpan={7} className="p-8 text-center text-gray-400">No records found for selected criteria.</td></tr>
               )}
               {reportData.rows.map(row => (
                 <tr key={row.id} className="hover:bg-gray-50">
                    <td className="p-2 text-gray-600 whitespace-nowrap">{row.date}</td>
                    <td className="p-2 text-gray-600">{row.voucherNo}</td>
                    {!filters.accountId && <td className="p-2 font-medium">{row.accountName}</td>}
                    <td className="p-2 text-gray-600 max-w-xs truncate">{row.narration}</td>
                    <td className="p-2 text-right">{row.dr ? row.dr.toFixed(2) : '-'}</td>
                    <td className="p-2 text-right">{row.cr ? row.cr.toFixed(2) : '-'}</td>
                    {filters.accountId && <td className="p-2 text-right font-medium text-gray-700">{row.balance.toFixed(2)}</td>}
                 </tr>
               ))}
             </tbody>
             <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                <tr>
                  <td colSpan={filters.accountId ? 3 : 4} className="p-2 text-right">Totals</td>
                  <td className="p-2 text-right">{reportData.totalDr.toFixed(2)}</td>
                  <td className="p-2 text-right">{reportData.totalCr.toFixed(2)}</td>
                  {filters.accountId && <td className="p-2"></td>}
                </tr>
             </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
};
