/**
 * Google API Service for Gmail and Sheets Integration
 * Requires OAuth Client ID to be configured
 */

// Configuration - Replace with your actual OAuth Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
].join(' ');

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  labelIds: string[];
  payload: {
    headers: Array<{ name: string; value: string }>;
    body: {
      size: number;
      data?: string;
    };
  };
}

export interface Email {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  labels: string[];
  unread: boolean;
}

/**
 * Initialize Google API client
 */
export async function initializeGapi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof gapi === 'undefined') {
      reject(new Error('Google API not loaded'));
      return;
    }

    gapi.load(async () => {
      try {
        await gapi.client.init({
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
            'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest',
          ],
        });
        gapiInited = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Check if Google API scripts are loaded
 */
export function isGoogleApiLoaded(): boolean {
  return typeof gapi !== 'undefined' && typeof google !== 'undefined' && !!google.accounts;
}

/**
 * Get the configured Client ID
 */
export function getConfiguredClientId(): string {
  return GOOGLE_CLIENT_ID;
}

/**
 * Check if Client ID is properly configured
 */
export function isClientIdConfigured(): boolean {
  const clientId = getConfiguredClientId();
  return !!clientId && clientId !== 'YOUR_CLIENT_ID_HERE' && clientId.includes('.apps.googleusercontent.com');
}

/**
 * Initialize Google Identity Services
 */
export function initializeGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if Client ID is configured
    if (!isClientIdConfigured()) {
      reject(new Error('OAuth Client ID not configured. Please complete the Setup Wizard first.'));
      return;
    }

    // Check if Google scripts are loaded
    if (typeof google === 'undefined' || !google.accounts) {
      reject(new Error('Google Identity Services not loaded. Please refresh the page or check your internet connection.'));
      return;
    }

    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || 'OAuth authentication failed'));
          } else {
            gisInited = true;
            resolve();
          }
        },
      });
    } catch (error: any) {
      reject(new Error(error.message || 'Failed to initialize Google Identity Services'));
    }
  });
}

/**
 * Request OAuth token
 */
export function requestToken(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized'));
      return;
    }

    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }

    // Wait for callback
    const checkToken = setInterval(() => {
      if (gapi.client.getToken() !== null) {
        clearInterval(checkToken);
        resolve();
      }
    }, 100);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkToken);
      if (gapi.client.getToken() === null) {
        reject(new Error('Token request timeout'));
      }
    }, 30000);
  });
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return gapiInited && gisInited && gapi.client.getToken() !== null;
}

/**
 * Sign out
 */
export function signOut(): void {
  const token = gapi.client.getToken();
  if (token) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    gisInited = false;
  }
}

/**
 * Fetch emails from Gmail
 */
export async function fetchEmails(
  maxResults: number = 50,
  query: string = ''
): Promise<Email[]> {
  try {
    const response = await gapi.client.gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query,
    });

    const messages = response.result.messages || [];
    const emails: Email[] = [];

    for (const msg of messages) {
      const detail = await gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
      });

      const message = detail.result;
      const headers = message.payload.headers;

      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const to = headers.find((h: any) => h.name === 'To')?.value || '';
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(no subject)';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';

      // Extract email body
      let body = '';
      if (message.payload.body?.data) {
        body = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (message.payload.parts) {
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            break;
          }
        }
      }

      // Extract sender email
      const fromMatch = from.match(/<(.+)>/);
      const fromEmail = fromMatch ? fromMatch[1] : from;

      emails.push({
        id: message.id,
        threadId: message.threadId,
        from,
        fromEmail,
        to,
        subject,
        snippet: message.snippet || '',
        body,
        date,
        labels: message.labelIds || [],
        unread: message.labelIds?.includes('UNREAD') || false,
      });
    }

    return emails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

/**
 * Send an email via Gmail API
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<void> {
  try {
    // Create email message
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      body,
    ].join('\n');

    // Encode to base64url
    const encodedEmail = btoa(email)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const request = {
      raw: encodedEmail,
      ...(threadId && { threadId }),
    };

    await gapi.client.gmail.users.messages.send({
      userId: 'me',
      resource: request,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Mark email as read
 */
export async function markAsRead(messageId: string): Promise<void> {
  try {
    await gapi.client.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      resource: {
        removeLabelIds: ['UNREAD'],
      },
    });
  } catch (error) {
    console.error('Error marking as read:', error);
    throw error;
  }
}

/**
 * Fetch data from Google Sheets
 */
export async function fetchSheetData(
  spreadsheetId: string,
  range: string = 'A1:Z1000'
): Promise<any[][]> {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.result.values || [];
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

/**
 * Get authenticated user's email
 */
export async function getUserEmail(): Promise<string> {
  try {
    const response = await gapi.client.gmail.users.getProfile({
      userId: 'me',
    });
    return response.result.emailAddress;
  } catch (error) {
    console.error('Error getting user email:', error);
    throw error;
  }
}
