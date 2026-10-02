import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBjfsQFV6_j0rJGzO-9FfvC3rt0C9HmKeE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nexora-ai-c130d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nexora-ai-c130d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'nexora-ai-c130d.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '524889477623',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:524889477623:web:3276afd14dc1cfeed89ef2',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Register a new user with email + password in Firebase Auth.
 * Returns { idToken, user } on success.
 */
export async function registerWithEmail(name, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Set display name in Firebase Auth profile
  await updateProfile(credential.user, { displayName: name });
  const idToken = await credential.user.getIdToken();
  return {
    idToken,
    user: credential.user,
    displayName: name,
    email: credential.user.email,
  };
}

/**
 * Sign in with email + password via Firebase Auth.
 * Returns { idToken, user } on success.
 */
export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  return {
    idToken,
    user: credential.user,
    displayName: credential.user.displayName || '',
    email: credential.user.email,
  };
}

/**
 * Sign in with Google via Firebase Auth popup.
 * Returns { idToken, user } on success, or null if cancelled.
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    return {
      idToken,
      user: result.user,
      displayName: result.user.displayName || '',
      email: result.user.email,
    };
  } catch (error) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      return null; // User closed popup — not an error
    }
    throw error;
  }
}

/**
 * Send a Firebase password reset email to the given address.
 * Firebase will send a proper reset link directly to the user's inbox.
 */
export async function sendFirebasePasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Send a Firebase email verification link to the current user.
 */
export async function sendFirebaseEmailVerification() {
  if (!auth.currentUser) throw new Error('No authenticated user found.');
  await sendEmailVerification(auth.currentUser);
}

/**
 * Sign out the current Firebase user.
 */
export async function firebaseSignOut() {
  await signOut(auth);
}
