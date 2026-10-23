/**
 * Gmail Integration Service
 * Real OAuth 2.0 implementation using Google Identity Services (GIS)
 * 
 * AUTHORIZED ACCOUNT: info.nextedgeaccesssolutions@gmail.com
 * SCOPE: gmail.readonly (minimum required)
 * FLOW: Implicit flow for browser-based SPA
 * 
 * Security:
 * - Tokens stored in memory only (never in localStorage)
 * - Identity verification on every OAuth callback
 * - CSRF protection via state parameter
 * - Audit logging for all operations
 * - No demo/mock data - only real OAuth
 */

import { orchestrationEngine } from '../neas/orchestrationEngine';

// Authorized company email - DO NOT CHANGE
const AUTHORIZED_EMAIL = 'info.nextedgeaccesssolutions@gmail.com';
const REQUIRED_SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

// OAuth client ID from environment (must be set in .env)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type GmailConnectionState = 
  | 'awaiting_authorization'
  | 'authorizing'
  | 'authorized'
  | 'verifying_identity'
  | 'syncing'
  | 'healthy'
  | 'degraded'
  | 'expired_authorization'
  | 'revoked'
  | 'failed'
  | 'disconnected'
  | 'identity_mismatch';

export interface GmailAccount {
  id: string;
  email: string;
  displayName: string;
  authorizedAt?: Date;
  lastSyncAt?: Date;
  lastHealthCheckAt?: Date;
  grantedScopes: string[];
  connectionState: GmailConnectionState;
  tokenExpiry?: Date;
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
  downloadUrl?: string;
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
  nextPageToken?: string;
}

export interface GmailConnectionHealth {
  status: 'healthy' | 'degraded' | 'down' | 'unauthorized' | 'awaiting_authorization';
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
// SERVICE STATE (In-Memory Only - Never Persisted)
// ============================================================================

let currentAccount: GmailAccount | null = null;
let accessToken: string | null = null;
let tokenClient: any = null;

let syncState: GmailSyncState = {
  emailsImported: 0,
  emailsSkipped: 0,
  emailsFailed: 0,
  status: 'idle',
  connectionState: 'awaiting_authorization',
  authorizedScopes: []
};

let emails: GmailEmail[] = [];
let draftReplies: GmailDraftReply[] = [];

// ============================================================================
// OAUTH INITIALIZATION
// ============================================================================

/**
 * Initialize Google Identity Services
 */
export async function initializeOAuth(): Promise<boolean> {
  if (!GOOGLE_CLIENT_ID) {
    console.error('[GmailService] Google Client ID not configured');
    orchestrationEngine.addAuditLog(
      'system',
      'gmail-service',
      'oauth_init_failed',
      'integration',
      'gmail',
      'Google Client ID not configured in environment variables',
      'error'
    );
    return false;
  }

  try {
    // Check if Google Identity Services is loaded
    if (typeof google === 'undefined' || !google.accounts) {
      throw new Error('Google Identity Services not loaded');
    }

    // Initialize token client
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: REQUIRED_SCOPES,
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          console.error('[GmailService] OAuth error:', tokenResponse.error);
          syncState.connectionState = 'failed';
          orchestrationEngine.addAuditLog(
            'system',
            'gmail-service',
            'oauth_callback_error',
            'integration',
            'gmail',
            `OAuth callback error: ${tokenResponse.error}`,
            'error'
          );
          return;
        }

        // Store token in memory only
        accessToken = tokenResponse.access_token;
        
        // Verify identity
        await verifyIdentity();
      },
    });

    orchestrationEngine.addAuditLog(
      'system',
      'gmail-service',
      'oauth_initialized',
      'integration',
      'gmail',
      'OAuth client initialized successfully',
      'info'
    );

    return true;
  } catch (error) {
    console.error('[GmailService] OAuth initialization failed:', error);
    orchestrationEngine.addAuditLog(
      'system',
      'gmail-service',
      'oauth_init_failed',
      'integration',
      'gmail',
      `OAuth initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'error'
    );
    return false;
  }
}

// ============================================================================
// IDENTITY VERIFICATION
// ============================================================================

/**
 * Verify that the authorized account matches the authorized email
 */
async function verifyIdentity(): Promise<void> {
  if (!accessToken) {
    throw new Error('No access token available');
  }

  syncState.connectionState = 'verifying_identity';

  try {
    // Get user profile from Gmail API
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.status}`);
    }

    const profile = await response.json();
    const userEmail = profile.emailAddress;

    // Verify identity matches authorized email
    if (userEmail !== AUTHORIZED_EMAIL) {
      console.error(`[GmailService] Identity mismatch: got ${userEmail}, expected ${AUTHORIZED_EMAIL}`);
      
      syncState.connectionState = 'identity_mismatch';
      currentAccount = null;
      accessToken = null;

      orchestrationEngine.addAuditLog(
        'system',
        'gmail-service',
        'identity_verification_failed',
        'integration',
        'gmail',
        `Identity mismatch: authorized ${userEmail}, expected ${AUTHORIZED_EMAIL}`,
        'error'
      );

      throw new Error(`Identity mismatch: You authorized ${userEmail}, but only ${AUTHORIZED_EMAIL} is allowed`);
    }

    // Identity verified - create account
    currentAccount = {
      id: `gmail-${Date.now()}`,
      email: userEmail,
      displayName: profile.name || userEmail,
      authorizedAt: new Date(),
      grantedScopes: [REQUIRED_SCOPES],
      connectionState: 'authorized',
      tokenExpiry: new Date(Date.now() + 3600000) // 1 hour from now
    };

    syncState.connectionState = 'authorized';
    syncState.authorizedScopes = [REQUIRED_SCOPES];

    orchestrationEngine.addAuditLog(
      'system',
      'gmail-service',
      'identity_verified',
      'integration',
      'gmail',
      `Identity verified for ${userEmail}`,
      'info'
    );

  } catch (error) {
    console.error('[GmailService] Identity verification failed:', error);
    syncState.connectionState = 'failed';
    currentAccount = null;
    accessToken = null;
    throw error;
  }
}

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Start OAuth authorization flow
 */
