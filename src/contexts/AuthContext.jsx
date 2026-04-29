import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";

// Default auth context shape.
// Prevents crashes if useAuth is used outside AuthProvider.
const AuthContext = createContext({
  user: null,
  loading: false,
  error: "",
  isConfigured: false,
  clearError: () => {},
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

// Converts Firebase auth error codes into translation keys.
function getAuthErrorKey(error) {
  const code = error?.code || "";

  if (code.includes("invalid-credential")) return "invalidCredentials";
  if (code.includes("email-already-in-use")) return "emailAlreadyUsed";
  if (code.includes("weak-password")) return "weakPassword";
  if (code.includes("invalid-email")) return "invalidEmail";

  return "authGenericError";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Initial loading depends on Firebase configuration
  const [loading, setLoading] = useState(isFirebaseConfigured);

  // Latest auth error as translation key
  const [error, setError] = useState("");

  // Listen to Firebase login/logout state
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Shared wrapper for login/register/logout errors
  const withErrorHandling = async (action) => {
    setError("");

    if (!isFirebaseConfigured || !auth) {
      setError("authGenericError");
      return null;
    }

    try {
      return await action();
    } catch (err) {
      setError(getAuthErrorKey(err));
      throw err;
    }
  };

  // Login existing user
  const login = (email, password) =>
    withErrorHandling(() => signInWithEmailAndPassword(auth, email, password));

  // Register new user
  const register = (email, password) =>
    withErrorHandling(() =>
      createUserWithEmailAndPassword(auth, email, password),
    );

  // Logout current user
  const logout = () => withErrorHandling(() => signOut(auth));

  // Memoized context value prevents unnecessary child re-renders
  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isConfigured: isFirebaseConfigured,
      clearError: () => setError(""),
      login,
      register,
      logout,
    }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Public hook for accessing auth state/actions
export function useAuth() {
  return useContext(AuthContext);
}
