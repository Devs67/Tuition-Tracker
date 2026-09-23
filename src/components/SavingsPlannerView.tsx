import React, { useState, useMemo } from 'react';
import {
  Target,
  ShoppingBag,
  Plus,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle,
  Calendar,
  PiggyBank,
  ArrowRight,
  Flame,
  ShieldCheck,
  Zap,
  Trash2,
  BookOpen
} from 'lucide-react';
import { PurchaseGoal, TutoringStudent } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface SavingsPlannerViewProps {
  goals: PurchaseGoal[];
  students: TutoringStudent[];
  onOpenAddGoal: () => void;
  onOpenAddDeposit: (goal: PurchaseGoal) => void;
  onDeleteGoal: (id: string) => void;
}

export const SavingsPlannerView: React.FC<SavingsPlannerViewProps> = ({
  goals,
  students,
  onOpenAddGoal,
  onOpenAddDeposit,
  onDeleteGoal,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');
  const [extraWeeklySavings, setExtraWeeklySavings] = useState<number>(1000); // ₹1,000 extra per week in simulator

  const activeGoal = useMemo(() => {
    return goals.find((g) => g.id === selectedGoalId) || goals[0];
  }, [goals, selectedGoalId]);

  // Average tuition rate across active students
  const avgHourlyRate = useMemo(() => {
    if (students.length === 0) return 600;
    const sum = students.reduce((acc, s) => acc + s.hourlyRate, 0);
    return Math.round(sum / students.length);
  }, [students]);

  // Calculations for active goal
  const goalStats = useMemo(() => {
    if (!activeGoal) return null;

    const remaining = Math.max(0, activeGoal.targetPrice - activeGoal.savedAmount);
    const progressPct = Math.min(100, Math.round((activeGoal.savedAmount / activeGoal.targetPrice) * 100));

    // Days remaining calculation
    const today = new Date();
    const target = new Date(activeGoal.targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const diffWeeks = Math.max(1, Math.ceil(diffDays / 7));
    const diffMonths = Math.max(1, Math.ceil(diffDays / 30));

    // Savings rates required
    const dailyTarget = Math.ceil(remaining / diffDays);
    const weeklyTarget = Math.ceil(remaining / diffWeeks);
    const monthlyTarget = Math.ceil(remaining / diffMonths);

    // Tuition hours needed to fully bridge the remaining gap
    const tuitionHoursNeeded = Math.ceil(remaining / avgHourlyRate);
    const tuitionSessionsNeeded = Math.ceil(tuitionHoursNeeded / 1.5); // ~1.5 hr sessions

    // Simulator: how many days faster with extraWeeklySavings
    const extraDaily = extraWeeklySavings / 7;
    const acceleratedDays = extraDaily > 0 ? Math.round(remaining / (dailyTarget + extraDaily)) : diffDays;
    const daysSaved = Math.max(0, diffDays - acceleratedDays);

    return {
      remaining,
      progressPct,
      diffDays,
      diffWeeks,
      diffMonths,
      dailyTarget,
      weeklyTarget,
      monthlyTarget,
      tuitionHoursNeeded,
      tuitionSessionsNeeded,
      daysSaved,
    };
  }, [activeGoal, avgHourlyRate, extraWeeklySavings]);

  const totalSavedAcrossAllGoals = useMemo(() => {
    return goals.reduce((sum, g) => sum + g.savedAmount, 0);
  }, [goals]);

  const totalTargetAcrossAllGoals = useMemo(() => {
    return goals.reduce((sum, g) => sum + g.targetPrice, 0);
  }, [goals]);

  return (
    <div className="space-y-8">
      {/* Top Banner: How to save money for anything you want */}
      <div className="p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                Smart Wishlist &amp; Savings Engine
              </span>
              <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
                Buy Anything Debt-Free
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C2B22] dark:text-[#EAE4D0]">
              Save to Buy Planner
            </h2>
            <p className="text-sm text-[#5B6856] dark:text-[#97A08C] mt-1">
              Want to buy a laptop, phone, gadget or vehicle? Plan daily micro-savings, fund it using tuition earnings, and purchase with 100% confidence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAddGoal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              + Add Item to Buy
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#DCD3B8] dark:border-[#263529]">
          <div className="p-4 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
            <span className="text-xs font-semibold text-[#5B6856] dark:text-[#97A08C]">Total Saved Across Goals</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {formatINR(totalSavedAcrossAllGoals)}
            </div>
            <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              Towards {formatINR(totalTargetAcrossAllGoals)} total wishlist
            </span>
          </div>

          <div className="p-4 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
            <span className="text-xs font-semibold text-[#5B6856] dark:text-[#97A08C]">Active Purchase Targets</span>
            <div className="text-xl sm:text-2xl font-bold text-[#1C2B22] dark:text-[#EAE4D0] mt-0.5">
              {goals.length} Items Planned
            </div>
            <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              {goals.filter((g) => g.savedAmount >= g.targetPrice).length} fully funded!
            </span>
          </div>

          <div className="p-4 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
            <span className="text-xs font-semibold text-[#5B6856] dark:text-[#97A08C]">Average Tuition Power</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">
              {formatINR(avgHourlyRate)}/hr
            </div>
            <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              Direct teaching income can fund your purchases
            </span>
          </div>
        </div>
      </div>

      {/* Goal Cards Grid: Select an item to analyze */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
            Your Wishlist Items ({goals.length})
          </h3>
          <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
            Click any card to inspect savings roadmap &amp; strategies
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const isSelected = goal.id === (activeGoal?.id || '');
            const pct = Math.min(100, Math.round((goal.savedAmount / goal.targetPrice) * 100));
            const remaining = Math.max(0, goal.targetPrice - goal.savedAmount);

            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoalId(goal.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                    : 'border-[#DCD3B8] bg-[#FFFDF6] dark:bg-[#151e17] dark:border-[#263529] hover:border-amber-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F6F1E4] text-[#1C2B22] dark:bg-[#18221a] dark:text-[#EAE4D0] border border-[#DCD3B8] dark:border-[#2b3c2e]">
                      {goal.category === 'laptop_pc' && '💻 Laptop / PC'}
                      {goal.category === 'phone_tablet' && '📱 Phone / Tablet'}
                      {goal.category === 'audio_gadget' && '🎧 Audio Gadget'}
                      {goal.category === 'vehicle' && '🛵 Vehicle'}
                      {goal.category === 'books_learning' && '📚 Learning Tool'}
                      {goal.category === 'other' && '🎯 Wishlist Item'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGoal(goal.id);
                      }}
                      className="p-1 text-[#5B6856] hover:text-rose-600 dark:text-[#97A08C] transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-bold text-base text-[#1C2B22] dark:text-[#EAE4D0] line-clamp-1">
                    {goal.title}
                  </h4>
                  {goal.specsOrNotes && (
                    <p className="text-xs text-[#5B6856] dark:text-[#97A08C] line-clamp-2 mt-1">
                      {goal.specsOrNotes}
                    </p>
                  )}

                  {/* Pricing and Progress */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-base text-emerald-700 dark:text-emerald-400">
                        {formatINR(goal.savedAmount)}
                      </span>
                      <span className="text-[#5B6856] dark:text-[#97A08C]">
                        Goal: <strong className="text-[#1C2B22] dark:text-[#EAE4D0]">{formatINR(goal.targetPrice)}</strong>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#DCD3B8]/60 dark:bg-[#2b3c2e] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#5B6856] dark:text-[#97A08C]">
                      <span>{pct}% funded</span>
                      <span>{remaining > 0 ? `${formatINR(remaining)} left` : 'Ready to buy! 🎉'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#DCD3B8]/60 dark:border-[#263529]/60 flex items-center justify-between">
                  <span className="text-xs text-[#5B6856] dark:text-[#97A08C] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Target: {formatDate(goal.targetDate)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddDeposit(goal);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    + Deposit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive: HOW TO SAVE MONEY FOR THIS SPECIFIC ITEM */}
      {activeGoal && goalStats && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCD3B8] dark:border-[#263529]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Target Savings Blueprint
                </span>
                <h3 className="text-xl font-bold text-[#1C2B22] dark:text-[#EAE4D0] mt-0.5">
                  How to save money to buy: {activeGoal.title}
                </h3>
                <p className="text-xs text-[#5B6856] dark:text-[#97A08C]">
                  Target date: {formatDate(activeGoal.targetDate)} • {goalStats.diffDays} days left to save {formatINR(goalStats.remaining)}
                </p>
              </div>

              <button
                onClick={() => onOpenAddDeposit(activeGoal)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <PiggyBank className="w-4 h-4" />
                Add Savings Deposit
              </button>
            </div>

            {/* 3 Savings Rate Paces */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {/* Daily Micro-Goal */}
              <div className="p-4 rounded-xl border bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Daily Micro-Target</span>
                  <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-200 mt-2">
                  {formatINR(goalStats.dailyTarget)} <span className="text-xs font-normal">/ day</span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/70 mt-1">
                  Putting aside just {formatINR(goalStats.dailyTarget)} every day achieves your goal by {formatDate(activeGoal.targetDate)}.
                </p>
              </div>

              {/* Weekly Target */}
              <div className="p-4 rounded-xl border bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Weekly Target</span>
                  <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-2">
                  {formatINR(goalStats.weeklyTarget)} <span className="text-xs font-normal">/ week</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/70 mt-1">
                  Save {formatINR(goalStats.weeklyTarget)} every Sunday or allocate from weekend tuition collections.
                </p>
              </div>

              {/* Monthly Target */}
              <div className="p-4 rounded-xl border bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300">Monthly Target</span>
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-200 mt-2">
                  {formatINR(goalStats.monthlyTarget)} <span className="text-xs font-normal">/ month</span>
                </div>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/70 mt-1">
                  Divert {formatINR(goalStats.monthlyTarget)} from your monthly stipend or tuition fees.
                </p>
              </div>
            </div>

            {/* Tuition-Funded Bridge Banner */}
            <div className="mt-6 p-5 rounded-2xl bg-[#1C2B22] text-[#FFFDF6] dark:bg-[#1a291f] border border-[#2b3c2e] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    The Tuition Funding Power
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold">
                  Teach {goalStats.tuitionHoursNeeded} hours of tuition to 100% fund this remaining {formatINR(goalStats.remaining)}!
                </h4>
                <p className="text-xs text-[#DCD3B8] max-w-xl">
                  At your active student hourly rate of {formatINR(avgHourlyRate)}/hr, taking just{' '}
                  <strong className="text-emerald-300">{goalStats.tuitionSessionsNeeded} tutoring sessions</strong> pays for this entire item without touching your living expenses or borrowing money.
                </p>
              </div>

              <button
                onClick={() => onOpenAddDeposit(activeGoal)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <PiggyBank className="w-4 h-4" />
                Allocate Tuition Payment
              </button>
            </div>
          </div>

          {/* Practical Strategies: 4 Proven Rules on How to Save Money */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 4 Actionable Habits */}
            <div className="p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm space-y-4">
              <h4 className="text-base font-bold text-[#1C2B22] dark:text-[#EAE4D0] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                4 Proven Strategies to Save for This Item
              </h4>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                      The 'Pay-Your-Goal-First' Rule
                    </h5>
                    <p className="text-xs text-[#5B6856] dark:text-[#97A08C] mt-0.5">
                      The second a student pays their monthly tuition fee via UPI, immediately route 30% to 50% into this goal fund before using the rest for daily discretionary purchases.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                      The Swiggy / Zomato Swap (Micro-Savings)
                    </h5>
                    <p className="text-xs text-[#5B6856] dark:text-[#97A08C] mt-0.5">
                      Skipping just 2 food deliveries per week saves ~₹600 weekly (₹2,400 monthly). In 3 months, that alone builds <strong className="text-[#1C2B22] dark:text-[#EAE4D0]">₹7,200</strong> of your purchase price!
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                      The 30-Day Anti-Impulse Rule
                    </h5>
                    <p className="text-xs text-[#5B6856] dark:text-[#97A08C] mt-0.5">
                      Never buy big-ticket electronics on zero-downpayment EMI loans. Saving cash upfront eliminates buyer's remorse, guarantees 0% interest, and gives complete ownership freedom.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                      Earmarked Digital Sub-Account
                    </h5>
                    <p className="text-xs text-[#5B6856] dark:text-[#97A08C] mt-0.5">
                      Keep these funds in a dedicated zero-balance bank pot or liquid fund. Keeping it separate prevents accidental UPI scanning at chai stalls or grocery stores.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Goal Accelerator Simulator */}
            <div className="p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-[#1C2B22] dark:text-[#EAE4D0] flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Interactive Goal Accelerator Simulator
                </h4>
                <p className="text-xs text-[#5B6856] dark:text-[#97A08C] mb-4">
                  See how small lifestyle tweaks speed up your purchase date
                </p>

                <div className="p-4 rounded-xl bg-[#F6F1E4] dark:bg-[#18221a] border border-[#DCD3B8] dark:border-[#2b3c2e] space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-[#1C2B22] dark:text-[#EAE4D0]">
                        Extra Weekly Savings or Extra Tutoring:
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                        +{formatINR(extraWeeklySavings)} / week
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="250"
                      value={extraWeeklySavings}
                      onChange={(e) => setExtraWeeklySavings(Number(e.target.value))}
                      className="w-full h-2 bg-[#DCD3B8] dark:bg-[#2b3c2e] rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />

                    <div className="flex justify-between text-[11px] text-[#5B6856] dark:text-[#97A08C] mt-1">
                      <span>₹0</span>
                      <span>₹2,500</span>
                      <span>₹5,000 / week</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 text-xs">
                    <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      Speed Boost Result:
                    </div>
                    <p className="text-emerald-800 dark:text-emerald-300 mt-1">
                      By saving an extra <strong className="font-bold">{formatINR(extraWeeklySavings)}/week</strong>, you reach your target{' '}
                      <strong className="font-extrabold text-sm underline">{goalStats.daysSaved} days earlier</strong> than scheduled!
                    </p>
                  </div>
                </div>
              </div>

              {/* Deposit History for this Goal */}
              <div className="mt-6 pt-4 border-t border-[#DCD3B8] dark:border-[#263529]">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                    Deposit Log ({activeGoal.deposits?.length || 0})
                  </h5>
                  <button
                    onClick={() => onOpenAddDeposit(activeGoal)}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    + Record New Deposit
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {!activeGoal.deposits || activeGoal.deposits.length === 0 ? (
                    <div className="text-xs text-[#5B6856] dark:text-[#97A08C] py-2">
                      No deposits recorded yet. Make your first deposit!
                    </div>
                  ) : (
                    activeGoal.deposits.map((dep) => (
                      <div
                        key={dep.id}
                        className="p-2.5 rounded-lg bg-[#F6F1E4]/60 dark:bg-[#18221a] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#1C2B22] dark:text-[#EAE4D0] block">
                            {dep.source}
                          </span>
                          <span className="text-[11px] text-[#5B6856] dark:text-[#97A08C]">
                            {formatDate(dep.date)} {dep.notes ? `• ${dep.notes}` : ''}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          +{formatINR(dep.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
