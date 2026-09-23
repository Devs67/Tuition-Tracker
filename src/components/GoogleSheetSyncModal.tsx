import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Plus,
  Link2,
  AlertCircle,
  Unlink,
  ShieldCheck,
  Check,
  ShieldAlert,
  Copy
} from 'lucide-react';
import {
  createPaisaLedgerSpreadsheet,
  getSpreadsheetMetadata,
  syncAllDataToGoogleSheet,
  extractSpreadsheetId,
  SpreadsheetDetails,
  AppSyncData
} from '../services/googleSheetsService';
import { signInWithGoogle, AppUser } from '../services/firebase';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
  connectedSheet: SpreadsheetDetails | null;
  setConnectedSheet: (sheet: SpreadsheetDetails | null) => void;
  appData: AppSyncData;
  onAuthSuccess: (user: AppUser, token?: string) => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  googleAccessToken,
  setGoogleAccessToken,
  connectedSheet,
  setConnectedSheet,
  appData,
  onAuthSuccess,
}) => {
  const [existingUrlOrId, setExistingUrlOrId] = useState('');
  const [customSheetTitle, setCustomSheetTitle] = useState('PaisaLedger - Tuition & Finance Tracker');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'devs67.github.io';

  const handleCopyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    } catch {
      // fallback
    }
  };

  const isDomainUnauthorized = errorMsg && (
    errorMsg.toLowerCase().includes('unauthorized-domain') ||
    errorMsg.toLowerCase().includes('domain authorization') ||
    errorMsg.toLowerCase().includes('authorized domains')
  );

  // Helper to ensure we have a valid Google Access Token
  const ensureGoogleToken = async (): Promise<string> => {
    if (googleAccessToken) return googleAccessToken;
    // Trigger Google Sign in
    const res = await signInWithGoogle();
    onAuthSuccess(res.user, res.accessToken);
    setGoogleAccessToken(res.accessToken);
    return res.accessToken;
  };

  // 1. Create a brand new Google Spreadsheet and populate it
  const handleCreateNewSheet = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const token = await ensureGoogleToken();
      const newSheet = await createPaisaLedgerSpreadsheet(token, customSheetTitle.trim());

      // Initial populate
      await syncAllDataToGoogleSheet(token, newSheet.id, appData);

      setConnectedSheet(newSheet);
      setSuccessMsg(`Google Sheet "${newSheet.title}" created and synced with your tuition & finance data!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create Google Spreadsheet.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Connect an existing Google Spreadsheet
  const handleConnectExistingSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const sheetId = extractSpreadsheetId(existingUrlOrId);
    if (!sheetId) {
      setErrorMsg('Please enter a valid Google Sheets URL or Spreadsheet ID.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await ensureGoogleToken();
      const details = await getSpreadsheetMetadata(token, sheetId);
      setConnectedSheet(details);
      setSuccessMsg(`Successfully connected to "${details.title}"! Click "Sync Now" below to push your data.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not connect to this Google Sheet. Ensure it is accessible by your account.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Sync all data into connected sheet (with mandatory user confirmation for mutating data)
  const handleSyncDataNow = async () => {
    if (!connectedSheet) return;

    // Explicit confirmation dialog before updating spreadsheet data as required by Workspace integration guidelines
    const confirmed = window.confirm(
      `Update Google Sheet "${connectedSheet.title}" with current tuition sessions, transactions, and savings goals? Existing data on matching rows will be refreshed.`
    );
    if (!confirmed) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const token = await ensureGoogleToken();
      await syncAllDataToGoogleSheet(token, connectedSheet.id, appData);

      const updatedSheet: SpreadsheetDetails = {
        ...connectedSheet,
        lastSyncedAt: new Date().toISOString(),
      };
      setConnectedSheet(updatedSheet);
      setSuccessMsg(`Google Sheet updated successfully at ${new Date().toLocaleTimeString()}!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sync data to Google Sheet.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Disconnect sheet
  const handleDisconnectSheet = () => {
    if (window.confirm('Disconnect this Google Sheet? Local data on your device will remain intact.')) {
      setConnectedSheet(null);
      setSuccessMsg('Google Sheet disconnected.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-2xl p-6 sm:p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-[#5B6856] hover:text-[#1C2B22] dark:text-[#97A08C] dark:hover:text-[#EAE4D0] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 shadow-inner">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-emerald-700 dark:text-emerald-400">
              Cloud Storage &amp; Backup
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C2B22] dark:text-[#EAE4D0]">
              Google Sheets Synchronization
            </h2>
            <p className="text-xs text-[#5B6856] dark:text-[#97A08C]">
              Store tuition logs, financial transactions, and purchase goals directly in Google Drive.
            </p>
          </div>
        </div>

        {/* Domain Authorization Notice & Instructions */}
        {isDomainUnauthorized && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs">
            <div className="flex items-start gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-950 dark:text-amber-100 text-sm">
                  Authorize GitHub Pages Domain for Google Sheets Sync
                </h4>
                <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                  To allow Google Sheets OAuth popups on your live website, Firebase requires whitelisting your domain in the Firebase Console.
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-amber-500/20 space-y-2.5">
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/70 dark:bg-black/30 border border-amber-500/20">
                <span className="font-mono text-[11px] font-bold text-[#1C2B22] dark:text-[#EAE4D0] select-all truncate">
                  {currentHostname}
                </span>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                >
                  {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedDomain ? 'Copied!' : 'Copy Domain'}
                </button>
              </div>

              <div className="text-[11px] text-[#5B6856] dark:text-[#97A08C] space-y-1">
                <p className="font-semibold text-amber-950 dark:text-amber-200">How to add in Firebase Console (30 sec):</p>
                <ol className="list-decimal list-inside space-y-0.5 pl-0.5">
                  <li>Open <strong>Firebase Console</strong> &rarr; select project <code className="font-mono text-[10px]">project-5c464bd1-d462-429d-b47</code></li>
                  <li>Click <strong>Authentication</strong> in the sidebar &rarr; <strong>Settings</strong> tab &rarr; <strong>Authorized domains</strong></li>
                  <li>Click <strong>Add domain</strong>, paste <span className="font-mono font-semibold">{currentHostname}</span>, and click Save.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {errorMsg && !isDomainUnauthorized && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Connected Sheet Card */}
        {connectedSheet ? (
          <div className="p-5 rounded-2xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full mb-1">
                  <Check className="w-3 h-3" /> Connected Spreadsheet
                </span>
                <h3 className="text-base font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                  {connectedSheet.title}
                </h3>
                <span className="text-xs text-[#5B6856] dark:text-[#97A08C] font-mono block mt-0.5 truncate max-w-sm">
                  ID: {connectedSheet.id}
                </span>
              </div>

              <a
                href={connectedSheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#223024] border border-[#DCD3B8] dark:border-[#2b3c2e] text-[#1C2B22] dark:text-[#EAE4D0] hover:border-emerald-600 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                Open in Sheets
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Sync Timestamp & Actions */}
            <div className="pt-3 border-t border-[#DCD3B8] dark:border-[#263529] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-[#5B6856] dark:text-[#97A08C]">
                {connectedSheet.lastSyncedAt ? (
                  <>Last synced: <strong>{new Date(connectedSheet.lastSyncedAt).toLocaleString()}</strong></>
                ) : (
                  'Not yet synced with current session'
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDisconnectSheet}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Disconnect
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSyncDataNow}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Syncing...' : 'Sync All Data Now'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Not Connected: Show 2 Setup Options */
          <div className="space-y-5">
            {/* Option 1: Create New Sheet */}
            <div className="p-5 rounded-2xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                  Option 1: Create &amp; Populate a New Google Sheet
                </h3>
              </div>
              <p className="text-xs text-[#5B6856] dark:text-[#97A08C] mb-4">
                Creates a new spreadsheet in your Google Drive with 3 pre-formatted tabs: <strong>Tuition Log</strong>, <strong>Finance Ledger</strong>, and <strong>Savings Goals</strong>.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                    Spreadsheet Name
                  </label>
                  <input
                    type="text"
                    value={customSheetTitle}
                    onChange={(e) => setCustomSheetTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-[#FFFDF6] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#151e17] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleCreateNewSheet}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {isLoading ? 'Creating & Initializing...' : 'Create & Connect New Google Sheet'}
                </button>
              </div>
            </div>

            {/* Option 2: Connect Existing Sheet */}
            <form onSubmit={handleConnectExistingSheet} className="p-5 rounded-2xl border bg-[#F6F1E4]/70 dark:bg-[#18221a] border-[#DCD3B8] dark:border-[#2b3c2e]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  <Link2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#1C2B22] dark:text-[#EAE4D0]">
                  Option 2: Connect an Existing Google Sheet
                </h3>
              </div>
              <p className="text-xs text-[#5B6856] dark:text-[#97A08C] mb-3">
                Paste the URL or Spreadsheet ID of a sheet in your Google Drive.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1... or Sheet ID"
                  value={existingUrlOrId}
                  onChange={(e) => setExistingUrlOrId(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border bg-[#FFFDF6] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#151e17] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || !existingUrlOrId.trim()}
                  className="py-2 px-4 rounded-xl text-xs font-bold border border-[#DCD3B8] dark:border-[#2b3c2e] bg-white dark:bg-[#202c22] text-[#1C2B22] dark:text-[#EAE4D0] hover:border-emerald-600 transition-colors disabled:opacity-50"
                >
                  Connect Sheet
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Data Architecture Info */}
        <div className="mt-6 pt-4 border-t border-[#DCD3B8] dark:border-[#263529] text-[11px] text-[#5B6856] dark:text-[#97A08C] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[#1C2B22] dark:text-[#EAE4D0]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure 3-Tab Schema</span>
          </div>
          <p>
            When synced, your data is partitioned cleanly into <strong>Tuition Log</strong> (with student rates, duration, and fees in ₹), <strong>Finance Ledger</strong> (cashflow income &amp; expenses), and <strong>Savings Goals</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
