import { useState, useEffect } from 'react';
import { agents, getAgentById, getDepartmentStats } from './neas/agentRegistry';
import { orchestrationEngine } from './neas/orchestrationEngine';
import PersistenceService from './services/persistenceService';
import ErrorBoundary from './components/ErrorBoundary';
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
import ProjectsModule from './components/ProjectsModule';
import FinanceModule from './components/FinanceModule';
import BOQModule from './components/BOQModule';
import HRModule from './components/HRModule';
import HSEModule from './components/HSEModule';
import ProcurementModule from './components/ProcurementModule';
import MarketingModule from './components/MarketingModule';
import ReportsModule from './components/ReportsModule';
import IntegrationsModule from './components/IntegrationsModule';
import UsersModule from './components/UsersModule';
import AuditModule from './components/AuditModule';

type ViewType = 
  | 'executive'
  | 'workforce'
  | 'assistant'
  | 'knowledge'
  | 'workflows'
  | 'crm'
  | 'staff-directory'
  | 'task-monitor'
  | 'email-center'
  | 'approval-inbox'
  | 'projects'
  | 'boq'
  | 'finance'
  | 'hr'
  | 'hse'
  | 'procurement'
  | 'marketing'
  | 'reports'
  | 'integrations'
  | 'users'
  | 'audit';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('executive');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize persistence and load saved data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load saved orchestration data
        const savedData = PersistenceService.loadOrchestrationData();
        
        // Log initialization
        orchestrationEngine.addAuditLog(
          'system',
          'app',
          'app_initialized',
          'system',
          'app',
          'Application initialized with persistence',
          'info',
          {
            tasksLoaded: savedData.tasks.length,
            approvalsLoaded: savedData.approvals.length,
            auditLogsLoaded: savedData.auditLogs.length
          }
        );

        console.log('[App] Initialized with persistence');
        setIsInitialized(true);
      } catch (error) {
        console.error('[App] Failed to initialize:', error);
        setIsInitialized(true); // Continue even if persistence fails
      }
    };

    initializeApp();
  }, []);

  // Auto-save orchestration data periodically
  useEffect(() => {
    if (!isInitialized) return;

    const saveInterval = setInterval(() => {
      try {
        const tasks = orchestrationEngine.getAllTasks();
        const approvals = orchestrationEngine.getAllApprovals();
        const auditLogs = orchestrationEngine.getAuditLogs();

        PersistenceService.saveOrchestrationData({
          tasks,
          approvals,
          auditLogs
        });
      } catch (error) {
        console.error('[App] Failed to auto-save:', error);
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [isInitialized]);

  const navigationItems = [
    { id: 'executive' as ViewType, icon: '👔', label: 'Executive Center', badge: orchestrationEngine.getPendingApprovals().length },
    { id: 'workforce' as ViewType, icon: '🎛️', label: 'Workforce Control' },
    { id: 'assistant' as ViewType, icon: '💬', label: 'AI Assistant' },
    { id: 'knowledge' as ViewType, icon: '📚', label: 'Knowledge Base' },
    { id: 'workflows' as ViewType, icon: '⚙️', label: 'Workflows' },
    { id: 'crm' as ViewType, icon: '📊', label: 'Sales CRM' },
    { id: 'staff-directory' as ViewType, icon: '🤖', label: 'AI Staff' },
    { id: 'task-monitor' as ViewType, icon: '📋', label: 'Task Monitor', badge: orchestrationEngine.getTasksByStatus('in_progress').length },
    { id: 'email-center' as ViewType, icon: '📧', label: 'Email Center' },
    { id: 'approval-inbox' as ViewType, icon: '✓', label: 'Approvals', badge: orchestrationEngine.getPendingApprovals().length },
    { id: 'projects' as ViewType, icon: '🏗️', label: 'Projects' },
    { id: 'boq' as ViewType, icon: '🧮', label: 'BOQ & Quotes' },
    { id: 'finance' as ViewType, icon: '💰', label: 'Finance' },
    { id: 'hr' as ViewType, icon: '👥', label: 'HR & Training' },
    { id: 'hse' as ViewType, icon: '🛡️', label: 'HSE & Quality' },
    { id: 'procurement' as ViewType, icon: '📦', label: 'Procurement' },
    { id: 'marketing' as ViewType, icon: '📣', label: 'Marketing' },
    { id: 'reports' as ViewType, icon: '📈', label: 'Reports' },
    { id: 'integrations' as ViewType, icon: '🔌', label: 'Integrations' },
    { id: 'users' as ViewType, icon: '🔐', label: 'Users' },
    { id: 'audit' as ViewType, icon: '📝', label: 'Audit Logs' },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'executive':
        return <ExecutiveCommandCenter />;
      case 'workforce':
        return <LiveWorkforceControlCenter />;
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
      case 'projects':
        return <ProjectsModule />;
      case 'boq':
        return <BOQModule />;
      case 'finance':
        return <FinanceModule />;
      case 'hr':
        return <HRModule />;
      case 'hse':
        return <HSEModule />;
      case 'procurement':
        return <ProcurementModule />;
      case 'marketing':
        return <MarketingModule />;
      case 'reports':
        return <ReportsModule />;
      case 'integrations':
        return <IntegrationsModule />;
      case 'users':
        return <UsersModule />;
      case 'audit':
        return <AuditModule />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
              <p className="text-slate-400">This module is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[#071D29] via-[#0a2a3a] to-[#071D29] flex">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-[#071D29]/80 backdrop-blur-xl border-r border-[#CA9332]/20 flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-[#CA9332]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CA9332] to-[#EBC07E] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-sm font-bold text-white">NEAS AI</h1>
                <p className="text-[10px] text-[#EBC07E]/60">Virtual Office</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                currentView === item.id
                  ? 'bg-gradient-to-r from-[#CA9332]/20 to-[#EBC07E]/10 border border-[#CA9332]/30 text-[#EBC07E]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="text-xs font-medium flex-1 text-left">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#CA9332]/30 text-[#EBC07E] text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse Button */}
        <div className="p-2 border-t border-[#CA9332]/20">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <span>{sidebarCollapsed ? '→' : '←'}</span>
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-[#071D29]/60 backdrop-blur-xl border-b border-[#CA9332]/20 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {navigationItems.find(item => item.id === currentView)?.label}
              </h2>
              <p className="text-xs text-slate-400">
                {currentView === 'executive' && 'Strategic overview and executive decision support'}
                {currentView === 'workforce' && 'Real-time AI workforce monitoring and control'}
                {currentView === 'assistant' && 'Conversational AI command interface'}
                {currentView === 'knowledge' && 'Company document and knowledge management'}
                {currentView === 'workflows' && 'Automated business workflow management'}
                {currentView === 'crm' && 'Sales pipeline and customer relationship management'}
                {currentView === 'staff-directory' && 'AI workforce management and performance'}
                {currentView === 'task-monitor' && 'Real-time task tracking and coordination'}
                {currentView === 'email-center' && 'Company email integration and management'}
                {currentView === 'approval-inbox' && 'Review and approve critical business actions'}
                {currentView === 'projects' && 'Project management and progress tracking'}
                {currentView === 'boq' && 'Bill of quantities and quotation management'}
                {currentView === 'finance' && 'Financial management and cash flow tracking'}
                {currentView === 'hr' && 'Human resources and employee management'}
                {currentView === 'hse' && 'Health, safety, and quality compliance'}
                {currentView === 'procurement' && 'Procurement and inventory management'}
                {currentView === 'marketing' && 'Marketing campaigns and analytics'}
                {currentView === 'reports' && 'Business reports and analytics'}
                {currentView === 'integrations' && 'System integrations and connections'}
                {currentView === 'users' && 'User management and access control'}
                {currentView === 'audit' && 'System audit trail and compliance logs'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-green-400 font-medium">System Online</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#CA9332]/10 border border-[#CA9332]/20">
                <span className="text-xs text-[#EBC07E]">👤 CEO</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderView()}
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
}
