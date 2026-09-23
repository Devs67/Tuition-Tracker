import React, { useState } from 'react';
import { X, Plus, ArrowDownRight, ArrowUpRight, IndianRupee } from 'lucide-react';
import { FinanceTransaction, FinanceCategory, TransactionType, PaymentMode } from '../types';
import { FINANCE_CATEGORY_CONFIG } from '../data/initialData';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<FinanceTransaction, 'id'>) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<FinanceCategory>('food_groceries');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    onAddTransaction({
      title: title.trim(),
      type,
      category,
      amount: Number(amount),
      date,
      paymentMode,
      notes: notes.trim() || undefined,
    });

    // Reset and close
    setTitle('');
    setAmount('');
    setNotes('');
    onClose();
  };

  const handleTypeSwitch = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory('tuition_earnings');
    } else {
      setCategory('food_groceries');
    }
  };

  const availableCategories = Object.entries(FINANCE_CATEGORY_CONFIG).filter(([_, config]) => {
    if (type === 'income') return config.isIncome;
    return !config.isIncome;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#DCD3B8] dark:border-[#263529]">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                Record Transaction
              </h3>
              <p className="text-xs text-[#5B6856] dark:text-[#97A08C]">
                Add income or personal expense in Indian Rupees (₹)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#5B6856] hover:text-[#1C2B22] dark:text-[#97A08C] dark:hover:text-[#EAE4D0]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F6F1E4] dark:bg-[#18221a] border border-[#DCD3B8] dark:border-[#2b3c2e]">
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-[#5B6856] dark:text-[#97A08C] hover:text-[#1C2B22]'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('income')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#5B6856] dark:text-[#97A08C] hover:text-[#1C2B22]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Income
            </button>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
              Description / Title
            </label>
            <input
              type="text"
              required
              placeholder={type === 'expense' ? 'e.g. Swiggy food delivery or PG Rent' : 'e.g. Class 12 Tuition Fee or Freelance'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                Amount (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-[#5B6856] dark:text-[#97A08C]">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs font-bold pl-8 pr-3 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FinanceCategory)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              >
                {availableCategories.map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Card">Debit / Credit Card</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Split with flatmates or milestone payment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#DCD3B8] dark:border-[#263529]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B6856] hover:text-[#1C2B22] dark:text-[#97A08C] dark:hover:text-[#EAE4D0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-colors ${
                type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              Save {type === 'expense' ? 'Expense' : 'Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
