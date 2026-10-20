import { useState } from "react";
import { useAuth } from "./AuthContext";

type AuthMode = "login" | "signup";

const FIELD =
  "w-full px-4 py-3 rounded-xl bg-[#071D29]/60 border border-[#CA9332]/20 text-white text-sm " +
  "placeholder:text-slate-600 focus:outline-none focus:border-[#CA9332]/60 focus:ring-1 " +
  "focus:ring-[#CA9332]/30 transition-all";

const LABEL = "block text-xs font-medium text-[#EBC07E]/70 mb-1.5 uppercase tracking-wider";

export default function AuthPage() {
  const { signIn, signUp, notice } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupCompany, setSignupCompany] = useState("");

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginEmail || !loginPassword) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    const res = await signIn(loginEmail, loginPassword);
    if (!res.ok) setError(res.error || "Sign in failed.");
    setBusy(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!signupName || !signupEmail || !signupPassword || !signupCompany) {
      setError("Fill in every field.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const res = await signUp(signupName, signupEmail, signupPassword, signupCompany);
    if (!res.ok) setError(res.error || "Sign up failed.");
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#071D29] via-[#0a2a3a] to-[#071D29]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#CA9332]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#EBC07E]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-4 py-10">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CA9332] to-[#EBC07E] mb-4 shadow-lg shadow-[#CA9332]/20">
            <span className="text-[#071D29] font-bold text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NEAS Virtual Office</h1>
          <p className="text-sm text-[#EBC07E]/60 mt-1">Next Edge Access Solutions</p>
        </div>

        <div
          className="glass-card rounded-2xl p-6 sm:p-8 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center gap-1 bg-[#071D29]/60 rounded-xl p-1 mb-6 border border-[#CA9332]/15">
            <button
              onClick={() => switchMode("login")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === "login"
                  ? "bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === "signup"
                  ? "bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Request Access
            </button>
          </div>

          {notice && (
            <div className="mb-4 p-3 rounded-lg bg-[#CA9332]/10 border border-[#CA9332]/25 text-[#EBC07E] text-xs">
              {notice}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-start gap-2"
            >
              <span aria-hidden>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={LABEL} htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={FIELD}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${FIELD} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#EBC07E] text-sm transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-[#071D29] text-sm font-bold hover:brightness-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#CA9332]/20"
              >
                {busy ? "Checking…" : "Log In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className={LABEL} htmlFor="su-name">
                  Full name
                </label>
                <input
                  id="su-name"
                  type="text"
                  autoComplete="name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Jane Santos"
                  className={FIELD}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="su-company">
                  Company
                </label>
                <input
                  id="su-company"
                  type="text"
                  autoComplete="organization"
                  value={signupCompany}
                  onChange={(e) => setSignupCompany(e.target.value)}
                  placeholder="Next Edge Access Solutions"
                  className={FIELD}
                />
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Type your company exactly as your colleagues did. The first account for a
                  company becomes its owner; everyone after that waits for the owner to approve
                  them.
                </p>
              </div>
              <div>
                <label className={LABEL} htmlFor="su-email">
                  Work email
                </label>
                <input
                  id="su-email"
                  type="email"
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={FIELD}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="su-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="su-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 10 characters"
                    className={`${FIELD} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#EBC07E] text-sm transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL} htmlFor="su-confirm">
                  Confirm password
                </label>
                <input
                  id="su-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className={FIELD}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-[#071D29] text-sm font-bold hover:brightness-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#CA9332]/20"
              >
                {busy ? "Creating…" : "Request Access"}
              </button>
            </form>
          )}
        </div>

        <div
          className="text-center mt-6 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
            Accounts are stored in this browser and passwords are hashed with PBKDF2-SHA256.
            This gates the interface on this device; it is not yet a server-enforced boundary,
            so do not treat it as protection for confidential records.
          </p>
        </div>
      </div>
    </div>
  );
}
