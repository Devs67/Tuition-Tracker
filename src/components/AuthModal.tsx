import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { signInWithGoogle, signInWithPassword, registerUserWithPassword, AppUser } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AppUser, token?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const user = await signInWithPassword(email.trim(), password);
        setSuccessMsg(`Welcome back, ${user.displayName || user.email}!`);
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
          resetForm();
        }, 600);
      } else {
        const user = await registerUserWithPassword(email.trim(), password, displayName.trim());
        setSuccessMsg(`User registered successfully! Logged in as ${user.displayName}.`);
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
          resetForm();
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const { user, accessToken } = await signInWithGoogle();
      setSuccessMsg(`Signed in with Google as ${user.displayName}!`);
      setTimeout(() => {
        onAuthSuccess(user, accessToken);
        onClose();
        resetForm();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border bg-[#FFFDF6] border-[#DCD3B8] dark:bg-[#151e17] dark:border-[#263529] shadow-2xl p-6 sm:p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-[#5B6856] hover:text-[#1C2B22] dark:text-[#97A08C] dark:hover:text-[#EAE4D0] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1C2B22] dark:text-[#EAE4D0]">
            {authMode === 'login' ? 'Sign In to PaisaLedger' : 'Add User / Create Account'}
          </h2>
          <p className="text-xs text-[#5B6856] dark:text-[#97A08C] mt-1">
            {authMode === 'login'
              ? 'Log in with your password or use your Google account'
              : 'Add a new user with a password to manage budgets'}
          </p>
        </div>

        {/* Tab switch: Login vs Add User */}
        <div className="flex rounded-xl bg-[#F6F1E4] dark:bg-[#18221a] p-1 border border-[#DCD3B8] dark:border-[#2b3c2e] mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-white text-[#1C2B22] shadow-xs dark:bg-[#253629] dark:text-[#EAE4D0]'
                : 'text-[#5B6856] dark:text-[#97A08C] hover:text-[#1C2B22]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Login with Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-white text-[#1C2B22] shadow-xs dark:bg-[#253629] dark:text-[#EAE4D0]'
                : 'text-[#5B6856] dark:text-[#97A08C] hover:text-[#1C2B22]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Add User
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Password Authentication Form */}
        <form onSubmit={handlePasswordAuth} className="space-y-3.5">
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
                Full Name / Tutor Handle
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-[#5B6856] dark:text-[#97A08C]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dev Chintu"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#5B6856] dark:text-[#97A08C]" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5B6856] dark:text-[#97A08C] mb-1">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#5B6856] dark:text-[#97A08C]" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border bg-[#F6F1E4] text-[#1C2B22] border-[#DCD3B8] dark:bg-[#18221a] dark:text-[#EAE4D0] dark:border-[#2b3c2e] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : authMode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In with Password
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create User &amp; Password
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#DCD3B8] dark:border-[#263529]" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-[#FFFDF6] dark:bg-[#151e17] px-2 text-[#5B6856] dark:text-[#97A08C]">
              Or Connect With Google
            </span>
          </div>
        </div>

        {/* Official Google Sign-in Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-[#DCD3B8] dark:border-[#2b3c2e] bg-white dark:bg-[#18221a] text-[#1C2B22] dark:text-[#EAE4D0] hover:bg-[#F6F1E4] dark:hover:bg-[#202c22] transition-colors flex items-center justify-center gap-2.5 shadow-xs disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          <span>Sign In with Google (Enables Google Sheets Sync)</span>
        </button>

        <p className="text-[11px] text-center text-[#5B6856] dark:text-[#97A08C] mt-4">
          Google Sign In provides instant authorization to create and update your connected Google Sheets.
        </p>
      </div>
    </div>
  );
};
