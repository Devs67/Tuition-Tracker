export type ActiveTab = 'tuition' | 'finance' | 'save-to-buy';

export type PaymentMode = 'UPI' | 'Cash' | 'Bank Transfer' | 'Card';

// 1. Tuition Logger Types
export interface TutoringStudent {
  id: string;
  name: string;
  subject: string;
  gradeOrClass: string;
  hourlyRate: number; // in ₹
  phone?: string;
  email?: string;
  color: string;
  upiId?: string;
}

export interface TutoringSession {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  durationMinutes: number;
  amount: number; // in ₹
  topic?: string;
  isPaid: boolean;
  paidDate?: string;
  paymentMode?: PaymentMode;
}

// 2. Finance Tracker Types
export type TransactionType = 'income' | 'expense';

export type FinanceCategory =
  | 'tuition_earnings'
  | 'salary_stipend'
  | 'freelance'
  | 'investments'
  | 'food_groceries'
  | 'rent_stay'
  | 'bills_utilities'
  | 'commute_fuel'
  | 'shopping'
  | 'tech_gadgets'
  | 'health_personal'
  | 'entertainment'
  | 'other';

export interface FinanceTransaction {
  id: string;
  title: string;
  type: TransactionType;
  category: FinanceCategory;
  amount: number; // in ₹
  date: string; // YYYY-MM-DD
  paymentMode: PaymentMode;
  notes?: string;
}

// 3. Save to Buy (Wishlist & Savings Planner) Types
export interface SavingsDeposit {
  id: string;
  date: string;
  amount: number; // in ₹
  source: string;
  notes?: string;
}

export interface PurchaseGoal {
  id: string;
  title: string;
  targetPrice: number; // in ₹
  savedAmount: number; // in ₹
  targetDate: string; // YYYY-MM-DD
  category: 'laptop_pc' | 'phone_tablet' | 'vehicle' | 'audio_gadget' | 'books_learning' | 'other';
  priority: 'high' | 'medium' | 'low';
  specsOrNotes?: string;
  deposits: SavingsDeposit[];
}

