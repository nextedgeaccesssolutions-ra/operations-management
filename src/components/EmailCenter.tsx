import { useState } from 'react';

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  category: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
  aiClassification?: string;
  aiSummary?: string;
  aiSuggestedReply?: string;
}

const mockEmails: Email[] = [
  {
    id: '1',
    from: 'John Santos',
    fromEmail: 'john.santos@ortigascorp.com.ph',
    subject: 'Inquiry: Facade Cleaning Services for Ortigas Office Tower',
    preview: 'Dear NEAS Team, We are interested in your facade cleaning services for our 30-story office building...',
    body: 'Dear NEAS Team,\n\nWe are interested in your facade cleaning services for our 30-story office building located in Ortigas Center. The building requires regular cleaning every quarter.\n\nPlease provide:\n1. Preliminary quotation\n2. Schedule availability\n3. Safety certifications\n4. References from similar projects\n\nLooking forward to your prompt response.\n\nBest regards,\nJohn Santos\nFacilities Manager\nOrtigas Corporation',
    date: '2024-02-08T10:30:00',
    category: 'New Lead',
    priority: 'high',
    read: false,
    starred: true,
    hasAttachment: true,
    aiClassification: 'Sales Lead - Facade Cleaning',
    aiSummary: 'New inquiry from Ortigas Corporation for quarterly facade cleaning of 30-story building. Requesting quotation, schedule, certifications, and references.',
    aiSuggestedReply: 'Thank you for your inquiry. We would be pleased to provide a comprehensive proposal for your facade cleaning requirements. Our team will prepare a detailed quotation including safety certifications and project references within 24 hours.'
  },
  {
    id: '2',
    from: 'Maria Cruz',
    fromEmail: 'maria.cruz@bgctower.com.ph',
    subject: 'Project Update Request - BGC Tower Maintenance',
    preview: 'Hi NEAS Team, Can you provide an update on the ongoing maintenance project at BGC Tower...',
    body: 'Hi NEAS Team,\n\nCan you provide an update on the ongoing maintenance project at BGC Tower? We need to know:\n1. Current progress percentage\n2. Any delays or issues\n3. Expected completion date\n4. Next scheduled activities\n\nPlease respond by EOD.\n\nThanks,\nMaria Cruz\nProject Coordinator\nBGC Tower Management',
    date: '2024-02-08T09:15:00',
    category: 'Active Project',
    priority: 'high',
    read: false,
    starred: false,
    hasAttachment: false,
    aiClassification: 'Project Status Request',
    aiSummary: 'Request for project update on BGC Tower maintenance. Needs progress %, delays, completion date, and next activities by EOD.',
    aiSuggestedReply: 'Good day Maria. The BGC Tower maintenance project is currently at 65% completion. We are on schedule with no delays. Expected completion is February 20, 2024. Next activity: installation of anchor points on floors 25-30.'
  },
  {
    id: '3',
    from: 'Roberto Reyes',
    fromEmail: 'roberto.reyes@supplies.com.ph',
    subject: 'Quotation: PPE Supplies - Q1 2024',
    preview: 'Dear NEAS, Please find attached our quotation for Q1 2024 PPE supplies including harnesses...',
    body: 'Dear NEAS,\n\nPlease find attached our quotation for Q1 2024 PPE supplies including:\n- Full body harnesses (50 units)\n- Helmets (100 units)\n- Safety shoes (75 pairs)\n- Gloves (200 pairs)\n\nDelivery: 5-7 working days\nPayment terms: 30 days\nValidity: 60 days\n\nBest regards,\nRoberto Reyes\nSales Manager\nSafety Supplies Inc.',
    date: '2024-02-07T16:45:00',
    category: 'Procurement',
    priority: 'normal',
    read: true,
    starred: false,
    hasAttachment: true,
    aiClassification: 'Supplier Quotation',
    aiSummary: 'PPE supplier quotation for Q1 2024: harnesses, helmets, shoes, gloves. 30-day payment terms, 60-day validity.',
    aiSuggestedReply: 'Thank you for the quotation. We will review and compare with other suppliers. Will respond within 3 working days.'
  },
  {
    id: '4',
    from: 'Anna Lim',
    fromEmail: 'anna.lim@cebuport.com.ph',
    subject: 'URGENT: Safety Incident Report - Cebu Project',
    preview: 'NEAS Team, We need to report a safety incident that occurred at the Cebu port project site today...',
    body: 'NEAS Team,\n\nWe need to report a safety incident that occurred at the Cebu port project site today at 14:30.\n\nIncident Details:\n- Type: Minor injury\n- Personnel: Juan Dela Cruz (Rigger)\n- Description: Slip on wet surface, minor ankle sprain\n- Action taken: First aid administered, sent to clinic\n- Status: Employee cleared to return to work tomorrow\n\nPlease provide:\n1. Incident report form\n2. Corrective action plan\n3. Updated risk assessment\n\nThis requires immediate attention.\n\nRegards,\nAnna Lim\nSafety Officer\nCebu Port Authority',
    date: '2024-02-08T14:35:00',
    category: 'Safety Incident',
    priority: 'urgent',
    read: false,
    starred: true,
    hasAttachment: false,
    aiClassification: 'Safety Incident Report',
    aiSummary: 'URGENT: Minor safety incident at Cebu port project. Employee slipped, minor ankle sprain. Requires incident report, corrective action plan, and updated risk assessment.',
    aiSuggestedReply: 'We acknowledge receipt of the incident report. Our HSE team will prepare the required documentation within 24 hours. Corrective actions include improved surface drainage and additional signage. We will submit the complete report by tomorrow EOD.'
  },
  {
    id: '5',
    from: 'Finance Department',
    fromEmail: 'finance@neas.com.ph',
    subject: 'Invoice #2024-0156 - Payment Reminder',
    preview: 'This is a reminder that Invoice #2024-0156 for ₱450,000 is now 15 days overdue...',
    body: 'Dear Client,\n\nThis is a reminder that Invoice #2024-0156 for ₱450,000 is now 15 days overdue.\n\nInvoice Details:\n- Invoice #: 2024-0156\n- Amount: ₱450,000\n- Due Date: January 24, 2024\n- Days Overdue: 15\n- Project: Makati Office Facade Maintenance\n\nPlease arrange payment at your earliest convenience.\n\nIf you have already sent payment, please disregard this notice.\n\nBest regards,\nNEAS Finance Department',
    date: '2024-02-08T08:00:00',
    category: 'Billing',
    priority: 'high',
    read: true,
    starred: false,
    hasAttachment: true,
    aiClassification: 'Payment Reminder - Outgoing',
    aiSummary: 'Payment reminder for overdue invoice #2024-0156 (₱450,000) - 15 days overdue for Makati Office project.',
    aiSuggestedReply: 'N/A - This is an outgoing payment reminder'
  }
];

