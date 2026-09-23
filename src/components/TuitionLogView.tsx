import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  FileText,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trash2,
  Phone,
  BookOpen,
  IndianRupee,
  CreditCard
} from 'lucide-react';
import { TutoringStudent, TutoringSession, PaymentMode } from '../types';
import { formatINR, formatDuration, formatDate } from '../utils/formatters';

interface TuitionLogViewProps {
  students: TutoringStudent[];
  sessions: TutoringSession[];
  instructorName: string;
  setInstructorName: (name: string) => void;
  onAddStudent: (student: Omit<TutoringStudent, 'id'>) => void;
  onDeleteStudent: (id: string) => void;
  onAddSession: (session: Omit<TutoringSession, 'id'>) => void;
  onDeleteSession: (id: string) => void;
  onToggleSessionPaid: (id: string) => void;
  onOpenInvoice: (studentId: string) => void;
}

export const TuitionLogView: React.FC<TuitionLogViewProps> = ({
  students,
  sessions,
  instructorName,
  setInstructorName,
  onAddStudent,
  onDeleteStudent,
  onAddSession,
  onDeleteSession,
  onToggleSessionPaid,
  onOpenInvoice,
}) => {
  // Calendar month state
  const [currentCalDate, setCurrentCalDate] = useState<Date>(new Date(2026, 2, 1)); // March 2026

  // Selected student filter
  const [selectedStudentId, setSelectedStudentId] = useState<string | 'all'>('all');

  // Form states for adding student
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSubject, setNewStudentSubject] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('Class 12 (CBSE)');
  const [newStudentRate, setNewStudentRate] = useState<number>(600); // ₹600/hr
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentUpi, setNewStudentUpi] = useState('');

  // Form states for logging a session
  const [sessionStudentId, setSessionStudentId] = useState<string>(students[0]?.id || '');
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [sessionTime, setSessionTime] = useState<string>('17:00');
  const [sessionHours, setSessionHours] = useState<number>(1);
  const [sessionMinutes, setSessionMinutes] = useState<number>(30);
  const [sessionTopic, setSessionTopic] = useState<string>('');
  const [sessionPaymentMode, setSessionPaymentMode] = useState<PaymentMode>('UPI');

  // Selected student for auto-calculating session amount
  const activeStudentForForm = useMemo(() => {
    return students.find((s) => s.id === sessionStudentId) || students[0];
  }, [students, sessionStudentId]);

  const computedSessionAmount = useMemo(() => {
    const rate = activeStudentForForm ? activeStudentForForm.hourlyRate : 500;
    const totalHours = (Number(sessionHours) || 0) + (Number(sessionMinutes) || 0) / 60;
    return Math.round(totalHours * rate);
  }, [activeStudentForForm, sessionHours, sessionMinutes]);

  // Overall totals
  const totalEarnedPaid = useMemo(() => {
    return sessions.filter((s) => s.isPaid).reduce((sum, s) => sum + s.amount, 0);
  }, [sessions]);

  const totalOwedUnpaid = useMemo(() => {
    return sessions.filter((s) => !s.isPaid).reduce((sum, s) => sum + s.amount, 0);
  }, [sessions]);

  const totalTutoringMinutes = useMemo(() => {
    return sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [sessions]);

  // Handle Add Student
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const colors = ['#059669', '#2563eb', '#7c3aed', '#d97706', '#e11d48', '#0891b2'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    onAddStudent({
      name: newStudentName.trim(),
      subject: newStudentSubject.trim() || 'General Tutoring',
      gradeOrClass: newStudentGrade.trim() || 'Class 10-12',
      hourlyRate: Number(newStudentRate) || 500,
      phone: newStudentPhone.trim() || undefined,
      upiId: newStudentUpi.trim() || undefined,
      color: randomColor,
    });
    setNewStudentName('');
    setNewStudentSubject('');
    setNewStudentPhone('');
    setNewStudentUpi('');
  };

  // Handle Add Session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionStudentId) return;
    const duration = (Number(sessionHours) || 0) * 60 + (Number(sessionMinutes) || 0);
    if (duration <= 0) return;

    onAddSession({
      studentId: sessionStudentId,
      date: sessionDate,
      startTime: sessionTime,
      durationMinutes: duration,
      amount: computedSessionAmount,
      topic: sessionTopic.trim() || undefined,
      isPaid: false,
      paymentMode: sessionPaymentMode,
    });
    setSessionTopic('');
  };

  // Calendar generation for current month
  const calendarDays = useMemo(() => {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const sessionDates = new Set(
      sessions
        .map((s) => s.date)
        .filter((d) => {
          const [y, m] = d.split('-').map(Number);
          return y === year && m === month + 1;
        })
    );

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, dateStr: '', hasSession: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayPad = day < 10 ? `0${day}` : `${day}`;
      const monthPad = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
      const dateStr = `${year}-${monthPad}-${dayPad}`;
      days.push({
        dayNumber: day,
        dateStr,
        hasSession: sessionDates.has(dateStr),
      });
    }
    return days;
  }, [currentCalDate, sessions]);

  // Filtered sessions
  const displayedSessions = useMemo(() => {
    let list = [...sessions];
    if (selectedStudentId !== 'all') {
      list = list.filter((s) => s.studentId === selectedStudentId);
    }
    return list.sort((a, b) => (b.date + (b.startTime || '')).localeCompare(a.date + (a.startTime || '')));
  }, [sessions, selectedStudentId]);

  return (
    <div className="space-y-8">
      {/* Header and Summary */}
      <div className="p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                Tuition Logger &amp; Invoices
              </span>
              <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
                All fees in Indian Rupee (₹)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C2B22] dark:text-[#EAE4D0]">
              Tuition Earnings &amp; Class Logger
            </h2>
            <p className="text-sm text-[#5B6856] dark:text-[#97A08C] mt-1">
              Log student lessons, calculate fees automatically, monitor pending payments, and generate UPI-ready receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-[#5B6856] dark:text-[#97A08C] block">Tutor Name</span>
              <input
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="Your Name (e.g. Dev Chintu)"
                className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#DCD3B8] dark:border-[#263529]">
          <div className="p-4 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
            <span className="text-xs font-semibold text-[#5B6856] dark:text-[#97A08C]">Total Fees Collected</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {formatINR(totalEarnedPaid)}
            </div>
            <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              {sessions.filter((s) => s.isPaid).length} completed &amp; paid sessions
            </span>
          </div>

          <div className="p-4 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
            <span className="text-xs font-semibold text-[#5B6856] dark:text-[#97A08C]">Pending / Unpaid Fees</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">
              {formatINR(totalOwedUnpaid)}
            </div>
            <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              {sessions.filter((s) => !s.isPaid).length} classes awaiting student payment
            </span>
          </div>

          <div className="p-4 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
            <span className="text-xs font-semibold text-[#5B6856] dark:text-[#97A08C]">Total Teaching Hours</span>
            <div className="text-xl sm:text-2xl font-bold text-[#1C2B22] dark:text-[#EAE4D0] mt-0.5">
              {formatDuration(totalTutoringMinutes)}
            </div>
            <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              Across {students.length} active students
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Calendar Activity Heatmap + Fast Session Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Heatmap (1 col) */}
        <div className="p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#1C2B22] dark:text-[#EAE4D0] flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Teaching Calendar
                </h3>
                <p className="text-xs text-[#5B6856] dark:text-[#97A08C]">
                  Session dates &amp; consistency
                </p>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() =>
                    setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1))
                  }
                  className="p-1 rounded hover:bg-[#F6F1E4] dark:hover:bg-[#1f2c22] text-[#5B6856] dark:text-[#97A08C]"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-[#1C2B22] dark:text-[#EAE4D0] px-1">
                  {currentCalDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
                <button
                  onClick={() =>
                    setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1))
                  }
                  className="p-1 rounded hover:bg-[#F6F1E4] dark:hover:bg-[#1f2c22] text-[#5B6856] dark:text-[#97A08C]"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="font-semibold py-1 text-[#5B6856] dark:text-[#97A08C]">
                  {d}
                </div>
              ))}

              {calendarDays.map((item, idx) => (
                <div
                  key={idx}
                  className={`h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                    !item.dayNumber
                      ? 'opacity-0'
                      : item.hasSession
                      ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-300 dark:ring-emerald-700 shadow-sm'
                      : 'bg-[#F6F1E4] text-[#5B6856] dark:bg-[#19231b] dark:text-[#97A08C]'
                  }`}
                  title={item.hasSession ? `Session logged on ${item.dateStr}` : item.dateStr}
                >
                  {item.dayNumber}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DCD3B8] dark:border-[#263529] flex items-center justify-between text-xs text-[#5B6856] dark:text-[#97A08C]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>Class conducted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DCD3B8] dark:bg-[#2e4233]"></span>
              <span>No class</span>
            </div>
          </div>
        </div>

        {/* Quick Log a Session Form (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#1C2B22] dark:text-[#EAE4D0] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Log a Tuition Class
              </h3>
              <p className="text-xs text-[#5B6856] dark:text-[#97A08C]">
                Calculates total fee in ₹ based on student rate and class duration
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                  Student
                </label>
                <select
                  value={sessionStudentId}
                  onChange={(e) => setSessionStudentId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({formatINR(student.hourlyRate)}/hr) — {student.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                  Duration (Hours &amp; Mins)
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center flex-1">
                    <input
                      type="number"
                      min="0"
                      max="8"
                      value={sessionHours}
                      onChange={(e) => setSessionHours(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-bold text-center py-2 rounded-l-xl border-y border-l bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e]"
                    />
                    <span className="px-2 py-2 text-xs font-semibold border-y border-r bg-[#E8E1CE] text-[#5B6856] border-[#DCD3B8] dark:bg-[#202c22] dark:text-[#97A08C] dark:border-[#2b3c2e] rounded-r-xl">
                      h
                    </span>
                  </div>
                  <div className="flex items-center flex-1">
                    <input
                      type="number"
                      min="0"
                      max="55"
                      step="5"
                      value={sessionMinutes}
                      onChange={(e) => setSessionMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                      className="w-full text-xs font-bold text-center py-2 rounded-l-xl border-y border-l bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e]"
                    />
                    <span className="px-2 py-2 text-xs font-semibold border-y border-r bg-[#E8E1CE] text-[#5B6856] border-[#DCD3B8] dark:bg-[#202c22] dark:text-[#97A08C] dark:border-[#2b3c2e] rounded-r-xl">
                      m
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                  Computed Fee (₹ INR)
                </label>
                <div className="w-full text-xs font-bold px-3 py-2 rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 flex items-center justify-between">
                  <span>{formatDuration((Number(sessionHours) || 0) * 60 + (Number(sessionMinutes) || 0))}</span>
                  <span className="text-sm font-extrabold">{formatINR(computedSessionAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                  Payment Mode Expected
                </label>
                <select
                  value={sessionPaymentMode}
                  onChange={(e) => setSessionPaymentMode(e.target.value as PaymentMode)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                Topics Covered / Lesson Note
              </label>
              <input
                type="text"
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
                placeholder="e.g. Calculus: Integration by parts, Problem sheet revision"
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Log Tuition Session
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Student Roster & Invoice Center */}
      <div className="p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
              Students &amp; Fee Invoices
            </h3>
            <p className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              Manage hourly tuition fees, review student pending dues, and generate UPI-ready printable invoices
            </p>
          </div>

          {/* Quick Add Student Inline */}
          <form onSubmit={handleCreateStudent} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              required
              placeholder="Student Name"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e]"
            />
            <input
              type="text"
              placeholder="Subject (e.g. Math / Physics)"
              value={newStudentSubject}
              onChange={(e) => setNewStudentSubject(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e]"
            />
            <input
              type="number"
              placeholder="₹/hr"
              value={newStudentRate}
              onChange={(e) => setNewStudentRate(Number(e.target.value))}
              className="w-20 text-xs px-3 py-1.5 rounded-lg border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1C2B22] hover:bg-black dark:bg-[#2e4738] dark:hover:bg-[#3d5e4a] transition-colors"
            >
              + Add Student
            </button>
          </form>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {students.map((student) => {
            const studentSessions = sessions.filter((s) => s.studentId === student.id);
            const unpaidTotal = studentSessions
              .filter((s) => !s.isPaid)
              .reduce((sum, s) => sum + s.amount, 0);
            const unpaidCount = studentSessions.filter((s) => !s.isPaid).length;

            return (
              <div
                key={student.id}
                className="p-4 rounded-xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: student.color }}
                      />
                      <span className="text-[11px] font-semibold text-[#5B6856] dark:text-[#97A08C]">
                        {student.gradeOrClass || 'Student'}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteStudent(student.id)}
                      className="text-[#5B6856] hover:text-rose-600 dark:text-[#97A08C] p-1"
                      title="Remove student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-bold text-sm text-[#1C2B22] dark:text-[#EAE4D0]">
                    {student.name}
                  </h4>
                  <p className="text-xs text-[#5B6856] dark:text-[#97A08C]">{student.subject}</p>

                  {student.upiId && (
                    <div className="mt-1 text-[11px] text-[#5B6856] dark:text-[#97A08C]">
                      UPI: <span className="font-mono">{student.upiId}</span>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[#5B6856] dark:text-[#97A08C]">Tuition Rate</span>
                    <span className="font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                      {formatINR(student.hourlyRate)}/hr
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-[#5B6856] dark:text-[#97A08C]">Pending Owed</span>
                    <span
                      className={`font-bold ${
                        unpaidTotal > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatINR(unpaidTotal)} ({unpaidCount})
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#DCD3B8] dark:border-[#2b3c2e] flex items-center gap-2">
                  <button
                    onClick={() => onOpenInvoice(student.id)}
                    className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center bg-[#1C2B22] text-[#FFFDF6] dark:bg-[#2e4738] dark:text-[#EAE4D0] hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    Invoice / Receipt
                  </button>
                  <button
                    onClick={() =>
                      setSelectedStudentId(selectedStudentId === student.id ? 'all' : student.id)
                    }
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedStudentId === student.id
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-[#DCD3B8] text-[#5B6856] dark:border-[#2b3c2e] dark:text-[#97A08C]'
                    }`}
                  >
                    {selectedStudentId === student.id ? 'Filtered' : 'Filter'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logged Sessions List (Interactive Table with Paid Status Toggle) */}
      <div className="p-6 rounded-2xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
              Session Log &amp; Payment Status
            </h3>
            <p className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              {selectedStudentId === 'all'
                ? 'Showing all student classes'
                : `Filtered by ${students.find((s) => s.id === selectedStudentId)?.name}`}
            </p>
          </div>

          {selectedStudentId !== 'all' && (
            <button
              onClick={() => setSelectedStudentId('all')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#DCD3B8] dark:border-[#263529] text-[#5B6856] dark:text-[#97A08C]">
                <th className="py-3 px-3 font-semibold">Date &amp; Time</th>
                <th className="py-3 px-3 font-semibold">Student</th>
                <th className="py-3 px-3 font-semibold">Duration</th>
                <th className="py-3 px-3 font-semibold">Topics Covered</th>
                <th className="py-3 px-3 font-semibold">Mode</th>
                <th className="py-3 px-3 font-semibold">Fee (₹)</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCD3B8]/60 dark:divide-[#263529]/60">
              {displayedSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-[#5B6856] dark:text-[#97A08C]">
                    No sessions logged yet. Use the form above to log your first class.
                  </td>
                </tr>
              ) : (
                displayedSessions.map((session) => {
                  const student = students.find((s) => s.id === session.studentId);
                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-[#F6F1E4]/50 dark:hover:bg-[#1a251d]/50 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-[#1C2B22] dark:text-[#EAE4D0] whitespace-nowrap">
                        {formatDate(session.date)}{' '}
                        {session.startTime && (
                          <span className="text-[#5B6856] dark:text-[#97A08C] text-[11px]">
                            • {session.startTime}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#1C2B22] dark:text-[#EAE4D0]">
                          {student?.name || 'Unknown'}
                        </span>
                        <span className="block text-[11px] text-[#5B6856] dark:text-[#97A08C]">
                          {student?.subject}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#5B6856] dark:text-[#97A08C]">
                        {formatDuration(session.durationMinutes)}
                      </td>
                      <td className="py-3 px-3 text-[#5B6856] dark:text-[#97A08C] max-w-xs truncate">
                        {session.topic || '—'}
                      </td>
                      <td className="py-3 px-3 text-[#5B6856] dark:text-[#97A08C]">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#F6F1E4] dark:bg-[#18221a] border border-[#DCD3B8] dark:border-[#2b3c2e]">
                          {session.paymentMode || 'UPI'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                        {formatINR(session.amount)}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onToggleSessionPaid(session.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            session.isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-200'
                          }`}
                        >
                          {session.isPaid ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Paid
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Mark Paid
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="p-1 rounded text-[#5B6856] hover:text-rose-600 dark:text-[#97A08C] transition-colors"
                          title="Delete session"
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
  );
};
