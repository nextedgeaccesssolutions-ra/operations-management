import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  avatar: string;
  createdAt: string;
}

interface StoredAccount {
  user: User;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  loginAsDemo: () => void;
  signup: (name: string, email: string, password: string, company: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function getAvatar(name: string) {
  const avatars = ['👤', '🧑‍💼', '👩‍💼', '🧑‍💻', '👨‍💼', '👩‍💻', '🧑‍🔧', '👨‍🔬', '👩‍🔬'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatars[Math.abs(hash) % avatars.length];
}

function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem('neas_accounts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem('neas_accounts', JSON.stringify(accounts));
}

function getStoredSession(): User | null {
  try {
    const raw = localStorage.getItem('neas_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: User | null) {
  if (user) {
    localStorage.setItem('neas_session', JSON.stringify(user));
  } else {
    localStorage.removeItem('neas_session');
  }
}

// Seed a demo account on first load
function seedDemoAccount() {
  const accounts = getStoredAccounts();
  if (!accounts.find(a => a.user.email === 'demo@neas.co')) {
    const demoUser: User = {
      id: generateId(),
      name: 'Demo User',
      email: 'demo@neas.co',
      company: 'Next Edge Access Solutions',
      role: 'Administrator',
      avatar: '🧑‍💼',
      createdAt: new Date().toISOString(),
    };
    accounts.push({ user: demoUser, password: 'demo123' });
    saveAccounts(accounts);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDemoAccount();
    const session = getStoredSession();
    if (session) setUser(session);
    setLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const accounts = getStoredAccounts();
    const account = accounts.find(a => a.user.email.toLowerCase() === email.toLowerCase());
    if (!account) return { success: false, error: 'No account found with that email' };
    if (account.password !== password) return { success: false, error: 'Incorrect password' };
    setUser(account.user);
    saveSession(account.user);
    return { success: true };
  };

  const loginAsDemo = () => {
    seedDemoAccount();
    const accounts = getStoredAccounts();
    const demo = accounts.find(a => a.user.email === 'demo@neas.co') || {
      user: {
        id: 'usr-demo',
        name: 'Alex Vance',
        email: 'demo@neas.co',
        company: 'Next Edge Access Solutions',
        role: 'Super Administrator',
        avatar: '🧑‍💼',
        createdAt: new Date().toISOString(),
      },
      password: 'demo',
    };
    setUser(demo.user);
    saveSession(demo.user);
  };

  const signup = (name: string, email: string, password: string, company: string) => {
    const accounts = getStoredAccounts();
    if (accounts.find(a => a.user.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists' };
    }
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };
    const newUser: User = {
      id: generateId(),
      name,
      email,
      company,
      role: 'Administrator',
      avatar: getAvatar(name),
      createdAt: new Date().toISOString(),
    };
    accounts.push({ user: newUser, password });
    saveAccounts(accounts);
    setUser(newUser);
    saveSession(newUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    saveSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsDemo, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
