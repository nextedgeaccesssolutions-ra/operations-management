import { useState } from "react";
import { useAuth } from "../AuthContext";

/**
 * The approval queue an owner or admin works from, plus the company roster.
 *
 * Deciding is deliberately explicit: approving as a member and approving as an
 * admin are two separate buttons, so nobody is handed administrative rights by
 * clicking the obvious one. Declining is confirmed before it applies.
 */
export default function AccessApprovals() {
  const { account, isAdmin, pendingRequests, colleagues, decide, changeRole } = useAuth();
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [confirmReject, setConfirmReject] = useState<string | null>(null);

  if (!account) return null;

  if (!isAdmin) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-1">Access requests</h2>
        <p className="text-xs text-slate-400">
          Only the owner or an administrator of {account.company} can review access requests.
          Your role is <strong className="text-[#EBC07E]">{account.role}</strong>.
        </p>
      </div>
    );
  }

  const act = (fn: () => { ok: boolean; error?: string }, success: string) => {
    const res = fn();
    if (res.ok) {
      setDone(success);
      setError("");
    } else {
      setError(res.error || "That did not work.");
      setDone("");
    }
    setConfirmReject(null);
  };

  const roster = [...colleagues].sort((a, b) => {
    const rank = { owner: 0, admin: 1, member: 2 } as const;
    if (rank[a.role] !== rank[b.role]) return rank[a.role] - rank[b.role];
    return a.name.localeCompare(b.name);
  });

  const statusChip = (s: string) =>
    s === "approved"
      ? "bg-green-500/15 text-green-300 border-green-500/30"
      : s === "pending"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-red-500/15 text-red-300 border-red-500/30";

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-white">Access requests</h2>
            <p className="text-xs text-slate-400 mt-1">
              New sign-ups for {account.company} wait here until you decide. Nothing in the
              office is rendered for them in the meantime.
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-[#CA9332]/15 border border-[#CA9332]/30 text-[#EBC07E] text-xs font-semibold">
            {pendingRequests.length} waiting
          </span>
        </div>

        {error && (
          <p role="alert" className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
            {error}
          </p>
        )}
        {done && (
          <p className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/25 text-green-300 text-xs">
            {done}
          </p>
        )}

        <div className="mt-5 space-y-3">
          {pendingRequests.length === 0 && (
            <p className="text-xs text-slate-500 py-6 text-center">
              Nobody is waiting for access right now.
            </p>
          )}

          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-xl bg-[#071D29]/50 border border-[#CA9332]/15"
            >
              <div className="flex items-start gap-3 flex-wrap">
                <div className="text-2xl" aria-hidden>
                  {req.avatar}
                </div>
                <div className="flex-1 min-w-[12rem]">
                  <p className="text-sm font-semibold text-white">{req.name}</p>
                  <p className="text-xs text-slate-400 break-words">{req.email}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Requested {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {confirmReject === req.id ? (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/25">
                  <p className="text-xs text-red-200 mb-2">
                    Decline {req.name}? They will not be able to sign in.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => act(() => decide(req.id, "reject"), `${req.name} was declined.`)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/80 text-white text-xs font-semibold hover:bg-red-500"
                    >
                      Yes, decline
                    </button>
                    <button
                      onClick={() => setConfirmReject(null)}
                      className="px-3 py-1.5 rounded-lg bg-[#071D29]/70 border border-[#CA9332]/20 text-xs text-slate-300"
                    >
                      Keep waiting
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      act(() => decide(req.id, "approve", false), `${req.name} was approved as a member.`)
                    }
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-[#071D29] text-xs font-bold hover:brightness-105"
                  >
                    Approve as member
                  </button>
                  <button
                    onClick={() =>
                      act(() => decide(req.id, "approve", true), `${req.name} was approved as an admin.`)
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#071D29]/70 border border-[#CA9332]/35 text-[#EBC07E] text-xs font-semibold hover:border-[#CA9332]/60"
                  >
                    Approve as admin
                  </button>
                  <button
                    onClick={() => setConfirmReject(req.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#071D29]/70 border border-red-500/25 text-xs text-red-300 hover:border-red-500/50"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-1">Who has access</h2>
        <p className="text-xs text-slate-400 mb-4">
          {roster.length} account{roster.length === 1 ? "" : "s"} on {account.company}.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-3 font-medium">Person</th>
                <th className="py-2 pr-3 font-medium">Role</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((c) => (
                <tr key={c.id} className="border-t border-[#CA9332]/10">
                  <td className="py-3 pr-3">
                    <span className="text-slate-200">
                      {c.avatar} {c.name}
                    </span>
                    <span className="block text-slate-500 break-words">{c.email}</span>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="text-[#EBC07E]">{c.role}</span>
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusChip(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {c.id === account.id ? (
                      <span className="text-slate-600">you</span>
                    ) : c.role === "owner" ? (
                      <span className="text-slate-600">owner</span>
                    ) : account.role !== "owner" ? (
                      <span className="text-slate-600">owner only</span>
                    ) : c.status !== "approved" ? (
                      <span className="text-slate-600">—</span>
                    ) : c.role === "admin" ? (
                      <button
                        onClick={() => act(() => changeRole(c.id, "member"), `${c.name} is now a member.`)}
                        className="px-2 py-1 rounded-lg bg-[#071D29]/70 border border-[#CA9332]/20 text-slate-300 hover:border-[#CA9332]/45"
                      >
                        Remove admin
                      </button>
                    ) : (
                      <button
                        onClick={() => act(() => changeRole(c.id, "admin"), `${c.name} is now an admin.`)}
                        className="px-2 py-1 rounded-lg bg-[#071D29]/70 border border-[#CA9332]/20 text-slate-300 hover:border-[#CA9332]/45"
                      >
                        Make admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
          These accounts live in this browser&rsquo;s storage, so this roster is per-device.
          Moving it behind Supabase with row-level policies is what makes it a real
          company-wide boundary.
        </p>
      </div>
    </div>
  );
}
