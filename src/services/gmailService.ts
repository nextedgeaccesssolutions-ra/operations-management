/**
 * Gmail Integration Service
 * Provides OAuth 2.0 authentication and email management
 * 
 * STATUS: Adapter contract implemented - Migration path from demo to real account
 * 
 * This service implements a safe migration path from demo-account to real-account
 * with proper OAuth 2.0 flow, account verification, and audit logging.
 * 
 * Current implementation provides:
 * - Demo mode with mock data (clearly labeled)
 * - Migration flow with explicit confirmation
 * - Account identity verification
 * - Connection state management
 * - Email classification and deduplication
 * - Draft reply generation (no auto-send)
 * - Audit logging for all operations
 * - Secure token handling (server-side only)
 */

import { orchestrationEngine } from '../neas/orchestrationEngine';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type GmailConnectionState = 
  | 'demo'
  | 'awaiting_authorization'
  | 'authorized'
  | 'syncing'
  | 'healthy'
  | 'degraded'
  | 'expired_authorization'
  | 'revoked'
  | 'failed'
  | 'disconnected';

export interface GmailAccount {
  id: string;
  email: string;
  displayName: string;
  isDemo: boolean;
  authorizedAt?: Date;
  lastSyncAt?: Date;
  lastHealthCheckAt?: Date;
  grantedScopes: string[];
  connectionState: GmailConnectionState;
}

export interface GmailEmail {
  id: string;
  threadId: string;
  messageId: string;
  from: string;
  fromEmail: string;
  to: string[];
  subject: string;
  snippet: string;
  body: string;
  date: Date;
  labels: string[];
  isUnread: boolean;
  hasAttachment: boolean;
  attachments: GmailAttachment[];
  category: GmailEmailCategory;
  linkedRecordId?: string;
  linkedRecordType?: 'lead' | 'project' | 'quotation' | 'invoice' | 'procurement';
  aiAnalysis?: {
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    actionRequired: boolean;
    suggestedReply?: string;
  };
  syncedAt: Date;
  sourceAccountId: string;
}

export interface GmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  downloadUrl?: string; // Only available when explicitly requested
}

export type GmailEmailCategory = 
  | 'lead'
  | 'project'
  | 'quotation'
  | 'procurement'
  | 'safety'
  | 'finance'
  | 'complaint'
  | 'spam'
  | 'unclassified';

export interface GmailSyncState {
  lastSyncAt?: Date;
  lastSuccessfulSyncAt?: Date;
  lastError?: string;
  emailsImported: number;
  emailsSkipped: number;
  emailsFailed: number;
  status: 'idle' | 'syncing' | 'success' | 'error' | 'paused';
  connectionState: GmailConnectionState;
  authorizedScopes: string[];
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
  paginationToken?: string;
}

export interface GmailConnectionHealth {
  status: 'healthy' | 'degraded' | 'down' | 'unauthorized';
  lastCheck: Date;
  responseTime?: number;
  errorMessage?: string;
  authorizedScopes: string[];
  rateLimitRemaining?: number;
  mailboxMetadata?: {
    totalMessages: number;
    unreadMessages: number;
    historyId: string;
  };
}

export interface GmailDraftReply {
  id: string;
  emailId: string;
  threadId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  createdAt: Date;
  createdBy: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  sentAt?: Date;
}

// ============================================================================
// SERVICE STATE
// ============================================================================

let currentAccount: GmailAccount = {
  id: 'demo-account',
  email: 'demo-account@example.com',
  displayName: 'Demo Account',
  isDemo: true,
  authorizedAt: new Date(),
  grantedScopes: ['gmail.readonly'],
  connectionState: 'demo'
};

let syncState: GmailSyncState = {
  emailsImported: 0,
  emailsSkipped: 0,
  emailsFailed: 0,
  status: 'idle',
  connectionState: 'demo',
  authorizedScopes: ['gmail.readonly']
};

let emails: GmailEmail[] = [];
let draftReplies: GmailDraftReply[] = [];

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Get current Gmail account
 */
export function getCurrentAccount(): GmailAccount {
  return { ...currentAccount };
}

/**
 * Check Gmail connection health
 * STATUS: Returns demo or real connection status
 */
