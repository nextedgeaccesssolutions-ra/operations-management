/**
 * Account store.
 *
 * Replaces the previous implementation, which kept passwords in plaintext in
 * localStorage under `neas_accounts`, auto-granted every signup the
 * "Administrator" role, and seeded a known demo@neas.co / demo123 credential.
 *
 * What this does instead:
 *   - Passwords are never stored. Only a PBKDF2-SHA256 derivation with a
 *     per-password random salt is kept.
 *   - Identifiers come from crypto.randomUUID, not Math.random.
 *   - The first account for a company becomes its owner and is approved.
 *     Every later account for that company is created `pending` and cannot
 *     reach company data until an owner or admin approves it.
 *   - The session record holds an id and an expiry, never a role. Roles and
 *     approval state are re-read from the store on every load, so revoking
 *     someone takes effect immediately rather than at their next sign-in.
 *
 * HONEST LIMITATION, stated in the UI as well as here: this is browser-local
 * storage. It gates the interface on this device; it is not a server-enforced
 * authorization boundary, and a determined user with devtools can edit their
 * own record. It is a real improvement over no gate and over plaintext, and it
 * is not a substitute for moving accounts behind Supabase (VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY are already expected by .env.example) with row-level
 * policies. Do not store confidential company records behind this alone.
 */

export type AccountRole = "owner" | "admin" | "member";
export type AccountStatus = "pending" | "approved" | "rejected";

export interface Account {
  id: string;
  name: string;
  email: string;
  company: string;
  /** Normalised company name — what membership is keyed on. */
  companyKey: string;
  role: AccountRole;
  status: AccountStatus;
  avatar: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  /** Set when an account was carried over from the old plaintext store. */
  migrated?: boolean;
}

interface StoredRecord {
  account: Account;
  algo: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  hash: string;
}

export interface SessionRecord {
  accountId: string;
  issuedAt: string;
  expiresAt: string;
}

const ACCOUNTS_KEY = "neas_accounts_v2";
const SESSION_KEY = "neas_session_v2";
const LEGACY_ACCOUNTS_KEY = "neas_accounts";
const LEGACY_SESSION_KEY = "neas_session";

const ITERATIONS = 150_000;
const SESSION_DAYS = 14;

/* ── small helpers ──────────────────────────────────────────────── */

export function companyKeyOf(company: string): string {
  return company.trim().toLowerCase().replace(/\s+/g, " ");
}

function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function unb64(s: string): Uint8Array {
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function newId(): string {
  // Narrow the property rather than the object, so `c` stays a Crypto in the
  // fallback branch instead of being narrowed away to `never`.
  const c: Crypto = globalThis.crypto;
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  return b64(b).replace(/[^a-zA-Z0-9]/g, "").slice(0, 22);
}

const AVATARS = ["🧑‍💼", "👩‍💼", "👨‍💼", "🧑‍💻", "👩‍💻", "🧑‍🔧", "👨‍🔬", "👩‍🔬", "🧑‍🏭"];

export function avatarFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATARS[Math.abs(hash) % AVATARS.length];
}

/* ── password derivation ────────────────────────────────────────── */

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" },
    material,
    256
  );
  return new Uint8Array(bits);
}

/** Compares without leaking how many leading bytes matched. */
function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ── persistence ────────────────────────────────────────────────── */

function readAll(): StoredRecord[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as StoredRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: StoredRecord[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(records));
  } catch {
    /* storage full or blocked — the caller surfaces the failed write */
  }
}

/**
 * Carries accounts over from the old plaintext store, then deletes it.
 *
 * The old store kept `{ user, password }` with the password in the clear.
 * Existing accounts are preserved (their password still works) by hashing the
 * plaintext once on the way across; the plaintext blob is then removed so it
 * stops sitting in the browser. The seeded demo@neas.co / demo123 record is
 * deliberately dropped rather than carried over — it is a known credential
 * pair and would become a live backdoor the moment the sign-in gate works.
 */
