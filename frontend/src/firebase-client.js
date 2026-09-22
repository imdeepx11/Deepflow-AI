export function isGoogleAuthConfigured() {
  return false;
}

export async function signInWithGoogle() {
  throw new Error('Google sign-in is not configured. Please use email demo login.');
}
