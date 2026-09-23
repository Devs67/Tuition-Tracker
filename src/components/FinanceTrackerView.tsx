import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  Download,
  Search,
  Filter,
  Trash2,
  PieChart,
  Percent,
  Calendar,
  CreditCard,
  TrendingUp,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { FinanceTransaction, FinanceCategory, TransactionType } from '../types';
import { FINANCE_CATEGORY_CONFIG } from '../data/initialData';
import { formatINR, formatDate } from '../utils/formatters';

interface FinanceTrackerViewProps {
  transactions: FinanceTransaction[];
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  onExportCSV: () => void;
}

export const FinanceTrackerView: React.FC<FinanceTrackerViewProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onExportCSV,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<FinanceCategory | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [showNetSavingsLine, setShowNetSavingsLine] = useState<boolean>(true);

  // Available months from transactions
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date) {
        monthSet.add(tx.date.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [transactions]);

  // Overall calculations (affected by selectedMonth if active)
  const monthFilteredTxs = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const totalIncome = useMemo(() => {
    return monthFilteredTxs
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [monthFilteredTxs]);

  const totalExpense = useMemo(() => {
    return monthFilteredTxs
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [monthFilteredTxs]);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  // 6-Month Trend Data for Recharts Line Chart
  const last6MonthsTrend = useMemo(() => {
    // Find reference date: latest transaction date or March 2026 / current date
    let refDate = new Date();
    if (transactions.length > 0) {
      const dates = transactions
        .map((t) => t.date)
        .filter(Boolean)
        .sort();
      const latestStr = dates[dates.length - 1];
      if (latestStr) {
        const [y, m] = latestStr.split('-').map(Number);
        refDate = new Date(y, m - 1, 1);
      }
    }

    // Build the 6 consecutive months up to refDate
    const monthsList: { key: string; label: string; fullLabel: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${m < 10 ? '0' + m : m}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const fullLabel = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      monthsList.push({ key, label, fullLabel });
    }

    return monthsList.map(({ key, label, fullLabel }) => {
      const monthTxs = transactions.filter((tx) => tx.date.startsWith(key));
      const income = monthTxs
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const expense = monthTxs
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const net = income - expense;
      const rate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;

      return {
        key,
        month: label,
        fullLabel,
        Income: income,
        Expense: expense,
        NetSavings: net,
        savingsRate: rate,
      };
    });
  }, [transactions]);

  // Aggregate 6-month statistics
  const sixMonthStats = useMemo(() => {
    const totalIn = last6MonthsTrend.reduce((sum, m) => sum + m.Income, 0);
    const totalOut = last6MonthsTrend.reduce((sum, m) => sum + m.Expense, 0);
    const totalNet = totalIn - totalOut;
    const avgRate = totalIn > 0 ? Math.round((totalNet / totalIn) * 100) : 0;
    const avgMonthlyNet = Math.round(totalNet / (last6MonthsTrend.length || 1));

    return {
      totalIn,
      totalOut,
      totalNet,
      avgRate,
      avgMonthlyNet,
    };
  }, [last6MonthsTrend]);

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const expenseTxs = monthFilteredTxs.filter((tx) => tx.type === 'expense');
    const totals: Record<string, number> = {};

    expenseTxs.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    });

    return Object.entries(totals)
      .map(([cat, amount]) => {
        const config = FINANCE_CATEGORY_CONFIG[cat as FinanceCategory] || FINANCE_CATEGORY_CONFIG.other;
        const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
        return {
          category: cat as FinanceCategory,
          label: config.label,
          color: config.color,
          amount,
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthFilteredTxs, totalExpense]);

  // Filtered transactions for the ledger table
  const displayedTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) return false;
        if (selectedType !== 'all' && tx.type !== selectedType) return false;
        if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = tx.title.toLowerCase().includes(q);
          const matchNote = tx.notes?.toLowerCase().includes(q);
          const matchCat = (FINANCE_CATEGORY_CONFIG[tx.category]?.label || '').toLowerCase().includes(q);
          if (!matchTitle && !matchNote && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth, selectedType, selectedCategory, searchQuery]);

  // Y-axis tick formatter for Recharts
  const formatYAxisTick = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
    return `₹${val}`;
  };

  // Custom Chart Tooltip
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3.5 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-2xl text-xs space-y-2.5 min-w-[200px]">
          <div className="font-bold text-[#1C2B22] dark:text-[#EAE4D0] border-b border-[#DCD3B8] dark:border-[#263529] pb-1.5 flex items-center justify-between">
            <span>{data.fullLabel}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                data.NetSavings >= 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
              }`}
            >
              {data.savingsRate}% saved
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#5B6856] dark:text-[#97A08C] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Income:
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {formatINR(data.Income)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#5B6856] dark:text-[#97A08C] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                Expense:
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {formatINR(data.Expense)}
              </span>
            </div>

            <div className="pt-2 border-t border-[#DCD3B8]/60 dark:border-[#263529]/60 flex items-center justify-between font-bold">
              <span className="text-[#1C2B22] dark:text-[#EAE4D0] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                Net Surplus:
              </span>
              <span
                className={
                  data.NetSavings >= 0
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-rose-600 dark:text-rose-400'
                }
              >
                {data.NetSavings >= 0 ? '+' : ''}
                {formatINR(data.NetSavings)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & 4 Key Financial Metrics */}
      <div className="p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                Personal Finance Ledger
              </span>
              <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
                Currency: Indian Rupee (₹ INR)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C2B22] dark:text-[#EAE4D0]">
              Income &amp; Expense Tracker
            </h2>
            <p className="text-sm text-[#5B6856] dark:text-[#97A08C] mt-1">
              Log tuition fees, salary stipends, groceries, bills, and visualize 6-month trends to grow your savings.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Month Filter Selector */}
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-[#5B6856] dark:text-[#97A08C]" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              >
                <option value="all">All-Time Totals</option>
                {availableMonths.map((m) => {
                  const [y, mon] = m.split('-');
                  const d = new Date(Number(y), Number(mon) - 1, 1);
                  const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                  return (
                    <option key={m} value={m}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={onAddTransaction}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              + Add Transaction
            </button>
          </div>
        </div>

        {/* 4 Financial Health Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#DCD3B8] dark:border-[#263529]">
          {/* Total Inflow */}
          <div className="p-4 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5B6856] dark:text-[#97A08C]">Total Inflow</span>
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-2">
              {formatINR(totalIncome)}
            </div>
            <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              {monthFilteredTxs.filter((tx) => tx.type === 'income').length} earnings recorded
            </span>
          </div>

          {/* Total Expense */}
          <div className="p-4 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5B6856] dark:text-[#97A08C]">Total Expenses</span>
              <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
              {formatINR(totalExpense)}
            </div>
            <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              {monthFilteredTxs.filter((tx) => tx.type === 'expense').length} expense payments
            </span>
          </div>

          {/* Net Savings */}
          <div className="p-4 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5B6856] dark:text-[#97A08C]">Net Surplus / Savings</span>
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-bold mt-2 ${
                netSavings >= 0
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatINR(netSavings)}
            </div>
            <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              {netSavings >= 0 ? 'Surplus ready to save/invest' : 'Deficit this period'}
            </span>
          </div>

          {/* Savings Rate */}
          <div className="p-4 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5B6856] dark:text-[#97A08C]">Savings Rate</span>
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#1C2B22] dark:text-[#EAE4D0] mt-2">
              {savingsRate}%
            </div>
            <div className="w-full bg-[#DCD3B8] dark:bg-[#2b3c2e] h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* RECHARTS LINE CHART: 6-Month Income vs Expense Trends */}
      <div className="p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCD3B8] dark:border-[#263529]">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                Income vs. Expense Trend (Last 6 Months)
              </h3>
            </div>
            <p className="text-xs text-[#5B6856] dark:text-[#97A08C] mt-0.5">
              Monthly cashflow trajectory across {last6MonthsTrend[0]?.month || 'Oct'} to {last6MonthsTrend[last6MonthsTrend.length - 1]?.month || 'Mar'}
            </p>
          </div>

          {/* Chart Controls & Quick Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNetSavingsLine((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                showNetSavingsLine
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-[#F6F1E4] text-[#5B6856] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#97A08C] dark:border-[#2b3c2e]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showNetSavingsLine ? 'bg-blue-600' : 'bg-gray-400'}`} />
              {showNetSavingsLine ? 'Net Savings Line On' : 'Show Net Savings Line'}
            </button>
          </div>
        </div>

        {/* 6-Month Aggregate Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 rounded-xl bg-[#F6F1E4]/60 dark:bg-[#18221a] border border-[#DCD3B8]/80 dark:border-[#2b3c2e]">
            <span className="text-[11px] font-medium text-[#5B6856] dark:text-[#97A08C] block">
              6M Total Inflow
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400">
              +{formatINR(sixMonthStats.totalIn)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F1E4]/60 dark:bg-[#18221a] border border-[#DCD3B8]/80 dark:border-[#2b3c2e]">
            <span className="text-[11px] font-medium text-[#5B6856] dark:text-[#97A08C] block">
              6M Total Outflow
            </span>
            <span className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400">
              -{formatINR(sixMonthStats.totalOut)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F1E4]/60 dark:bg-[#18221a] border border-[#DCD3B8]/80 dark:border-[#2b3c2e]">
            <span className="text-[11px] font-medium text-[#5B6856] dark:text-[#97A08C] block">
              6M Total Net Saved
            </span>
            <span className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-400">
              {formatINR(sixMonthStats.totalNet)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F1E4]/60 dark:bg-[#18221a] border border-[#DCD3B8]/80 dark:border-[#2b3c2e]">
            <span className="text-[11px] font-medium text-[#5B6856] dark:text-[#97A08C] block">
              Avg. Monthly Savings Rate
            </span>
            <span className="text-sm sm:text-base font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
              {sixMonthStats.avgRate}% / month
            </span>
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={last6MonthsTrend}
              margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-[#DCD3B8]/70 dark:text-[#263529]/80"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="currentColor"
                className="text-xs text-[#5B6856] dark:text-[#97A08C]"
                tickLine={false}
                axisLine={{ stroke: 'currentColor', opacity: 0.3 }}
              />
              <YAxis
                stroke="currentColor"
                className="text-xs text-[#5B6856] dark:text-[#97A08C]"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip content={renderCustomTooltip} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="Income"
                name="Income (₹)"
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#059669' }}
              />
              <Line
                type="monotone"
                dataKey="Expense"
                name="Expense (₹)"
                stroke="#e11d48"
                strokeWidth={3}
                dot={{ r: 4, fill: '#e11d48', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#e11d48' }}
              />
              {showNetSavingsLine && (
                <Line
                  type="monotone"
                  dataKey="NetSavings"
                  name="Net Savings (₹)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#2563eb', strokeWidth: 1.5, stroke: '#fff' }}
                  activeDot={{ r: 5, fill: '#2563eb' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Key Takeaway / Insight */}
        <div className="mt-3 pt-3 border-t border-[#DCD3B8]/60 dark:border-[#263529]/60 flex items-center justify-between text-xs text-[#5B6856] dark:text-[#97A08C]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Income consistently exceeds expenses over all 6 periods.</span>
          </div>
          <div className="hidden sm:block">
            <span>Average surplus of <strong>{formatINR(sixMonthStats.avgMonthlyNet)}/mo</strong> available for your wishlist goals.</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Cashflow Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Category Spending Distribution (1 col) */}
        <div className="p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1C2B22] dark:text-[#EAE4D0] flex items-center gap-1.5 mb-1">
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Expense Breakdown
            </h3>
            <p className="text-xs text-[#5B6856] dark:text-[#97A08C] mb-4">
              Where your money is going ({selectedMonth === 'all' ? 'All Time' : selectedMonth})
            </p>

            {categoryBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#5B6856] dark:text-[#97A08C]">
                No expenses logged for this timeframe.
              </div>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1C2B22] dark:text-[#EAE4D0] flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.label}
                      </span>
                      <span className="font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                        {formatINR(item.amount)}{' '}
                        <span className="font-normal text-[#5B6856] dark:text-[#97A08C]">
                          ({item.percentage}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-[#F6F1E4] dark:bg-[#18221a] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#DCD3B8] dark:border-[#263529] text-xs text-[#5B6856] dark:text-[#97A08C]">
            💡 <strong className="text-[#1C2B22] dark:text-[#EAE4D0]">Tip:</strong> Trimming discretionary food delivery can free up ₹2,000+ monthly to divert directly into your wishlist savings goals!
          </div>
        </div>

        {/* Right: Cashflow Summary & Ledger (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                  Transactions Ledger
                </h3>
                <p className="text-xs text-[#5B6856] dark:text-[#97A08C]">
                  Showing {displayedTransactions.length} records in Indian Rupee (₹)
                </p>
              </div>

              <button
                onClick={onExportCSV}
                title="Export Ledger to CSV"
                className="self-start sm:self-auto p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] hover:border-[#1C2B22] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e]"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5B6856] dark:text-[#97A08C]" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
                />
              </div>

              {/* Type filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as TransactionType | 'all')}
                className="text-xs font-semibold px-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              >
                <option value="all">All Types (Income &amp; Expense)</option>
                <option value="income">Income Only (+)</option>
                <option value="expense">Expense Only (-)</option>
              </select>

              {/* Category filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as FinanceCategory | 'all')}
                className="text-xs font-semibold px-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              >
                <option value="all">All Categories</option>
                {Object.entries(FINANCE_CATEGORY_CONFIG).map(([k, cfg]) => (
                  <option key={k} value={k}>
                    {cfg.isIncome ? '[+] ' : '[-] '} {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#DCD3B8] dark:border-[#263529] text-[#5B6856] dark:text-[#97A08C]">
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Title</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Mode</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCD3B8]/60 dark:divide-[#263529]/60">
                  {displayedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#5B6856] dark:text-[#97A08C]">
                        No transactions found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedTransactions.map((tx) => {
                      const catConfig =
                        FINANCE_CATEGORY_CONFIG[tx.category] || FINANCE_CATEGORY_CONFIG.other;
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-[#F6F1E4]/50 dark:hover:bg-[#1a251d]/50 transition-colors"
                        >
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-[#1C2B22] dark:text-[#EAE4D0]">
                            {formatDate(tx.date)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-[#1C2B22] dark:text-[#EAE4D0]">
                              {tx.title}
                            </div>
                            {tx.notes && (
                              <div className="text-[11px] text-[#5B6856] dark:text-[#97A08C] truncate max-w-xs">
                                {tx.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                              style={{
                                backgroundColor: catConfig.bgLight,
                                color: catConfig.color,
                              }}
                            >
                              {catConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-[#5B6856] dark:text-[#97A08C]">
                            <span className="px-1.5 py-0.5 rounded text-[11px] bg-[#F6F1E4] dark:bg-[#18221a] border border-[#DCD3B8] dark:border-[#2b3c2e]">
                              {tx.paymentMode}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-right font-bold text-sm">
                            <span
                              className={
                                tx.type === 'income'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {tx.type === 'income' ? '+' : '-'}
                              {formatINR(tx.amount)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => onDeleteTransaction(tx.id)}
                              className="p-1 rounded text-[#5B6856] hover:text-rose-600 dark:text-[#97A08C] transition-colors"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
