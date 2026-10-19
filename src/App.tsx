import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth, type User } from './AuthContext';
import AuthPage from './AuthPage';
import {
  departments,
  meetingRooms,
  chatChannels,
  chatMessages as initialMessages,
  activityFeed,
  officeRooms,
  signOffDepartments,
  monitoredEmails as initialEmails,
  adminLogs as initialAdminLogs,
  ADMIN_EMAIL,
  type Agent,
  type Task,
  type Department,
  type ChatMessage,
  type PresenceStatus,
  type MonitoredEmail,
  type AdminLog,
  type TaskStatus,
  type TaskPriority,
} from './data';
import {
  initializeGapi,
  initializeGis,
  requestToken,
  isAuthenticated,
  signOut,
  fetchEmails,
  sendEmail,
  markAsRead,
  getUserEmail,
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

function PresenceSelector({ presence, onChange }: { presence: PresenceStatus; onChange: (p: PresenceStatus) => void }) {
  const [open, setOpen] = useState(false);
  const options: { value: PresenceStatus; label: string; color: string; icon: string }[] = [
    { value: 'available', label: 'Available', color: 'bg-green-500', icon: '🟢' },
    { value: 'busy', label: 'Busy', color: 'bg-red-500', icon: '🔴' },
    { value: 'away', label: 'Away', color: 'bg-yellow-500', icon: '🟡' },
    { value: 'dnd', label: 'Do Not Disturb', color: 'bg-purple-500', icon: '🟣' },
  ];
  const current = options.find(o => o.value === presence)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/50 transition-all text-xs"
      >
        <span className={`w-2 h-2 rounded-full ${current.color} status-pulse`} />
        <span className="text-slate-300">{current.label}</span>
        <span className="text-slate-500">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 w-48 glass-card rounded-xl p-2 z-50 border-slate-600/30! shadow-xl">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  presence === opt.value ? 'bg-blue-500/10 text-blue-300' : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============ Task Components ============

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

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config: Record<TaskPriority, { bg: string; label: string }> = {
    critical: { bg: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Critical' },
    high: { bg: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'High' },
    medium: { bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Medium' },
    low: { bg: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Low' },
  };
  const c = config[priority];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border ${c.bg}`}>
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

// ============ Agent Desk ============

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

// ============ Office Floor Plan ============

function OfficeFloorPlan({ onRoomSelect, selectedRoom }: { onRoomSelect: (roomId: string) => void; selectedRoom: string | null }) {
  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="text-blue-400">◈</span> Office Floor Plan
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500/50" /> Active</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500/50" /> Meeting</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-500/50" /> Break</span>
        </div>
      </div>
      
      <div className="relative bg-slate-900/50 rounded-xl border border-slate-700/30 p-4 overflow-hidden" style={{ minHeight: '340px' }}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        
        <div className="relative grid grid-cols-4 gap-2" style={{ gridTemplateRows: 'repeat(5, 1fr)' }}>
          <div
            className={`office-room col-span-4 rounded-lg p-3 flex items-center justify-between ${selectedRoom === 'reception' ? 'active' : ''}`}
            style={{ backgroundColor: '#6366f120', border: '1px solid #6366f140' }}
            onClick={() => onRoomSelect('reception')}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🏢</span>
              <span className="text-xs font-medium text-white/80">Reception</span>
            </div>
            <span className="text-[10px] text-slate-400">Welcome Area</span>
          </div>

          <div
            className={`office-room rounded-lg p-3 flex flex-col items-center justify-center ${selectedRoom === 'exec-desk' ? 'active' : ''}`}
            style={{ backgroundColor: '#8b5cf620', border: '1px solid #8b5cf640' }}
            onClick={() => onRoomSelect('exec-desk')}
          >
            <span className="text-lg mb-1">👔</span>
            <span className="text-[10px] font-medium text-white/80">Executive</span>
            <div className="flex -space-x-1 mt-1">
              <span className="text-xs agent-avatar-float">👩‍💼</span>
            </div>
          </div>
          <div
            className={`office-room rounded-lg p-3 flex flex-col items-center justify-center ${selectedRoom === 'ops-desk' ? 'active' : ''}`}
            style={{ backgroundColor: '#3b82f620', border: '1px solid #3b82f640' }}
            onClick={() => onRoomSelect('ops-desk')}
          >
            <span className="text-lg mb-1">⚙️</span>
            <span className="text-[10px] font-medium text-white/80">Operations</span>
            <div className="flex -space-x-1 mt-1">
              <span className="text-xs agent-avatar-float">👨‍💻</span>
            </div>
          </div>
          <div
            className={`office-room rounded-lg p-3 flex flex-col items-center justify-center ${selectedRoom === 'finance-desk' ? 'active' : ''}`}
            style={{ backgroundColor: '#10b98120', border: '1px solid #10b98140' }}
            onClick={() => onRoomSelect('finance-desk')}
          >
            <span className="text-lg mb-1">💰</span>
            <span className="text-[10px] font-medium text-white/80">Finance</span>
            <div className="flex -space-x-1 mt-1">
              <span className="text-xs agent-avatar-float">👩‍💻</span>
            </div>
          </div>
          <div
            className={`office-room rounded-lg p-3 flex flex-col items-center justify-center row-span-2 ${selectedRoom === 'break-room' ? 'active' : ''}`}
            style={{ backgroundColor: '#84cc1620', border: '1px solid #84cc1640' }}
            onClick={() => onRoomSelect('break-room')}
          >
            <span className="text-2xl mb-1">☕</span>
            <span className="text-[10px] font-medium text-white/80">Break Room</span>
            <span className="text-[9px] text-slate-400 mt-1">3 people</span>
          </div>

          <div
            className={`office-room rounded-lg p-3 flex flex-col items-center justify-center ${selectedRoom === 'sales-desk' ? 'active' : ''}`}
            style={{ backgroundColor: '#f59e0b20', border: '1px solid #f59e0b40' }}
            onClick={() => onRoomSelect('sales-desk')}
          >
            <span className="text-lg mb-1">📈</span>
            <span className="text-[10px] font-medium text-white/80">Sales</span>
            <div className="flex -space-x-1 mt-1">
              <span className="text-xs agent-avatar-float">👨‍💼</span>
            </div>
          </div>
          <div
            className={`office-room rounded-lg p-3 flex flex-col items-center justify-center ${selectedRoom === 'proc-desk' ? 'active' : ''}`}
            style={{ backgroundColor: '#06b6d420', border: '1px solid #06b6d440' }}
            onClick={() => onRoomSelect('proc-desk')}
          >
            <span className="text-lg mb-1">🔗</span>
            <span className="text-[10px] font-medium text-white/80">Procurement</span>
            <div className="flex -space-x-1 mt-1">
              <span className="text-xs agent-avatar-float opacity-50">👨‍🔧</span>
            </div>
          </div>
          <div
            className={`office-room rounded-lg p-3 flex flex-col items-center justify-center ${selectedRoom === 'safety-desk' ? 'active' : ''}`}
            style={{ backgroundColor: '#ef444420', border: '1px solid #ef444440' }}
            onClick={() => onRoomSelect('safety-desk')}
          >
            <span className="text-lg mb-1">🛡️</span>
            <span className="text-[10px] font-medium text-white/80">Safety</span>
            <div className="flex -space-x-1 mt-1">
              <span className="text-xs agent-avatar-float">👩‍🔬</span>
            </div>
          </div>

          <div
            className={`office-room rounded-lg p-3 flex flex-col items-center justify-center ${selectedRoom === 'people-desk' ? 'active' : ''}`}
            style={{ backgroundColor: '#ec489920', border: '1px solid #ec489940' }}
            onClick={() => onRoomSelect('people-desk')}
          >
            <span className="text-lg mb-1">🤝</span>
            <span className="text-[10px] font-medium text-white/80">People</span>
            <div className="flex -space-x-1 mt-1">
              <span className="text-xs agent-avatar-float">👩‍🏫</span>
              <span className="text-xs agent-avatar-float">👩‍💼</span>
            </div>
          </div>
          <div
            className={`office-room rounded-lg p-3 flex flex-col items-center justify-center ${selectedRoom === 'customer-desk' ? 'active' : ''}`}
            style={{ backgroundColor: '#f9731620', border: '1px solid #f9731640' }}
            onClick={() => onRoomSelect('customer-desk')}
          >
            <span className="text-lg mb-1">🎧</span>
            <span className="text-[10px] font-medium text-white/80">Customer</span>
            <div className="flex -space-x-1 mt-1">
              <span className="text-xs agent-avatar-float">👨‍💻</span>
            </div>
          </div>
          <div
            className={`office-room rounded-lg p-3 flex flex-col items-center justify-center ${selectedRoom === 'meeting-1' ? 'active' : ''}`}
            style={{ backgroundColor: '#6366f120', border: '1px solid #6366f140' }}
            onClick={() => onRoomSelect('meeting-1')}
          >
            <span className="text-lg mb-1">🏔️</span>
            <span className="text-[10px] font-medium text-white/80">Summit Room</span>
            <span className="text-[9px] text-green-400 mt-1">● In meeting</span>
          </div>
          <div
            className={`office-room rounded-lg p-3 flex flex-col items-center justify-center ${selectedRoom === 'server-room' ? 'active' : ''}`}
            style={{ backgroundColor: '#64748b20', border: '1px solid #64748b40' }}
            onClick={() => onRoomSelect('server-room')}
          >
            <span className="text-2xl mb-1">🖥️</span>
            <span className="text-[10px] font-medium text-white/80">Server Room</span>
            <span className="text-[9px] text-green-400 mt-1">● Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Chat Panel ============

function ChatPanel({ userName, userAvatar }: { userName: string; userAvatar: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [activeChannel, setActiveChannel] = useState('general');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredMessages = messages.filter(m => m.channel === activeChannel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages.length]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: userName,
      senderAvatar: userAvatar,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      channel: activeChannel,
    };
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  return (
    <div className="glass-card rounded-2xl flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-slate-700/30">
        <div className="flex items-center gap-1 overflow-x-auto">
          {chatChannels.map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeChannel === ch.id
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
              }`}
            >
              <span>{ch.icon}</span>
              <span>{ch.name}</span>
              {ch.unread > 0 && activeChannel !== ch.id && (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-[9px] text-white flex items-center justify-center notification-badge">
                  {ch.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '300px' }}>
        {filteredMessages.map(msg => (
          <div key={msg.id} className={`chat-bubble flex gap-2.5 ${msg.isSystem ? 'opacity-70' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-slate-700/50 flex items-center justify-center text-sm flex-shrink-0 border border-slate-600/30">
              {msg.senderAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-semibold ${msg.isSystem ? 'text-amber-400' : 'text-white'}`}>
                  {msg.sender}
                </span>
                <span className="text-[10px] text-slate-600">{msg.timestamp}</span>
              </div>
              <p className={`text-xs leading-relaxed ${msg.isSystem ? 'text-amber-300/80 italic' : 'text-slate-300'}`}>
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-700/30">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-30"
          >
            <span className="text-sm">↑</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Meeting Rooms ============

function MeetingRoomsPanel() {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="text-purple-400">◉</span> Meeting Rooms
        </h3>
        <button className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
          + Book Room
        </button>
      </div>
      <div className="space-y-2.5">
        {meetingRooms.map(room => (
          <div key={room.id} className="meeting-card p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{room.icon}</span>
                <span className="text-xs font-semibold text-white">{room.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                room.status === 'available'
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : room.status === 'in-use'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {room.status === 'available' ? '● Available' : room.status === 'in-use' ? '● In Use' : '● Reserved'}
              </span>
            </div>
            {room.currentMeeting && (
              <p className="text-[11px] text-slate-400 mb-1">📋 {room.currentMeeting}</p>
            )}
            <div className="flex items-center justify-between">
              {room.participants && (
                <div className="flex -space-x-1.5">
                  {room.participants.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-full bg-slate-600 border border-slate-700 flex items-center justify-center text-[8px]">
                      👤
                    </div>
                  ))}
                  {room.participants.length > 3 && (
                    <div className="w-5 h-5 rounded-full bg-slate-600 border border-slate-700 flex items-center justify-center text-[8px] text-slate-400">
                      +{room.participants.length - 3}
                    </div>
                  )}
                </div>
              )}
              <span className="text-[10px] text-slate-500 ml-auto">
                Free: {room.nextAvailable} · Cap: {room.capacity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Activity Feed ============

function ActivityFeedPanel() {
  const typeConfig: Record<string, { icon: string; color: string }> = {
    'task-started': { icon: '▶', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    'task-completed': { icon: '✓', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
    'meeting-started': { icon: '📋', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    'agent-online': { icon: '●', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
    'agent-offline': { icon: '○', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
    'sign-off-required': { icon: '⏳', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    'message': { icon: '💬', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="text-cyan-400">◈</span> Activity Feed
        </h3>
        <span className="text-[10px] text-slate-500">Live</span>
      </div>
      <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
        {activityFeed.map(event => {
          const config = typeConfig[event.type] || typeConfig['message'];
          return (
            <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] border flex-shrink-0 ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs">{event.actorAvatar}</span>
                  <span className="text-[11px] font-medium text-white">{event.actor}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{event.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-slate-600">{event.timestamp}</span>
                  {event.department && (
                    <>
                      <span className="text-[9px] text-slate-700">·</span>
                      <span className="text-[9px] text-slate-500">{event.department}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Department Card ============

function DepartmentCard({ department, index }: { department: Department; index: number }) {
  return (
    <div
      className="glass-card rounded-2xl p-5 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: `${department.color}15`, border: `1px solid ${department.color}30` }}
          >
            {department.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{department.name}</h3>
            <p className="text-[10px] text-slate-500">
              {department.seats} seat{department.seats > 1 ? 's' : ''} · {department.openSeats} open
            </p>
          </div>
        </div>
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: department.color, boxShadow: `0 0 8px ${department.color}60` }}
        />
      </div>

      <div className="space-y-3">
        {department.agents.map((agent) => (
          <AgentDesk key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

// ============ Stats Bar ============

function StatsBar() {
  const totalAgents = departments.reduce((sum, d) => sum + d.agents.length, 0);
  const onDuty = departments.reduce((sum, d) => sum + d.agents.filter(a => a.status === 'on-duty').length, 0);
  const totalTasks = departments.reduce((sum, d) => sum + d.agents.reduce((s, a) => s + a.tasks.length, 0), 0);
  const gatedTasks = departments.reduce((sum, d) => sum + d.agents.reduce((s, a) => s + a.tasks.filter(t => t.gated).length, 0), 0);
  const activeMeetings = meetingRooms.filter(r => r.status === 'in-use').length;

  const stats = [
    { label: 'Agents', value: totalAgents, icon: '🤖', color: 'text-blue-400' },
    { label: 'On Duty', value: onDuty, icon: '✅', color: 'text-green-400' },
    { label: 'Tasks', value: totalTasks, icon: '📋', color: 'text-purple-400' },
    { label: 'Gated', value: gatedTasks, icon: '🔒', color: 'text-amber-400' },
    { label: 'Meetings', value: activeMeetings, icon: '🏔️', color: 'text-cyan-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="glass-card rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">{stat.icon}</span>
          <div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Sign-Off Banner ============

function SignOffBanner() {
  return (
    <div className="glass-card rounded-2xl p-5 mb-6 border-amber-500/20! bg-gradient-to-r from-amber-500/5 to-transparent">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl animate-float">
          🚦
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-amber-300 mb-1">Human Sign-Off Required</h3>
          <p className="text-xs text-slate-400">
            <span className="text-amber-400 font-semibold">{signOffDepartments.length} departments</span> waiting on a person — nothing leaves the floor ungated
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {signOffDepartments.map((dept) => (
            <span key={dept} className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-medium">
              {dept}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ User Menu ============

function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/50 transition-all"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-sm">
          {user.avatar}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-medium text-white leading-tight">{user.name}</p>
          <p className="text-[10px] text-slate-500">{user.company}</p>
        </div>
        <span className="text-slate-500 text-xs">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 glass-card rounded-xl p-2 z-50 border-slate-600/30! shadow-xl shadow-black/20">
            <div className="p-3 border-b border-slate-700/30 mb-1">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-400 font-medium">
                  {user.role}
                </span>
                <span className="text-[9px] text-slate-600">
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <span>🚪</span> Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============ Sidebar Navigation ============

type ViewType = 'floor' | 'departments' | 'chat' | 'meetings' | 'activity' | 'admin' | 'liveops';

function Sidebar({ activeView, onViewChange, notificationCount }: {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  notificationCount: number;
}) {
  const items: { id: ViewType; icon: string; label: string; badge?: number }[] = [
    { id: 'liveops', icon: '🚀', label: 'Live Ops Center' },
    { id: 'floor', icon: '🏢', label: 'Floor Plan' },
    { id: 'departments', icon: '👥', label: 'Departments' },
    { id: 'admin', icon: '🎛️', label: 'Admin Panel' },
    { id: 'chat', icon: '💬', label: 'Chat', badge: 9 },
    { id: 'meetings', icon: '📋', label: 'Meetings' },
    { id: 'activity', icon: '📊', label: 'Activity' },
  ];

  return (
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
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-left ${
              activeView === item.id ? 'active' : ''
            }`}
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            <span className="hidden lg:block text-xs font-medium text-slate-300">{item.label}</span>
            {(item.badge || notificationCount > 0) && item.id === 'chat' && (
              <span className="hidden lg:flex ml-auto w-5 h-5 rounded-full bg-blue-500 text-[9px] text-white items-center justify-center notification-badge">
                {item.badge}
              </span>
            )}
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
  );
}

// ============ Live Operations Center ============

function LiveOpsCenter() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'emails' | 'sheets' | 'platform' | 'autoreply'>('emails');
  const [emails, setEmails] = useState(initialEmails);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [composing, setComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '', threadId: '' });

  const monitoredAccounts = [
    'info.nextedgeaccesssolutions@gmail.com',
    'nextedgeaccesssolutions@gmail.com',
  ];

  // Initialize Google API on mount
  useEffect(() => {
    const initGoogle = async () => {
      try {
        await initializeGapi();
        await initializeGis();
        
        // Check if already authenticated
        if (isAuthenticated()) {
          setGoogleConnected(true);
          const email = await getUserEmail();
          setUserEmail(email);
          await loadRealEmails();
        }
      } catch (err) {
        console.error('Google API init error:', err);
      }
    };

    initGoogle();
  }, []);

  const handleConnectGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await requestToken();
      setGoogleConnected(true);
      
      const email = await getUserEmail();
      setUserEmail(email);
      
      await loadRealEmails();
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Google');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    signOut();
    setGoogleConnected(false);
    setUserEmail('');
    setEmails(initialEmails);
  };

  const loadRealEmails = async () => {
    try {
      setLoading(true);
      const realEmails = await fetchEmails(50);
      setEmails(realEmails.map(e => ({
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
      console.error('Error loading emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setLoading(true);
      await sendEmail(composeData.to, composeData.subject, composeData.body, composeData.threadId || undefined);
      setComposing(false);
      setComposeData({ to: '', subject: '', body: '', threadId: '' });
      await loadRealEmails();
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (emailId: string) => {
    try {
      await markAsRead(emailId);
      setEmails(emails.map(e => e.id === emailId ? { ...e, status: 'read' as const } : e));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleReply = (email: any) => {
    setComposeData({
      to: email.fromEmail,
      subject: `Re: ${email.subject}`,
      body: `\n\n---\nOn ${email.timestamp}, ${email.from} wrote:\n> ${email.body.split('\n').join('\n> ')}`,
      threadId: email.threadId || '',
    });
    setComposing(true);
  };

  const handleEmailAction = (emailId: string, action: 'read' | 'reply' | 'archive' | 'flag') => {
    if (action === 'archive') {
      setEmails(emails.map(e => e.id === emailId ? { ...e, status: 'archived' as const } : e));
    } else if (action === 'flag') {
      // Flag functionality
    }
  };

  const sheets = [
    {
      id: 'marketing',
      name: 'Marketing Data',
      url: 'https://docs.google.com/spreadsheets/d/1zFWIjmKYJe9T0_h32IU23CiBOYuo-TVZY3MNHfTNf8A/edit',
      icon: '📊',
      lastSync: '2 min ago',
      status: 'live',
    },
    {
      id: 'hr-finance',
      name: 'HR & Finance',
      url: 'https://docs.google.com/spreadsheets/d/1hOf_eByDKcv6GEQiz44s37xqzf-cbbHY0kTVBZikEDE/edit',
      icon: '💼',
      lastSync: '5 min ago',
      status: 'live',
    },
  ];

  const platforms = [
    {
      id: 'neas-platform',
      name: 'NEAS Platform',
      url: 'https://neas-platform-preview.vercel.app/login',
      icon: '🌐',
      status: 'online',
      uptime: '99.97%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="glass-card rounded-2xl p-6 border-gradient-to-r from-blue-500/20 to-purple-500/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30">
              🚀
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Live Operations Center</h2>
              <p className="text-sm text-slate-400">24/7 Email Monitoring · Auto-Reply · Real-Time Sheets · Platform Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border ${googleConnected ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${googleConnected ? 'bg-green-500 status-pulse' : 'bg-red-500'}`} />
                <span className={`text-xs font-semibold ${googleConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {googleConnected ? `Connected: ${userEmail}` : 'Not Connected'}
                </span>
              </div>
            </div>
            <button
              onClick={googleConnected ? handleDisconnect : handleConnectGoogle}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                googleConnected
                  ? 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-slate-600/50'
                  : 'bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Connecting...' : googleConnected ? 'Disconnect' : 'Connect Google'}
            </button>
          </div>
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Monitored Accounts */}
        <div className="mt-5 p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">Monitored Email Accounts</p>
          <div className="flex flex-wrap gap-2">
            {monitoredAccounts.map(account => (
              <div key={account} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/30 border border-slate-600/30">
                <span className="w-2 h-2 rounded-full bg-green-500 status-pulse" />
                <span className="text-xs text-slate-300 font-mono">{account}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1.5 border border-slate-700/50 w-fit">
        {([
          { id: 'emails' as const, label: 'Email Monitor', icon: '📧', count: emails.filter(e => e.status === 'unread').length },
          { id: 'sheets' as const, label: 'Google Sheets', icon: '📊' },
          { id: 'platform' as const, label: 'Platform Monitor', icon: '🌐' },
          { id: 'autoreply' as const, label: 'Auto-Reply', icon: '🤖' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-blue-500/30 text-blue-200">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.5 8.5l10.5 7 10.5-7M2 17h20V5H2v12zm0 2h20v1H2v-1z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {googleConnected ? 'Real Gmail Inbox' : 'Gmail API Monitoring'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {googleConnected 
                    ? `Connected to ${userEmail} · ${emails.length} emails loaded`
                    : 'Connect Google to view real emails'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-medium">
                🔴 {emails.filter(e => e.priority === 'urgent').length} urgent
              </span>
              <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-medium">
                📬 {emails.filter(e => e.status === 'unread').length} unread
              </span>
              {googleConnected && (
                <button
                  onClick={loadRealEmails}
                  disabled={loading}
                  className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium hover:bg-green-500/20 transition-colors"
                >
                  {loading ? 'Loading...' : '↻ Refresh'}
                </button>
              )}
              {googleConnected && (
                <button
                  onClick={() => setComposing(true)}
                  className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-[10px] text-blue-300 font-medium hover:bg-blue-500/30 transition-colors"
                >
                  ✉ Compose
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {emails.map(email => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email.id)}
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
                    {email.hasAttachment && <span className="text-[10px] text-slate-500">📎</span>}
                  </div>
                </div>
              ))}
            </div>

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
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30 flex-wrap">
                        {email.status === 'unread' && googleConnected && (
                          <button
                            onClick={() => handleMarkAsRead(email.id)}
                            className="px-3 py-1.5 rounded-lg text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors font-medium"
                          >
                            ✓ Mark Read
                          </button>
                        )}
                        {googleConnected && (
                          <button
                            onClick={() => handleReply(email)}
                            className="px-3 py-1.5 rounded-lg text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors font-medium"
                          >
                            ↩ Reply as CEO
                          </button>
                        )}
                        <button
                          onClick={() => handleEmailAction(email.id, 'archive')}
                          className="px-3 py-1.5 rounded-lg text-[10px] bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-colors font-medium"
                        >
                          📁 Archive
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <span className="text-5xl mb-4">📧</span>
                  <p className="text-sm text-slate-400 mb-2">Select an email to view</p>
                  <p className="text-[10px] text-slate-600">Monitoring {emails.length} emails from 2 accounts</p>
                </div>
              )}
            </div>
          </div>

          {/* Compose Modal */}
          {composing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="glass-card rounded-2xl p-6 w-full max-w-2xl border-blue-500/20!">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>✉</span> {composeData.subject.startsWith('Re:') ? 'Reply' : 'Compose'} Email
                  </h3>
                  <button onClick={() => setComposing(false)} className="text-slate-500 hover:text-slate-300">✕</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider">To</label>
                    <input
                      type="email"
                      value={composeData.to}
                      onChange={e => setComposeData({ ...composeData, to: e.target.value })}
                      className="w-full mt-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider">Subject</label>
                    <input
                      type="text"
                      value={composeData.subject}
                      onChange={e => setComposeData({ ...composeData, subject: e.target.value })}
                      className="w-full mt-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                      placeholder="Email subject"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider">Body</label>
                    <textarea
                      value={composeData.body}
                      onChange={e => setComposeData({ ...composeData, body: e.target.value })}
                      rows={8}
                      className="w-full mt-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
                      placeholder="Write your message..."
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleSendEmail}
                      disabled={loading || !composeData.to || !composeData.subject}
                      className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-xs text-blue-300 font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : '📤 Send Email'}
                    </button>
                    <button
                      onClick={() => setComposing(false)}
                      className="px-4 py-2 rounded-lg bg-slate-700/30 border border-slate-600/30 text-xs text-slate-400 font-medium hover:bg-slate-700/50 transition-colors"
                    >
                      Cancel
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Sending from:</span>
                      <span className="text-[10px] text-blue-300 font-mono">{userEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sheets' && (
        <div className="space-y-4">
          {sheets.map(sheet => (
            <div key={sheet.id} className="glass-card rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center text-2xl">
                    {sheet.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{sheet.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sheet.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">
                    ● Live
                  </span>
                  <span className="text-[10px] text-slate-500">Synced {sheet.lastSync}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <p className="text-xs text-slate-400 mb-3">Live data preview (requires Google Sheets API connection)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/20">
                    <p className="text-[10px] text-slate-500 mb-1">Total Rows</p>
                    <p className="text-lg font-bold text-white">--</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/20">
                    <p className="text-[10px] text-slate-500 mb-1">Columns</p>
                    <p className="text-lg font-bold text-white">--</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/20">
                    <p className="text-[10px] text-slate-500 mb-1">Last Update</p>
                    <p className="text-lg font-bold text-white">{sheet.lastSync}</p>
                  </div>
                </div>
              </div>
              <a
                href={sheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400 font-medium hover:bg-blue-500/20 transition-colors"
              >
                Open in Google Sheets ↗
              </a>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'platform' && (
        <div className="space-y-4">
          {platforms.map(platform => (
            <div key={platform.id} className="glass-card rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center text-2xl">
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{platform.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{platform.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">
                    ● {platform.status}
                  </span>
                  <span className="text-[10px] text-slate-500">Uptime: {platform.uptime}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 mb-1">Response Time</p>
                  <p className="text-lg font-bold text-green-400">142ms</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 mb-1">Status Code</p>
                  <p className="text-lg font-bold text-green-400">200</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 mb-1">Last Check</p>
                  <p className="text-lg font-bold text-white">Just now</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 mb-1">SSL Cert</p>
                  <p className="text-lg font-bold text-green-400">Valid</p>
                </div>
              </div>
              <a
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400 font-medium hover:bg-blue-500/20 transition-colors"
              >
                Open Platform ↗
              </a>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'autoreply' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">CEO Auto-Reply Templates</h3>
            <div className="space-y-3">
              {[
                {
                  trigger: 'Customer Inquiry',
                  template: 'Thank you for reaching out to Next Edge Access Solutions. I\'ve received your message and will review it personally. Our team will respond within 24 hours with a comprehensive solution.',
                  tone: 'Professional & Reassuring',
                },
                {
                  trigger: 'Urgent Issue',
                  template: 'I understand the urgency of this matter. I\'m personally overseeing this situation and have escalated it to our senior team. You\'ll hear from us within 2 hours with a resolution plan.',
                  tone: 'Urgent & Action-Oriented',
                },
                {
                  trigger: 'Partnership Inquiry',
                  template: 'Thank you for your interest in partnering with NEAS. I\'d welcome the opportunity to discuss how we can create value together. Let\'s schedule a call this week.',
                  tone: 'Strategic & Open',
                },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">{item.trigger}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.tone}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">"{item.template}"</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <p className="text-[11px] text-amber-300 font-medium mb-1">⚠️ Auto-Reply Status</p>
              <p className="text-[10px] text-slate-400">
                Auto-reply is currently <span className="text-amber-400 font-semibold">DISABLED</span>. Connect Google API to enable automated CEO-style responses.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Admin Controller ============

type AdminTab = 'tasks' | 'email' | 'logs' | 'settings';

function AdminController() {
  const [activeTab, setActiveTab] = useState<AdminTab>('tasks');
  const [allTasks, setAllTasks] = useState<(Task & { agentId: string; agentName: string; department: string; departmentColor: string })[]>(() => {
    return departments.flatMap(dept =>
      dept.agents.flatMap(agent =>
        agent.tasks.map(task => ({
          ...task,
          agentId: agent.id,
          agentName: agent.name,
          department: dept.name,
          departmentColor: dept.color,
          priority: (task.gated ? 'high' : task.status === 'blocked' ? 'critical' : 'medium') as TaskPriority,
          createdAt: 'Today',
        }))
      )
    );
  });
  const [emails, setEmails] = useState(initialEmails);
  const [logs, setLogs] = useState(initialAdminLogs);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskStatus | 'all'>('all');
  const [emailFilter, setEmailFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [emailConnected, setEmailConnected] = useState(true);
  const [autoMonitor, setAutoMonitor] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const addLog = (action: string, target: string, details?: string) => {
    const newLog: AdminLog = {
      id: `l-${Date.now()}`,
      action,
      target,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      admin: 'Admin Controller',
      details,
    };
    setLogs([newLog, ...logs]);
  };

  const handleTaskAction = (taskId: string, newStatus: TaskStatus) => {
    setAllTasks(tasks => tasks.map(t => {
      if (t.id === taskId) {
        addLog(
          newStatus === 'completed' ? 'Completed' : newStatus === 'cancelled' ? 'Cancelled' : newStatus === 'running' ? 'Started' : newStatus === 'queued' ? 'Queued' : 'Updated',
          t.title.substring(0, 40) + '...',
          `Status changed to ${newStatus}`
        );
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  const handleEmailAction = (emailId: string, action: 'read' | 'reply' | 'archive' | 'flag') => {
    setEmails(emails.map(e => {
      if (e.id === emailId) {
        const newStatus = action === 'read' ? 'read' as const : action === 'reply' ? 'replied' as const : action === 'archive' ? 'archived' as const : e.status;
        addLog(
          action === 'read' ? 'Read' : action === 'reply' ? 'Replied' : action === 'archive' ? 'Archived' : 'Flagged',
          e.subject.substring(0, 40) + '...',
          `Email from ${e.from}`
        );
        return { ...e, status: newStatus };
      }
      return e;
    }));
  };

  const filteredTasks = allTasks.filter(t => {
    if (taskFilter !== 'all' && t.status !== taskFilter) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.assignee.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredEmails = emails.filter(e => {
    if (emailFilter === 'unread' && e.status !== 'unread') return false;
    if (emailFilter === 'urgent' && e.priority !== 'urgent') return false;
    return true;
  });

  const unreadCount = emails.filter(e => e.status === 'unread').length;
  const urgentCount = emails.filter(e => e.priority === 'urgent' && e.status !== 'archived').length;
  const runningTasks = allTasks.filter(t => t.status === 'running').length;
  const blockedTasks = allTasks.filter(t => t.status === 'blocked').length;
  const awaitingSignOff = allTasks.filter(t => t.status === 'awaiting-sign-off').length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 border-blue-500/20!">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-2xl">
              🎛️
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Admin Controller</h2>
              <p className="text-xs text-slate-400">Centralized task management & email monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 status-pulse" />
              <span className="text-[10px] text-green-400 font-medium">Connected</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-500">Monitoring</p>
              <p className="text-[11px] text-blue-300 font-mono font-medium">{ADMIN_EMAIL}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-lg font-bold text-blue-400">{runningTasks}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Running</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-lg font-bold text-red-400">{blockedTasks}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Blocked</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-lg font-bold text-amber-400">{awaitingSignOff}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Awaiting Sign-off</p>
          </div>
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
            <p className="text-lg font-bold text-green-400">{completedTasks}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Completed</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <p className="text-lg font-bold text-purple-400">{unreadCount}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Unread Emails</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1.5 border border-slate-700/50 w-fit">
        {([
          { id: 'tasks' as AdminTab, label: 'All Tasks', icon: '📋', count: allTasks.length },
          { id: 'email' as AdminTab, label: 'Email Monitor', icon: '📧', count: unreadCount },
          { id: 'logs' as AdminTab, label: 'Admin Logs', icon: '📝', count: logs.length },
          { id: 'settings' as AdminTab, label: 'Settings', icon: '⚙️' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                activeTab === tab.id ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-700 text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks or assignees..."
              className="flex-1 w-full md:w-auto bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <div className="flex items-center gap-1 flex-wrap">
              {(['all', 'running', 'queued', 'blocked', 'awaiting-sign-off', 'completed', 'cancelled'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setTaskFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    taskFilter === status
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-300 bg-slate-800/30 border border-slate-700/30'
                  }`}
                >
                  {status === 'all' ? 'All' : status === 'awaiting-sign-off' ? 'Sign-off' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/30">
                    <th className="text-left px-4 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Task</th>
                    <th className="text-left px-4 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Assignee</th>
                    <th className="text-left px-4 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Department</th>
                    <th className="text-left px-4 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Priority</th>
                    <th className="text-left px-4 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Due</th>
                    <th className="text-right px-4 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {task.gated && <span className="text-amber-400 text-[10px]">🔒</span>}
                          <p className="text-xs text-slate-200 max-w-[200px] truncate">{task.title}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-300">{task.agentName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                          style={{
                            backgroundColor: `${task.departmentColor}15`,
                            borderColor: `${task.departmentColor}30`,
                            color: task.departmentColor,
                          }}
                        >
                          {task.department}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={task.priority || 'medium'} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] ${task.dueDate === 'Today' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}>
                          {task.dueDate}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {task.status !== 'running' && task.status !== 'completed' && task.status !== 'cancelled' && (
                            <button
                              onClick={() => handleTaskAction(task.id, 'running')}
                              className="px-2 py-1 rounded text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                              title="Start"
                            >
                              ▶
                            </button>
                          )}
                          {task.status !== 'completed' && task.status !== 'cancelled' && (
                            <button
                              onClick={() => handleTaskAction(task.id, 'completed')}
                              className="px-2 py-1 rounded text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                              title="Complete"
                            >
                              ✓
                            </button>
                          )}
                          {task.status !== 'cancelled' && (
                            <button
                              onClick={() => handleTaskAction(task.id, 'cancelled')}
                              className="px-2 py-1 rounded text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTasks.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No tasks match your filters</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.5 8.5l10.5 7 10.5-7M2 17h20V5H2v12zm0 2h20v1H2v-1z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${emailConnected ? 'bg-green-500 status-pulse' : 'bg-red-500'}`} />
                  <span className="text-xs font-medium text-white">
                    {emailConnected ? 'IMAP Connected — Monitoring Active' : 'Disconnected'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ADMIN_EMAIL}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 font-medium">🔴 {urgentCount} urgent</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] text-blue-400 font-medium">📬 {unreadCount} unread</span>
              </div>
              <button
                onClick={() => setEmailConnected(!emailConnected)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${
                  emailConnected
                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                {emailConnected ? '● Connected' : '○ Reconnect'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'unread', 'urgent'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setEmailFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  emailFilter === filter
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-300 bg-slate-800/30 border border-slate-700/30'
                }`}
              >
                {filter === 'all' ? '📬 All' : filter === 'unread' ? '🔵 Unread' : '🔴 Urgent'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              {filteredEmails.map(email => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email.id)}
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
                    {email.hasAttachment && <span className="text-[10px] text-slate-500">📎</span>}
                    {email.threadCount && <span className="text-[10px] text-slate-500">💬 {email.threadCount}</span>}
                    <div className="ml-auto flex items-center gap-1">
                      {email.status === 'unread' && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                      {email.status === 'replied' && (
                        <span className="text-[9px] text-green-400">↩ replied</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-5">
              {selectedEmail ? (
                (() => {
                  const email = emails.find(e => e.id === selectedEmail);
                  if (!email) return null;
                  return (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-white mb-1">{email.subject}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">From: <span className="text-slate-200">{email.from}</span></span>
                            <span className="text-[10px] text-slate-600">&lt;{email.fromEmail}&gt;</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                          email.priority === 'urgent' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}>
                          {email.priority === 'urgent' ? '🔴 Urgent' : 'Normal'}
                        </span>
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
                        {email.status === 'unread' && (
                          <button
                            onClick={() => handleEmailAction(email.id, 'read')}
                            className="px-3 py-1.5 rounded-lg text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors font-medium"
                          >
                            ✓ Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => handleEmailAction(email.id, 'reply')}
                          className="px-3 py-1.5 rounded-lg text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors font-medium"
                        >
                          ↩ Reply
                        </button>
                        <button
                          onClick={() => handleEmailAction(email.id, 'archive')}
                          className="px-3 py-1.5 rounded-lg text-[10px] bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-colors font-medium"
                        >
                          📁 Archive
                        </button>
                        <button
                          onClick={() => handleEmailAction(email.id, 'flag')}
                          className="px-3 py-1.5 rounded-lg text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors font-medium"
                        >
                          🚩 Flag
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <span className="text-4xl mb-3">📧</span>
                  <p className="text-sm text-slate-400">Select an email to view details</p>
                  <p className="text-[10px] text-slate-600 mt-1">Monitoring {emails.length} emails from {ADMIN_EMAIL}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Admin Action Log</h3>
            <span className="text-[10px] text-slate-500">{logs.length} entries</span>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/20 border border-slate-700/20 hover:border-slate-600/30 transition-colors">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] flex-shrink-0 border ${
                  log.action === 'Approved' || log.action === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                  log.action === 'Blocked' || log.action === 'Cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                  log.action === 'Escalated' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  log.action === 'Connected' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                  'bg-slate-500/10 text-slate-400 border-slate-500/30'
                }`}>
                  {log.action === 'Approved' ? '✓' : log.action === 'Completed' ? '✓' : log.action === 'Blocked' ? '⊘' : log.action === 'Escalated' ? '↑' : log.action === 'Connected' ? '●' : log.action === 'Created' ? '+' : log.action === 'Paused' ? '⏸' : log.action === 'Started' ? '▶' : log.action === 'Cancelled' ? '✕' : log.action === 'Read' ? '👁' : log.action === 'Replied' ? '↩' : log.action === 'Archived' ? '📁' : log.action === 'Flagged' ? '🚩' : '•'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold text-white">{log.action}</span>
                    <span className="text-[11px] text-slate-400 truncate">{log.target}</span>
                  </div>
                  {log.details && (
                    <p className="text-[10px] text-slate-500">{log.details}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-slate-600">{log.timestamp}</span>
                    <span className="text-[9px] text-slate-700">·</span>
                    <span className="text-[9px] text-slate-500">{log.admin}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Email Connection Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <div>
                  <p className="text-xs font-medium text-white">Connected Email</p>
                  <p className="text-[11px] text-blue-300 font-mono mt-0.5">{ADMIN_EMAIL}</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">
                  ● Active
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <div>
                  <p className="text-xs font-medium text-white">Protocol</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">IMAP (imap.gmail.com:993)</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-medium">
                  SSL/TLS
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <div>
                  <p className="text-xs font-medium text-white">Auto-Monitor Incoming Emails</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Automatically check for new emails every 30 seconds</p>
                </div>
                <button
                  onClick={() => setAutoMonitor(!autoMonitor)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${autoMonitor ? 'bg-blue-500' : 'bg-slate-600'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoMonitor ? 'left-5.5 translate-x-0' : 'left-0.5'}`}
                    style={{ left: autoMonitor ? '22px' : '2px' }}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <div>
                  <p className="text-xs font-medium text-white">Email Connection Status</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Last sync: Just now · {emails.length} emails indexed</p>
                </div>
                <button
                  onClick={() => setEmailConnected(!emailConnected)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${
                    emailConnected
                      ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                  }`}
                >
                  {emailConnected ? 'Disconnect' : 'Reconnect'}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Task Management Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <div>
                  <p className="text-xs font-medium text-white">Auto-approve gated tasks</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Automatically approve tasks awaiting sign-off after review</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-medium">
                  Manual Only
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <div>
                  <p className="text-xs font-medium text-white">Blocked task notifications</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Send alerts when tasks become blocked</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">
                  ● Enabled
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <div>
                  <p className="text-xs font-medium text-white">Admin access level</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Full control over all tasks, agents, and departments</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-medium">
                  Super Admin
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Main Dashboard ============

function OfficeDashboard() {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('liveops');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [presence, setPresence] = useState<PresenceStatus>('available');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!user) return null;

  const renderContent = () => {
    switch (activeView) {
      case 'liveops':
        return <LiveOpsCenter />;

      case 'floor':
        return (
          <div>
            <OfficeFloorPlan onRoomSelect={setSelectedRoom} selectedRoom={selectedRoom} />
            
            {selectedRoom && (
              <div className="glass-card rounded-2xl p-5 mb-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">
                    {officeRooms.find(r => r.id === selectedRoom)?.name || 'Room'} Details
                  </h3>
                  <button onClick={() => setSelectedRoom(null)} className="text-slate-500 hover:text-slate-300 text-xs">✕ Close</button>
                </div>
                {selectedRoom === 'break-room' && (
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">☕</span>
                    <div>
                      <p className="text-xs text-slate-300">The break room is where agents recharge between tasks.</p>
                      <p className="text-[10px] text-slate-500 mt-1">3 people currently here · Free WiFi · Coffee machine</p>
                    </div>
                  </div>
                )}
                {selectedRoom === 'meeting-1' && (
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🏔️</span>
                    <div>
                      <p className="text-xs text-slate-300">Q4 Planning Sync in progress</p>
                      <p className="text-[10px] text-slate-500 mt-1">Participants: Mara Vance, Dele Okafor, Tobias Bram · Until 11:30 AM</p>
                    </div>
                  </div>
                )}
                {selectedRoom === 'server-room' && (
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🖥️</span>
                    <div>
                      <p className="text-xs text-slate-300">All systems operational</p>
                      <p className="text-[10px] text-slate-500 mt-1">Uptime: 99.97% · Last deploy: 2 hours ago · 8 agents connected</p>
                    </div>
                  </div>
                )}
                {selectedRoom === 'reception' && (
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🏢</span>
                    <div>
                      <p className="text-xs text-slate-300">Welcome to the NEAS Virtual Office</p>
                      <p className="text-[10px] text-slate-500 mt-1">8 departments · 10 agents · 10 active tasks</p>
                    </div>
                  </div>
                )}
                {selectedRoom.includes('-desk') && (() => {
                  const room = officeRooms.find(r => r.id === selectedRoom);
                  const dept = departments.find(d => d.name.toLowerCase().includes(room?.name.toLowerCase().split(' ')[0] || ''));
                  if (!dept) return null;
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${dept.color}15`, border: `1px solid ${dept.color}30` }}>
                          {dept.icon}
                        </div>
                        <div>
                          <p className="text-xs text-slate-300">{dept.name} Department</p>
                          <p className="text-[10px] text-slate-500">{dept.agents.length} agent(s) · {dept.agents.reduce((s, a) => s + a.tasks.length, 0)} tasks</p>
                        </div>
                      </div>
                      {dept.agents.map(agent => (
                        <AgentDesk key={agent.id} agent={agent} />
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            <StatsBar />
            <SignOffBanner />
            
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-green-400">●</span> Who's Online
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {departments.flatMap(d => d.agents).filter(a => a.status === 'on-duty').map(agent => (
                  <div key={agent.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700/20 hover:border-slate-600/40 transition-all cursor-pointer">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm border border-slate-600/30">
                        {agent.avatar}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900 status-pulse" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-white truncate">{agent.name}</p>
                      <p className="text-[9px] text-slate-500 truncate">{agent.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'departments':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-blue-400">◈</span> Office Floor
              </h2>
              <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  ▦ Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  ☰ List
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {departments.map((dept, i) => (
                  <DepartmentCard key={dept.id} department={dept} index={i} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {departments.map((dept, i) => (
                  <div
                    key={dept.id}
                    className="glass-card rounded-2xl p-5 animate-fade-in-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                        style={{ backgroundColor: `${dept.color}15`, border: `1px solid ${dept.color}30` }}
                      >
                        {dept.icon}
                      </div>
                      <h3 className="text-sm font-bold text-white">{dept.name}</h3>
                      <span className="text-[10px] text-slate-500 ml-auto">
                        {dept.seats} seat{dept.seats > 1 ? 's' : ''} · {dept.openSeats} open
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dept.agents.map((agent) => (
                        <AgentDesk key={agent.id} agent={agent} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'admin':
        return <AdminController />;

      case 'chat':
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-cyan-400">💬</span> Team Chat
            </h2>
            <ChatPanel userName={user.name} userAvatar={user.avatar} />
          </div>
        );

      case 'meetings':
        return (
          <div>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-purple-400">📋</span> Meeting Rooms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetingRooms.map(room => (
                <div key={room.id} className="meeting-card glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center text-2xl">
                        {room.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{room.name}</h4>
                        <p className="text-[10px] text-slate-500">Capacity: {room.capacity} people</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${
                      room.status === 'available'
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : room.status === 'in-use'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {room.status === 'available' ? '● Available' : room.status === 'in-use' ? '● In Use' : '● Reserved'}
                    </span>
                  </div>
                  {room.currentMeeting && (
                    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20 mb-3">
                      <p className="text-xs text-slate-300 font-medium">📋 {room.currentMeeting}</p>
                      {room.participants && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex -space-x-1.5">
                            {room.participants.map((_, i) => (
                              <div key={i} className="w-6 h-6 rounded-full bg-slate-600 border border-slate-700 flex items-center justify-center text-[10px]">
                                👤
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-500">{room.participants.length} participants</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Next available: <span className="text-white font-medium">{room.nextAvailable}</span>
                    </span>
                    {room.status === 'available' && (
                      <button className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-[10px] text-blue-400 font-medium hover:bg-blue-500/20 transition-colors">
                        Book Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-cyan-400">📊</span> Activity Feed
            </h2>
            <ActivityFeedPanel />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex floor-grid">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        notificationCount={9}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">
                {activeView === 'liveops' && '🚀 Live Operations Center'}
                {activeView === 'floor' && '🏢 Office Floor'}
                {activeView === 'departments' && '👥 Departments'}
                {activeView === 'admin' && '🎛️ Admin Controller'}
                {activeView === 'chat' && '💬 Team Chat'}
                {activeView === 'meetings' && '📋 Meeting Rooms'}
                {activeView === 'activity' && '📊 Activity'}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {activeView === 'liveops' && '24/7 email monitoring, auto-reply, sheets, and platform tracking'}
                {activeView === 'floor' && 'Interactive office layout with live agent positions'}
                {activeView === 'departments' && 'All departments and agent task queues'}
                {activeView === 'admin' && 'Centralized task management & email monitoring'}
                {activeView === 'chat' && 'Real-time team communication'}
                {activeView === 'meetings' && 'Room availability and scheduling'}
                {activeView === 'activity' && 'Live feed of office events and actions'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PresenceSelector presence={presence} onChange={setPresence} />
              <UserMenu user={user} onLogout={logout} />
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}

          <footer className="mt-12 pt-6 border-t border-slate-800/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-600">
                NEAS Virtual Office · Row Level Security requires Postgres connection for real company records
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>Reference roster displayed</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>Agents created against company</span>
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
