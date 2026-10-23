import { useState, useEffect } from 'react';
import { orchestrationEngine } from '../neas/orchestrationEngine';
import { agents, getAgentById } from '../neas/agentRegistry';
import PersistenceService from '../services/persistenceService';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  taskCreated?: string;
  agentAssigned?: string;
  requiresApproval?: boolean;
}

interface CommandSuggestion {
  text: string;
  icon: string;
  category: string;
}

const commandSuggestions: CommandSuggestion[] = [
  { text: 'Summarize all important company emails', icon: '📧', category: 'Email' },
  { text: 'Identify new clients and prepare follow-up drafts', icon: '🎯', category: 'Sales' },
  { text: 'Show all active projects and overdue tasks', icon: '🏗️', category: 'Projects' },
  { text: 'Prepare a quotation based on approved BOQ', icon: '📄', category: 'Estimating' },
  { text: 'Calculate project cost, markup, and gross margin', icon: '💰', category: 'Finance' },
  { text: 'Prepare tomorrow\'s manpower deployment', icon: '👷', category: 'Operations' },
  { text: 'Generate this week\'s management report', icon: '📊', category: 'Reporting' },
  { text: 'Identify risks requiring my attention', icon: '⚠️', category: 'Risk' },
];

export default function AIExecutiveAssistant() {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from localStorage
    const saved = PersistenceService.loadModuleData<Message[]>('assistantMessages', []);
    if (saved.length > 0) {
      return saved;
    }
    return [
      {
        id: '1',
        role: 'system',
        content: 'Welcome to NEAS AI Executive Assistant. I can help you manage the company, analyze data, prepare reports, and coordinate with AI agents. What would you like me to do?',
        timestamp: new Date()
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Save messages to localStorage when they change
  useEffect(() => {
    PersistenceService.saveModuleData('assistantMessages', messages);
  }, [messages]);

  const categories = ['all', 'Email', 'Sales', 'Projects', 'Estimating', 'Finance', 'Operations', 'Reporting', 'Risk'];

  const filteredSuggestions = selectedCategory === 'all' 
    ? commandSuggestions 
    : commandSuggestions.filter(s => s.category === selectedCategory);

  const processCommand = async (command: string) => {
    setIsProcessing(true);
    setError(null);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: command,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Analyze command and route to appropriate agent
      let response: Message;
      let taskCreated = false;
      let agentAssigned: string | undefined;
      let requiresApproval = false;

      const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('email') || lowerCommand.includes('summarize')) {
      // Route to CEO agent for email analysis
      const task = orchestrationEngine.createTask({
        title: 'Email Summary Request',
        description: command,
        assignedAgentId: 'ceo-agent',
        createdBy: 'CEO',
        department: 'executive',
        priority: 'high',
        status: 'queued',
        approvalLevel: 1,
        progress: 0,
        dueDate: new Date(Date.now() + 3600000).toISOString().split('T')[0],
        tags: ['email', 'summary', 'ceo-request']
      });
      
      taskCreated = true;
      agentAssigned = 'ARIA';
      
      response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've assigned ARIA (CEO Agent) to analyze and summarize all important company emails. This task has been queued and will be processed shortly.\n\n**Task Details:**\n- Task ID: ${task.id}\n- Assigned to: ARIA (CEO & Executive Intelligence Agent)\n- Priority: High\n- Estimated completion: 5-10 minutes\n\nARIA will:\n1. Retrieve and categorize recent emails\n2. Identify urgent matters and new leads\n3. Summarize key communications\n4. Flag items requiring your attention\n\nI'll notify you when the summary is ready.`,
        timestamp: new Date(),
        taskCreated: task.id,
        agentAssigned: 'ARIA'
      };
    } else if (lowerCommand.includes('client') || lowerCommand.includes('lead') || lowerCommand.includes('follow-up')) {
      const task = orchestrationEngine.createTask({
        title: 'New Client Identification & Follow-up',
        description: command,
        assignedAgentId: 'sales-agent',
        createdBy: 'CEO',
        department: 'sales',
        priority: 'high',
        status: 'queued',
        approvalLevel: 2,
        progress: 0,
        dueDate: new Date(Date.now() + 7200000).toISOString().split('T')[0],
        tags: ['sales', 'leads', 'follow-up', 'ceo-request']
      });
      
      taskCreated = true;
      agentAssigned = 'MERCURY';
      
      response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've assigned MERCURY (Sales Agent) to identify new clients and prepare follow-up drafts.\n\n**Task Details:**\n- Task ID: ${task.id}\n- Assigned to: MERCURY (Sales & Business Development AI)\n- Priority: High\n- Approval Level: 2 (Internal Execution)\n\nMERCURY will:\n1. Analyze recent inquiries and emails\n2. Identify potential new clients\n3. Check for duplicate contacts\n4. Prepare personalized follow-up drafts\n5. Create CRM records for qualified leads\n\n**Note:** All external communications will require your approval before sending.`,
        timestamp: new Date(),
        taskCreated: task.id,
        agentAssigned: 'MERCURY'
      };
    } else if (lowerCommand.includes('project') || lowerCommand.includes('overdue')) {
      const activeProjects = orchestrationEngine.getTasksByDepartment('operations').filter(t => t.status === 'in_progress');
      const overdueTasks = orchestrationEngine.getAllTasks().filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && t.status !== 'completed';
      });
      
      response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Active Projects:** ${activeProjects.length}\n\n${activeProjects.map(p => {
          const agent = getAgentById(p.assignedAgentId);
          return `• **${p.title}**\n  - Assigned to: ${agent?.name || 'Unknown'}\n  - Progress: ${p.progress}%\n  - Due: ${p.dueDate || 'Not set'}\n  - Status: ${p.status}`;
        }).join('\n\n')}\n\n**Overdue Tasks:** ${overdueTasks.length}\n\n${overdueTasks.length > 0 ? overdueTasks.map(t => {
          const agent = getAgentById(t.assignedAgentId);
          const daysOverdue = Math.floor((Date.now() - new Date(t.dueDate!).getTime()) / 86400000);
          return `• **${t.title}** - ${daysOverdue} days overdue\n  - Assigned to: ${agent?.name || 'Unknown'}\n  - Priority: ${t.priority}`;
        }).join('\n\n') : 'No overdue tasks at this time.'}\n\nWould you like me to:\n1. Send reminders for overdue tasks?\n2. Reassign any tasks?\n3. Generate a detailed project status report?`,
        timestamp: new Date()
      };
    } else if (lowerCommand.includes('quotation') || lowerCommand.includes('boq')) {
      const task = orchestrationEngine.createTask({
        title: 'Quotation Preparation',
        description: command,
        assignedAgentId: 'estimating-agent',
        createdBy: 'CEO',
        department: 'estimating',
        priority: 'high',
        status: 'queued',
        approvalLevel: 3,
        progress: 0,
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        tags: ['quotation', 'boq', 'estimating', 'ceo-request']
      });
      
      taskCreated = true;
      agentAssigned = 'CALCULUS';
      requiresApproval = true;
      
      response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've assigned CALCULUS (Estimating Agent) to prepare the quotation.\n\n**Task Details:**\n- Task ID: ${task.id}\n- Assigned to: CALCULUS (Estimating & Commercial AI)\n- Priority: High\n- **Approval Level: 3 (Human Approval Required)**\n\nCALCULUS will:\n1. Review the approved BOQ\n2. Calculate labor, materials, and equipment costs\n3. Apply overhead, contingency, and profit margins\n4. Generate draft quotation with detailed breakdown\n5. Flag any uncertainties or missing information\n\n**⚠️ Important:** This quotation will require your approval before it can be sent to the client. I'll notify you when it's ready for review.`,
        timestamp: new Date(),
        taskCreated: task.id,
        agentAssigned: 'CALCULUS',
        requiresApproval: true
      };
    } else if (lowerCommand.includes('cost') || lowerCommand.includes('margin') || lowerCommand.includes('cash flow')) {
      const task = orchestrationEngine.createTask({
        title: 'Financial Analysis & Projections',
        description: command,
        assignedAgentId: 'finance-agent',
        createdBy: 'CEO',
        department: 'finance',
        priority: 'high',
        status: 'queued',
        approvalLevel: 1,
        progress: 0,
        dueDate: new Date(Date.now() + 3600000).toISOString().split('T')[0],
        tags: ['finance', 'analysis', 'ceo-request']
      });
      
      taskCreated = true;
      agentAssigned = 'LEDGER';
      
      response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've assigned LEDGER (Finance Agent) to perform the financial analysis.\n\n**Task Details:**\n- Task ID: ${task.id}\n- Assigned to: LEDGER (Finance & Accounting AI)\n- Priority: High\n\nLEDGER will:\n1. Calculate project costs and breakdown\n2. Determine markup and gross margin\n3. Project cash flow based on payment schedules\n4. Identify financial risks and opportunities\n5. Prepare detailed financial report\n\nThe analysis will be ready in approximately 10-15 minutes.`,
        timestamp: new Date(),
        taskCreated: task.id,
        agentAssigned: 'LEDGER'
      };
    } else if (lowerCommand.includes('manpower') || lowerCommand.includes('deployment')) {
      const task = orchestrationEngine.createTask({
        title: 'Manpower Deployment Planning',
        description: command,
        assignedAgentId: 'operations-agent',
        createdBy: 'CEO',
        department: 'operations',
        priority: 'high',
        status: 'queued',
        approvalLevel: 2,
        progress: 0,
        dueDate: new Date(Date.now() + 7200000).toISOString().split('T')[0],
        tags: ['operations', 'manpower', 'deployment', 'ceo-request']
      });
      
      taskCreated = true;
      agentAssigned = 'ATLAS';
      
      response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've assigned ATLAS (Operations Manager) to prepare tomorrow's manpower deployment.\n\n**Task Details:**\n- Task ID: ${task.id}\n- Assigned to: ATLAS (Operations Manager AI)\n- Priority: High\n- Approval Level: 2 (Internal Execution)\n\nATLAS will:\n1. Review all active projects and their requirements\n2. Check employee availability and certifications\n3. Consider travel time and logistics\n4. Optimize crew assignments\n5. Prepare deployment schedule\n6. Flag any certification or capacity issues\n\nThe deployment plan will be ready for your review in approximately 15-20 minutes.`,
        timestamp: new Date(),
        taskCreated: task.id,
        agentAssigned: 'ATLAS'
      };
    } else if (lowerCommand.includes('report') || lowerCommand.includes('management')) {
      const task = orchestrationEngine.createTask({
        title: 'Weekly Management Report',
        description: command,
        assignedAgentId: 'ceo-agent',
        createdBy: 'CEO',
        department: 'executive',
        priority: 'high',
        status: 'queued',
        approvalLevel: 1,
        progress: 0,
        dueDate: new Date(Date.now() + 10800000).toISOString().split('T')[0],
        tags: ['report', 'management', 'weekly', 'ceo-request']
      });
      
      taskCreated = true;
      agentAssigned = 'ARIA';
      
      response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've assigned ARIA (CEO Agent) to generate this week's management report.\n\n**Task Details:**\n- Task ID: ${task.id}\n- Assigned to: ARIA (CEO & Executive Intelligence Agent)\n- Priority: High\n\nARIA will compile:\n1. **Executive Summary** - Key highlights and achievements\n2. **Project Status** - Active projects, progress, issues\n3. **Financial Overview** - Revenue, expenses, cash flow\n4. **Sales Pipeline** - New leads, quotations, conversions\n5. **Operations** - Resource utilization, delays, safety\n6. **HR Updates** - Staffing, certifications, training\n7. **Risk Register** - Identified risks and mitigation\n8. **Next Week Priorities** - Key focus areas\n\nThe comprehensive report will be ready in approximately 20-30 minutes.`,
        timestamp: new Date(),
        taskCreated: task.id,
        agentAssigned: 'ARIA'
      };
    } else if (lowerCommand.includes('risk') || lowerCommand.includes('attention')) {
      const overdueTasks = orchestrationEngine.getAllTasks().filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && t.status !== 'completed';
      });
      
      const pendingApprovals = orchestrationEngine.getPendingApprovals();
      
      const blockedTasks = orchestrationEngine.getTasksByStatus('blocked');
      
      response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Risk Analysis - Items Requiring Your Attention:**\n\n**🔴 Critical Risks:**\n\n1. **Overdue Tasks:** ${overdueTasks.length} tasks past due date\n${overdueTasks.slice(0, 3).map(t => `   • ${t.title} (${t.priority} priority)`).join('\n')}\n\n2. **Pending Approvals:** ${pendingApprovals.length} awaiting your decision\n${pendingApprovals.map(a => `   • ${a.taskTitle} (Level ${a.approvalLevel})`).join('\n')}\n\n3. **Blocked Tasks:** ${blockedTasks.length} tasks cannot proceed\n${blockedTasks.slice(0, 3).map(t => `   • ${t.title}`).join('\n')}\n\n**🟡 Medium Risks:**\n\n4. **Certification Expiries:** Check HR for upcoming expirations\n5. **Budget Variances:** Review Finance for projects over budget\n6. **Safety Incidents:** Review HSE for recent incidents\n\n**Recommended Actions:**\n1. Review and approve pending approvals\n2. Address overdue tasks - reassign or extend deadlines\n3. Unblock tasks - resolve dependencies or provide resources\n4. Schedule risk review meeting with department heads\n\nWould you like me to:\n- Create tasks to address these risks?\n- Send reminders to responsible agents?\n- Prepare a detailed risk mitigation plan?`,
        timestamp: new Date()
      };
    } else {
      response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you'd like me to: "${command}"\n\nI can help you with:\n- **Email Management:** Summarize, classify, and draft responses\n- **Sales & CRM:** Identify leads, prepare proposals, track pipeline\n- **Project Management:** Monitor progress, allocate resources, track issues\n- **Financial Analysis:** Calculate costs, margins, cash flow projections\n- **Operations:** Plan deployments, schedule work, track equipment\n- **Reporting:** Generate management reports and analytics\n- **Risk Management:** Identify issues, prepare mitigation plans\n\nCould you please be more specific about what you'd like me to do? Or try one of the suggested commands below.`,
        timestamp: new Date()
      };
    }

    setMessages(prev => [...prev, response]);
    setIsProcessing(false);
    } catch (error) {
      console.error('[AIExecutiveAssistant] Command processing failed:', error);
      setError('Failed to process command. Please try again.');
      setIsProcessing(false);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: '⚠️ Sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    processCommand(input.trim());
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    processCommand(suggestion);
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
      setMessages([
        {
          id: '1',
          role: 'system',
          content: 'Welcome to NEAS AI Executive Assistant. I can help you manage the company, analyze data, prepare reports, and coordinate with AI agents. What would you like me to do?',
          timestamp: new Date()
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CA9332] to-[#EBC07E] flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Executive Assistant</h2>
              <p className="text-xs text-slate-400">Conversational command interface for CEO</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="px-3 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
              aria-label="Clear chat history"
            >
              Clear Chat
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-green-400 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 glass-card rounded-xl p-6 overflow-y-auto mb-4">
        <div className="space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-[#CA9332]/20 border border-[#CA9332]/30' 
                  : message.role === 'system'
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : 'bg-slate-800/50 border border-slate-700/30'
              } rounded-xl p-4`}>
                {message.role === 'assistant' && message.agentAssigned && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getAgentById(agents.find(a => a.name === message.agentAssigned)?.id || '')?.avatar}</span>
                    <span className="text-xs text-[#EBC07E] font-medium">via {message.agentAssigned}</span>
                  </div>
                )}
                <div className="text-xs text-white whitespace-pre-wrap">{message.content}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.taskCreated && (
                    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px] font-medium">
                      Task Created: {message.taskCreated}
                    </span>
                  )}
                  {message.requiresApproval && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-medium">
                      Requires Approval
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#CA9332] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#CA9332] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#CA9332] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-400">Processing your request...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Command Suggestions */}
      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-slate-400">Quick Commands:</span>
          <div className="flex gap-1 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30'
                    : 'bg-slate-800/30 text-slate-400 hover:bg-slate-800/50'
                }`}
                aria-label={`Filter by ${cat === 'all' ? 'all categories' : cat}`}
                aria-pressed={selectedCategory === cat}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.length === 0 ? (
            <p className="text-xs text-slate-500">No suggestions available for this category.</p>
          ) : (
            filteredSuggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion.text)}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/30 text-xs text-slate-300 hover:bg-slate-800/50 hover:border-[#CA9332]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Execute command: ${suggestion.text}`}
              >
                <span className="mr-1" aria-hidden="true">{suggestion.icon}</span>
                {suggestion.text}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your command or question..."
            disabled={isProcessing}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50 disabled:opacity-50"
            aria-label="Command input"
            aria-describedby="command-help"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isProcessing ? 'Processing command' : 'Send command'}
          >
            {isProcessing ? 'Processing...' : 'Send'}
          </button>
        </div>
        <p id="command-help" className="sr-only">
          Type a command to interact with the AI Executive Assistant. Commands are processed and routed to appropriate AI agents.
        </p>
      </form>
    </div>
  );
}
