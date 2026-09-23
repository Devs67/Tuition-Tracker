import React, { useState } from 'react';
import { X, Plus, PiggyBank, IndianRupee } from 'lucide-react';
import { PurchaseGoal, SavingsDeposit } from '../types';
import { formatINR } from '../utils/formatters';

interface AddDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: PurchaseGoal | null;
  onAddDeposit: (goalId: string, deposit: Omit<SavingsDeposit, 'id'>) => void;
}

export const AddDepositModal: React.FC<AddDepositModalProps> = ({
  isOpen,
  onClose,
  goal,
  onAddDeposit,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [source, setSource] = useState('Tuition Income Allocation');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  if (!isOpen || !goal) return null;

  const remaining = Math.max(0, goal.targetPrice - goal.savedAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    onAddDeposit(goal.id, {
      amount: Number(amount),
      source: source.trim() || 'Savings Deposit',
      date,
      notes: notes.trim() || undefined,
    });

    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#DCD3B8] dark:border-[#263529]">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                Add Savings Deposit
              </h3>
              <p className="text-xs text-[#5B6856] dark:text-[#97A08C]">
                For: <strong className="text-[#1C2B22] dark:text-[#EAE4D0]">{goal.title}</strong>
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

        {/* Goal Summary Pill */}
        <div className="p-3 mb-4 rounded-xl bg-[#F6F1E4] dark:bg-[#18221a] border border-[#DCD3B8] dark:border-[#2b3c2e] flex items-center justify-between text-xs">
          <div>
            <span className="text-[#5B6856] dark:text-[#97A08C] block">Remaining Needed</span>
            <span className="font-bold text-base text-emerald-700 dark:text-emerald-400">
              {formatINR(remaining)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[#5B6856] dark:text-[#97A08C] block">Already Saved</span>
            <span className="font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
              {formatINR(goal.savedAmount)} / {formatINR(goal.targetPrice)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
              Deposit Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-[#5B6856] dark:text-[#97A08C]">
                ₹
              </span>
              <input
                type="number"
                required
                min="10"
                step="1"
                placeholder="e.g. 2500"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm font-bold pl-8 pr-3 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Source options */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
              Funding Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
            >
              <option value="Tuition Income Allocation">🎓 Tuition Session Fee Allocation</option>
              <option value="Discretionary Expense Cut">🍔 Cut Down Food Delivery / Swiggy</option>
              <option value="Freelance Project Milestone">💻 Freelance / Project Pay</option>
              <option value="Monthly Salary / Stipend">💼 Salary / Stipend Savings Pool</option>
              <option value="Gift / Pocket Money">🎁 Gift / Cashback / Allowance</option>
              <option value="General Bank Transfer">🏦 Bank Savings Transfer</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
              Deposit Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Aryan tuition 2 classes or Feb food savings"
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Confirm Deposit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
