import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  auth = getAuth(app);
}

export function isGoogleAuthConfigured() {
  return configured && Boolean(auth);
}

/**
 * Initiates Google sign-in via Popup (or Redirect fallback if popups blocked).
 * Returns { user, idToken } on popup success, or null if redirect initiated.
 */
export async function signInWithGoogle() {
  if (!auth) {
    throw new Error(
      'Google sign-in is not configured yet. Add Firebase web app settings in Vercel environment variables.'
    );
  }
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    return {
      user: result.user,
      idToken: await result.user.getIdToken(),
    };
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

/**
 * Call on app mount to capture Google redirect sign-in result if redirect was used.
 */
export async function getGoogleRedirectResult() {
  if (!auth) return null;
  const result = await getRedirectResult(auth);
  if (!result) return null;
  return {
    user: result.user,
    idToken: await result.user.getIdToken(),
  };
}