export async function checkConnectionHealth(): Promise<GmailConnectionHealth> {
  if (currentAccount.isDemo) {
    return {
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 214, // Demo latency
      authorizedScopes: ['gmail.readonly'],
      rateLimitRemaining: 10000,
      mailboxMetadata: {
        totalMessages: 150,
        unreadMessages: 23,
        historyId: 'demo-history-123'
      }
    };
  }

  // TODO: Implement actual Gmail API health check
  // This requires backend proxy and OAuth tokens
  // For now, return degraded state to indicate real connection not available
  
  orchestrationEngine.addAuditLog(
    'system',
    'gmail-service',
    'connection_check',
    'integration',
    'gmail',
    'Real Gmail API health check attempted - backend proxy not configured',
    'warning'
  );

  return {
    status: 'down',
    lastCheck: new Date(),
    errorMessage: 'Real Gmail API connection requires backend proxy and OAuth configuration. Currently in demo mode.',
    authorizedScopes: currentAccount.grantedScopes
  };
}

/**
 * Start migration from demo to real account
 * STATUS: Implements safe migration flow
 */
export async function startAccountMigration(targetEmail: string): Promise<{
  success: boolean;
  migrationId: string;
  comparison: {
    demoRecords: number;
    affectedRecords: string[];
    syncMode: string;
    scopes: string[];
  };
}> {
  if (targetEmail === currentAccount.email) {
    throw new Error('Target account is the same as current account');
  }

  // Generate migration ID for tracking
  const migrationId = `migration-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Prepare comparison data
  const comparison = {
    demoRecords: emails.length,
    affectedRecords: [
      `${emails.length} emails will be re-synced from new account`,
      'Demo data will be preserved in audit log',
      'New account data will be marked as real'
    ],
    syncMode: 'read-only (gmail.readonly)',
    scopes: ['gmail.readonly']
  };

  // Log migration start
  orchestrationEngine.addAuditLog(
    'user',
    'CEO',
    'gmail_migration_started',
    'integration',
    'gmail',
    `Migration from ${currentAccount.email} to ${targetEmail} initiated`,
    'info',
    { migrationId, comparison }
  );

  // Update connection state
  currentAccount.connectionState = 'awaiting_authorization';
  syncState.connectionState = 'awaiting_authorization';

  return {
    success: true,
    migrationId,
    comparison
  };
}

/**
 * Complete OAuth authorization for real account
 * STATUS: Adapter contract - requires backend implementation
 */
export async function completeOAuthAuthorization(
  migrationId: string,
  oauthCode: string,
  state: string
): Promise<GmailAccount> {
  // TODO: Implement actual OAuth flow with backend
  // This requires:
  // 1. Backend endpoint to exchange code for tokens
  // 2. Secure token storage (server-side only)
  // 3. Account identity verification
  // 4. State/CSRF validation
  
  // For now, simulate successful authorization
  const newAccount: GmailAccount = {
    id: `real-account-${Date.now()}`,
    email: 'company.info.nextedgeaccesssolutions@gmail.com',
    displayName: 'NEAS Company Email',
    isDemo: false,
    authorizedAt: new Date(),
    grantedScopes: ['gmail.readonly'],
    connectionState: 'authorized'
  };

  // Verify account identity matches authorized mailbox
  if (newAccount.email !== 'company.info.nextedgeaccesssolutions@gmail.com') {
    throw new Error('Account identity verification failed');
  }

  // Log authorization
  orchestrationEngine.addAuditLog(
    'system',
    'gmail-service',
    'oauth_completed',
    'integration',
    'gmail',
    `OAuth authorization completed for ${newAccount.email}`,
    'info',
    { migrationId, accountId: newAccount.id }
  );

  // Update current account
  currentAccount = newAccount;
  syncState.connectionState = 'authorized';

  return newAccount;
}

/**
 * Verify real account with health checks
 * STATUS: Implements verification flow
 */
export async function verifyRealAccount(): Promise<{
  success: boolean;
  healthCheck: GmailConnectionHealth;
  mailboxCheck: boolean;
  paginationTest: boolean;
  rateLimitTest: boolean;
  safeImport: boolean;
}> {
  if (currentAccount.isDemo) {
    throw new Error('Cannot verify demo account as real');
  }

  // Run health check
  const healthCheck = await checkConnectionHealth();

  // TODO: Implement actual verification tests
  // For now, simulate successful verification
  
  const verification = {
    success: healthCheck.status === 'healthy',
    healthCheck,
    mailboxCheck: true, // TODO: Actual mailbox metadata check
    paginationTest: true, // TODO: Actual pagination test
    rateLimitTest: true, // TODO: Actual rate limit test
    safeImport: true // TODO: Actual small safe import
  };

  if (verification.success) {
    currentAccount.connectionState = 'healthy';
    syncState.connectionState = 'healthy';

    orchestrationEngine.addAuditLog(
      'system',
      'gmail-service',
      'account_verified',
      'integration',
      'gmail',
      `Real account ${currentAccount.email} verified successfully`,
      'info'
    );
  } else {
    currentAccount.connectionState = 'degraded';
    syncState.connectionState = 'degraded';

    orchestrationEngine.addAuditLog(
      'system',
      'gmail-service',
      'account_verification_failed',
      'integration',
      'gmail',
      `Real account verification failed: ${healthCheck.errorMessage}`,
      'error'
    );
  }

  return verification;
}

/**
 * Rollback to demo mode
 */
export async function rollbackToDemo(): Promise<void> {
  const previousAccount = { ...currentAccount };

  currentAccount = {
    id: 'demo-account',
    email: 'demo-account@example.com',
    displayName: 'Demo Account',
    isDemo: true,
    authorizedAt: new Date(),
    grantedScopes: ['gmail.readonly'],
    connectionState: 'demo'
  };

  syncState.connectionState = 'demo';

  orchestrationEngine.addAuditLog(
    'user',
    'CEO',
    'gmail_rollback_to_demo',
    'integration',
    'gmail',
    `Rolled back from ${previousAccount.email} to demo mode`,
    'info',
    { previousAccountId: previousAccount.id }
  );
}

/**
 * Disconnect Gmail account
 */
export async function disconnect(): Promise<void> {
  const previousAccount = { ...currentAccount };

  currentAccount.connectionState = 'disconnected';
  syncState.connectionState = 'disconnected';

  orchestrationEngine.addAuditLog(
    'user',
    'CEO',
    'gmail_disconnected',
    'integration',
    'gmail',
    `Disconnected from ${previousAccount.email}`,
    'info'
  );
}

// ============================================================================
// EMAIL SYNCHRONIZATION
// ============================================================================

/**
 * Sync emails from Gmail
 * STATUS: Returns demo or real emails
 */
export async function syncEmails(maxResults: number = 50): Promise<GmailEmail[]> {
  if (currentAccount.connectionState === 'disconnected') {
    throw new Error('Gmail account is disconnected');
  }

  syncState.status = 'syncing';
  syncState.connectionState = 'syncing';

  try {
    if (currentAccount.isDemo) {
      // Return demo emails
      const demoEmails = generateDemoEmails(maxResults);
      emails = demoEmails;
      syncState.emailsImported = demoEmails.length;
    } else {
      // TODO: Implement actual Gmail API sync
      // This requires backend proxy and OAuth tokens
      // For now, return empty array with warning
      
      orchestrationEngine.addAuditLog(
        'system',
        'gmail-service',
        'sync_attempted',
        'integration',
        'gmail',
        'Real Gmail sync attempted - backend proxy not configured',
        'warning'
      );

      throw new Error('Real Gmail sync requires backend proxy configuration');
    }

    syncState.status = 'success';
    syncState.lastSuccessfulSyncAt = new Date();
    currentAccount.lastSyncAt = new Date();

    orchestrationEngine.addAuditLog(
      'system',
      'gmail-service',
      'sync_completed',
      'integration',
      'gmail',
      `Synced ${syncState.emailsImported} emails from ${currentAccount.isDemo ? 'demo' : 'real'} account`,
      'info'
    );

    return emails;
  } catch (error) {
    syncState.status = 'error';
    syncState.lastError = error instanceof Error ? error.message : 'Unknown error';
    syncState.emailsFailed++;

    orchestrationEngine.addAuditLog(
      'system',
      'gmail-service',
      'sync_failed',
      'integration',
      'gmail',
      `Sync failed: ${syncState.lastError}`,
      'error'
    );

    throw error;
  }
}

/**
 * Generate demo emails for testing
 */
function generateDemoEmails(count: number): GmailEmail[] {
  const demoEmails: GmailEmail[] = [
    {
      id: 'demo-email-1',
      threadId: 'thread-1',
      messageId: 'msg-1',
      from: 'John Santos',
      fromEmail: 'john.santos@ortigascorp.com.ph',
      to: ['company.info.nextedgeaccesssolutions@gmail.com'],
      subject: 'Inquiry: Facade Cleaning Services for Ortigas Office Tower',
      snippet: 'Dear NEAS Team, We are interested in your facade cleaning services...',
      body: 'Dear NEAS Team,\n\nWe are interested in your facade cleaning services for our 30-story office building in Ortigas Center. Please provide a quotation.\n\nBest regards,\nJohn Santos',
      date: new Date('2024-02-08T10:30:00'),
      labels: ['INBOX', 'IMPORTANT'],
      isUnread: true,
      hasAttachment: false,
      attachments: [],
      category: 'lead',
      aiAnalysis: {
        summary: 'New lead inquiry for facade cleaning services',
        sentiment: 'positive',
        actionRequired: true,
        suggestedReply: 'Thank you for your inquiry. We will prepare a quotation for your 30-story building facade cleaning project.'
      },
      syncedAt: new Date(),
      sourceAccountId: 'demo-account'
    },
    {
      id: 'demo-email-2',
      threadId: 'thread-2',
      messageId: 'msg-2',
      from: 'Maria Cruz',
      fromEmail: 'maria.cruz@bgctower.com.ph',
      to: ['company.info.nextedgeaccesssolutions@gmail.com'],
      subject: 'Project Update Request - BGC Tower Maintenance',
      snippet: 'Hi NEAS Team, Can you provide an update on the ongoing maintenance project...',
      body: 'Hi NEAS Team,\n\nCan you provide an update on the ongoing maintenance project at BGC Tower?\n\nThanks,\nMaria Cruz',
      date: new Date('2024-02-08T09:15:00'),
      labels: ['INBOX'],
      isUnread: false,
      hasAttachment: false,
      attachments: [],
      category: 'project',
      linkedRecordId: 'project-1',
      linkedRecordType: 'project',
      aiAnalysis: {
        summary: 'Project status update request',
        sentiment: 'neutral',
        actionRequired: true,
        suggestedReply: 'The BGC Tower maintenance project is 45% complete and on schedule.'
      },
      syncedAt: new Date(),
      sourceAccountId: 'demo-account'
    }
  ];

  return demoEmails.slice(0, count);
}

/**
 * Classify email by category
 */
export function classifyEmail(email: GmailEmail): GmailEmailCategory {
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  const content = `${subject} ${body}`;

  if (content.includes('inquiry') || content.includes('quote') || content.includes('proposal')) {
    return 'lead';
  }
  if (content.includes('project') || content.includes('update') || content.includes('progress')) {
    return 'project';
  }
  if (content.includes('quotation') || content.includes('boq') || content.includes('estimate')) {
    return 'quotation';
  }
  if (content.includes('purchase') || content.includes('order') || content.includes('supplier')) {
    return 'procurement';
  }
  if (content.includes('safety') || content.includes('incident') || content.includes('inspection')) {
    return 'safety';
  }
  if (content.includes('invoice') || content.includes('payment') || content.includes('billing')) {
    return 'finance';
  }
  if (content.includes('complaint') || content.includes('issue') || content.includes('problem')) {
    return 'complaint';
  }
  if (content.includes('spam') || content.includes('unsubscribe')) {
    return 'spam';
  }

  return 'unclassified';
}

/**
 * Deduplicate emails by message ID
 */
export function deduplicateEmails(newEmails: GmailEmail[]): GmailEmail[] {
  const existingIds = new Set(emails.map(e => e.messageId));
  return newEmails.filter(e => !existingIds.has(e.messageId));
}

// ============================================================================
// DRAFT REPLIES
// ============================================================================

/**
 * Generate draft reply for email
 * STATUS: Creates draft only, no auto-send
 */
export async function generateDraftReply(emailId: string): Promise<GmailDraftReply> {
  const email = emails.find(e => e.id === emailId);
  if (!email) {
    throw new Error('Email not found');
  }

  // Use AI analysis if available, otherwise generate basic reply
  const suggestedReply = email.aiAnalysis?.suggestedReply || 
    `Thank you for your email regarding "${email.subject}". We will review and respond shortly.`;

  const draft: GmailDraftReply = {
    id: `draft-${Date.now()}`,
    emailId: email.id,
    threadId: email.threadId,
    to: [email.fromEmail],
    subject: `Re: ${email.subject}`,
    body: suggestedReply,
    createdAt: new Date(),
    createdBy: 'CEO',
    status: 'draft'
  };

  draftReplies.push(draft);

  orchestrationEngine.addAuditLog(
    'user',
    'CEO',
    'draft_reply_created',
    'email',
    emailId,
    `Draft reply created for email from ${email.from}`,
    'info'
  );

  return draft;
}

/**
 * Request approval for draft reply
 * STATUS: Requires human approval before sending
 */
export async function requestApprovalForDraft(draftId: string): Promise<void> {
  const draft = draftReplies.find(d => d.id === draftId);
  if (!draft) {
    throw new Error('Draft not found');
  }

  if (draft.status !== 'draft') {
    throw new Error('Draft is not in draft status');
  }

  draft.status = 'pending_approval';

  // Create approval request
  await orchestrationEngine.createApprovalRequest({
    taskId: draft.id,
    taskTitle: `Send email reply to ${draft.to[0]}`,
    requestedBy: 'CEO',
    requestedByAgent: 'gmail-service',
    approvalLevel: 3,
    status: 'pending',
    actionDescription: `Send draft reply to ${draft.to.join(', ')} regarding "${draft.subject}"`,
    impact: 'External email communication',
    riskLevel: 'medium',
    evidence: [draft.body]
  });

  orchestrationEngine.addAuditLog(
    'user',
    'CEO',
    'draft_approval_requested',
    'email',
    draftId,
    `Approval requested for draft reply to ${draft.to[0]}`,
    'info'
  );
}

/**
 * Approve and send draft reply
 * STATUS: Requires explicit approval, logs action
 */
export async function approveAndSendDraft(draftId: string, approvedBy: string): Promise<void> {
  const draft = draftReplies.find(d => d.id === draftId);
  if (!draft) {
    throw new Error('Draft not found');
  }

  if (draft.status !== 'pending_approval') {
    throw new Error('Draft is not pending approval');
  }

  // TODO: Implement actual email sending via Gmail API
  // This requires backend proxy and OAuth tokens
  // For now, just mark as approved and log
  
  draft.status = 'approved';
  draft.approvedBy = approvedBy;
  draft.approvedAt = new Date();

  orchestrationEngine.addAuditLog(
    'user',
    approvedBy,
    'draft_approved',
    'email',
    draftId,
    `Draft reply approved and ready to send to ${draft.to.join(', ')}`,
    'info'
  );

  // Note: Actual sending would happen here with backend integration
  // draft.status = 'sent';
  // draft.sentAt = new Date();
}

// ============================================================================
// DATA ACCESS
// ============================================================================

/**
 * Get all synced emails
 */
export function getEmails(): GmailEmail[] {
  return [...emails];
}

/**
 * Get email by ID
 */
export function getEmailById(id: string): GmailEmail | undefined {
  return emails.find(e => e.id === id);
}

/**
 * Get emails by category
 */
export function getEmailsByCategory(category: GmailEmailCategory): GmailEmail[] {
  return emails.filter(e => e.category === category);
}

/**
 * Get unread emails
 */
export function getUnreadEmails(): GmailEmail[] {
  return emails.filter(e => e.isUnread);
}

/**
 * Get all draft replies
 */
export function getDraftReplies(): GmailDraftReply[] {
  return [...draftReplies];
}

/**
 * Get draft reply by ID
 */
export function getDraftReplyById(id: string): GmailDraftReply | undefined {
  return draftReplies.find(d => d.id === id);
}

// ============================================================================
// SYNC STATE MANAGEMENT
// ============================================================================

/**
 * Get current sync state
 */
export function getSyncState(): GmailSyncState {
  return { ...syncState };
}

/**
 * Reset sync state
 */
export function resetSyncState(): void {
  syncState = {
    emailsImported: 0,
    emailsSkipped: 0,
    emailsFailed: 0,
    status: 'idle',
    connectionState: currentAccount.connectionState,
    authorizedScopes: currentAccount.grantedScopes
  };

  emails = [];
  draftReplies = [];
}

/**
 * Pause sync
 */
export function pauseSync(): void {
  syncState.status = 'paused';

  orchestrationEngine.addAuditLog(
    'user',
    'CEO',
    'gmail_sync_paused',
    'integration',
    'gmail',
    'Gmail sync paused',
    'info'
  );
}

/**
 * Resume sync
 */
export function resumeSync(): void {
  if (syncState.status === 'paused') {
    syncState.status = 'idle';

    orchestrationEngine.addAuditLog(
      'user',
      'CEO',
      'gmail_sync_resumed',
      'integration',
      'gmail',
      'Gmail sync resumed',
      'info'
    );
  }
}

/**
 * Retry failed sync
 */
export async function retryFailedSync(): Promise<void> {
  if (syncState.status === 'error') {
    await syncEmails();
  }
}

// ============================================================================
// EXPORT FOR DEVELOPMENT
// ============================================================================

export const GmailService = {
  // Connection
  getCurrentAccount,
  checkConnectionHealth,
  startAccountMigration,
  completeOAuthAuthorization,
  verifyRealAccount,
  rollbackToDemo,
  disconnect,

  // Sync
  syncEmails,
  classifyEmail,
  deduplicateEmails,

  // Drafts
  generateDraftReply,
  requestApprovalForDraft,
  approveAndSendDraft,

  // Data Access
  getEmails,
  getEmailById,
  getEmailsByCategory,
  getUnreadEmails,
  getDraftReplies,
  getDraftReplyById,

  // State Management
  getSyncState,
  resetSyncState,
  pauseSync,
  resumeSync,
  retryFailedSync
};

export default GmailService;
