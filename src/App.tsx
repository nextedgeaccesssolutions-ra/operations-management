import { useEffect, useState } from 'react';
import { orchestrationEngine } from './neas/orchestrationEngine';
import { useAuth } from './AuthContext';
import AuthPage from './AuthPage';
import PendingApproval from './components/PendingApproval';
import AccessApprovals from './components/AccessApprovals';
import ExecutiveCommandCenter from './components/ExecutiveCommandCenter';
import AIStaffDirectory from './components/AIStaffDirectory';
import AgentTaskMonitor from './components/AgentTaskMonitor';
import EmailCenter from './components/EmailCenter';
import ApprovalInbox from './components/ApprovalInbox';
import LiveWorkforceControlCenter from './components/LiveWorkforceControlCenter';
import AIExecutiveAssistant from './components/AIExecutiveAssistant';
import CompanyKnowledgeBase from './components/CompanyKnowledgeBase';
import WorkflowBuilder from './components/WorkflowBuilder';
import SalesCRM from './components/SalesCRM';
import OfficeHub from './components/OfficeHub';
import InterDepartmentFeed from './components/InterDepartmentFeed';

type ViewType =
  | 'executive'
  | 'office'
  | 'workforce'
  | 'collaboration'
  | 'assistant'
  | 'knowledge'
  | 'workflows'
  | 'crm'
  | 'staff-directory'
  | 'task-monitor'
  | 'email-center'
  | 'approval-inbox'
  | 'access'
  | 'projects'
  | 'boq'
  | 'finance'
  | 'hr'
  | 'hse'
  | 'procurement'
  | 'marketing'
  | 'reports'
  | 'integrations'
  | 'audit';

type NavItem = {
  id: ViewType;
  icon: string;
  label: string;
  badge?: number;
  /** Built and reachable, or declared as not yet built. */
  built: boolean;
  /** Only shown to an owner or admin. */
  adminOnly?: boolean;
};

/** What each unbuilt module still needs, so the placeholder is specific. */
const NOT_BUILT: Partial<Record<ViewType, string>> = {
  projects: 'Milestones, Gantt schedules, planned-versus-actual progress and daily site reports.',
  boq: 'Bill of quantities, manpower and material costing, markup and quotation approval.',
  finance: 'Invoices and receivables, expense tracking, budget monitoring and cash flow.',
  hr: 'Employee records, certification tracking, recruitment and manpower allocation.',
  hse: 'Risk assessments, method statements, inspection records and corrective actions.',
  procurement: 'Supplier records, material requests, stock levels and quotation comparison.',
  marketing: 'Content planning, SEO metadata, campaign drafts and lead analytics.',
  reports: 'Scheduled daily, weekly and monthly reporting across the modules above.',
  integrations: 'Connection health and consent controls for Gmail, Sheets and the AI gateway.',
  audit: 'A durable, queryable audit trail of agent actions and human approvals.',
};

