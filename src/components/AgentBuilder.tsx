import { useState } from 'react';
import { useAuth } from '../AuthContext';
import {
  DEPARTMENTS,
  GRANTABLE_TOOLS,
  LEVELS,
  WITHHELD_TOOLS,
  approvalLevelFor,
  create,
  customAgentsFor,
  remove,
  type CustomAgent,
} from '../neas/customAgents';
import type { AgentLevel, Department } from '../neas/agentRegistry';

const AVATARS = ['🤖', '🛰️', '📐', '🧭', '⚖️', '🔭', '🧮', '🛡️', '📡', '🗂️'];

const INPUT =
  'w-full px-3 py-2 rounded-lg bg-[#071D29]/70 border border-[#CA9332]/20 text-xs text-white ' +
  'placeholder:text-slate-600 focus:outline-none focus:border-[#CA9332]/55 transition-colors';

const LABEL = 'block text-[10px] font-medium text-[#EBC07E]/70 mb-1.5 uppercase tracking-wider';

const APPROVAL_NOTE: Record<number, string> = {
  1: 'Read-only. This agent can look things up and report, and cannot change anything.',
  2: 'Drafts only. Everything it produces waits for a person before it goes anywhere.',
  3: 'Writes to the schedule or the work queue. Each write is logged and reversible by a person.',
  4: 'Reserved for actions this screen does not grant.',
};

/**
 * Where a company builds its own agents, rather than being stuck with the
 * compiled reference roster. Owners and admins only.
 */