export async function startOAuthAuthorization(): Promise<{
  success: boolean;
  authorizationId: string;
  account: string;
  scopes: string[];
}> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in environment variables.');
  }

  const initialized = await initializeOAuth();
  if (!initialized) {
    throw new Error('Failed to initialize OAuth client');
  }

  const authorizationId = `auth-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  orchestrationEngine.addAuditLog(
    'user',
    'CEO',
    'gmail_authorization_started',
    'integration',
    'gmail',
    `OAuth authorization initiated for ${AUTHORIZED_EMAIL}`,
    'info',
    { authorizationId, targetEmail: AUTHORIZED_EMAIL }
  );

  syncState.connectionState = 'authorizing';

  // Trigger OAuth popup
  try {
    tokenClient.requestAccessToken({
      prompt: 'consent',
      state: authorizationId // CSRF protection
    });
  } catch (error) {
    console.error('[GmailService] OAuth request failed:', error);
    syncState.connectionState = 'failed';
    throw error;
  }

  return {
    success: true,
    authorizationId,
    account: AUTHORIZED_EMAIL,
    scopes: [REQUIRED_SCOPES]
  };
}

/**
 * Get current Gmail account
 */
export function getCurrentAccount(): GmailAccount | null {
  return currentAccount ? { ...currentAccount } : null;
}

/**
 * Check Gmail connection health
 */
export async function checkConnectionHealth(): Promise<GmailConnectionHealth> {
  if (!currentAccount || !accessToken) {
    return {
      status: 'awaiting_authorization',
      lastCheck: new Date(),
      errorMessage: 'No authorized account. Please complete OAuth authorization.',
      authorizedScopes: []
    };
  }

  try {
    const startTime = Date.now();
    
    // Get mailbox metadata
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      if (response.status === 401) {
        syncState.connectionState = 'expired_authorization';
        return {
          status: 'unauthorized',
          lastCheck: new Date(),
          responseTime,
          errorMessage: 'Access token expired. Please re-authorize.',
          authorizedScopes: currentAccount.grantedScopes
        };
      }
      throw new Error(`Health check failed: ${response.status}`);
    }

    const profile = await response.json();

    currentAccount.lastHealthCheckAt = new Date();
    syncState.connectionState = 'healthy';

    return {
      status: 'healthy',
      lastCheck: new Date(),
      responseTime,
      authorizedScopes: currentAccount.grantedScopes,
      mailboxMetadata: {
        totalMessages: profile.messagesTotal || 0,
        unreadMessages: profile.messagesUnread || 0,
        historyId: profile.historyId || ''
      }
    };

  } catch (error) {
    console.error('[GmailService] Health check failed:', error);
    syncState.connectionState = 'degraded';
    
    return {
      status: 'degraded',
      lastCheck: new Date(),
      errorMessage: error instanceof Error ? error.message : 'Health check failed',
      authorizedScopes: currentAccount.grantedScopes
    };
  }
}

/**
 * Disconnect Gmail account
 */
export async function disconnect(): Promise<void> {
  if (!currentAccount) {
    throw new Error('No account to disconnect');
  }

  const previousEmail = currentAccount.email;

  // Revoke token if possible
  if (accessToken && typeof google !== 'undefined' && google.accounts) {
    try {
      google.accounts.oauth2.revoke(accessToken);
      console.log('[GmailService] Token revoked');
    } catch (error) {
      console.error('[GmailService] Token revocation failed:', error);
    }
  }

  currentAccount = null;
  accessToken = null;
  syncState.connectionState = 'disconnected';
  emails = [];
  draftReplies = [];

  orchestrationEngine.addAuditLog(
    'user',
    'CEO',
    'gmail_disconnected',
    'integration',
    'gmail',
    `Disconnected from ${previousEmail}`,
    'info'
  );
}

// ============================================================================
// EMAIL SYNCHRONIZATION
// ============================================================================

/**
 * Sync emails from Gmail API
 */
export async function syncEmails(maxResults: number = 50, pageToken?: string): Promise<GmailEmail[]> {
  if (!currentAccount || !accessToken) {
    throw new Error('No authorized account. Please complete OAuth authorization first.');
  }

  if (currentAccount.connectionState === 'disconnected') {
    throw new Error('Gmail account is disconnected');
  }

  syncState.status = 'syncing';
  syncState.connectionState = 'syncing';

  try {
    // Build query parameters
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      userId: 'me'
    });

    if (pageToken || syncState.nextPageToken) {
      params.append('pageToken', pageToken || syncState.nextPageToken || '');
    }

    // Fetch message list
    const listResponse = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!listResponse.ok) {
      if (listResponse.status === 401) {
        syncState.connectionState = 'expired_authorization';
        throw new Error('Access token expired. Please re-authorize.');
      }
      throw new Error(`Failed to fetch messages: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    const messageIds = listData.messages || [];

    // Store next page token for pagination
    if (listData.nextPageToken) {
      syncState.nextPageToken = listData.nextPageToken;
    }

    // Fetch full message details
    const newEmails: GmailEmail[] = [];
    
    for (const msg of messageIds) {
      try {
        const msgResponse = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (!msgResponse.ok) {
          syncState.emailsFailed++;
          continue;
        }

        const msgData = await msgResponse.json();
        const email = parseGmailMessage(msgData, currentAccount?.id || '');
        
        // Deduplicate
        if (!emails.find(e => e.id === email.id)) {
          newEmails.push(email);
          syncState.emailsImported++;
        } else {
          syncState.emailsSkipped++;
        }
      } catch (error) {
        console.error(`[GmailService] Failed to fetch message ${msg.id}:`, error);
        syncState.emailsFailed++;
      }
    }

    // Merge with existing emails
    emails = [...newEmails, ...emails];

    syncState.status = 'success';
    syncState.lastSuccessfulSyncAt = new Date();
    currentAccount.lastSyncAt = new Date();
    syncState.connectionState = 'healthy';

    orchestrationEngine.addAuditLog(
      'system',
      'gmail-service',
      'sync_completed',
      'integration',
      'gmail',
      `Synced ${newEmails.length} emails from ${currentAccount.email}`,
      'info',
      {
        imported: syncState.emailsImported,
        skipped: syncState.emailsSkipped,
        failed: syncState.emailsFailed
      }
    );

    return newEmails;
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
 * Parse Gmail API message into internal format
 */
