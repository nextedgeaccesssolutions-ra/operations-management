import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth, type User } from './AuthContext';
import AuthPage from './AuthPage';
import {
  departments,
  meetingRooms,
  chatChannels,
  chatMessages as initialMessages,
  monitoredEmails as initialEmails,
  type Agent,
  type Task,
  type ChatMessage,
  type PresenceStatus,
  type MonitoredEmail,
  type TaskStatus,
} from './data';
import { agenticEngine, simulateTaskProgress, simulateEmailProcessing, generateAIResponse } from './agenticEngine';
import InterDepartmentFeed from './components/InterDepartmentFeed';
import OfficeHub from './components/OfficeHub';
import TitanCommandCenter from './components/TitanCommandCenter';
import {
  initializeGapi,
  initializeGis,
  requestToken,
  isAuthenticated,
  signOut,
  fetchEmails as fetchGmailEmails,
  sendEmail as sendGmailEmail,
  markAsRead as markGmailAsRead,
  getUserEmail,
  isGoogleApiLoaded,
  isClientIdConfigured,
} from './services/googleApi';

// ============ Status Components ============

function StatusDot({ status }: { status: Agent['status'] }) {
  const config = {
    'on-duty': { color: 'bg-green-500', label: 'On duty', className: 'status-pulse' },
    idle: { color: 'bg-gray-400', label: 'Idle', className: 'status-pulse-idle' },
    held: { color: 'bg-red-500', label: 'Held', className: 'status-pulse-held' },
  };
  const c = config[status];
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${c.color} ${c.className}`} />
      <span className="text-xs text-slate-400 font-medium">{c.label}</span>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { bg: string; icon: string; label: string }> = {
    running: { bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '▶', label: 'Running' },
    queued: { bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: '◻', label: 'Queued' },
    blocked: { bg: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '⊘', label: 'Blocked' },
    'awaiting-sign-off': { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '⏳', label: 'Awaiting sign-off' },
    completed: { bg: 'bg-green-500/20 text-green-300 border-green-500/30', icon: '✓', label: 'Completed' },
    cancelled: { bg: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: '✕', label: 'Cancelled' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="group/task relative p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs text-slate-200 leading-relaxed flex-1">{task.title}</p>
        {task.gated && (
          <span className="gate-badge px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-400 uppercase tracking-wider whitespace-nowrap">
            Gated
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TaskStatusBadge status={task.status} />
          {task.blockedBy && (
            <span className="text-[10px] text-red-400">blocked by {task.blockedBy}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>{task.assignee}</span>
          <span className="text-slate-600">·</span>
          <span className={task.dueDate === 'Today' ? 'text-amber-400 font-medium' : ''}>due {task.dueDate}</span>
        </div>
      </div>
      {task.status === 'running' && (
        <div className="mt-2 h-0.5 rounded-full bg-slate-700 overflow-hidden">
          <div className="h-full task-progress rounded-full w-2/3" />
        </div>
      )}
    </div>
  );
}

function AgentDesk({ agent }: { agent: Agent }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="desk-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-lg border border-slate-600/50">
            {agent.avatar}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{agent.name}</h4>
            <p className="text-xs text-slate-400">{agent.role}</p>
          </div>
        </div>
        <StatusDot status={agent.status} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
          Model: <span className="text-slate-300">{agent.model}</span>
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
        >
          {expanded ? '▾ Tasks' : '▸ Tasks'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2">
          {agent.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Email Monitor with Gmail Integration ============

function EmailMonitor() {
  const [emails, setEmails] = useState<MonitoredEmail[]>(initialEmails);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [aiReply, setAiReply] = useState<string>('');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailUser, setGmailUser] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already connected on mount
  useEffect(() => {
    if (isGoogleApiLoaded() && isClientIdConfigured() && isAuthenticated()) {
      setGmailConnected(true);
      getUserEmail().then(email => setGmailUser(email)).catch(() => {});
      loadGmailEmails();
    }
  }, []);

  // Simulate email processing every 10 seconds (only when not connected to Gmail)
  useEffect(() => {
    if (gmailConnected) return;
    
    const interval = setInterval(() => {
      setEmails(prev => prev.map(email => simulateEmailProcessing(email)));
    }, 10000);

    return () => clearInterval(interval);
  }, [gmailConnected]);

  const loadGmailEmails = async () => {
    try {
      setLoading(true);
      const gmailEmails = await fetchGmailEmails(50);
      setEmails(gmailEmails.map(e => ({
        id: e.id,
        from: e.from,
        fromEmail: e.fromEmail,
        subject: e.subject,
        preview: e.snippet,
        body: e.body,
        timestamp: new Date(e.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        status: e.unread ? 'unread' as const : 'read' as const,
        priority: e.subject.toLowerCase().includes('urgent') ? 'urgent' as const : 'normal' as const,
        labels: e.labels,
        hasAttachment: false,
        threadCount: 1,
      })));
    } catch (err) {
      console.error('Error loading Gmail emails:', err);
      setError('Failed to load emails from Gmail');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isGoogleApiLoaded()) {
        throw new Error('Google API not loaded. Please refresh the page.');
      }

      if (!isClientIdConfigured()) {
        throw new Error('OAuth Client ID not configured. Please check environment variables.');
      }

      await initializeGapi();
      await initializeGis();
      await requestToken();

      if (!isAuthenticated()) {
        throw new Error('Authentication failed. Please try again.');
      }

      const email = await getUserEmail();
      setGmailUser(email);
      setGmailConnected(true);
      
      await loadGmailEmails();
    } catch (err: any) {
      console.error('Gmail connection error:', err);
      setError(err.message || 'Failed to connect to Gmail');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGmail = () => {
    signOut();
    setGmailConnected(false);
    setGmailUser('');
    setEmails(initialEmails);
  };

  const handleGenerateReply = (email: MonitoredEmail) => {
    setAiReply(generateAIResponse(email));
  };

  const handleSendReply = async (email: MonitoredEmail) => {
    if (!gmailConnected || !aiReply) return;
    
    try {
      setLoading(true);
      await sendGmailEmail(email.fromEmail, `Re: ${email.subject}`, aiReply);
      setAiReply('');
      setEmails(emails.map(e => e.id === email.id ? { ...e, status: 'replied' as const } : e));
    } catch (err: any) {
      setError('Failed to send reply: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (emailId: string) => {
    if (gmailConnected) {
      try {
        await markGmailAsRead(emailId);
      } catch (err) {
        console.error('Failed to mark as read in Gmail:', err);
      }
    }
    setEmails(emails.map(e => e.id === emailId ? { ...e, status: 'read' as const } : e));
  };

  const unreadCount = emails.filter(e => e.status === 'unread').length;
  const urgentCount = emails.filter(e => e.priority === 'urgent').length;

  return (
    <div className="space-y-4">
      {/* Gmail Connection Status */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center text-2xl">
              📧
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gmail Integration</h3>
              <p className="text-[10px] text-slate-400">
                {gmailConnected 
                  ? `Connected as ${gmailUser}` 
                  : 'Connect your Gmail to monitor real emails'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {gmailConnected ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="w-2 h-2 rounded-full bg-green-500 status-pulse" />
                  <span className="text-[10px] text-green-400 font-medium">Connected</span>
                </div>
                <button
                  onClick={handleDisconnectGmail}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg text-[10px] bg-slate-700/30 border border-slate-600/30 text-slate-400 hover:bg-slate-700/50 transition-colors font-medium disabled:opacity-50"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectGmail}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-xs bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? '⏳ Connecting...' : '🔗 Connect Gmail'}
              </button>
            )}
          </div>
        </div>
        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-300">⚠️ {error}</p>
          </div>
        )}
        {!gmailConnected && !error && (
          <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-[11px] text-slate-400">
              <span className="text-blue-300 font-medium">💡 Tip:</span> Connect your Gmail account to monitor real emails from{' '}
              <span className="text-blue-300 font-mono">info.nextedgeaccesssolutions@gmail.com</span> and{' '}
              <span className="text-blue-300 font-mono">nextedgeaccesssolutions@gmail.com</span>. 
              You can read, reply, and manage emails directly from this dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">{emails.length}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Emails</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">{unreadCount}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Unread</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-red-400">{urgentCount}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Urgent</p>
        </div>
      </div>

      {/* Email List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {emails.map(email => (
            <div
              key={email.id}
              onClick={() => {
                setSelectedEmail(email.id);
                setAiReply('');
              }}
              className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${
                selectedEmail === email.id ? 'border-blue-500/40! bg-blue-500/5!' : ''
              } ${email.status === 'unread' ? 'border-l-2 border-l-blue-500' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {email.priority === 'urgent' && <span className="text-red-400 text-[10px]">🔴</span>}
                  <span className="text-xs font-semibold text-white">{email.from}</span>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{email.timestamp}</span>
              </div>
              <p className={`text-xs mb-1 ${email.status === 'unread' ? 'text-white font-medium' : 'text-slate-300'}`}>
                {email.subject}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{email.preview}</p>
              <div className="flex items-center gap-2 mt-2">
                {email.labels.map(label => (
                  <span key={label} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-700/50 text-slate-400 border border-slate-600/30">
                    {label}
                  </span>
                ))}
                <span className="ml-auto text-[9px] text-slate-500 capitalize">{email.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Email Detail */}
        <div className="glass-card rounded-2xl p-5">
          {selectedEmail ? (
            (() => {
              const email = emails.find(e => e.id === selectedEmail);
              if (!email) return null;
              return (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">{email.subject}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>From: <span className="text-slate-200">{email.from}</span></span>
                      <span className="text-slate-600">&lt;{email.fromEmail}&gt;</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                    <p className="text-xs text-slate-300 leading-relaxed">{email.body}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {email.labels.map(label => (
                      <span key={label} className="px-2 py-1 rounded-md text-[10px] bg-slate-700/50 text-slate-300 border border-slate-600/30">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
                    <button
                      onClick={() => handleGenerateReply(email)}
                      className="px-3 py-1.5 rounded-lg text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors font-medium"
                    >
                      🤖 Generate AI Reply
                    </button>
                    <button
                      onClick={() => handleMarkAsRead(email.id)}
                      className="px-3 py-1.5 rounded-lg text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors font-medium"
                    >
                      ✓ Mark Read
                    </button>
                    <button
                      onClick={() => setEmails(emails.map(e => e.id === email.id ? { ...e, status: 'archived' as const } : e))}
                      className="px-3 py-1.5 rounded-lg text-[10px] bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-colors font-medium"
                    >
                      📁 Archive
                    </button>
                    {gmailConnected && (
                      <button
                        onClick={loadGmailEmails}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors font-medium disabled:opacity-50"
                      >
                        🔄 Refresh
                      </button>
                    )}
                  </div>
                  {aiReply && (
                    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                      <p className="text-[10px] text-green-400 font-medium mb-2">🤖 AI-Generated Reply:</p>
                      <p className="text-xs text-slate-300 leading-relaxed italic">"{aiReply}"</p>
                      <div className="mt-3 flex items-center gap-2">
                        {gmailConnected ? (
                          <button
                            onClick={() => handleSendReply(email)}
                            disabled={loading}
                            className="px-3 py-1.5 rounded-lg text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-colors font-medium disabled:opacity-50"
                          >
                            {loading ? '⏳ Sending...' : '📤 Send via Gmail'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEmails(emails.map(e => e.id === email.id ? { ...e, status: 'replied' as const } : e));
                              setAiReply('');
                            }}
                            className="px-3 py-1.5 rounded-lg text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-colors font-medium"
                          >
                            ✓ Mark as Replied
                          </button>
                        )}
                        <button
                          onClick={() => setAiReply('')}
                          className="px-3 py-1.5 rounded-lg text-[10px] bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:bg-slate-700/50 transition-colors font-medium"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <span className="text-5xl mb-4">📧</span>
              <p className="text-sm text-slate-400 mb-2">Select an email to view</p>
              <p className="text-[10px] text-slate-600">Monitoring {emails.length} emails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Agentic Activity Feed ============

function AgenticActivityFeed() {
  const [actions, setActions] = useState(agenticEngine.getRecentActions(20));
  const [thoughts, setThoughts] = useState(agenticEngine.getThoughts());

  useEffect(() => {
    const unsubscribe = agenticEngine.subscribe(() => {
      setActions(agenticEngine.getRecentActions(20));
      setThoughts(agenticEngine.getThoughts());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Agent Thoughts */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-purple-400">💭</span> Agent Thoughts (Live)
        </h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {thoughts.slice(0, 5).map((thought, i) => {
            const agent = departments.flatMap(d => d.agents).find(a => a.id === thought.agentId);
            return (
              <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{agent?.avatar}</span>
                  <span className="text-xs font-medium text-white">{agent?.name}</span>
                  <span className="text-[9px] text-slate-600">
                    {thought.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 italic">"{thought.thought}"</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Actions */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-blue-400">⚡</span> Agent Actions (Live)
        </h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {actions.map((action, i) => {
            const agent = departments.flatMap(d => d.agents).find(a => a.id === action.agentId);
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/20 border border-slate-700/20">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm flex-shrink-0">
                  {agent?.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold text-white">{action.agentName}</span>
                    <span className="text-[9px] text-slate-600">
                      {action.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    <span className="text-blue-300">{action.action}</span> · {action.target}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ Main Dashboard ============

function OfficeDashboard() {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<'floor' | 'emails' | 'activity' | 'interdept' | 'hub' | 'titan'>('floor');
  const [presence, setPresence] = useState<PresenceStatus>('available');
  const [agents, setAgents] = useState(departments.flatMap(d => d.agents));

  // Simulate task progression every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        tasks: agent.tasks.map(task => simulateTaskProgress(task))
      })));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const totalAgents = agents.length;
  const onDuty = agents.filter(a => a.status === 'on-duty').length;
  const totalTasks = agents.reduce((sum, a) => sum + a.tasks.length, 0);
  const runningTasks = agents.reduce((sum, a) => sum + a.tasks.filter(t => t.status === 'running').length, 0);
  const completedTasks = agents.reduce((sum, a) => sum + a.tasks.filter(t => t.status === 'completed').length, 0);

  return (
    <div className="min-h-screen flex floor-grid">
      {/* Sidebar */}
      <div className="w-16 lg:w-56 flex-shrink-0 bg-slate-900/50 border-r border-slate-800/50 flex flex-col">
        <div className="p-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-sm font-bold text-white">Virtual Office</h1>
              <p className="text-[9px] text-slate-500">NEAS Workspace</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'titan' as const, icon: '🏛️', label: 'PROJECT TITAN' },
            { id: 'floor' as const, icon: '🏢', label: 'Office Floor' },
            { id: 'hub' as const, icon: '🖥️', label: 'Office Hub' },
            { id: 'emails' as const, icon: '📧', label: 'Email Monitor' },
            { id: 'activity' as const, icon: '⚡', label: 'Agent Activity' },
            { id: 'interdept' as const, icon: '🤝', label: 'Dept. Collaboration' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-left ${
                activeView === item.id ? 'active' : ''
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span className="hidden lg:block text-xs font-medium text-slate-300">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800/50">
          <div className="hidden lg:flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-800/30">
            <span className="w-2 h-2 rounded-full bg-green-500 status-pulse" />
            <span className="text-[10px] text-slate-400">System Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">
                {activeView === 'titan' && '🏛️ PROJECT TITAN - Empire Command Center'}
                {activeView === 'floor' && '🏢 Office Floor'}
                {activeView === 'hub' && '🖥️ Office Hub'}
                {activeView === 'emails' && '📧 Email Monitor'}
                {activeView === 'activity' && '⚡ Agent Activity'}
                {activeView === 'interdept' && '🤝 Inter-Department Collaboration'}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {activeView === 'titan' && 'Autonomous Agentic AI Empire Operating System'}
                {activeView === 'floor' && 'Interactive office with autonomous AI agents'}
                {activeView === 'hub' && 'Office equipment and asset management'}
                {activeView === 'emails' && 'Real-time email monitoring with AI responses'}
                {activeView === 'activity' && 'Live agent thoughts and actions'}
                {activeView === 'interdept' && 'Live communication between all departments'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                <span className="w-2 h-2 rounded-full bg-green-500 status-pulse" />
                <span className="text-[10px] text-green-400 font-medium">AI Agents Active</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-sm">
                  {user.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500">{user.company}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="text-xl font-bold text-blue-400">{totalAgents}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Agents</p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-xl font-bold text-green-400">{onDuty}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">On Duty</p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-xl font-bold text-purple-400">{totalTasks}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tasks</p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">▶</span>
              <div>
                <p className="text-xl font-bold text-blue-400">{runningTasks}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Running</p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="text-xl font-bold text-green-400">{completedTasks}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Completed</p>
              </div>
            </div>
          </div>

          {activeView === 'floor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {departments.map((dept, i) => (
                <div
                  key={dept.id}
                  className="glass-card rounded-2xl p-5 animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${dept.color}15`, border: `1px solid ${dept.color}30` }}
                      >
                        {dept.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{dept.name}</h3>
                        <p className="text-[10px] text-slate-500">
                          {dept.seats} seat{dept.seats > 1 ? 's' : ''} · {dept.openSeats} open
                        </p>
                      </div>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: dept.color, boxShadow: `0 0 8px ${dept.color}60` }}
                    />
                  </div>

                  <div className="space-y-3">
                    {agents.filter(a => a.departmentId === dept.id).map((agent) => (
                      <AgentDesk key={agent.id} agent={agent} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeView === 'titan' && <TitanCommandCenter />}
          {activeView === 'hub' && <OfficeHub />}
          {activeView === 'emails' && <EmailMonitor />}
          {activeView === 'activity' && <AgenticActivityFeed />}
          {activeView === 'interdept' && <InterDepartmentFeed />}

          <footer className="mt-12 pt-6 border-t border-slate-800/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-600">
                NEAS Virtual Office · Agentic AI System · 24/7 Autonomous Operations
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>Powered by AI Agents</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>Real-time Monitoring</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center floor-grid">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            Loading workspace...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <OfficeDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