export default function EmailCenter() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);

  const categories = ['all', 'New Lead', 'Active Project', 'Procurement', 'Safety Incident', 'Billing'];

  const filteredEmails = mockEmails.filter(email => {
    if (filterCategory !== 'all' && email.category !== filterCategory) return false;
    if (searchQuery && !email.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !email.from.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unreadCount = mockEmails.filter(e => !e.read).length;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="glass-card rounded-xl p-4 border border-[#CA9332]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="text-xl">📧</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gmail Integration</h3>
              <p className="text-[10px] text-slate-400">company.info.nextedgeaccesssolutions@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Last Sync</p>
              <p className="text-[10px] text-green-400">2 minutes ago</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-xs font-medium hover:bg-[#CA9332]/30 transition-all">
              Sync Now
            </button>
          </div>
        </div>
      </div>

      {/* Email Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{mockEmails.length}</p>
          <p className="text-xs text-slate-400">Total Emails</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">{unreadCount}</p>
          <p className="text-xs text-slate-400">Unread</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">{mockEmails.filter(e => e.category === 'New Lead').length}</p>
          <p className="text-xs text-slate-400">New Leads</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-red-400">{mockEmails.filter(e => e.priority === 'urgent').length}</p>
          <p className="text-xs text-slate-400">Urgent</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">{mockEmails.filter(e => e.hasAttachment).length}</p>
          <p className="text-xs text-slate-400">With Attachments</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Email List and Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <div className="lg:col-span-1 glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Inbox ({filteredEmails.length})</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredEmails.map(email => (
              <div
                key={email.id}
                onClick={() => {
                  setSelectedEmail(email);
                  setShowAIPanel(false);
                }}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedEmail?.id === email.id
                    ? 'bg-[#CA9332]/10 border border-[#CA9332]/30'
                    : 'bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/30'
                } ${!email.read ? 'border-l-2 border-l-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1">
                    {email.starred && <span className="text-amber-400 text-xs">★</span>}
                    <span className="text-xs font-semibold text-white truncate">{email.from}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">
                    {new Date(email.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-white font-medium mb-1 truncate">{email.subject}</p>
                <p className="text-[10px] text-slate-400 line-clamp-2">{email.preview}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${
                    email.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                    email.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-700/50 text-slate-400'
                  }`}>
                    {email.priority}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-700/50 text-[9px] text-slate-400">
                    {email.category}
                  </span>
                  {email.hasAttachment && <span className="text-[10px] text-slate-500">📎</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Detail */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          {selectedEmail ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-bold text-white">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAIPanel(!showAIPanel)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        showAIPanel
                          ? 'bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30'
                          : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      🤖 AI Analysis
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-medium text-white">{selectedEmail.from}</span>
                  <span>&lt;{selectedEmail.fromEmail}&gt;</span>
                  <span>•</span>
                  <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                </div>
              </div>

              {/* AI Analysis Panel */}
              {showAIPanel && (
                <div className="p-4 rounded-lg bg-[#CA9332]/5 border border-[#CA9332]/20 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#EBC07E] mb-1">🤖 AI Classification</h4>
                    <p className="text-xs text-white">{selectedEmail.aiClassification}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#EBC07E] mb-1">📋 AI Summary</h4>
                    <p className="text-xs text-slate-300">{selectedEmail.aiSummary}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#EBC07E] mb-1">💡 Suggested Reply</h4>
                    <p className="text-xs text-slate-300 italic">{selectedEmail.aiSuggestedReply}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all">
                        ✓ Use This Reply
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                        ✏️ Edit Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Body */}
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans">{selectedEmail.body}</pre>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-700/30">
                <button className="px-3 py-1.5 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-xs font-medium hover:bg-[#CA9332]/30 transition-all">
                  ↩ Reply
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                  → Forward
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                  📋 Create Task
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                  📁 Archive
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📧</div>
                <h3 className="text-lg font-bold text-white mb-2">Select an Email</h3>
                <p className="text-xs text-slate-400">Choose an email from the inbox to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
