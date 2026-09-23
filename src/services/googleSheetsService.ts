import { TutoringStudent, TutoringSession, FinanceTransaction, PurchaseGoal } from '../types';
import { FINANCE_CATEGORY_CONFIG } from '../data/initialData';

const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface SpreadsheetDetails {
  id: string;
  title: string;
  url: string;
  lastSyncedAt?: string;
}

export interface AppSyncData {
  students: TutoringStudent[];
  sessions: TutoringSession[];
  transactions: FinanceTransaction[];
  goals: PurchaseGoal[];
}

/**
 * Creates a new Google Spreadsheet in the user's Google Drive with 3 dedicated sheets:
 * 1. "Tuition Log"
 * 2. "Finance Ledger"
 * 3. "Savings Goals"
 */
export const createPaisaLedgerSpreadsheet = async (
  accessToken: string,
  customTitle = 'PaisaLedger - Tuition & Finance Tracker'
): Promise<SpreadsheetDetails> => {
  const requestBody = {
    properties: {
      title: customTitle,
      locale: 'en_IN',
    },
    sheets: [
      {
        properties: {
          title: 'Tuition Log',
          gridProperties: { rowCount: 100, columnCount: 10, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Finance Ledger',
          gridProperties: { rowCount: 200, columnCount: 10, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Savings Goals',
          gridProperties: { rowCount: 50, columnCount: 10, frozenRowCount: 1 },
        },
      },
    ],
  };

  const response = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Sheet: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    id: result.spreadsheetId,
    title: result.properties?.title || customTitle,
    url: `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}`,
    lastSyncedAt: new Date().toISOString(),
  };
};

/**
 * Validates and fetches metadata for an existing Google Spreadsheet
 */
export const getSpreadsheetMetadata = async (
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetDetails> => {
  const response = await fetch(`${SHEETS_API_URL}/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Unable to access Google Sheet (${response.statusText})`);
  }

  const data = await response.json();
  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Connected Sheet',
    url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
    lastSyncedAt: new Date().toISOString(),
  };
};

/**
 * Syncs all application data (Tuition, Transactions, Goals) into the 3 tabs of the Google Sheet
 */
export const syncAllDataToGoogleSheet = async (
  accessToken: string,
  spreadsheetId: string,
  data: AppSyncData
): Promise<void> => {
  // 1. Build Tuition Log Rows
  const tuitionHeader = [
    'Session ID',
    'Date',
    'Time',
    'Student Name',
    'Subject',
    'Grade / Class',
    'Duration (Mins)',
    'Amount (INR ₹)',
    'Payment Mode',
    'Paid Status',
    'Topics / Notes',
  ];

  const tuitionRows = data.sessions.map((s) => {
    const student = data.students.find((st) => st.id === s.studentId);
    return [
      s.id,
      s.date,
      s.startTime || '',
      student?.name || 'Unknown',
      student?.subject || '',
      student?.gradeOrClass || '',
      s.durationMinutes,
      s.amount,
      s.paymentMode || 'UPI',
      s.isPaid ? 'PAID' : 'PENDING',
      s.topic || '',
    ];
  });

  // 2. Build Finance Ledger Rows
  const financeHeader = [
    'Transaction ID',
    'Date',
    'Type',
    'Title',
    'Category',
    'Amount (INR ₹)',
    'Payment Mode',
    'Notes',
  ];

  const financeRows = data.transactions.map((t) => {
    const catConfig = FINANCE_CATEGORY_CONFIG[t.category] || FINANCE_CATEGORY_CONFIG.other;
    return [
      t.id,
      t.date,
      t.type.toUpperCase(),
      t.title,
      catConfig.label,
      t.amount,
      t.paymentMode,
      t.notes || '',
    ];
  });

  // 3. Build Wishlist Savings Goals Rows
  const goalsHeader = [
    'Goal ID',
    'Item Title',
    'Category',
    'Priority',
    'Target Price (INR ₹)',
    'Saved So Far (INR ₹)',
    'Remaining to Save (INR ₹)',
    'Progress (%)',
    'Target Date',
    'Specs / Notes',
  ];

  const goalsRows = data.goals.map((g) => {
    const remaining = Math.max(0, g.targetPrice - g.savedAmount);
    const progress = Math.min(100, Math.round((g.savedAmount / g.targetPrice) * 100));
    return [
      g.id,
      g.title,
      g.category,
      g.priority.toUpperCase(),
      g.targetPrice,
      g.savedAmount,
      remaining,
      `${progress}%`,
      g.targetDate,
      g.specsOrNotes || '',
    ];
  });

  // Clear existing ranges and append fresh rows via batchUpdate
  const batchData = [
    {
      range: "'Tuition Log'!A1:K" + Math.max(2, tuitionRows.length + 1),
      values: [tuitionHeader, ...tuitionRows],
    },
    {
      range: "'Finance Ledger'!A1:H" + Math.max(2, financeRows.length + 1),
      values: [financeHeader, ...financeRows],
    },
    {
      range: "'Savings Goals'!A1:J" + Math.max(2, goalsRows.length + 1),
      values: [goalsHeader, ...goalsRows],
    },
  ];

  // Try writing to specific tabs; if tab names differ, write to default sheet
  const updateRes = await fetch(
    `${SHEETS_API_URL}/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    }
  );

  if (!updateRes.ok) {
    // If named sheets don't exist in a custom user sheet, fallback to writing to Sheet1
    const fallbackData = [
      {
        range: 'A1:H' + Math.max(2, financeRows.length + 1),
        values: [financeHeader, ...financeRows],
      },
    ];
    await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: fallbackData,
      }),
    });
  }
};

/**
 * Extracts spreadsheet ID from either full Google Sheets URL or raw ID
 */
export const extractSpreadsheetId = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Match https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If user pasted bare ID (length ~44 characters, alphanumeric with hyphens)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
};
