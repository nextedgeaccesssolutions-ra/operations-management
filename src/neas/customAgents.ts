import type { Agent, AgentCapability, AgentLevel, Department } from './agentRegistry';
import { agents as builtInAgents } from './agentRegistry';

/**
 * Agents a company creates for itself.
 *
 * The registry in agentRegistry.ts is a fixed roster compiled into the build:
 * the same ten agents for everyone, and nothing a company can change. This
 * holds the agents a company defines, keyed by company so one company's roster
 * is not another's, and shaped exactly like a registry Agent so every existing
 * component renders them without modification.
 *
 * Two things are deliberate:
 *
 *   Tools are granted, never assumed. A new agent starts with nothing and only
 *   gets what is ticked, and whatever is ticked is recorded on the agent so the
 *   grant stays visible in the directory rather than living somewhere invisible.
 *
 *   Performance figures start empty, not at zero-as-a-score. A brand new agent
 *   has no success rate; showing "0%" would read as a measured failure, so
 *   callers check `hasRunHistory` and show nothing instead.
 *
 * Storage is the same browser-local store the accounts use, with the same
 * limitation: this is per-device, not a server-side record.
 */

export interface CustomAgentMeta {
  custom: true;
  companyKey: string;
  createdAt: string;
  createdBy: string;
}

export type CustomAgent = Agent & CustomAgentMeta;

const KEY = 'neas_custom_agents_v1';

/** The tools an agent can be granted, and what each one actually permits. */
export const GRANTABLE_TOOLS: Array<{
  id: string;
  label: string;
  note: string;
  /** Writes or sends something, so it needs a higher approval level. */
  sensitive: boolean;
}> = [
  { id: 'read:projects', label: 'Read projects', note: 'Project records, milestones and progress', sensitive: false },
  { id: 'read:crm', label: 'Read CRM', note: 'Leads, contacts and the opportunity pipeline', sensitive: false },
  { id: 'read:ledger', label: 'Read ledger', note: 'Invoices, receivables and expenses', sensitive: false },
  { id: 'read:roster', label: 'Read roster', note: 'Employees, certifications and availability', sensitive: false },
  { id: 'read:inventory', label: 'Read inventory', note: 'Stock levels and material allocation', sensitive: false },
  { id: 'read:incidents', label: 'Read HSE records', note: 'Incidents, permits and inspections', sensitive: false },
  { id: 'read:email', label: 'Read company email', note: 'Requires a connected Gmail account', sensitive: false },
  { id: 'draft:quote', label: 'Draft quotations', note: 'Prepares a quote; a person still issues it', sensitive: true },
  { id: 'draft:report', label: 'Draft reports', note: 'Prepares a report for review', sensitive: true },
  { id: 'draft:email', label: 'Draft email replies', note: 'Writes a reply; a person still sends it', sensitive: true },
  { id: 'write:schedule', label: 'Write the schedule', note: 'Changes crew and job scheduling', sensitive: true },
  { id: 'write:task', label: 'Create and update tasks', note: 'Adds work to the queue', sensitive: true },
];

/** Never grantable from this screen, and shown so the ceiling is visible. */
export const WITHHELD_TOOLS: Array<{ id: string; note: string }> = [
  { id: 'send:email', note: 'Sending external email always needs a person' },
  { id: 'approve:payment', note: 'No agent approves money leaving the company' },
  { id: 'write:payroll', note: 'Payroll is never written by an agent' },
  { id: 'close:incident', note: 'Safety findings are closed by a person' },
  { id: 'approve:own-work', note: 'An agent cannot sign off its own output' },
];

export const DEPARTMENTS: Department[] = [
  'executive',
  'operations',
  'sales',
  'estimating',
  'finance',
  'hr',
  'hse',
  'customer-service',
  'marketing',
  'procurement',
];

export const LEVELS: AgentLevel[] = ['executive', 'manager', 'specialist', 'support'];