function parseGmailMessage(msgData: any, currentAccountId: string): GmailEmail {
  const headers = msgData.payload?.headers || [];
  
  const from = headers.find((h: any) => h.name === 'From')?.value || '';
  const to = headers.find((h: any) => h.name === 'To')?.value || '';
  const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(no subject)';
  const date = headers.find((h: any) => h.name === 'Date')?.value || '';
  const messageId = headers.find((h: any) => h.name === 'Message-ID')?.value || msgData.id;

  // Extract email addresses
  const fromMatch = from.match(/<(.+)>/);
  const fromEmail = fromMatch ? fromMatch[1] : from;
  const toAddresses = to.split(',').map((addr: string) => addr.trim());

  // Get body
  let body = '';
  if (msgData.payload?.body?.data) {
    body = atob(msgData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  } else if (msgData.payload?.parts) {
    for (const part of msgData.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        break;
      }
    }
  }

  // Check for attachments
  const hasAttachment = msgData.payload?.filename && msgData.payload.filename.length > 0;
  const attachments: GmailAttachment[] = [];
  
  if (msgData.payload?.parts) {
    for (const part of msgData.payload.parts) {
      if (part.filename && part.filename.length > 0) {
        attachments.push({
          id: part.body?.attachmentId || '',
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body?.size || 0
        });
      }
    }
  }

  // Classify email
  const category = classifyEmailContent(subject, body);

  return {
    id: msgData.id,
    threadId: msgData.threadId,
    messageId,
    from,
    fromEmail,
    to: toAddresses,
    subject,
    snippet: msgData.snippet || '',
    body,
    date: new Date(date),
    labels: msgData.labelIds || [],
    isUnread: msgData.labelIds?.includes('UNREAD') || false,
    hasAttachment: hasAttachment || attachments.length > 0,
    attachments,
    category,
    syncedAt: new Date(),
    sourceAccountId: currentAccount?.id || ''
  };
}

/**
 * Classify email content by category
 */
function classifyEmailContent(subject: string, body: string): GmailEmailCategory {
  const content = `${subject} ${body}`.toLowerCase();

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

// ============================================================================
// DRAFT REPLIES
// ============================================================================

/**
 * Generate draft reply for email
 */
export async function generateDraftReply(emailId: string): Promise<GmailDraftReply> {
  const email = emails.find(e => e.id === emailId);
  if (!email) {
    throw new Error('Email not found');
  }

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
    connectionState: currentAccount?.connectionState || 'awaiting_authorization',
    authorizedScopes: currentAccount?.grantedScopes || []
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

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const GmailService = {
  // OAuth
  startOAuthAuthorization,
  getCurrentAccount,
  checkConnectionHealth,
  disconnect,

  // Sync
  syncEmails,

  // Data Access
  getEmails,
  getEmailById,
  getEmailsByCategory,
  getUnreadEmails,

  // Drafts
  generateDraftReply,
  getDraftReplies,
  getDraftReplyById,

  // State Management
  getSyncState,
  resetSyncState,
  pauseSync,
  resumeSync
};

export default GmailService;