export default function App() {
  const { account, loading, approved, isAdmin, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('executive');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // The engine holds its queue in memory and does not publish changes, so the
  // badges are polled rather than left to go stale on whichever page is open.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!approved) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 4000);
    return () => window.clearInterval(id);
  }, [approved]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071D29] via-[#0a2a3a] to-[#071D29]">
        <div className="flex items-center gap-3 text-[#EBC07E]/70 text-sm">
          <span className="w-4 h-4 border-2 border-[#CA9332]/30 border-t-[#CA9332] rounded-full animate-spin" />
          Loading your office…
        </div>
      </div>
    );
  }

  if (!account) return <AuthPage />;
  if (!approved) return <PendingApproval />;

  const pendingApprovals = orchestrationEngine.getPendingApprovals().length;
  const running = orchestrationEngine.getTasksByStatus('in_progress').length;

  const navigationItems: NavItem[] = [
    { id: 'executive', icon: '👔', label: 'Executive Center', badge: pendingApprovals, built: true },
    { id: 'office', icon: '🏢', label: 'Virtual Office', built: true },
    { id: 'workforce', icon: '🎛️', label: 'Workforce Control', built: true },
    { id: 'collaboration', icon: '🔗', label: 'Collaboration', built: true },
    { id: 'assistant', icon: '💬', label: 'AI Assistant', built: true },
    { id: 'knowledge', icon: '📚', label: 'Knowledge Base', built: true },
    { id: 'workflows', icon: '⚙️', label: 'Workflows', built: true },
    { id: 'crm', icon: '📊', label: 'Sales CRM', built: true },
    { id: 'staff-directory', icon: '🤖', label: 'AI Staff', built: true },
    { id: 'task-monitor', icon: '📋', label: 'Task Monitor', badge: running, built: true },
    { id: 'email-center', icon: '📧', label: 'Email Center', built: true },
    { id: 'approval-inbox', icon: '✓', label: 'Approvals', badge: pendingApprovals, built: true },
    { id: 'access', icon: '🔐', label: 'Access Requests', built: true, adminOnly: true },
    { id: 'projects', icon: '🏗️', label: 'Projects', built: false },
    { id: 'boq', icon: '🧮', label: 'BOQ & Quotes', built: false },
    { id: 'finance', icon: '💰', label: 'Finance', built: false },
    { id: 'hr', icon: '👥', label: 'HR & Training', built: false },
    { id: 'hse', icon: '🛡️', label: 'HSE & Quality', built: false },
    { id: 'procurement', icon: '📦', label: 'Procurement', built: false },
    { id: 'marketing', icon: '📣', label: 'Marketing', built: false },
    { id: 'reports', icon: '📈', label: 'Reports', built: false },
    { id: 'integrations', icon: '🔌', label: 'Integrations', built: false },
    { id: 'audit', icon: '📝', label: 'Audit Logs', built: false },
  ].filter((item) => !item.adminOnly || isAdmin) as NavItem[];

  const current = navigationItems.find((item) => item.id === currentView);

  const renderView = () => {
    switch (currentView) {
      case 'executive':
        return <ExecutiveCommandCenter />;
      case 'office':
        return <OfficeHub />;
      case 'workforce':
        return <LiveWorkforceControlCenter />;
      case 'collaboration':
        return <InterDepartmentFeed />;
      case 'assistant':
        return <AIExecutiveAssistant />;
      case 'knowledge':
        return <CompanyKnowledgeBase />;
      case 'workflows':
        return <WorkflowBuilder />;
      case 'crm':
        return <SalesCRM />;
      case 'staff-directory':
        return <AIStaffDirectory />;
      case 'task-monitor':
        return <AgentTaskMonitor />;
      case 'email-center':
        return <EmailCenter />;
      case 'approval-inbox':
        return <ApprovalInbox />;
      case 'access':
        return <AccessApprovals />;
      default:
        return (
          <div className="flex items-start justify-center pt-10">
            <div className="glass-card rounded-2xl p-8 max-w-lg text-center">
              <div className="text-4xl mb-3" aria-hidden>
                {current?.icon ?? '🚧'}
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                {current?.label} is not built yet
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {NOT_BUILT[currentView] ??
                  'This module has not been implemented in this build.'}
              </p>
              <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
                Nothing is shown here rather than showing numbers that are not real. The
                modules already working are marked without a dot in the sidebar.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071D29] via-[#0a2a3a] to-[#071D29] flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } bg-[#071D29]/80 backdrop-blur-xl border-r border-[#CA9332]/20 flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        <div className="p-4 border-b border-[#CA9332]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CA9332] to-[#EBC07E] flex items-center justify-center flex-shrink-0">
              <span className="text-[#071D29] font-bold text-lg">N</span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white">NEAS AI</h1>
                <p className="text-[10px] text-[#EBC07E]/60 truncate">{account.company}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              aria-current={currentView === item.id ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                currentView === item.id
                  ? 'bg-gradient-to-r from-[#CA9332]/20 to-[#EBC07E]/10 border border-[#CA9332]/30 text-[#EBC07E]'
                  : item.built
                  ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                  : 'text-slate-600 hover:bg-white/5 hover:text-slate-400'
              }`}
            >
              <span className="text-lg flex-shrink-0" aria-hidden>
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <>
                  <span className="text-xs font-medium flex-1 text-left truncate">
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#CA9332]/30 text-[#EBC07E] text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                  {!item.built && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0"
                      title="Not built yet"
                      aria-label="Not built yet"
                    />
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-[#CA9332]/20">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span aria-hidden>{sidebarCollapsed ? '→' : '←'}</span>
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-[#071D29]/60 backdrop-blur-xl border-b border-[#CA9332]/20 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{current?.label}</h2>
              <p className="text-xs text-slate-400">
                {currentView === 'executive' && 'Strategic overview and executive decision support'}
                {currentView === 'office' && 'The floor, who is at which desk, and the room inventory'}
                {currentView === 'collaboration' && 'Hand-offs and messages between departments'}
                {currentView === 'staff-directory' && 'AI workforce management and performance'}
                {currentView === 'task-monitor' && 'Task tracking and coordination'}
                {currentView === 'email-center' && 'Company email integration and management'}
                {currentView === 'approval-inbox' && 'Review and approve critical business actions'}
                {currentView === 'access' && 'Approve or decline people asking to join your company'}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#CA9332]/10 border border-[#CA9332]/20">
                <span aria-hidden>{account.avatar}</span>
                <span className="text-xs text-[#EBC07E] max-w-[11rem] truncate">
                  {account.name}
                </span>
                <span className="text-[10px] text-[#EBC07E]/50 uppercase tracking-wider">
                  {account.role}
                </span>
              </div>
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-lg bg-[#071D29]/70 border border-[#CA9332]/20 text-xs text-slate-300 hover:text-white hover:border-[#CA9332]/45 transition-all"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{renderView()}</div>
      </main>
    </div>
  );
}
