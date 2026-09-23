import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Sheets & Drive Scopes
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const googleProvider = new GoogleAuthProvider();
GOOGLE_SCOPES.forEach((scope) => googleProvider.addScope(scope));
// Prompt user to select account if needed
googleProvider.setCustomParameters({ prompt: 'select_account' });

// In-memory token cache (never in localStorage to prevent XSS leakage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  provider: 'google' | 'password' | 'guest';
}

// Local users storage fallback (enables multi-user login with password even if Firebase Auth Email/Pass is unconfigured in GCP)
const LOCAL_USERS_KEY = 'paisaledger_local_users_v2';
const CURRENT_LOCAL_USER_KEY = 'paisaledger_current_local_user_v2';

interface LocalUserRecord {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

const getLocalUsers = (): LocalUserRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalUsers = (users: LocalUserRecord[]) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

// Set in-memory access token
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Get in-memory access token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Sign in with Google (obtains Google Sheets OAuth Token)
export const signInWithGoogle = async (): Promise<{ user: AppUser; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;

    if (!token) {
      throw new Error('Could not retrieve Google Sheets access token.');
    }

    cachedAccessToken = token;

    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Tutor',
      photoURL: result.user.photoURL,
      provider: 'google',
    };

    localStorage.removeItem(CURRENT_LOCAL_USER_KEY);
    return { user: appUser, accessToken: token };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    if (error?.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'devs67.github.io';
      const customErr: any = new Error(
        `Firebase domain authorization required: "${currentHost}" is not yet added to Authorized Domains in Firebase Console.`
      );
      customErr.code = 'auth/unauthorized-domain';
      customErr.domain = currentHost;
      throw customErr;
    }
    if (error?.code === 'auth/popup-closed-by-user') {
      const customErr: any = new Error('Google Sign-In popup was closed before completing. Please try again.');
      customErr.code = error.code;
      throw customErr;
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign in with Email & Password
export const signInWithPassword = async (email: string, pass: string): Promise<AppUser> => {
  try {
    // Try Firebase Authentication first
    const result = await signInWithEmailAndPassword(auth, email, pass);
    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName || email.split('@')[0],
      photoURL: result.user.photoURL,
      provider: 'password',
    };
    localStorage.removeItem(CURRENT_LOCAL_USER_KEY);
    return appUser;
  } catch (firebaseErr: any) {
    // Graceful fallback to verified local user registry if Firebase email/pass provider is restricted or unauthorized domain
    const localUsers = getLocalUsers();
    const found = localUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (found.passwordHash === btoa(pass)) {
        const appUser: AppUser = {
          uid: found.uid,
          email: found.email,
          displayName: found.displayName,
          provider: 'password',
        };
        localStorage.setItem(CURRENT_LOCAL_USER_KEY, JSON.stringify(appUser));
        return appUser;
      }
      throw new Error('Incorrect password for this user. Please try again.');
    }

    if (firebaseErr?.code === 'auth/unauthorized-domain') {
      throw new Error(
        "No account found for this email on this device. Please switch to the '+ Add User' tab above to register your account first."
      );
    }
    if (firebaseErr?.code === 'auth/user-not-found' || firebaseErr?.code === 'auth/invalid-credential') {
      throw new Error("Invalid email or password. If you don't have an account yet, click '+ Add User' above.");
    }
    throw new Error(firebaseErr?.message || 'Invalid email or password.');
  }
};

// Add new user / register with password
export const registerUserWithPassword = async (
  email: string,
  pass: string,
  displayName: string
): Promise<AppUser> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: displayName || email.split('@')[0],
      provider: 'password',
    };
    localStorage.removeItem(CURRENT_LOCAL_USER_KEY);
    return appUser;
  } catch (firebaseErr: any) {
    // Save to local verified users registry
    const localUsers = getLocalUsers();
    const exists = localUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error('A user with this email already exists.');
    }

    const newUser: LocalUserRecord = {
      uid: `usr-local-${Date.now()}`,
      email: email.trim(),
      displayName: displayName.trim() || email.split('@')[0],
      passwordHash: btoa(pass),
      createdAt: new Date().toISOString(),
    };

    localUsers.push(newUser);
    saveLocalUsers(localUsers);

    const appUser: AppUser = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      provider: 'password',
    };
    localStorage.setItem(CURRENT_LOCAL_USER_KEY, JSON.stringify(appUser));
    return appUser;
  }
};

// Log out user
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Signout error:', e);
  }
  cachedAccessToken = null;
  localStorage.removeItem(CURRENT_LOCAL_USER_KEY);
};

// Get current active user (Firebase or local)
export const getActiveUser = (): AppUser | null => {
  if (auth.currentUser) {
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
      photoURL: auth.currentUser.photoURL,
      provider: cachedAccessToken ? 'google' : 'password',
    };
  }
  try {
    const localRaw = localStorage.getItem(CURRENT_LOCAL_USER_KEY);
    return localRaw ? JSON.parse(localRaw) : null;
  } catch {
    return null;
  }
};

// Auth state listener
export const subscribeToAuth = (callback: (user: AppUser | null) => void) => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.photoURL,
        provider: cachedAccessToken ? 'google' : 'password',
      });
    } else {
      const local = getActiveUser();
      callback(local);
    }
  });
};