export default function AgentBuilder({ onChanged }: { onChanged: () => void }) {
  const { account, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState<Department>('operations');
  const [level, setLevel] = useState<AgentLevel>('specialist');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [kpis, setKpis] = useState('');
  const [escalation, setEscalation] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [tools, setTools] = useState<string[]>([]);

  if (!account) return null;

  const mine: CustomAgent[] = customAgentsFor(account.companyKey);

  if (!isAdmin) {
    return (
      <div className="glass-card rounded-xl p-4">
        <p className="text-xs text-slate-400">
          {mine.length > 0
            ? `${account.company} has ${mine.length} agent${mine.length === 1 ? '' : 's'} of its own. Only an owner or admin can add or remove them.`
            : 'Only an owner or admin can add agents for your company.'}
        </p>
      </div>
    );
  }

  const toggleTool = (id: string) =>
    setTools((cur) => (cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id]));

  const reset = () => {
    setName('');
    setTitle('');
    setDescription('');
    setResponsibilities('');
    setKpis('');
    setEscalation('');
    setTools([]);
    setAvatar('🤖');
    setDepartment('operations');
    setLevel('specialist');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = create(
      {
        name,
        title,
        department,
        level,
        description,
        responsibilities: responsibilities.split('\n'),
        kpis: kpis.split('\n'),
        escalationRules: escalation.split('\n'),
        tools,
        avatar,
      },
      { companyKey: account.companyKey, email: account.email, role: account.role }
    );
    if (!res.ok) {
      setError(res.error);
      setDone('');
      return;
    }
    setError('');
    setDone(`${res.agent.name} was added to ${account.company}.`);
    reset();
    setOpen(false);
    onChanged();
  };

  const drop = (id: string, agentName: string) => {
    const res = remove(id, { companyKey: account.companyKey, role: account.role });
    setConfirmRemove(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError('');
    setDone(`${agentName} was removed.`);
    onChanged();
  };

  const level_ = approvalLevelFor(tools);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-white">Your company&rsquo;s own agents</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            The roster below the filters is the reference set that ships with the build and is
            the same for everyone. Agents you add here belong to{' '}
            <strong className="text-[#EBC07E]">{account.company}</strong> and appear first.
          </p>
        </div>
        <button
          onClick={() => {
            setOpen(!open);
            setError('');
            setDone('');
          }}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-[#071D29] text-xs font-bold hover:brightness-105 transition-all"
        >
          {open ? 'Cancel' : '+ Add an agent'}
        </button>
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

      {mine.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {mine.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#CA9332]/10 border border-[#CA9332]/25 text-xs text-[#EBC07E]"
            >
              <span aria-hidden>{a.avatar}</span>
              {a.name}
              {confirmRemove === a.id ? (
                <>
                  <button
                    onClick={() => drop(a.id, a.name)}
                    className="text-red-300 hover:text-red-200 font-semibold"
                  >
                    remove?
                  </button>
                  <button onClick={() => setConfirmRemove(null)} className="text-slate-400">
                    no
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmRemove(a.id)}
                  aria-label={`Remove ${a.name}`}
                  className="text-slate-500 hover:text-red-300"
                >
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {open && (
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="ag-name">
                Agent name
              </label>
              <input
                id="ag-name"
                className={INPUT}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. VERTEX"
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="ag-title">
                Role title
              </label>
              <input
                id="ag-title"
                className={INPUT}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rope Access Scheduler"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="ag-dept">
                Department
              </label>
              <select
                id="ag-dept"
                className={INPUT}
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="ag-level">
                Seniority
              </label>
              <select
                id="ag-level"
                className={INPUT}
                value={level}
                onChange={(e) => setLevel(e.target.value as AgentLevel)}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l.replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL}>Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  aria-pressed={avatar === a}
                  className={`w-9 h-9 rounded-lg text-lg transition-all ${
                    avatar === a
                      ? 'bg-[#CA9332]/25 border border-[#CA9332]/50'
                      : 'bg-[#071D29]/70 border border-[#CA9332]/15 hover:border-[#CA9332]/35'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL} htmlFor="ag-desc">
              What is it responsible for?
            </label>
            <textarea
              id="ag-desc"
              className={`${INPUT} min-h-[72px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Plans the week's rope-access crews against confirmed job dates and certification expiry."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="ag-resp">
                Duties — one per line
              </label>
              <textarea
                id="ag-resp"
                className={`${INPUT} min-h-[72px] resize-y`}
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder={'Build the weekly crew plan\nFlag certification expiries'}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="ag-kpi">
                How you will judge it — one per line
              </label>
              <textarea
                id="ag-kpi"
                className={`${INPUT} min-h-[72px] resize-y`}
                value={kpis}
                onChange={(e) => setKpis(e.target.value)}
                placeholder={'No crew sent without a valid IRATA card\nPlan ready before Friday noon'}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Tools it may use</label>
            <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
              An agent gets nothing it is not given here. Ticks marked with a dot write or draft
              something, so they raise the approval level.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {GRANTABLE_TOOLS.map((t) => {
                const on = tools.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      on
                        ? 'bg-[#CA9332]/10 border-[#CA9332]/40'
                        : 'bg-[#071D29]/50 border-[#CA9332]/12 hover:border-[#CA9332]/25'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleTool(t.id)}
                      className="mt-0.5 accent-[#CA9332]"
                    />
                    <span className="min-w-0">
                      <span className="block text-xs text-white">
                        {t.label}
                        {t.sensitive && (
                          <span className="ml-1.5 text-[#EBC07E]" aria-label="needs approval">
                            •
                          </span>
                        )}
                      </span>
                      <span className="block text-[10px] text-slate-500 leading-snug">{t.note}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#071D29]/60 border border-[#CA9332]/20">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              Approval level {level_}
            </p>
            <p className="text-xs text-[#EBC07E]">{APPROVAL_NOTE[level_]}</p>
          </div>

          <div>
            <label className={LABEL} htmlFor="ag-esc">
              When should it stop and ask a person? — one per line
            </label>
            <textarea
              id="ag-esc"
              className={`${INPUT} min-h-[60px] resize-y`}
              value={escalation}
              onChange={(e) => setEscalation(e.target.value)}
              placeholder={'Any job over ₱500,000\nAnything touching a lapsed certification'}
            />
            <p className="text-[10px] text-slate-500 mt-1.5">
              A final rule is always added: anything outside the tools above is refused and
              raised to a person.
            </p>
          </div>

          <details className="rounded-lg bg-[#071D29]/50 border border-[#CA9332]/12 p-3">
            <summary className="text-xs text-slate-400 cursor-pointer">
              What no agent is ever given
            </summary>
            <ul className="mt-2 space-y-1">
              {WITHHELD_TOOLS.map((t) => (
                <li key={t.id} className="text-[10px] text-slate-500">
                  <code className="text-red-300/70 line-through">{t.id}</code> — {t.note}
                </li>
              ))}
            </ul>
          </details>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-[#071D29] text-xs font-bold hover:brightness-105 transition-all"
            >
              Add to {account.company}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-lg bg-[#071D29]/70 border border-[#CA9332]/20 text-xs text-slate-300 hover:border-[#CA9332]/40"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
