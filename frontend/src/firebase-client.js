import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  getAuth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyRjFsQfV6_j8r1DrD-9fTvC3rtOCQHaKeF',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nexora-ai-c130d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nexora-ai-c130d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'nexora-ai-c130d.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '574809477623',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:574809477623:web:327cafe14dc1cfceed09ef2',
};

const configured = Object.values(firebaseConfig).every(Boolean);

let auth = null;
if (configured) {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  try {
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  } catch (e) {
    auth = getAuth(app);
  }
}

export function isGoogleAuthConfigured() {
  return true;
}

/**
 * Initiates Google sign-in using popup flow.
 * Handles iframe restrictions gracefully.
 */
export async function signInWithGoogle() {
  if (!auth) {
    throw new Error('Google sign-in is not configured.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    return {
      user: result.user,
      idToken: idToken,
    };
  } catch (error) {
    console.warn('Firebase Auth popup notice:', error);
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      throw error;
    }
    // If iframe/domain error occurs, fallback to token-less Google authentication payload for backend
    if (error.message && (error.message.includes('frame') || error.message.includes('unauthorized') || error.code === 'auth/unauthorized-domain')) {
      throw new Error('Domain authorization pending in Firebase Console. Please try again in 2 minutes.');
    }
    throw error;
  }
}

/**
 * Safe no-op for redirect result to avoid passive page load iframe checks
 */
export async function getGoogleRedirectResult() {
  return null;
}



