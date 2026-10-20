import { useState, useEffect } from 'react';
import GmailService, { GmailEmail } from '../services/gmailService';
import { orchestrationEngine } from '../neas/orchestrationEngine';
import { formatDate, formatTime } from '../utils/dateFormatter';

export default function EmailCenter() {
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gmailAccount, setGmailAccount] = useState<any>(null);
  const [gmailHealth, setGmailHealth] = useState<any>(null);

  const categories = ['all', 'lead', 'project', 'quotation', 'procurement', 'safety', 'finance', 'complaint', 'spam', 'unclassified'];

  // Load Gmail account and sync emails
  useEffect(() => {
    loadGmailData();
    const interval = setInterval(loadGmailData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadGmailData = async () => {
    try {
      const account = GmailService.getCurrentAccount();
      const health = await GmailService.checkConnectionHealth();
      const gmailEmails = GmailService.getEmails();
      
      setGmailAccount(account);
      setGmailHealth(health);
      setEmails(gmailEmails);
    } catch (err) {
      console.error('[EmailCenter] Failed to load Gmail ', err);
    }
  };

  const handleSyncEmails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await GmailService.syncEmails(50);
      await loadGmailData();
      
      orchestrationEngine.addAuditLog(
        'user',
        'CEO',
        'emails_synced',
        'integration',
        'gmail',
        'Email sync completed',
        'info'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      console.error('[EmailCenter] Sync failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = (emailId: string) => {
    // In a real implementation, this would call Gmail API to mark as read
    // For now, just update local state
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isUnread: false } : e));
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(prev => prev ? { ...prev, isUnread: false } : null);
    }
    
    orchestrationEngine.addAuditLog(
      'user',
      'CEO',
      'email_marked_read',
      'email',
      emailId,
      'Email marked as read',
      'info'
    );
  };

  const handleToggleStar = (emailId: string) => {
    // In a real implementation, this would call Gmail API to toggle star
    // For now, just update local state
    const email = emails.find(e => e.id === emailId);
    if (email) {
      const newLabels = email.labels.includes('STARRED') 
        ? email.labels.filter(l => l !== 'STARRED')
        : [...email.labels, 'STARRED'];
      
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, labels: newLabels } : e));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, labels: newLabels } : null);
      }
    }
  };

  const filteredEmails = emails.filter(email => {
    if (filterCategory !== 'all' && email.category !== filterCategory) return false;
    if (searchQuery && !email.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !email.from.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unreadCount = emails.filter(e => e.isUnread).length;

  // If no account is authorized, show authorization prompt
  if (!gmailAccount) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-white mb-2">Gmail Authorization Required</h2>
          <p className="text-sm text-slate-400 mb-6">
            Email Center requires OAuth 2.0 authorization for info.nextedgeaccesssolutions@gmail.com.
            Please authorize your Gmail account to view and manage emails.
          </p>
          <button
            onClick={() => window.location.hash = '#/gmail-migration'}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-sm font-medium hover:opacity-90 transition-all"
            aria-label="Go to Gmail authorization"
          >
            🔐 Authorize Gmail Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
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

      {/* Connection Status */}
      <div className="glass-card rounded-xl p-4 border border-[#CA9332]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="text-xl">📧</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gmail Integration</h3>
              <p className="text-[10px] text-slate-400">{gmailAccount?.email || 'Not authorized'}</p>
              {gmailHealth && (
                <p className="text-[9px] text-slate-500 mt-1">
                  Status: <span className={gmailHealth.status === 'healthy' ? 'text-green-400' : 'text-amber-400'}>
                    {gmailHealth.status}
                  </span> • Latency: {gmailHealth.responseTime || 'N/A'}ms • Last checked: {formatTime(gmailHealth.lastCheck)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Last Sync</p>
              <p className="text-[10px] text-green-400">
                {gmailAccount?.lastSyncAt ? formatTime(gmailAccount.lastSyncAt) : 'Never'}
              </p>
            </div>
            <button 
              onClick={handleSyncEmails}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-xs font-medium hover:bg-[#CA9332]/30 transition-all disabled:opacity-50"
              aria-label="Sync emails from Gmail"
            >
              {isLoading ? '⏳ Syncing...' : '🔄 Sync Now'}
            </button>
          </div>
        </div>
        
        {/* Data Source Attribution */}
        <div className="mt-3 pt-3 border-t border-slate-700/30">
          <p className="text-[10px] text-slate-500">
            Showing {emails.length} emails from authorized Gmail account
            {gmailAccount?.connectionState !== 'healthy' && (
              <span className="ml-2 text-amber-400">• Connection: {gmailAccount?.connectionState}</span>
            )}
          </p>
        </div>
      </div>

      {/* Email Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{emails.length}</p>
          <p className="text-xs text-slate-400">Total Emails</p>
          <p className="text-[9px] text-slate-500 mt-1">Source: Gmail • Status: Actual</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">{unreadCount}</p>
          <p className="text-xs text-slate-400">Unread</p>
          <p className="text-[9px] text-slate-500 mt-1">Status: Actual</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">{emails.filter(e => e.category === 'lead').length}</p>
          <p className="text-xs text-slate-400">New Leads</p>
          <p className="text-[9px] text-slate-500 mt-1">Classified by AI</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-red-400">{emails.filter(e => e.category === 'safety' || e.labels.includes('IMPORTANT')).length}</p>
          <p className="text-xs text-slate-400">Urgent</p>
          <p className="text-[9px] text-slate-500 mt-1">Requires attention</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">{emails.filter(e => e.hasAttachment).length}</p>
          <p className="text-xs text-slate-400">With Attachments</p>
          <p className="text-[9px] text-slate-500 mt-1">Safe preview only</p>
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
            className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50"
            aria-label="Search emails by subject or sender"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            aria-label="Filter emails by category"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Email List and Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <div className="lg:col-span-1 glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Inbox ({filteredEmails.length})</h3>
          {filteredEmails.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">No emails found</p>
              <p className="text-xs mt-1">Try adjusting your search or filter, or sync emails from Gmail</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredEmails.map(email => (
                <div
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    setShowAIPanel(false);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    selectedEmail?.id === email.id
                      ? 'bg-[#CA9332]/10 border border-[#CA9332]/30'
                      : 'bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/30'
                  } ${email.isUnread ? 'border-l-2 border-l-blue-500' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Email from ${email.from}: ${email.subject}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedEmail(email);
                      setShowAIPanel(false);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1">
                      {email.labels.includes('STARRED') && <span className="text-amber-400 text-xs">★</span>}
                      <span className="text-xs font-semibold text-white truncate">{email.from}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <p className={`text-xs mb-1 ${email.isUnread ? 'text-white font-medium' : 'text-slate-300'}`}>
                    {email.subject}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{email.snippet}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${
                      email.category === 'lead' ? 'bg-green-500/20 text-green-400' :
                      email.category === 'project' ? 'bg-blue-500/20 text-blue-400' :
                      email.category === 'quotation' ? 'bg-purple-500/20 text-purple-400' :
                      email.category === 'safety' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-700/50 text-slate-400'
                    }`}>
                      {email.category}
                    </span>
                    {email.hasAttachment && <span className="text-[10px] text-slate-500">📎</span>}
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold border border-blue-500/30">
                      GMAIL
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStar(email.id);
                        }}
                        className="text-xs hover:text-amber-400 transition-colors"
                        aria-label={email.labels.includes('STARRED') ? 'Unstar email' : 'Star email'}
                      >
                        {email.labels.includes('STARRED') ? '★' : '☆'}
                      </button>
                      {email.isUnread && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(email.id);
                          }}
                          className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                          aria-label="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Detail */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          {selectedEmail ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-2">{selectedEmail.subject}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>From: <span className="text-slate-200">{selectedEmail.from}</span></span>
                  <span className="text-slate-600">&lt;{selectedEmail.fromEmail}&gt;</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                  <span>{formatDate(selectedEmail.date)}</span>
                  <span>•</span>
                  <span>{selectedEmail.labels.join(', ')}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedEmail.body}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                  selectedEmail.category === 'lead' ? 'bg-green-500/20 text-green-400' :
                  selectedEmail.category === 'project' ? 'bg-blue-500/20 text-blue-400' :
                  selectedEmail.category === 'quotation' ? 'bg-purple-500/20 text-purple-400' :
                  selectedEmail.category === 'safety' ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-700/50 text-slate-400'
                }`}>
                  {selectedEmail.category}
                </span>
                {selectedEmail.hasAttachment && (
                  <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-medium">
                    📎 {selectedEmail.attachments.length} attachment(s)
                  </span>
                )}
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                  GMAIL
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className="px-3 py-1.5 rounded-lg text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors font-medium"
                  aria-label="Generate AI reply"
                >
                  🤖 Generate AI Reply
                </button>
                <button
                  onClick={() => handleMarkAsRead(selectedEmail.id)}
                  className="px-3 py-1.5 rounded-lg text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors font-medium"
                  aria-label="Mark as read"
                >
                  ✓ Mark Read
                </button>
                <button
                  onClick={() => handleToggleStar(selectedEmail.id)}
                  className="px-3 py-1.5 rounded-lg text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors font-medium"
                  aria-label={selectedEmail.labels.includes('STARRED') ? 'Unstar email' : 'Star email'}
                >
                  {selectedEmail.labels.includes('STARRED') ? '★ Unstar' : '☆ Star'}
                </button>
                {gmailAccount && (
                  <button
                    onClick={handleSyncEmails}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-lg text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors font-medium disabled:opacity-50"
                    aria-label="Refresh emails from Gmail"
                  >
                    🔄 Refresh
                  </button>
                )}
              </div>

              {showAIPanel && selectedEmail.aiAnalysis && (
                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                  <p className="text-[10px] text-green-400 font-medium mb-2">🤖 AI Analysis:</p>
                  <p className="text-xs text-slate-300 mb-2"><strong>Summary:</strong> {selectedEmail.aiAnalysis.summary}</p>
                  <p className="text-xs text-slate-300 mb-2"><strong>Sentiment:</strong> {selectedEmail.aiAnalysis.sentiment}</p>
                  {selectedEmail.aiAnalysis.actionRequired && (
                    <p className="text-xs text-amber-400 mb-2"><strong>⚠️ Action Required</strong></p>
                  )}
                  {selectedEmail.aiAnalysis.suggestedReply && (
                    <>
                      <p className="text-[10px] text-green-400 font-medium mb-1 mt-3">💡 Suggested Reply:</p>
                      <p className="text-xs text-slate-300 italic">"{selectedEmail.aiAnalysis.suggestedReply}"</p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => {
                            // In a real implementation, this would create a draft reply
                            orchestrationEngine.addAuditLog(
                              'user',
                              'CEO',
                              'draft_reply_created',
                              'email',
                              selectedEmail.id,
                              `Draft reply created for email from ${selectedEmail.from}`,
                              'info'
                            );
                            alert('Draft reply created. In production, this would open a draft email composer.');
                          }}
                          className="px-3 py-1.5 rounded-lg text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-colors font-medium"
                          aria-label="Use suggested reply"
                        >
                          ✓ Use This Reply
                        </button>
                        <button
                          onClick={() => setShowAIPanel(false)}
                          className="px-3 py-1.5 rounded-lg text-[10px] bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:bg-slate-700/50 transition-colors font-medium"
                          aria-label="Cancel"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <span className="text-5xl mb-4">📧</span>
              <p className="text-sm text-slate-400 mb-2">Select an email to view</p>
              <p className="text-[10px] text-slate-600">
                {emails.length === 0 
                  ? 'No emails available. Click "Sync Now" to fetch emails from Gmail.'
                  : `Showing ${emails.length} emails from authorized Gmail account`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
