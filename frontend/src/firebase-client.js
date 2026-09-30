import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyRjFsQfV6_j8r1DrD-9fTvC3rtOCQHaKeF',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nexora-ai-c130d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nexora-ai-c130d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'nexora-ai-c130d.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '574809477623',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:574809477623:web:327cafe14dc1cfceed09ef2',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

export function isGoogleAuthConfigured() {
  return Boolean(auth);
}

/**
 * Initiates Google sign-in using standard Firebase Auth popup flow.
 * Returns { user, idToken } on success, or null if cancelled by user.
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
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      return null;
    }
    throw error;
  }
}

/**
 * Safe no-op for redirect result to prevent passive page load checks
 */
export async function getGoogleRedirectResult() {
  return null;
}




