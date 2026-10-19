/**
 * Google API Service for Gmail and Sheets Integration
 * Requires OAuth Client ID to be configured
 */

// Configuration - Real OAuth Client ID for NEAS Operations
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '737870802771-nkana7tq73qh98cgfc280dfua1r2055o.apps.googleusercontent.com';

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
 * Wait for Google API scripts to load in the DOM.
 * NOTE: "[Script error.]" from cross-origin scripts is NORMAL and NOT a failure.
 * We only wait for the script tag's onload event.
 */
function waitForScripts(maxWait: number = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      const loading = window.googleApiLoading;
      
      // Scripts loaded successfully via onload events
      if (loading?.gapiLoaded && loading?.gisLoaded) {
        resolve();
        return;
      }
      
      // Check timeout
      if (Date.now() - startTime > maxWait) {
        // Even on timeout, check if gapi/google are available (scripts may have loaded without firing onload)
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
          console.warn('Google API scripts available but onload not fired - proceeding anyway');
          resolve();
          return;
        }
        reject(new Error('Google API scripts failed to load. Please check your internet connection and refresh the page.'));
        return;
      }
      
      // Try again in 200ms
      setTimeout(check, 200);
    };
    
    check();
  });
}

/**
 * Initialize Google API client.
 * CRITICAL: Must call gapi.load('client', callback) - the 'client' argument is REQUIRED
 * to load the client library. Without it, gapi.client is undefined.
 */
export async function initializeGapi(): Promise<void> {
  // Wait for scripts to load
  await waitForScripts();
  
  return new Promise((resolve, reject) => {
    // Check if gapi is loaded
    if (typeof gapi === 'undefined') {
      reject(new Error('Google API library not loaded. Please refresh the page.'));
      return;
    }

    try {
      // CRITICAL FIX: Must pass 'client' as first argument to load the client library
      // Without 'client', gapi.client will be undefined
      gapi.load('client', async () => {
        try {
          // Verify gapi.client exists after loading
          if (!gapi.client) {
            reject(new Error('gapi.client is undefined after load. Please refresh the page.'));
            return;
          }

          // Initialize the client with discovery docs
          await gapi.client.init({
            discoveryDocs: [
              'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
              'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest',
            ],
          });
          gapiInited = true;
          resolve();
        } catch (error: any) {
          console.error('GAPI client init error:', error);
          reject(new Error(error.message || 'Failed to initialize Google API client'));
        }
      });
    } catch (error: any) {
      console.error('gapi.load error:', error);
      reject(new Error(error.message || 'Failed to load Google API client'));
    }
  });
}

/**
 * Check if gapi client is ready
 */
export function isGapiReady(): boolean {
  return gapiInited && typeof gapi !== 'undefined' && gapi.client !== undefined;
}

/**
 * Check if Google API scripts are loaded in the DOM
 */
export function isGoogleApiLoaded(): boolean {
  // Check our loading flags first
  const loading = window.googleApiLoading;
  if (loading?.gapiLoaded && loading?.gisLoaded) {
    return true;
  }
  
  // Fallback: check if the globals exist (scripts may have loaded without firing onload)
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
 * Initialize Google Identity Services (GIS)
 */
export function initializeGis(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    // Wait for scripts to load
    try {
      await waitForScripts();
    } catch (error: any) {
      reject(error);
      return;
    }

    // Check if Client ID is configured
    if (!isClientIdConfigured()) {
      reject(new Error('OAuth Client ID not configured. Please complete the Setup Wizard first.'));
      return;
    }

    // Check if Google Identity Services is loaded
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
      reject(new Error('Google Identity Services not loaded. Please refresh the page.'));
      return;
    }

    try {
      // Initialize token client
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          // This callback is called after each token request
          if (response.error) {
            console.error('GIS callback error:', response.error);
          } else {
            gisInited = true;
          }
        },
      });
      
      // Mark as initialized (token client created successfully)
      gisInited = true;
      resolve();
    } catch (error: any) {
      console.error('GIS init error:', error);
      reject(new Error(error.message || 'Failed to initialize Google Identity Services'));
    }
  });
}

/**
 * Request OAuth token - opens Google sign-in popup
 */
export function requestToken(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Verify token client exists
    if (!tokenClient) {
      reject(new Error('Token client not initialized. Please refresh the page and try again.'));
      return;
    }

    // Verify gapi.client exists before accessing it
    if (typeof gapi === 'undefined' || !gapi.client) {
      reject(new Error('Google API client not ready. Please refresh the page and try again.'));
      return;
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      reject(new Error('Connection timeout. Please try again.'));
    }, 60000);

    // Override the callback for this specific request
    tokenClient.callback = (response: any) => {
      clearTimeout(timeoutId);
      
      if (response.error) {
        const errorMsg = response.error_description || response.error || 'Authentication failed';
        reject(new Error(errorMsg));
      } else {
        // Token received successfully - set it on gapi.client
        try {
          gapi.client.setToken(response);
        } catch (e) {
          console.warn('Failed to set token on gapi.client:', e);
        }
        resolve();
      }
    };

    try {
      // Request the token - this will trigger the callback and open the popup
      let currentToken = null;
      try {
        currentToken = gapi.client.getToken();
      } catch (e) {
        // getToken might throw if client isn't fully ready
        currentToken = null;
      }
      
      if (currentToken === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      reject(new Error(error.message || 'Failed to request access token'));
    }
  });
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  try {
    return gapiInited && 
           gisInited && 
           typeof gapi !== 'undefined' && 
           gapi.client !== undefined && 
           gapi.client.getToken() !== null;
  } catch (e) {
    return false;
  }
}

/**
 * Sign out
 */
export function signOut(): void {
  try {
    if (typeof gapi === 'undefined' || !gapi.client) {
      return;
    }
    
    const token = gapi.client.getToken();
    if (token && typeof google !== 'undefined' && google.accounts?.oauth2) {
      google.accounts.oauth2.revoke(token.access_token);
    }
    gapi.client.setToken('');
    gisInited = false;
  } catch (e) {
    console.warn('Error during sign out:', e);
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
    if (typeof gapi === 'undefined' || !gapi.client?.gmail) {
      throw new Error('Gmail API not ready');
    }

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
    if (typeof gapi === 'undefined' || !gapi.client?.gmail) {
      throw new Error('Gmail API not ready');
    }

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
    if (typeof gapi === 'undefined' || !gapi.client?.gmail) {
      throw new Error('Gmail API not ready');
    }

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
    if (typeof gapi === 'undefined' || !gapi.client?.sheets) {
      throw new Error('Sheets API not ready');
    }

    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.result.values || [];
  } catch (error) {
    console.error('Error fetching sheet ', error);
    throw error;
  }
}

/**
 * Get authenticated user's email
 */
export async function getUserEmail(): Promise<string> {
  try {
    if (typeof gapi === 'undefined' || !gapi.client?.gmail) {
      throw new Error('Gmail API not ready');
    }

    const response = await gapi.client.gmail.users.getProfile({
      userId: 'me',
    });
    return response.result.emailAddress;
  } catch (error) {
    console.error('Error getting user email:', error);
    throw error;
  }
}
