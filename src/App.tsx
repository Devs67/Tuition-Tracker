import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ActiveTab,
  TutoringStudent,
  TutoringSession,
  FinanceTransaction,
  PurchaseGoal,
  SavingsDeposit
} from './types';
import {
  INITIAL_STUDENTS,
  INITIAL_SESSIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_PURCHASE_GOALS,
  FINANCE_CATEGORY_CONFIG
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { TuitionLogView } from './components/TuitionLogView';
import { FinanceTrackerView } from './components/FinanceTrackerView';
import { SavingsPlannerView } from './components/SavingsPlannerView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AddGoalModal } from './components/AddGoalModal';
import { AddDepositModal } from './components/AddDepositModal';
import { InvoiceModal } from './components/InvoiceModal';
import { AuthModal } from './components/AuthModal';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { AppUser, getActiveUser, logoutUser, subscribeToAuth, setCachedAccessToken } from './services/firebase';
import { SpreadsheetDetails, AppSyncData } from './services/googleSheetsService';

const BASE_STORAGE_KEYS = {
  STUDENTS: 'paisaledger_students_v3',
  SESSIONS: 'paisaledger_sessions_v3',
  TRANSACTIONS: 'paisaledger_transactions_v3',
  GOALS: 'paisaledger_goals_v3',
  INSTRUCTOR: 'paisaledger_instructor_v3',
  CONNECTED_SHEET: 'paisaledger_connected_sheet_v3',
  THEME: 'paisaledger_theme_v2',
};

// Helper to get partition key for current user
const getUserKey = (user: AppUser | null): string => {
  if (!user || !user.uid) return 'guest';
  return user.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
};

const getScopedKey = (baseKey: string, userKey: string): string => {
  return `${baseKey}_${userKey}`;
};

export default function App() {
  // Theme state (global across users on this device)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(BASE_STORAGE_KEYS.THEME);
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem(BASE_STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 3 Primary Tabs: 'tuition' | 'finance' | 'save-to-buy'
  const [activeTab, setActiveTab] = useState<ActiveTab>('tuition');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getActiveUser());
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Active user partition key
  const userKey = getUserKey(currentUser);
  const previousUserKeyRef = useRef<string>(userKey);

  // Helper to load user-specific data from localStorage with migration fallback
  const loadUserPartition = (key: string) => {
    const scopedKey = getScopedKey(BASE_STORAGE_KEYS.STUDENTS, key);
    const existing = localStorage.getItem(scopedKey);

    // If partitioned data exists for this user, load it
    if (existing) {
      try {
        const parsedStudents = JSON.parse(existing);
        const parsedSessions = JSON.parse(localStorage.getItem(getScopedKey(BASE_STORAGE_KEYS.SESSIONS, key)) || '[]');
        const parsedTransactions = JSON.parse(localStorage.getItem(getScopedKey(BASE_STORAGE_KEYS.TRANSACTIONS, key)) || '[]');
        const parsedGoals = JSON.parse(localStorage.getItem(getScopedKey(BASE_STORAGE_KEYS.GOALS, key)) || '[]');
        const parsedInstructor = localStorage.getItem(getScopedKey(BASE_STORAGE_KEYS.INSTRUCTOR, key)) || (currentUser?.displayName || 'Tutor');
        const sheetRaw = localStorage.getItem(getScopedKey(BASE_STORAGE_KEYS.CONNECTED_SHEET, key));
        const parsedSheet = sheetRaw ? JSON.parse(sheetRaw) : null;

        return {
          students: parsedStudents,
          sessions: parsedSessions,
          transactions: parsedTransactions,
          goals: parsedGoals,
          instructorName: parsedInstructor,
          connectedSheet: parsedSheet,
        };
      } catch (err) {
        console.error('Error loading partitioned user data', err);
      }
    }

    // Check v2 legacy unpartitioned data for seamless migration of guest / initial user
    const legacyStudents = localStorage.getItem('paisaledger_students_v2');
    if (legacyStudents && key === 'guest') {
      try {
        return {
          students: JSON.parse(legacyStudents),
          sessions: JSON.parse(localStorage.getItem('paisaledger_sessions_v2') || '[]'),
          transactions: JSON.parse(localStorage.getItem('paisaledger_transactions_v2') || '[]'),
          goals: JSON.parse(localStorage.getItem('paisaledger_goals_v2') || '[]'),
          instructorName: localStorage.getItem('paisaledger_instructor_v2') || 'Dev Chintu',
          connectedSheet: null,
        };
      } catch (e) {
        // Fall back to template
      }
    }

    // Default template data for a fresh user
    return {
      students: INITIAL_STUDENTS,
      sessions: INITIAL_SESSIONS,
      transactions: INITIAL_TRANSACTIONS,
      goals: INITIAL_PURCHASE_GOALS,
      instructorName: currentUser?.displayName || 'Dev Chintu',
      connectedSheet: null,
    };
  };

  // State definitions initialized for current user partition
  const initialData = useMemo(() => loadUserPartition(userKey), []);

  const [instructorName, setInstructorName] = useState<string>(initialData.instructorName);
  const [students, setStudents] = useState<TutoringStudent[]>(initialData.students);
  const [sessions, setSessions] = useState<TutoringSession[]>(initialData.sessions);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(initialData.transactions);
  const [goals, setGoals] = useState<PurchaseGoal[]>(initialData.goals);
  const [connectedSheet, setConnectedSheet] = useState<SpreadsheetDetails | null>(initialData.connectedSheet);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // When active user switches (e.g. login, switch account, sign out):
  // 1. Save prior user's state to their partitioned keys
  // 2. Load the newly active user's separated records
  useEffect(() => {
    if (previousUserKeyRef.current !== userKey) {
      const prevKey = previousUserKeyRef.current;
      // Save departing user's state
      localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.STUDENTS, prevKey), JSON.stringify(students));
      localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.SESSIONS, prevKey), JSON.stringify(sessions));
      localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.TRANSACTIONS, prevKey), JSON.stringify(transactions));
      localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.GOALS, prevKey), JSON.stringify(goals));
      localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.INSTRUCTOR, prevKey), instructorName);
      if (connectedSheet) {
        localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.CONNECTED_SHEET, prevKey), JSON.stringify(connectedSheet));
      } else {
        localStorage.removeItem(getScopedKey(BASE_STORAGE_KEYS.CONNECTED_SHEET, prevKey));
      }

      // Switch to newly active user's partition
      const nextData = loadUserPartition(userKey);
      setStudents(nextData.students);
      setSessions(nextData.sessions);
      setTransactions(nextData.transactions);
      setGoals(nextData.goals);
      setInstructorName(currentUser?.displayName || nextData.instructorName);
      setConnectedSheet(nextData.connectedSheet);

      // Update previous key tracker
      previousUserKeyRef.current = userKey;
    }
  }, [userKey]);

  // Continuously persist current user's state to their specific storage keys
  useEffect(() => {
    localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.STUDENTS, userKey), JSON.stringify(students));
  }, [students, userKey]);

  useEffect(() => {
    localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.SESSIONS, userKey), JSON.stringify(sessions));
  }, [sessions, userKey]);

  useEffect(() => {
    localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.TRANSACTIONS, userKey), JSON.stringify(transactions));
  }, [transactions, userKey]);

  useEffect(() => {
    localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.GOALS, userKey), JSON.stringify(goals));
  }, [goals, userKey]);

  useEffect(() => {
    localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.INSTRUCTOR, userKey), instructorName);
  }, [instructorName, userKey]);

  useEffect(() => {
    if (connectedSheet) {
      localStorage.setItem(getScopedKey(BASE_STORAGE_KEYS.CONNECTED_SHEET, userKey), JSON.stringify(connectedSheet));
    } else {
      localStorage.removeItem(getScopedKey(BASE_STORAGE_KEYS.CONNECTED_SHEET, userKey));
    }
  }, [connectedSheet, userKey]);

  // Bundle app data for Google Sheets sync
  const appData: AppSyncData = useMemo(() => ({
    students,
    sessions,
    transactions,
    goals,
  }), [students, sessions, transactions, goals]);

  // Modals state
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [depositTargetGoal, setDepositTargetGoal] = useState<PurchaseGoal | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceStudentId, setInvoiceStudentId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSheetsSyncModalOpen, setIsSheetsSyncModalOpen] = useState(false);

  // Handlers for Students
  const handleAddStudent = (newStudent: Omit<TutoringStudent, 'id'>) => {
    const student: TutoringStudent = {
      ...newStudent,
      id: `stud-${Date.now()}`,
    };
    setStudents((prev) => [...prev, student]);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Handlers for Sessions
  const handleAddSession = (newSession: Omit<TutoringSession, 'id'>) => {
    const session: TutoringSession = {
      ...newSession,
      id: `sess-${Date.now()}`,
    };
    setSessions((prev) => [session, ...prev]);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleSessionPaid = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updatedPaid = !s.isPaid;
          if (updatedPaid) {
            const student = students.find((st) => st.id === s.studentId);
            const studentName = student?.name || 'Student';
            const autoTx: FinanceTransaction = {
              id: `tx-tuition-${Date.now()}`,
              title: `${studentName} Tuition (${s.topic || 'Class Session'})`,
              type: 'income',
              category: 'tuition_earnings',
              amount: s.amount,
              date: s.date,
              paymentMode: s.paymentMode || 'UPI',
              notes: `Auto-logged from completed session (${s.durationMinutes} mins)`,
            };
            setTransactions((tPrev) => [autoTx, ...tPrev]);
          }
          return { ...s, isPaid: updatedPaid };
        }
        return s;
      })
    );
  };

  const handleOpenInvoice = (studentId: string) => {
    setInvoiceStudentId(studentId);
    setIsInvoiceOpen(true);
  };

  const handleMarkAllAsPaid = (studentId: string) => {
    const unpaidSessions = sessions.filter((s) => s.studentId === studentId && !s.isPaid);
    const totalAmount = unpaidSessions.reduce((sum, s) => sum + s.amount, 0);

    setSessions((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, isPaid: true } : s))
    );

    if (totalAmount > 0) {
      const student = students.find((st) => st.id === studentId);
      const studentName = student?.name || 'Student';
      const autoTx: FinanceTransaction = {
        id: `tx-tuition-bulk-${Date.now()}`,
        title: `${studentName} Invoice Cleared (${unpaidSessions.length} sessions)`,
        type: 'income',
        category: 'tuition_earnings',
        amount: totalAmount,
        date: new Date().toISOString().slice(0, 10),
        paymentMode: 'UPI',
        notes: `Settled ${unpaidSessions.length} pending tutoring classes`,
      };
      setTransactions((prev) => [autoTx, ...prev]);
    }
  };

  // Handlers for Transactions
  const handleAddTransaction = (newTx: Omit<FinanceTransaction, 'id'>) => {
    const tx: FinanceTransaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [tx, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers for Goals
  const handleAddGoal = (newGoal: Omit<PurchaseGoal, 'id' | 'savedAmount' | 'deposits'>) => {
    const goal: PurchaseGoal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
      savedAmount: 0,
      deposits: [],
    };
    setGoals((prev) => [goal, ...prev]);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleOpenAddDeposit = (goal: PurchaseGoal) => {
    setDepositTargetGoal(goal);
    setIsAddDepositOpen(true);
  };

  const handleAddDeposit = (
    goalId: string,
    depositData: Omit<SavingsDeposit, 'id'>
  ) => {
    const deposit: SavingsDeposit = {
      ...depositData,
      id: `dep-${Date.now()}`,
    };

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            savedAmount: g.savedAmount + deposit.amount,
            deposits: [deposit, ...(g.deposits || [])],
          };
        }
        return g;
      })
    );
  };

  // Reset to initial demo data for current user
  const handleResetData = () => {
    if (
      window.confirm(
        `Are you sure you want to reset all data for ${currentUser?.displayName || 'the current user'} back to sample records?`
      )
    ) {
      setStudents(INITIAL_STUDENTS);
      setSessions(INITIAL_SESSIONS);
      setTransactions(INITIAL_TRANSACTIONS);
      setGoals(INITIAL_PURCHASE_GOALS);
      setInstructorName(currentUser?.displayName || 'Dev Chintu');
    }
  };

  // Export transactions to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Title', 'Category', 'Amount (INR)', 'Payment Mode', 'Notes'];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      t.type,
      `"${t.title.replace(/"/g, '""')}"`,
      FINANCE_CATEGORY_CONFIG[t.category]?.label || t.category,
      t.amount,
      t.paymentMode,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `paisaledger-finances-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auth success handler
  const handleAuthSuccess = (user: AppUser, token?: string) => {
    setCurrentUser(user);
    if (token) {
      setGoogleAccessToken(token);
      setCachedAccessToken(token);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setGoogleAccessToken(null);
  };

  const activeInvoiceStudent = useMemo(() => {
    return students.find((s) => s.id === invoiceStudentId) || null;
  }, [students, invoiceStudentId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF6] text-[#1C2B22] dark:bg-[#121913] dark:text-[#EAE4D0] transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenAddTransaction={() => setIsAddTxOpen(true)}
        onOpenAddGoal={() => setIsAddGoalOpen(true)}
        onResetData={handleResetData}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        connectedSheet={connectedSheet}
        onOpenSheetsSync={() => setIsSheetsSyncModalOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'tuition' && (
          <TuitionLogView
            students={students}
            sessions={sessions}
            instructorName={instructorName}
            setInstructorName={setInstructorName}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
            onToggleSessionPaid={handleToggleSessionPaid}
            onOpenInvoice={handleOpenInvoice}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceTrackerView
            transactions={transactions}
            onAddTransaction={() => setIsAddTxOpen(true)}
            onDeleteTransaction={handleDeleteTransaction}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'save-to-buy' && (
          <SavingsPlannerView
            goals={goals}
            students={students}
            onOpenAddGoal={() => setIsAddGoalOpen(true)}
            onOpenAddDeposit={handleOpenAddDeposit}
            onDeleteGoal={handleDeleteGoal}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-[#DCD3B8] dark:border-[#263529] text-center text-xs text-[#5B6856] dark:text-[#97A08C]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            PaisaLedger • Indian Rupee (₹) Tuition Logger, Finance Tracker &amp; Savings Planner
          </span>
          <div className="flex items-center gap-3">
            {connectedSheet && (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                ● Synced with Google Sheets ({currentUser ? currentUser.displayName : 'Guest'})
              </span>
            )}
            <span>
              {currentUser ? `Logged in as ${currentUser.displayName} (Isolated Workspace)` : 'Guest Mode (Local Workspace)'}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onAddTransaction={handleAddTransaction}
      />

      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onAddGoal={handleAddGoal}
      />

      <AddDepositModal
        isOpen={isAddDepositOpen}
        onClose={() => {
          setIsAddDepositOpen(false);
          setDepositTargetGoal(null);
        }}
        goal={depositTargetGoal}
        onAddDeposit={handleAddDeposit}
      />

      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setInvoiceStudentId(null);
        }}
        student={activeInvoiceStudent}
        sessions={sessions}
        instructorName={instructorName}
        onMarkAllAsPaid={handleMarkAllAsPaid}
      />

      {/* Authentication Modal (Password Login / Registration + Google Auth) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Google Sheets Connection & Sync Modal */}
      <GoogleSheetSyncModal
        isOpen={isSheetsSyncModalOpen}
        onClose={() => setIsSheetsSyncModalOpen(false)}
        currentUser={currentUser}
        googleAccessToken={googleAccessToken}
        setGoogleAccessToken={setGoogleAccessToken}
        connectedSheet={connectedSheet}
        setConnectedSheet={setConnectedSheet}
        appData={appData}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
