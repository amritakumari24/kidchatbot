import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "./AuthContext";
import { GOOGLE_CLIENT_ID } from "./config";

const initialForm = { name: "", email: "", password: "" };

function validateForm(mode, form) {
  const errors = {};
  if (mode === "signup" && !form.name.trim()) errors.name = "Enter your name";
  if (!form.email.trim()) errors.email = "Enter your email";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email";
  if (!form.password) errors.password = "Enter your password";
  else if (form.password.length < 8)
    errors.password = "Use at least 8 characters";
  return errors;
}

function Login() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const openModal = (nextMode = "login") => {
    setMode(nextMode);
    setForm(initialForm);
    setErrors({});
    setSubmitError("");
    setGoogleError("");
    setIsOpen(true);
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm(mode, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      // Email/password endpoints can be connected here without changing the UI.
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      setSubmitError(
        "Email and password accounts are not enabled yet. Use Google to continue.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return (
      <div className="account-control">
        <span className="account-name">{user.name}</span>
        <button type="button" className="account-logout" onClick={logout}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <button type="button" className="auth-open-button" onClick={() => openModal()}>
        Log in
      </button>
      {isOpen && (
        <div
          className="auth-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <button
              type="button"
              className="auth-modal-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close sign in dialog"
            >
              ×
            </button>
            <div className="auth-modal-brand">
              <span className="auth-modal-bunny">🐰</span>
              <span>Bunny</span>
            </div>
            <h2 id="auth-modal-title">
              {mode === "login" ? "Welcome back!" : "Join Bunny"}
            </h2>
            <p className="auth-modal-subtitle">
              {mode === "login"
                ? "Sign in to keep your learning journey going."
                : "Create an account and make learning more fun."}
            </p>

            <div className="auth-tabs" role="tablist" aria-label="Account action">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={mode === "login" ? "active" : ""}
                onClick={() => openModal("login")}
              >
                Log in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className={mode === "signup" ? "active" : ""}
                onClick={() => openModal("signup")}
              >
                Sign up
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {mode === "signup" && (
                <label className="auth-field">
                  <span>Name</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    autoComplete="name"
                    placeholder="Your name"
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name && <small>{errors.name}</small>}
                </label>
              )}
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && <small>{errors.email}</small>}
              </label>
              <label className="auth-field">
                <span>Password</span>
                <span className="auth-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) =>
                      updateField("password", event.target.value)
                    }
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    placeholder="At least 8 characters"
                    aria-invalid={Boolean(errors.password)}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
                {errors.password && <small>{errors.password}</small>}
              </label>
              {mode === "login" && (
                <button type="button" className="auth-forgot">
                  Forgot password?
                </button>
              )}
              {submitError && <p className="auth-form-error">{submitError}</p>}
              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting && <span className="auth-spinner" aria-hidden="true" />}
                {isSubmitting
                  ? "Please wait..."
                  : mode === "login"
                    ? "Log in"
                    : "Create account"}
              </button>
            </form>

            <div className="auth-divider"><span>or continue with</span></div>
            {GOOGLE_CLIENT_ID ? (
              <div className="auth-google">
                <GoogleLogin
                  text="continue_with"
                  shape="pill"
                  size="large"
                  width="340"
                  onSuccess={({ credential }) => {
                    if (!credential) return;
                    setGoogleError("");
                    loginWithGoogle(credential)
                      .then(() => setIsOpen(false))
                      .catch((error) => setGoogleError(error.message));
                  }}
                  onError={() =>
                    setGoogleError("Google sign-in failed. Please try again.")
                  }
                />
                {googleError && <p className="auth-form-error">{googleError}</p>}
              </div>
            ) : (
              <p className="auth-form-error">Google sign-in is not configured.</p>
            )}
            <p className="auth-terms">
              By continuing, you agree to learn, explore, and have fun with Bunny.
            </p>
          </section>
        </div>
      )}
    </>
  );
}

export default Login;
