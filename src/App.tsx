import React, { useState, useEffect } from 'react';
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
import { formatINR } from './utils/formatters';

const STORAGE_KEYS = {
  STUDENTS: 'paisaledger_students_v2',
  SESSIONS: 'paisaledger_sessions_v2',
  TRANSACTIONS: 'paisaledger_transactions_v2',
  GOALS: 'paisaledger_goals_v2',
  INSTRUCTOR: 'paisaledger_instructor_v2',
  THEME: 'paisaledger_theme_v2',
};

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
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
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 3 Primary Tabs: 'tuition' | 'finance' | 'save-to-buy'
  const [activeTab, setActiveTab] = useState<ActiveTab>('tuition');

  // Instructor Name
  const [instructorName, setInstructorName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.INSTRUCTOR) || 'Dev Chintu';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSTRUCTOR, instructorName);
  }, [instructorName]);

  // Core Data States with localStorage persistence
  const [students, setStudents] = useState<TutoringStudent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [sessions, setSessions] = useState<TutoringSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
    } catch {
      return INITIAL_SESSIONS;
    }
  });

  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [goals, setGoals] = useState<PurchaseGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      return saved ? JSON.parse(saved) : INITIAL_PURCHASE_GOALS;
    } catch {
      return INITIAL_PURCHASE_GOALS;
    }
  });

  // Sync states to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }, [goals]);

  // Modals state
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [depositTargetGoal, setDepositTargetGoal] = useState<PurchaseGoal | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceStudentId, setInvoiceStudentId] = useState<string | null>(null);

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
        if (s.id !== id) return s;
        const nextPaid = !s.isPaid;
        const paidDate = nextPaid ? new Date().toISOString().slice(0, 10) : undefined;

        // When marked paid, auto-sync as Income in Finance Tracker if not already present
        if (nextPaid) {
          const student = students.find((st) => st.id === s.studentId);
          const newTx: FinanceTransaction = {
            id: `tx-tuition-${s.id}`,
            title: `Tuition Fee: ${student?.name || 'Student'} (${s.topic || 'Class'})`,
            type: 'income',
            category: 'tuition_earnings',
            amount: s.amount,
            date: paidDate || new Date().toISOString().slice(0, 10),
            paymentMode: s.paymentMode || 'UPI',
            notes: `Logged automatically from tuition session`,
          };
          setTransactions((tPrev) => [newTx, ...tPrev]);
        }

        return { ...s, isPaid: nextPaid, paidDate };
      })
    );
  };

  const handleMarkAllAsPaid = (studentId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const student = students.find((st) => st.id === studentId);

    setSessions((prev) =>
      prev.map((s) => {
        if (s.studentId === studentId && !s.isPaid) {
          // Record income transaction
          const newTx: FinanceTransaction = {
            id: `tx-tuition-${s.id}`,
            title: `Tuition Fee: ${student?.name || 'Student'}`,
            type: 'income',
            category: 'tuition_earnings',
            amount: s.amount,
            date: today,
            paymentMode: 'UPI',
            notes: `Bulk invoice payment receipt`,
          };
          setTransactions((tPrev) => [newTx, ...tPrev]);
          return { ...s, isPaid: true, paidDate: today };
        }
        return s;
      })
    );
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
  const handleAddGoal = (newGoalData: Omit<PurchaseGoal, 'id' | 'deposits'> & { initialDeposit?: number }) => {
    const deposits: SavingsDeposit[] = [];
    if (newGoalData.initialDeposit && newGoalData.initialDeposit > 0) {
      deposits.push({
        id: `dep-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        amount: newGoalData.initialDeposit,
        source: 'Initial Goal Allocation',
      });
    }

    const goal: PurchaseGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalData.title,
      targetPrice: newGoalData.targetPrice,
      savedAmount: newGoalData.savedAmount,
      targetDate: newGoalData.targetDate,
      category: newGoalData.category,
      priority: newGoalData.priority,
      specsOrNotes: newGoalData.specsOrNotes,
      deposits,
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

  const handleAddDeposit = (goalId: string, depositData: Omit<SavingsDeposit, 'id'>) => {
    const deposit: SavingsDeposit = {
      ...depositData,
      id: `dep-${Date.now()}`,
    };

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          savedAmount: g.savedAmount + deposit.amount,
          deposits: [deposit, ...(g.deposits || [])],
        };
      })
    );
  };

  // Reset to sample data
  const handleResetData = () => {
    if (window.confirm('Reset all tuition sessions, finances, and wishlist goals to default sample data?')) {
      setStudents(INITIAL_STUDENTS);
      setSessions(INITIAL_SESSIONS);
      setTransactions(INITIAL_TRANSACTIONS);
      setGoals(INITIAL_PURCHASE_GOALS);
      setInstructorName('Dev Chintu');
      localStorage.removeItem(STORAGE_KEYS.STUDENTS);
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.GOALS);
      localStorage.removeItem(STORAGE_KEYS.INSTRUCTOR);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Type,Title,Category,Amount_INR,Date,Payment_Mode,Notes\n';
    transactions.forEach((tx) => {
      const catLabel = FINANCE_CATEGORY_CONFIG[tx.category]?.label || tx.category;
      csvContent += `"${tx.type}","${tx.title.replace(/"/g, '""')}","${catLabel}",${tx.amount},"${tx.date}","${tx.paymentMode}","${(tx.notes || '').replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PaisaLedger_Finances_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Active student for invoice modal
  const activeInvoiceStudent = students.find((s) => s.id === invoiceStudentId) || null;

  return (
    <div className="min-h-screen bg-[#FBF8EF] text-[#1C2B22] dark:bg-[#0D140E] dark:text-[#EAE4D0] transition-colors duration-200">
      {/* Top Navbar with 3 Tabs */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenAddTransaction={() => setIsAddTxOpen(true)}
        onOpenAddGoal={() => setIsAddGoalOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            onOpenInvoice={(studentId) => {
              setInvoiceStudentId(studentId);
              setIsInvoiceOpen(true);
            }}
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
          <span>
            All calculations computed locally in ₹ INR with private storage.
          </span>
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
    </div>
  );
}
