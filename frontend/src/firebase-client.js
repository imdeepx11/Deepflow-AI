import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserSessionPersistence,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
 * Initiates Google sign-in via redirect (avoids "Illegal URL for new Frame"
 * errors that signInWithPopup causes on Vercel preview/production URLs).
 * Call getGoogleRedirectResult() on app load to capture the result.
 */
export async function signInWithGoogle() {
  if (!auth) {
    throw new Error(
      'Google sign-in is not configured yet. Add the Firebase web app settings to Vercel environment variables.'
    );
  }
  await setPersistence(auth, browserSessionPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  // Redirect flow — page navigates away and comes back with the result.
  await signInWithRedirect(auth, provider);
}

/**
 * Call this once on app mount to check whether the user has just returned
 * from a Google redirect sign-in. Returns { user, idToken } or null.
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

