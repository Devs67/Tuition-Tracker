import React, { useState } from 'react';
import { X, Plus, ShoppingBag, Calendar, Tag, IndianRupee } from 'lucide-react';
import { PurchaseGoal } from '../types';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGoal: (goal: Omit<PurchaseGoal, 'id' | 'deposits'> & { initialDeposit?: number }) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  onAddGoal,
}) => {
  const [title, setTitle] = useState('');
  const [targetPrice, setTargetPrice] = useState<number | ''>('');
  const [initialDeposit, setInitialDeposit] = useState<number | ''>('');
  const [targetDate, setTargetDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3); // 3 months from now
    return d.toISOString().slice(0, 10);
  });
  const [category, setCategory] = useState<PurchaseGoal['category']>('laptop_pc');
  const [priority, setPriority] = useState<PurchaseGoal['priority']>('high');
  const [specsOrNotes, setSpecsOrNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetPrice || Number(targetPrice) <= 0) return;

    const initialSaved = Number(initialDeposit) || 0;

    onAddGoal({
      title: title.trim(),
      targetPrice: Number(targetPrice),
      savedAmount: initialSaved,
      targetDate,
      category,
      priority,
      specsOrNotes: specsOrNotes.trim() || undefined,
      initialDeposit: initialSaved,
    });

    setTitle('');
    setTargetPrice('');
    setInitialDeposit('');
    setSpecsOrNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#DCD3B8] dark:border-[#263529]">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                Add Purchase Goal
              </h3>
              <p className="text-xs text-[#5B6856] dark:text-[#97A08C]">
                What item do you want to save money to buy?
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
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
              Item Name / Model
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Samsung Galaxy Book 360, iPhone 16, or Bike"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Target Price and Initial Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                Target Price (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-[#5B6856] dark:text-[#97A08C]">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="100"
                  step="1"
                  placeholder="e.g. 135000"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs font-bold pl-8 pr-3 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                Initial Saved Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-[#5B6856] dark:text-[#97A08C]">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0 (if starting fresh)"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs font-bold pl-8 pr-3 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Category & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PurchaseGoal['category'])}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              >
                <option value="laptop_pc">💻 Laptop / Computer</option>
                <option value="phone_tablet">📱 Phone / Tablet</option>
                <option value="audio_gadget">🎧 Audio / Electronics</option>
                <option value="vehicle">🛵 Two-Wheeler / Vehicle</option>
                <option value="books_learning">📚 Course / Learning Tools</option>
                <option value="other">🎯 Other Wishlist Item</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                Target Purchase Date
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              />
            </div>
          </div>

          {/* Specs or Motivation Note */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
              Specs, Link or Why You Want It (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 16GB RAM, Touchscreen with pen for teaching notes and coding"
              value={specsOrNotes}
              onChange={(e) => setSpecsOrNotes(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none resize-none"
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Savings Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
