import { useState } from "react";
import { useI18n } from "../../i18n/useI18n.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

// Authentication modal.
// Handles login, register, logout,
// Firebase setup state, and auth errors.
export function AuthModal({ open, onClose }) {
  const { t, language } = useI18n();

  const {
    user,
    login,
    register,
    logout,
    error,
    clearError,
    isConfigured,
    loading,
  } = useAuth();

  // Helper for Hebrew / English UI
  const isHebrew = language === "he";

  // Current mode: login | register
  const [mode, setMode] = useState("login");

  // Form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Local submit loading state
  const [busy, setBusy] = useState(false);

  // Do not render modal if closed
  if (!open) return null;

  // Handles login/register submit
  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }

      // Clear form after success
      setEmail("");
      setPassword("");

      onClose();
    } catch {
      // Errors are handled inside AuthContext
    } finally {
      setBusy(false);
    }
  };

  // Switch between login/register tabs
  const switchMode = (next) => {
    setMode(next);
    clearError();
  };

  return (
    <div className="overlay" onClick={onClose}>
      {/* Prevent closing when clicking inside modal */}
      <div className="authShell" onClick={(e) => e.stopPropagation()}>
        {/* Brand header */}
        <div className="authBrandRow">
          <span className="logo logoMain">↯</span>
          <span className="brandText">PowerCalc</span>
        </div>

        <div className="modalCard authModalCard">
          {/* Close button */}
          <button className="iconBtn authClose" type="button" onClick={onClose}>
            ✕
          </button>

          {/* Firebase config missing */}
          {!isConfigured ? (
            <div className="setupBox">
              <div className="authTitle">
                {isHebrew ? "נדרש חיבור Firebase" : "Firebase setup needed"}
              </div>

              <div className="authSubtitle">
                {isHebrew
                  ? "הוסף קובץ ENV והפעל מחדש את הפרויקט."
                  : "Paste your Firebase config into .env and restart."}
              </div>
            </div>
          ) : user ? (
            /* User already logged in */
            <div className="authStateBox">
              <div className="authTitle">
                {isHebrew ? "מחובר בהצלחה" : "Signed in"}
              </div>

              <div className="authSubtitle">
                {isHebrew
                  ? "היסטוריית החישובים שלך מסונכרנת."
                  : "Your history sync is active."}
              </div>

              <div className="authEmail">{user.email}</div>

              <button
                className="ctaButton"
                type="button"
                onClick={async () => {
                  try {
                    await logout();
                    onClose();
                  } catch {
                    // logout error is already set in AuthContext
                  }
                }}
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <>
              {/* Login / Register tabs */}
              <div className="authTabs authTabsTop">
                <button
                  className={`tabMini ${mode === "login" ? "active" : ""}`}
                  type="button"
                  onClick={() => switchMode("login")}
                >
                  {isHebrew ? "התחברות" : "Login"}
                </button>

                <button
                  className={`tabMini ${mode === "register" ? "active" : ""}`}
                  type="button"
                  onClick={() => switchMode("register")}
                >
                  {isHebrew ? "הרשמה" : "Register"}
                </button>
              </div>

              {/* Dynamic title */}
              <div className="authTitle">
                {mode === "login"
                  ? isHebrew
                    ? "ברוך שובך"
                    : "Welcome back"
                  : isHebrew
                    ? "צור חשבון חדש"
                    : "Create account"}
              </div>

              <div className="authSubtitle">
                {isHebrew
                  ? "התחבר כדי לשמור היסטוריה."
                  : "Sign in to continue."}
              </div>

              {/* Auth form */}
              <form className="authForm" onSubmit={submit}>
                {/* Email input */}
                <label className="authField">
                  <span className="authLabel">Email</span>

                  <div className="authInputWrap">
                    <span className="authInputIcon">✉</span>

                    <input
                      className="authInput"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </label>

                {/* Password input */}
                <label className="authField">
                  <span className="authLabel">
                    {isHebrew ? "סיסמה" : "Password"}
                  </span>

                  <div className="authInputWrap">
                    <span className="authInputIcon">🔒</span>

                    <input
                      className="authInput"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>
                </label>

                {/* Auth errors from context */}
                {error && <div className="authError">{t(error)}</div>}

                {/* Submit button */}
                <button
                  className="ctaButton"
                  type="submit"
                  disabled={busy || loading}
                >
                  {busy
                    ? isHebrew
                      ? "טוען..."
                      : "Loading..."
                    : mode === "login"
                      ? isHebrew
                        ? "התחבר"
                        : "Sign In"
                      : isHebrew
                        ? "צור חשבון"
                        : "Create Account"}

                  <span>→</span>
                </button>
              </form>

              {/* Bottom switch link */}
              <div className="authFooterLine">
                {mode === "login"
                  ? isHebrew
                    ? "אין לך חשבון?"
                    : "Don't have an account?"
                  : isHebrew
                    ? "כבר יש לך חשבון?"
                    : "Already have an account?"}

                <button
                  className="linkBtn inline"
                  type="button"
                  onClick={() =>
                    switchMode(mode === "login" ? "register" : "login")
                  }
                >
                  {mode === "login"
                    ? isHebrew
                      ? "הרשמה"
                      : "Sign up"
                    : isHebrew
                      ? "התחברות"
                      : "Sign in"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Legal footer */}
        <div className="authLegal">
          {isHebrew
            ? "בהמשך השימוש אתה מסכים לתנאים ולמדיניות."
            : "By continuing you agree to Terms and Privacy Policy"}
        </div>
      </div>
    </div>
  );
}
