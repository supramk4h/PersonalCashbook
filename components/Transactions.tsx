import React, { useState, useEffect } from 'react';
import { Transaction, Account, TransactionLine } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Edit2, Trash2, Plus, Minus, Check, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  nextVoucherNo: number;
  onSave: (tx: any) => void;
  onDelete: (id: string) => void;
}

const emptyLine = (accounts: Account[]): TransactionLine => ({
  id: Math.random().toString(36).substr(2, 9),
  accountId: accounts[0]?.id || '',
  narration: '',
  dr: 0,
  cr: 0
});

export const Transactions: React.FC<TransactionsProps> = ({ transactions, accounts, nextVoucherNo, onSave, onDelete }) => {
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({});

  useEffect(() => {
    if (transactions.length > 0 && viewIndex === null) {
      setViewIndex(transactions.length - 1);
    }
  }, [transactions.length]);

  const currentTx = viewIndex !== null ? transactions[viewIndex] : null;

  const handleNew = () => {
    if (accounts.length === 0) return alert('Create accounts first');
    setFormData({
      voucherNo: nextVoucherNo,
      date: new Date().toISOString().slice(0, 10),
      narration: '',
      lines: [emptyLine(accounts), emptyLine(accounts)],
      posted: false
    });
    setIsEditing(true);
  };

  const handleEdit = () => {
    if (!currentTx) return;
    setFormData(JSON.parse(JSON.stringify(currentTx)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleSave = (post: boolean) => {
    if (!formData.lines) return;
    
    // Validate
    const drTotal = formData.lines.reduce((s, l) => s + (l.dr || 0), 0);
    const crTotal = formData.lines.reduce((s, l) => s + (l.cr || 0), 0);
    
    if (Math.abs(drTotal - crTotal) > 0.01) {
      alert(`Totals do not match! DR: ${drTotal.toFixed(2)}, CR: ${crTotal.toFixed(2)}`);
      return;
    }

    if (formData.lines.length < 2) {
      alert('At least 2 lines required');
      return;
    }

    onSave({ ...formData, posted: post });
    setIsEditing(false);
  };

  const updateLine = (idx: number, field: keyof TransactionLine, value: any) => {
    if (!formData.lines) return;
    const newLines = [...formData.lines];
    const line = { ...newLines[idx] };

    // Logic for mutual exclusivity
    if (field === 'dr') {
      line.dr = parseFloat(value) || 0;
      if (line.dr > 0) line.cr = 0;
    } else if (field === 'cr') {
      line.cr = parseFloat(value) || 0;
      if (line.cr > 0) line.dr = 0;
    } else {
      // @ts-ignore
      line[field] = value;
    }
    
    newLines[idx] = line;
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => {
    if (!formData.lines) return;
    setFormData({ ...formData, lines: [...formData.lines, emptyLine(accounts)] });
  };

  const removeLine = (idx: number) => {
    if (!formData.lines || formData.lines.length <= 1) return;
    setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== idx) });
  };

  const drTotal = formData.lines?.reduce((s, l) => s + (l.dr || 0), 0) || 0;
  const crTotal = formData.lines?.reduce((s, l) => s + (l.cr || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">
               {isEditing ? (formData.id ? `Edit Voucher #${formData.voucherNo}` : 'New Voucher') : (currentTx ? `Voucher #${currentTx.voucherNo}` : 'Transactions')}
            </h2>
            {!isEditing && currentTx && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${currentTx.posted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {currentTx.posted ? 'POSTED' : 'DRAFT'}
              </span>
            )}
          </div>

          {!isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleNew} variant="primary" size="sm"><Plus className="w-4 h-4 mr-1"/> New</Button>
              <Button onClick={handleEdit} disabled={!currentTx} variant="secondary" size="sm"><Edit2 className="w-4 h-4 mr-1"/> Edit</Button>
              <Button onClick={() => currentTx && confirm('Delete?') && onDelete(currentTx.id)} disabled={!currentTx} variant="danger" size="sm"><Trash2 className="w-4 h-4 mr-1"/> Delete</Button>
            </div>
          )}
        </div>

        {/* Navigation if not editing */}
        {!isEditing && transactions.length > 0 && (
          <div className="flex justify-center items-center gap-2 mt-4 border-t pt-4">
             <button onClick={() => setViewIndex(0)} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30" disabled={viewIndex === 0}><ChevronsLeft className="w-4 h-4"/></button>
             <button onClick={() => setViewIndex(prev => Math.max(0, (prev||0)-1))} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30" disabled={viewIndex === 0}><ChevronLeft className="w-4 h-4"/></button>
             <span className="text-sm font-medium min-w-[100px] text-center">{viewIndex! + 1} of {transactions.length}</span>
             <button onClick={() => setViewIndex(prev => Math.min(transactions.length-1, (prev||0)+1))} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30" disabled={viewIndex === transactions.length-1}><ChevronRight className="w-4 h-4"/></button>
             <button onClick={() => setViewIndex(transactions.length-1)} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30" disabled={viewIndex === transactions.length-1}><ChevronsRight className="w-4 h-4"/></button>
          </div>
        )}
      </Card>

      {/* Editor or Viewer */}
      {isEditing ? (
        <Card className="border-blue-200 ring-4 ring-blue-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input label="Voucher No" value={formData.voucherNo} disabled readOnly className="bg-gray-100" />
            <Input label="Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            <div className="md:col-span-2">
              <Input label="Narration (Optional)" value={formData.narration} onChange={e => setFormData({...formData, narration: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-2">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Account</div>
              <div className="col-span-3">Narration</div>
              <div className="col-span-2 text-right">Debit</div>
              <div className="col-span-2 text-right">Credit</div>
            </div>
            
            {formData.lines?.map((line, idx) => (
              <div key={line.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200">
                <div className="col-span-1 text-gray-400 text-sm pl-2">{idx + 1}</div>
                <div className="col-span-4">
                  <select 
                    className="w-full p-2 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={line.accountId}
                    onChange={e => updateLine(idx, 'accountId', e.target.value)}
                  >
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <input className="w-full p-2 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-sm" placeholder="Line detail..." value={line.narration} onChange={e => updateLine(idx, 'narration', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <input className="w-full p-2 text-right bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-sm" type="number" placeholder="0.00" value={line.dr || ''} onChange={e => updateLine(idx, 'dr', e.target.value)} />
                </div>
                <div className="col-span-2 relative group">
                  <input className="w-full p-2 text-right bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-sm" type="number" placeholder="0.00" value={line.cr || ''} onChange={e => updateLine(idx, 'cr', e.target.value)} />
                  <button onClick={() => removeLine(idx)} className="absolute right-full top-1/2 -translate-y-1/2 mr-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><X className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
             <Button variant="secondary" size="sm" onClick={addLine}><Plus className="w-4 h-4 mr-1"/> Add Line</Button>
             <div className="text-right flex gap-6 text-sm">
                <div>
                   <span className="text-gray-500 mr-2">Total Debit:</span>
                   <span className="font-bold">{drTotal.toFixed(2)}</span>
                </div>
                <div>
                   <span className="text-gray-500 mr-2">Total Credit:</span>
                   <span className={`font-bold ${Math.abs(drTotal-crTotal) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>{crTotal.toFixed(2)}</span>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
            <Button variant="primary" onClick={() => handleSave(false)}>Save Draft</Button>
            <Button variant="success" onClick={() => handleSave(true)}>Post Entry</Button>
          </div>
        </Card>
      ) : currentTx ? (
        <Card>
          <div className="mb-4 text-sm text-gray-500">
             Date: {currentTx.date} <br/>
             {currentTx.narration && <span className="italic">{currentTx.narration}</span>}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
               <tr>
                 <th className="p-2 text-left">Account</th>
                 <th className="p-2 text-left">Line Narration</th>
                 <th className="p-2 text-right">Debit</th>
                 <th className="p-2 text-right">Credit</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentTx.lines.map((line, i) => {
                 const acc = accounts.find(a => a.id === line.accountId);
                 return (
                   <tr key={i}>
                      <td className="p-2 font-medium">{acc?.name || 'Unknown'}</td>
                      <td className="p-2 text-gray-500">{line.narration}</td>
                      <td className="p-2 text-right">{line.dr ? line.dr.toFixed(2) : '-'}</td>
                      <td className="p-2 text-right">{line.cr ? line.cr.toFixed(2) : '-'}</td>
                   </tr>
                 );
              })}
            </tbody>
            <tfoot className="font-bold bg-gray-50">
               <tr>
                 <td colSpan={2} className="p-2 text-right">Totals</td>
                 <td className="p-2 text-right">{currentTx.lines.reduce((s,l)=>s+(l.dr||0),0).toFixed(2)}</td>
                 <td className="p-2 text-right">{currentTx.lines.reduce((s,l)=>s+(l.cr||0),0).toFixed(2)}</td>
               </tr>
            </tfoot>
          </table>
        </Card>
      ) : (
         <div className="text-center py-10 text-gray-400 bg-white rounded border border-dashed">
            No transactions found. Click "New" to create one.
         </div>
      )}
    </div>
  );
};
