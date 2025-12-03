import React, { useState } from 'react';
import { useLedger } from './hooks/useLedger';
import { Dashboard } from './components/Dashboard';
import { Accounts } from './components/Accounts';
import { Transactions } from './components/Transactions';
import { Reports } from './components/Reports';
import { LayoutDashboard, Wallet, Receipt, BarChart3, Menu, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function App() {
  const { 
    state, isLoaded, status, 
    addAccount, updateAccount, deleteAccount, 
    saveTransaction, deleteTransaction, 
    importData, clearAllData, performBackup, performRestore, 
    accountBalances 
  } = useLedger();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'transactions' | 'reports'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Ledger...</div>;

  const NavItem = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'text-gray-600 hover:bg-white hover:text-blue-600'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row">
      
      {/* Toast Notification */}
      {status && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down text-white ${
          status.type === 'success' ? 'bg-green-600' : status.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
          <span className="font-medium text-sm">{status.msg}</span>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <h1 className="text-lg font-bold text-gray-800">Ledger Pro</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky md:top-0 inset-y-0 left-0 z-30 w-64 bg-gray-50/50 border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 p-4 flex flex-col
        ${mobileMenuOpen ? 'translate-x-0 bg-white' : '-translate-x-full'}
      `}>
        <div className="mb-8 px-4 mt-2">
          <h1 className="text-xl font-extrabold text-blue-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">L</div>
            Ledger Pro
          </h1>
          <p className="text-xs text-gray-400 mt-1 pl-10">v2.1 Personal Edition</p>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
          <NavItem id="accounts" label="Accounts" icon={Wallet} />
          <NavItem id="transactions" label="Transactions" icon={Receipt} />
          <NavItem id="reports" label="Reports" icon={BarChart3} />
        </nav>

        <div className="p-4 bg-blue-50 rounded-xl mt-auto">
          <h4 className="text-xs font-semibold text-blue-800 uppercase mb-1">Status</h4>
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            System Ready
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <header className="mb-8 hidden md:block">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h2>
          <p className="text-gray-500 text-sm">Manage your personal finances with precision.</p>
        </header>

        <div className="animate-fade-in">
          {activeTab === 'dashboard' && (
            <Dashboard 
              state={state} 
              accountBalances={accountBalances}
              onClear={clearAllData}
              onImport={importData}
              onBackup={performBackup}
              onRestore={performRestore}
            />
          )}
          {activeTab === 'accounts' && (
             <Accounts 
               accounts={state.accounts} 
               balances={accountBalances}
               onAdd={addAccount}
               onUpdate={updateAccount}
               onDelete={deleteAccount}
             />
          )}
          {activeTab === 'transactions' && (
             <Transactions 
               transactions={state.transactions}
               accounts={state.accounts}
               nextVoucherNo={state.meta.nextVoucherNo}
               onSave={saveTransaction}
               onDelete={deleteTransaction}
             />
          )}
          {activeTab === 'reports' && (
             <Reports 
               accounts={state.accounts}
               transactions={state.transactions}
             />
          )}
        </div>
      </main>
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
