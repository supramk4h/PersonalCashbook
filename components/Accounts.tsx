import React, { useState } from 'react';
import { Account } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Edit2, Trash2, PlusCircle } from 'lucide-react';

interface AccountsProps {
  accounts: Account[];
  balances: Record<string, number>;
  onAdd: (acc: Omit<Account, 'id' | 'serial'>) => void;
  onUpdate: (id: string, acc: Partial<Account>) => void;
  onDelete: (id: string) => void;
}

const INITIAL_FORM = { name: '', type: '', narration: '', openingBalance: '0' };

export const Accounts: React.FC<AccountsProps> = ({ accounts, balances, onAdd, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload = {
      name: formData.name,
      type: formData.type,
      narration: formData.narration,
      openingBalance: parseFloat(formData.openingBalance) || 0
    };

    if (editingId) {
      onUpdate(editingId, payload);
      setEditingId(null);
    } else {
      onAdd(payload);
    }
    setFormData(INITIAL_FORM);
  };

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id);
    setFormData({
      name: acc.name,
      type: acc.type,
      narration: acc.narration,
      openingBalance: acc.openingBalance.toString()
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
  };

  const sortedAccounts = [...accounts].sort((a, b) => a.serial - b.serial);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card title={editingId ? 'Edit Account' : 'New Account'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Account Name" 
              placeholder="e.g. Wallet, Chase Bank" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
            <Input 
              label="Type" 
              placeholder="e.g. Cash, Bank, Income, Expense" 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            />
            <Input 
              label="Narration" 
              placeholder="Optional description" 
              value={formData.narration}
              onChange={e => setFormData({...formData, narration: e.target.value})}
            />
            <Input 
              label="Opening Balance" 
              type="number"
              step="0.01"
              value={formData.openingBalance}
              onChange={e => setFormData({...formData, openingBalance: e.target.value})}
            />
            
            <div className="flex gap-2 pt-2">
              <Button type="submit" variant={editingId ? 'primary' : 'success'} className="flex-1">
                {editingId ? 'Update' : 'Create Account'}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card title="Account List">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="p-3 rounded-tl-lg">#</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Opening</th>
                  <th className="p-3 text-right">Current</th>
                  <th className="p-3 rounded-tr-lg text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedAccounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-400">No accounts created yet.</td>
                  </tr>
                )}
                {sortedAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-gray-500">{acc.serial}</td>
                    <td className="p-3 font-medium text-gray-800">{acc.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs uppercase tracking-wide">
                        {acc.type || 'General'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-gray-500">
                      {acc.openingBalance.toFixed(2)}
                    </td>
                    <td className={`p-3 text-right font-medium ${(balances[acc.id] || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {(balances[acc.id] || 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(acc)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { if(confirm('Delete account?')) onDelete(acc.id); }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
