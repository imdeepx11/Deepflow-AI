// Firebase SDK configuration template for DeepFlow AI
// Add your Firebase Web App credentials below or via VITE_FIREBASE_API_KEY environment variables

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoConfigKeyDeepFlow2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "deepflow-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "deepflow-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "deepflow-ai.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo123456"
};