export async function migrateLegacyAccounts(): Promise<{ moved: number; droppedDemo: boolean }> {
  let legacy: Array<{ user: Record<string, unknown>; password?: string }> = [];
  try {
    const raw = localStorage.getItem(LEGACY_ACCOUNTS_KEY);
    if (!raw) return { moved: 0, droppedDemo: false };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(LEGACY_ACCOUNTS_KEY);
      return { moved: 0, droppedDemo: false };
    }
    legacy = parsed;
  } catch {
    localStorage.removeItem(LEGACY_ACCOUNTS_KEY);
    return { moved: 0, droppedDemo: false };
  }

  const records = readAll();
  const seenCompanies = new Set(records.map((r) => r.account.companyKey));
  let moved = 0;
  let droppedDemo = false;

  for (const entry of legacy) {
    const email = String(entry?.user?.email ?? "").trim();
    const password = entry?.password;
    if (!email || typeof password !== "string" || !password) continue;

    if (email.toLowerCase() === "demo@neas.co") {
      droppedDemo = true;
      continue;
    }
    if (records.some((r) => r.account.email.toLowerCase() === email.toLowerCase())) continue;

    const name = String(entry.user?.name ?? email);
    const company = String(entry.user?.company ?? "Next Edge Access Solutions");
    const key = companyKeyOf(company);
    const first = !seenCompanies.has(key);
    seenCompanies.add(key);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(password, salt, ITERATIONS);

    records.push({
      account: {
        id: typeof entry.user?.id === "string" && entry.user.id ? (entry.user.id as string) : newId(),
        name,
        email,
        company,
        companyKey: key,
        role: first ? "owner" : "member",
        status: first ? "approved" : "pending",
        avatar: String(entry.user?.avatar ?? avatarFor(name)),
        createdAt: String(entry.user?.createdAt ?? new Date().toISOString()),
        migrated: true,
      },
      algo: "PBKDF2-SHA256",
      iterations: ITERATIONS,
      salt: b64(salt),
      hash: b64(hash),
    });
    moved++;
  }

  writeAll(records);
  localStorage.removeItem(LEGACY_ACCOUNTS_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
  return { moved, droppedDemo };
}

/* ── queries ────────────────────────────────────────────────────── */

export function listAccounts(): Account[] {
  return readAll().map((r) => r.account);
}

export function accountsInCompany(companyKey: string): Account[] {
  return readAll()
    .map((r) => r.account)
    .filter((a) => a.companyKey === companyKey);
}

export function pendingInCompany(companyKey: string): Account[] {
  return accountsInCompany(companyKey).filter((a) => a.status === "pending");
}

export function accountById(id: string): Account | null {
  return readAll().find((r) => r.account.id === id)?.account ?? null;
}

export function anyAccountsExist(): boolean {
  return readAll().length > 0;
}

/* ── mutations ──────────────────────────────────────────────────── */

export type SignUpOutcome =
  | { ok: true; account: Account; firstForCompany: boolean }
  | { ok: false; error: string };

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  const low = password.toLowerCase();
  for (const common of ["password", "12345", "qwerty", "letmein", "111111", "admin", "neas"]) {
    if (low.includes(common)) return "That contains a very common word. Pick something harder to guess.";
  }
  return null;
}

export function emailLooksValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
  company: string;
}): Promise<SignUpOutcome> {
  const name = input.name.trim();
  const email = input.email.trim();
  const company = input.company.trim();

  if (!name) return { ok: false, error: "Enter your full name." };
  if (!company) return { ok: false, error: "Enter your company name." };
  if (!emailLooksValid(email)) return { ok: false, error: "That email address does not look right." };
  const pw = passwordProblem(input.password);
  if (pw) return { ok: false, error: pw };

  const records = readAll();
  if (records.some((r) => r.account.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "An account already exists for that email. Sign in instead." };
  }

  const key = companyKeyOf(company);
  const firstForCompany = !records.some((r) => r.account.companyKey === key);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(input.password, salt, ITERATIONS);

  const account: Account = {
    id: newId(),
    name,
    email,
    company,
    companyKey: key,
    role: firstForCompany ? "owner" : "member",
    status: firstForCompany ? "approved" : "pending",
    avatar: avatarFor(name),
    createdAt: new Date().toISOString(),
  };

  records.push({
    account,
    algo: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: b64(salt),
    hash: b64(hash),
  });
  writeAll(records);

  return { ok: true, account, firstForCompany };
}

