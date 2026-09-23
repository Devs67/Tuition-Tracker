import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Wallet,
  Target,
  PlusCircle,
  Sun,
  Moon,
  RotateCcw,
  IndianRupee,
  ShoppingBag,
  FileSpreadsheet,
  User as UserIcon,
  LogOut,
  UserPlus,
  Lock,
  ChevronDown
} from 'lucide-react';
import { ActiveTab } from '../types';
import { AppUser } from '../services/firebase';
import { SpreadsheetDetails } from '../services/googleSheetsService';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenAddTransaction: () => void;
  onOpenAddGoal: () => void;
  onResetData: () => void;
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  connectedSheet: SpreadsheetDetails | null;
  onOpenSheetsSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  onOpenAddTransaction,
  onOpenAddGoal,
  onResetData,
  currentUser,
  onOpenAuth,
  onLogout,
  connectedSheet,
  onOpenSheetsSync,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Cloud Sync, User Auth & Controls */}
          <div className="flex items-center space-x-2">
            {/* Google Sheets Sync Button */}
            <button
              id="google-sheets-sync-btn"
              onClick={onOpenSheetsSync}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                connectedSheet
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shadow-xs'
                  : 'bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] hover:border-emerald-600 dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e]'
              }`}
              title={connectedSheet ? `Connected to ${connectedSheet.title}` : 'Connect Google Sheet'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">
                {connectedSheet ? 'Sheet Synced' : 'Google Sheets'}
              </span>
              {connectedSheet && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {/* User Auth Profile / Login Dropdown */}
            <div className="relative" ref={dropdownRef}>
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => setShowUserDropdown((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-[#DCD3B8] bg-[#F6F1E4] text-[#1C2B22] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] hover:border-[#1C2B22] transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.displayName?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <span className="hidden md:inline max-w-[90px] truncate">
                    {currentUser.displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#5B6856] dark:text-[#97A08C]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Login / Add User</span>
                </button>
              )}

              {/* User Menu Dropdown */}
              {currentUser && showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#DCD3B8] dark:border-[#263529]">
                    <div className="font-bold text-xs text-[#1C2B22] dark:text-[#EAE4D0] truncate">
                      {currentUser.displayName}
                    </div>
                    <div className="text-[11px] text-[#5B6856] dark:text-[#97A08C] truncate">
                      {currentUser.email || 'Local User Account'}
                    </div>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F6F1E4] dark:bg-[#18221a] text-[#5B6856] dark:text-[#97A08C] border border-[#DCD3B8] dark:border-[#2b3c2e]">
                      {currentUser.provider === 'google' ? 'Google Auth' : 'Password Protected'}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAuth();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-[#1C2B22] dark:text-[#EAE4D0] hover:bg-[#F6F1E4] dark:hover:bg-[#18221a] flex items-center gap-2 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                      Add Another User / Switch
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenSheetsSync();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-[#1C2B22] dark:text-[#EAE4D0] hover:bg-[#F6F1E4] dark:hover:bg-[#18221a] flex items-center gap-2 transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                      Google Sheets Backup
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[#DCD3B8] dark:border-[#263529]">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action: Add Transaction */}
            <button
              id="quick-add-tx-btn"
              onClick={onOpenAddTransaction}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm text-white bg-[#1C2B22] hover:bg-black dark:bg-[#203126] dark:hover:bg-[#283d30] transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              + Transaction
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
