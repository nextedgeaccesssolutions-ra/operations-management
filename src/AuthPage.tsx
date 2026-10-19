import { useState } from 'react';
import { useAuth } from './AuthContext';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const { login, signup, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupCompany, setSignupCompany] = useState('');

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = login(loginEmail, loginPassword);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 600));

    if (!signupName || !signupEmail || !signupPassword || !signupCompany) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const result = signup(signupName, signupEmail, signupPassword, signupCompany);
    if (!result.success) {
      setError(result.error || 'Sign up failed');
    }
    setLoading(false);
  };

  const fillDemo = () => {
    setLoginEmail('demo@neas.co');
    setLoginPassword('demo123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center floor-grid relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NEAS Virtual Office</h1>
          <p className="text-sm text-slate-400 mt-1">Next Edge Access Solutions</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {/* Quick Demo Access */}
          <button
            type="button"
            onClick={() => loginAsDemo()}
            className="w-full mb-6 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span className="text-base group-hover:scale-110 transition-transform">⚡</span>
            <span>Explore Live Demo Workspace (Instant 1-Click Access)</span>
          </button>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-700/50"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-wider">or sign in with credentials</span>
            <div className="flex-grow border-t border-slate-700/50"></div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 mb-6 border border-slate-700/30">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <span>⚠</span>
              {error}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Log In'
                )}
              </button>

              {/* Demo credentials */}
              <div className="pt-2 border-t border-slate-700/30">
                <p className="text-[10px] text-slate-500 text-center mb-2">Quick access</p>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="w-full py-2 rounded-lg bg-slate-800/40 border border-slate-700/30 text-xs text-slate-400 hover:text-slate-300 hover:border-slate-600/50 transition-all flex items-center justify-center gap-2"
                >
                  <span>🔑</span> Use demo credentials
                </button>
              </div>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Company</label>
                <input
                  type="text"
                  value={signupCompany}
                  onChange={(e) => setSignupCompany(e.target.value)}
                  placeholder="Your company name"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>

              <p className="text-[10px] text-slate-500 text-center pt-1">
                By signing up you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <p className="text-[10px] text-slate-500">
            Backed by Netlify Database (Managed Postgres) with Drizzle ORM · Live State Persisted
          </p>
        </div>
      </div>
    </div>
  );
}