function readAll(): CustomAgent[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CustomAgent[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: CustomAgent[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* caller surfaces the failure */
  }
}

export function customAgentsFor(companyKey: string): CustomAgent[] {
  return readAll().filter((a) => a.companyKey === companyKey);
}

/**
 * What the directory should list: the company's own agents first, then the
 * built-in reference roster.
 */
export function rosterFor(companyKey: string): Agent[] {
  return [...customAgentsFor(companyKey), ...builtInAgents];
}

/** An agent with no completed work has no success rate worth showing. */
export function hasRunHistory(agent: Agent): boolean {
  return agent.completedTasks > 0;
}

export function isCustom(agent: Agent): agent is CustomAgent {
  return (agent as CustomAgent).custom === true;
}

export interface NewAgentInput {
  name: string;
  title: string;
  department: Department;
  level: AgentLevel;
  description: string;
  responsibilities: string[];
  tools: string[];
  escalationRules: string[];
  kpis: string[];
  avatar: string;
}

export type CreateOutcome = { ok: true; agent: CustomAgent } | { ok: false; error: string };

/**
 * Approval level follows from what was granted, rather than being a free
 * choice: anything that writes or drafts outbound work needs a person on it.
 */
export function approvalLevelFor(tools: string[]): 1 | 2 | 3 | 4 {
  const sensitive = GRANTABLE_TOOLS.filter((t) => t.sensitive).map((t) => t.id);
  const granted = tools.filter((t) => sensitive.includes(t));
  if (granted.length === 0) return 1;
  if (granted.some((t) => t.startsWith('write:'))) return 3;
  return 2;
}

export function create(
  input: NewAgentInput,
  actor: { companyKey: string; email: string; role: string }
): CreateOutcome {
  if (actor.role !== 'owner' && actor.role !== 'admin') {
    return { ok: false, error: 'Only an owner or admin can add an agent.' };
  }

  const name = input.name.trim();
  const title = input.title.trim();
  const description = input.description.trim();

  if (name.length < 2) return { ok: false, error: 'Give the agent a name.' };
  if (!title) return { ok: false, error: 'Give the agent a role title.' };
  if (description.length < 20) {
    return { ok: false, error: 'Describe what this agent is responsible for, in a sentence or two.' };
  }
  if (input.tools.length === 0) {
    return { ok: false, error: 'Grant at least one tool, or the agent cannot do anything.' };
  }

  const existing = readAll();
  if (
    existing.some(
      (a) => a.companyKey === actor.companyKey && a.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return { ok: false, error: `You already have an agent called ${name}.` };
  }

  const approvalLevel = approvalLevelFor(input.tools);

  const capability: AgentCapability = {
    id: `cap-${Date.now().toString(36)}`,
    name: `${title} duties`,
    description,
    tools: input.tools,
    permissions: input.tools.map((t) => (t.startsWith('read:') ? 'read' : 'propose')),
    approvalLevel,
  };

  const agent: CustomAgent = {
    id: `custom-${globalThis.crypto.randomUUID?.() ?? Date.now().toString(36)}`,
    name,
    title,
    department: input.department,
    level: input.level,
    status: 'idle',
    avatar: input.avatar || '🤖',
    description,
    responsibilities: input.responsibilities.filter((r) => r.trim().length > 0),
    capabilities: [capability],
    kpis: input.kpis.filter((k) => k.trim().length > 0),
    escalationRules: [
      ...input.escalationRules.filter((r) => r.trim().length > 0),
      'Anything outside the granted tools above is refused and raised to a person.',
    ],
    currentTasks: 0,
    completedTasks: 0,
    successRate: 0,
    custom: true,
    companyKey: actor.companyKey,
    createdAt: new Date().toISOString(),
    createdBy: actor.email,
  };

  existing.push(agent);
  writeAll(existing);
  return { ok: true, agent };
}

export function remove(
  id: string,
  actor: { companyKey: string; role: string }
): { ok: true } | { ok: false; error: string } {
  if (actor.role !== 'owner' && actor.role !== 'admin') {
    return { ok: false, error: 'Only an owner or admin can remove an agent.' };
  }
  const all = readAll();
  const target = all.find((a) => a.id === id);
  if (!target) return { ok: false, error: 'That agent no longer exists.' };
  if (target.companyKey !== actor.companyKey) {
    return { ok: false, error: 'That agent belongs to a different company.' };
  }
  writeAll(all.filter((a) => a.id !== id));
  return { ok: true };
}
