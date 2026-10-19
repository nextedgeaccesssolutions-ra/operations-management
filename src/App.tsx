import { useState, useRef, useEffect } from 'react';
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
  type Agent,
  type Task,
  type Department,
  type ChatMessage,
  type PresenceStatus,
} from './data';

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

function TaskStatusBadge({ status }: { status: Task['status'] }) {
  const config = {
    running: { bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '▶', label: 'Running' },
    queued: { bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: '◻', label: 'Queued' },
    blocked: { bg: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '⊘', label: 'Blocked' },
    'awaiting-sign-off': { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '⏳', label: 'Awaiting sign-off' },
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
        {/* Grid background */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        
        {/* Rooms */}
        <div className="relative grid grid-cols-4 gap-2" style={{ gridTemplateRows: 'repeat(5, 1fr)' }}>
          {/* Reception - spans full width */}
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

          {/* Row 1: Executive, Operations, Finance, Break Room */}
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

          {/* Row 2: Sales, Procurement, Safety */}
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

          {/* Row 3: People, Customer, Summit Room */}
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
      {/* Channel tabs */}
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

      {/* Messages */}
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

      {/* Input */}
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

type ViewType = 'floor' | 'departments' | 'chat' | 'meetings' | 'activity';

function Sidebar({ activeView, onViewChange, notificationCount }: {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  notificationCount: number;
}) {
  const items: { id: ViewType; icon: string; label: string; badge?: number }[] = [
    { id: 'floor', icon: '🏢', label: 'Floor Plan' },
    { id: 'departments', icon: '👥', label: 'Departments' },
    { id: 'chat', icon: '💬', label: 'Chat', badge: 9 },
    { id: 'meetings', icon: '📋', label: 'Meetings' },
    { id: 'activity', icon: '📊', label: 'Activity' },
  ];

  return (
    <div className="w-16 lg:w-56 flex-shrink-0 bg-slate-900/50 border-r border-slate-800/50 flex flex-col">
      {/* Logo */}
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

      {/* Nav items */}
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

      {/* Bottom section */}
      <div className="p-3 border-t border-slate-800/50">
        <div className="hidden lg:flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-800/30">
          <span className="w-2 h-2 rounded-full bg-green-500 status-pulse" />
          <span className="text-[10px] text-slate-400">System Online</span>
        </div>
      </div>
    </div>
  );
}

// ============ Main Dashboard ============

function OfficeDashboard() {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('floor');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [presence, setPresence] = useState<PresenceStatus>('available');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!user) return null;

  const renderContent = () => {
    switch (activeView) {
      case 'floor':
        return (
          <div>
            <OfficeFloorPlan onRoomSelect={setSelectedRoom} selectedRoom={selectedRoom} />
            
            {/* Selected Room Detail */}
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

            {/* Quick Stats */}
            <StatsBar />
            <SignOffBanner />
            
            {/* Online Agents */}
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
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        notificationCount={9}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">
                {activeView === 'floor' && '🏢 Office Floor'}
                {activeView === 'departments' && '👥 Departments'}
                {activeView === 'chat' && '💬 Team Chat'}
                {activeView === 'meetings' && '📋 Meeting Rooms'}
                {activeView === 'activity' && '📊 Activity'}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {activeView === 'floor' && 'Interactive office layout with live agent positions'}
                {activeView === 'departments' && 'All departments and agent task queues'}
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

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}

          {/* Footer */}
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

// ============ App Content ============

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
