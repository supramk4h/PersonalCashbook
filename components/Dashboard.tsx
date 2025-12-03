import React, { useRef } from 'react';
import { AppState } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Upload, Trash2, Save, History } from 'lucide-react';
import * as Storage from '../services/storage';

interface DashboardProps {
  state: AppState;
  accountBalances: Record<string, number>;
  onClear: () => void;
  onImport: (data: AppState) => void;
  onBackup: () => void;
  onRestore: (key: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, accountBalances, onClear, onImport, onBackup, onRestore }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate Totals
  const totalCash = state.accounts
    .filter(a => a.type.toLowerCase().includes('cash'))
    .reduce((sum, a) => sum + (accountBalances[a.id] || 0), 0);

  const totalBank = state.accounts
    .filter(a => a.type.toLowerCase().includes('bank'))
    .reduce((sum, a) => sum + (accountBalances[a.id] || 0), 0);
  
  const totalBalance = totalCash + totalBank;

  const postedTxs = state.transactions.filter(t => t.posted).length;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (confirm('Importing will replace current data. Continue?')) {
            onImport(data);
          }
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const backups = Storage.listBackups();

  const chartData = [
    { name: 'Cash', value: totalCash },
    { name: 'Bank', value: totalBank },
  ].filter(d => d.value > 0);

  const COLORS = ['#10B981', '#3B82F6'];

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Balance">
          <div className="text-3xl font-bold text-gray-800">
            {totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
          <div className="text-xs text-gray-500 mt-2">Cash + Bank Accounts</div>
        </Card>

        <Card title="Cash on Hand">
          <div className="text-2xl font-semibold text-emerald-600">
            {totalCash.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
          <div className="text-xs text-gray-500 mt-2">Physical Currency</div>
        </Card>

        <Card title="Bank Accounts">
          <div className="text-2xl font-semibold text-blue-600">
            {totalBank.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
          <div className="text-xs text-gray-500 mt-2">Digital Currency</div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Summary & Chart */}
        <div className="lg:col-span-2 space-y-6">
           <Card title="Distribution">
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/>
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No balance data to visualize
                  </div>
                )}
              </div>
           </Card>

           <Card title="Quick Stats">
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-xl font-bold text-gray-700">{state.accounts.length}</div>
                  <div className="text-xs text-gray-500 uppercase">Accounts</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-xl font-bold text-gray-700">{postedTxs}</div>
                  <div className="text-xs text-gray-500 uppercase">Posted Txs</div>
                </div>
             </div>
           </Card>
        </div>

        {/* Right: Actions & Backups */}
        <div className="space-y-6">
          <Card title="Data Management">
            <div className="flex flex-col gap-3">
              <Button variant="primary" onClick={onBackup} className="w-full justify-start">
                <Save className="w-4 h-4 mr-2" />
                Create Backup
              </Button>
              <Button variant="secondary" onClick={handleExport} className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Import JSON
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange} 
              />
              <div className="h-px bg-gray-100 my-2"></div>
              <Button variant="danger" onClick={onClear} className="w-full justify-start">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </Card>

          <Card title="Recent Backups">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {backups.length === 0 && <div className="text-sm text-gray-400">No backups found</div>}
              {backups.map((backup) => (
                <div key={backup.key} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 text-sm">
                  <div>
                    <div className="font-medium">{new Date(backup.timestamp).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">{new Date(backup.timestamp).toLocaleTimeString()} • {backup.type}</div>
                  </div>
                  <button 
                    onClick={() => { if(confirm('Restore this backup? Current data will be replaced.')) onRestore(backup.key); }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Restore"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
