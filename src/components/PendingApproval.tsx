import { useAuth } from "../AuthContext";

/**
 * Where an account lands between requesting access and an owner deciding.
 *
 * This is the whole point of the approval gate: a session exists, but no
 * company data is rendered behind it. The only actions offered are to re-check
 * the decision and to sign out.
 */
export default function PendingApproval() {
  const { account, refresh, signOut, colleagues } = useAuth();
  if (!account) return null;

  const admins = colleagues.filter(
    (c) => (c.role === "owner" || c.role === "admin") && c.status === "approved"
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071D29] via-[#0a2a3a] to-[#071D29] px-4">
      <div className="w-full max-w-lg">
        <div className="glass-card rounded-2xl p-8 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-[#CA9332]/15 border border-[#CA9332]/30 flex items-center justify-center text-2xl">
              ⏳
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Waiting for approval</h1>
              <p className="text-xs text-[#EBC07E]/70">
                {account.company}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Your account was created, but an owner or administrator at{" "}
            <strong className="text-white">{account.company}</strong> has to approve it before
            you can see any company data. Nothing is loaded until they do.
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#071D29]/50 border border-[#CA9332]/15">
              <dt className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Requested as
              </dt>
              <dd className="text-xs text-white break-words">{account.email}</dd>
            </div>
            <div className="p-3 rounded-xl bg-[#071D29]/50 border border-[#CA9332]/15">
              <dt className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Requested on
              </dt>
              <dd className="text-xs text-white">
                {new Date(account.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>

          {admins.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-[#071D29]/50 border border-[#CA9332]/15">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                Who can approve you
              </p>
              <ul className="space-y-1">
                {admins.map((a) => (
                  <li key={a.id} className="text-xs text-slate-300">
                    {a.avatar} {a.name} — <span className="text-slate-500">{a.email}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {admins.length === 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <p className="text-xs text-amber-200 leading-relaxed">
                No approved owner or administrator was found for a company spelled exactly
                &ldquo;{account.company}&rdquo; in this browser. If your colleagues spelled it
                differently, nobody here can approve you — sign out and request access again
                with the exact company name they used.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-6">
            <button
              onClick={refresh}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-[#071D29] text-xs font-bold hover:brightness-105 transition-all"
            >
              Check again
            </button>
            <button
              onClick={signOut}
              className="px-4 py-2.5 rounded-xl bg-[#071D29]/60 border border-[#CA9332]/20 text-xs text-slate-300 hover:text-white hover:border-[#CA9332]/40 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