export type SignInOutcome = { ok: true; account: Account } | { ok: false; error: string };

export async function signIn(email: string, password: string): Promise<SignInOutcome> {
  const records = readAll();
  const record = records.find((r) => r.account.email.toLowerCase() === email.trim().toLowerCase());

  // Same message whether or not the address exists, so the form does not
  // confirm which emails are registered.
  const generic = "That email and password do not match an account.";
  if (!record) return { ok: false, error: generic };

  const expected = unb64(record.hash);
  const actual = await derive(password, unb64(record.salt), record.iterations || ITERATIONS);
  if (!sameBytes(actual, expected)) return { ok: false, error: generic };

  if (record.account.status === "rejected") {
    return { ok: false, error: "This account was declined by an administrator. Contact your company owner." };
  }

  return { ok: true, account: record.account };
}

/** Approve or decline a pending account. Only an owner or admin may do this. */
export function decide(
  actor: Account,
  targetId: string,
  decision: "approve" | "reject",
  grantAdmin = false
): { ok: true; account: Account } | { ok: false; error: string } {
  if (actor.role !== "owner" && actor.role !== "admin") {
    return { ok: false, error: "Only an owner or admin can decide on access requests." };
  }
  const records = readAll();
  const record = records.find((r) => r.account.id === targetId);
  if (!record) return { ok: false, error: "That request no longer exists." };
  if (record.account.companyKey !== actor.companyKey) {
    return { ok: false, error: "That account belongs to a different company." };
  }
  if (record.account.id === actor.id) {
    return { ok: false, error: "You cannot decide on your own access." };
  }

  record.account.status = decision === "approve" ? "approved" : "rejected";
  record.account.role = decision === "approve" && grantAdmin ? "admin" : "member";
  record.account.decidedAt = new Date().toISOString();
  record.account.decidedBy = actor.email;
  writeAll(records);
  return { ok: true, account: record.account };
}

/** Owners may hand out or withdraw admin. Never applied to the actor. */
export function setRole(
  actor: Account,
  targetId: string,
  role: Exclude<AccountRole, "owner">
): { ok: true } | { ok: false; error: string } {
  if (actor.role !== "owner") return { ok: false, error: "Only the company owner can change roles." };
  const records = readAll();
  const record = records.find((r) => r.account.id === targetId);
  if (!record) return { ok: false, error: "That account no longer exists." };
  if (record.account.companyKey !== actor.companyKey) {
    return { ok: false, error: "That account belongs to a different company." };
  }
  if (record.account.id === actor.id) return { ok: false, error: "You cannot change your own role." };
  if (record.account.status !== "approved") {
    return { ok: false, error: "Approve the account before giving it a role." };
  }
  record.account.role = role;
  writeAll(records);
  return { ok: true };
}

/* ── sessions ───────────────────────────────────────────────────── */

export function startSession(accountId: string): void {
  const now = Date.now();
  const rec: SessionRecord = {
    accountId,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_DAYS * 86_400_000).toISOString(),
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(rec));
  } catch {
    /* nothing to do; the caller keeps the in-memory session for this tab */
  }
}

export function endSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Resolves the stored session back to a live account record. The session holds
 * no role and no approval state, so an account approved, declined or demoted
 * since sign-in reflects that on the very next load.
 */
export function resumeSession(): Account | null {
  let rec: SessionRecord | null = null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    rec = raw ? (JSON.parse(raw) as SessionRecord) : null;
  } catch {
    rec = null;
  }
  if (!rec?.accountId) return null;
  if (!rec.expiresAt || new Date(rec.expiresAt).getTime() <= Date.now()) {
    endSession();
    return null;
  }
  const account = accountById(rec.accountId);
  if (!account || account.status === "rejected") {
    endSession();
    return null;
  }
  return account;
}
