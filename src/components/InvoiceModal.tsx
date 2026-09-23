import React from 'react';
import { X, Printer, CheckCircle, BookOpen, QrCode, IndianRupee } from 'lucide-react';
import { TutoringStudent, TutoringSession } from '../types';
import { formatINR, formatDuration, formatDate } from '../utils/formatters';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: TutoringStudent | null;
  sessions: TutoringSession[];
  instructorName: string;
  onMarkAllAsPaid: (studentId: string) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  student,
  sessions,
  instructorName,
  onMarkAllAsPaid,
}) => {
  if (!isOpen || !student) return null;

  const unpaidSessions = sessions.filter((s) => s.studentId === student.id && !s.isPaid);
  const totalDue = unpaidSessions.reduce((sum, s) => sum + s.amount, 0);

  const invoiceNumber = `REC-${student.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-4)}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-2xl p-6 sm:p-8">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#DCD3B8] dark:border-[#263529] print:hidden">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
              Tuition Fee Statement &amp; Receipt
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] hover:border-[#1C2B22] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e]"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#5B6856] hover:text-[#1C2B22] dark:text-[#97A08C] dark:hover:text-[#EAE4D0]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="invoice-sheet" className="space-y-6 text-[#1C2B22] dark:text-[#EAE4D0]">
          {/* Header */}
          <div className="flex items-start justify-between pb-6 border-b-2 border-[#1C2B22] dark:border-[#EAE4D0]">
            <div>
              <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-700 dark:text-emerald-400">
                Tuition &amp; Coaching Statement
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1">FEE INVOICE</h1>
              <p className="text-xs text-[#5B6856] dark:text-[#97A08C] mt-1">
                Tutor: <strong className="text-[#1C2B22] dark:text-[#EAE4D0]">{instructorName || 'Private Tutor'}</strong>
              </p>
            </div>

            <div className="text-right text-xs">
              <div className="font-mono font-bold text-sm">{invoiceNumber}</div>
              <div className="text-[#5B6856] dark:text-[#97A08C] mt-0.5">Date: {issueDate}</div>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {unpaidSessions.length > 0 ? 'Payment Due' : 'Fully Paid'}
              </div>
            </div>
          </div>

          {/* Student Billing Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#5B6856] dark:text-[#97A08C] block uppercase tracking-wider font-semibold">
                Student Details
              </span>
              <div className="text-base font-bold mt-0.5">{student.name}</div>
              <div className="text-[#5B6856] dark:text-[#97A08C]">{student.gradeOrClass}</div>
              <div className="text-[#5B6856] dark:text-[#97A08C]">Subject: {student.subject}</div>
              {student.phone && (
                <div className="text-[#5B6856] dark:text-[#97A08C]">Phone: {student.phone}</div>
              )}
            </div>

            <div className="text-right">
              <span className="text-[#5B6856] dark:text-[#97A08C] block uppercase tracking-wider font-semibold">
                Payment Info
              </span>
              <div className="font-medium mt-0.5">Rate: {formatINR(student.hourlyRate)}/hr</div>
              <div className="text-[#5B6856] dark:text-[#97A08C]">Accepted via UPI / Cash / Bank</div>
              {student.upiId && (
                <div className="text-[#5B6856] dark:text-[#97A08C] font-mono mt-1">
                  UPI ID: {student.upiId}
                </div>
              )}
            </div>
          </div>

          {/* Table of Unpaid Sessions */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DCD3B8] dark:border-[#263529] text-[#5B6856] dark:text-[#97A08C]">
                  <th className="py-2 px-2 font-semibold">Date</th>
                  <th className="py-2 px-2 font-semibold">Duration</th>
                  <th className="py-2 px-2 font-semibold">Topics Covered</th>
                  <th className="py-2 px-2 font-semibold text-right">Fee (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCD3B8]/60 dark:divide-[#263529]/60">
                {unpaidSessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#5B6856] dark:text-[#97A08C]">
                      No outstanding unpaid sessions for {student.name}. All caught up!
                    </td>
                  </tr>
                ) : (
                  unpaidSessions.map((session) => (
                    <tr key={session.id}>
                      <td className="py-2.5 px-2 font-medium">
                        {formatDate(session.date)}
                        {session.startTime && (
                          <span className="text-[#5B6856] dark:text-[#97A08C] text-[11px] block">
                            {session.startTime}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2">{formatDuration(session.durationMinutes)}</td>
                      <td className="py-2.5 px-2 text-[#5B6856] dark:text-[#97A08C]">
                        {session.topic || 'Class coaching'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold">
                        {formatINR(session.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total Due Banner */}
          <div className="flex justify-end pt-4 border-t-2 border-[#1C2B22] dark:border-[#EAE4D0]">
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-[#5B6856] dark:text-[#97A08C] font-semibold">
                Total Amount Due
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-1">
                {formatINR(totalDue)}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#5B6856] dark:text-[#97A08C] pt-4 border-t border-[#DCD3B8] dark:border-[#263529] flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Please remit payment via UPI (Google Pay, PhonePe, Paytm) within 7 days.</span>
            <span className="font-semibold">Thank you for learning with us!</span>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="mt-6 pt-4 border-t border-[#DCD3B8] dark:border-[#263529] flex items-center justify-between print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B6856] hover:text-[#1C2B22] dark:text-[#97A08C]"
          >
            Close
          </button>

          {unpaidSessions.length > 0 && (
            <button
              onClick={() => {
                onMarkAllAsPaid(student.id);
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mark All {unpaidSessions.length} Classes as Paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
