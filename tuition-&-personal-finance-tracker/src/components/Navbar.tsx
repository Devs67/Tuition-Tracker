import React from 'react';
import {
  BookOpen,
  Wallet,
  Target,
  PlusCircle,
  Sun,
  Moon,
  RotateCcw,
  IndianRupee,
  ShoppingBag
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenAddTransaction: () => void;
  onOpenAddGoal: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  onOpenAddTransaction,
  onOpenAddGoal,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-200 bg-[#FFFDF6]/95 border-[#DCD3B8] dark:bg-[#121913]/95 dark:border-[#263529]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Identity */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab('tuition')}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1C2B22] text-[#FFFDF6] dark:bg-[#2e4738] dark:text-[#EAE4D0] shadow-sm ring-1 ring-black/5">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-[#1C2B22] dark:text-[#EAE4D0]">
                  PaisaLedger
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 ring-1 ring-emerald-300/40">
                  ₹ INR
                </span>
              </div>
              <p className="text-xs text-[#5B6856] dark:text-[#97A08C] hidden sm:block">
                Tuition Logger • Finance Tracker • Save to Buy
              </p>
            </div>
          </div>

          {/* 3 Core Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 p-1 rounded-full border bg-[#F6F1E4] border-[#DCD3B8] dark:bg-[#18221a] dark:border-[#2b3c2e]">
            <button
              id="nav-tab-tuition"
              onClick={() => setActiveTab('tuition')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'tuition'
                  ? 'bg-[#1C2B22] text-[#F6F1E4] shadow-sm dark:bg-[#2e4738] dark:text-[#EAE4D0]'
                  : 'text-[#5B6856] hover:text-[#1C2B22] dark:text-[#97A08C] dark:hover:text-[#EAE4D0]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Tuition Logger
            </button>

            <button
              id="nav-tab-finance"
              onClick={() => setActiveTab('finance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'finance'
                  ? 'bg-[#1C2B22] text-[#F6F1E4] shadow-sm dark:bg-[#2e4738] dark:text-[#EAE4D0]'
                  : 'text-[#5B6856] hover:text-[#1C2B22] dark:text-[#97A08C] dark:hover:text-[#EAE4D0]'
              }`}
            >
              <Wallet className="w-4 h-4 text-blue-400" />
              Finance Tracker
            </button>

            <button
              id="nav-tab-save-to-buy"
              onClick={() => setActiveTab('save-to-buy')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'save-to-buy'
                  ? 'bg-[#1C2B22] text-[#F6F1E4] shadow-sm dark:bg-[#2e4738] dark:text-[#EAE4D0]'
                  : 'text-[#5B6856] hover:text-[#1C2B22] dark:text-[#97A08C] dark:hover:text-[#EAE4D0]'
              }`}
            >
              <Target className="w-4 h-4 text-amber-400" />
              Save to Buy
            </button>
          </nav>

          {/* Quick Action & Controls */}
          <div className="flex items-center space-x-2">
            {/* Quick Action: Add Transaction */}
            <button
              id="quick-add-tx-btn"
              onClick={onOpenAddTransaction}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              + Transaction
            </button>

            {/* Quick Action: Add Goal */}
            <button
              id="quick-add-goal-btn"
              onClick={onOpenAddGoal}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] hover:border-[#1C2B22] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e]"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              + Want to Buy
            </button>

            {/* Reset data */}
            <button
              id="reset-data-btn"
              onClick={onResetData}
              title="Reset to sample data"
              className="p-2 rounded-lg border text-[#5B6856] hover:text-rose-600 border-[#DCD3B8] bg-[#F6F1E4] dark:bg-[#18221a] dark:text-[#97A08C] dark:border-[#2b3c2e] dark:hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg border text-[#5B6856] hover:text-[#1C2B22] border-[#DCD3B8] bg-[#F6F1E4] dark:bg-[#18221a] dark:text-[#97A08C] dark:border-[#2b3c2e] dark:hover:text-[#EAE4D0] transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="grid grid-cols-3 md:hidden py-2 border-t border-[#DCD3B8] dark:border-[#2b3c2e] gap-1">
          <button
            onClick={() => setActiveTab('tuition')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1 ${
              activeTab === 'tuition'
                ? 'bg-[#1C2B22] text-[#F6F1E4] dark:bg-[#2e4738] dark:text-[#EAE4D0]'
                : 'text-[#5B6856] dark:text-[#97A08C]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Tuition
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1 ${
              activeTab === 'finance'
                ? 'bg-[#1C2B22] text-[#F6F1E4] dark:bg-[#2e4738] dark:text-[#EAE4D0]'
                : 'text-[#5B6856] dark:text-[#97A08C]'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Finance
          </button>
          <button
            onClick={() => setActiveTab('save-to-buy')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1 ${
              activeTab === 'save-to-buy'
                ? 'bg-[#1C2B22] text-[#F6F1E4] dark:bg-[#2e4738] dark:text-[#EAE4D0]'
                : 'text-[#5B6856] dark:text-[#97A08C]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Save to Buy
          </button>
        </div>
      </div>
    </header>
  );
};
