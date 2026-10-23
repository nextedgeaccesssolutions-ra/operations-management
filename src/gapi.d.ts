// Type declarations for Google API client libraries

interface GapiClient {
  init(config: { discoveryDocs: string[] }): Promise<void>;
  getToken(): { access_token: string } | null;
  setToken(token: any): void;
  gmail: {
    users: {
      messages: {
        list(params: {
          userId: string;
          maxResults?: number;
          q?: string;
        }): Promise<{ result: { messages?: Array<{ id: string; threadId: string }> } }>;
        get(params: {
          userId: string;
          id: string;
        }): Promise<{
          result: {
            id: string;
            threadId: string;
            snippet: string;
            internalDate: string;
            labelIds: string[];
            payload: {
              headers: Array<{ name: string; value: string }>;
              body: { size: number; data?: string };
              parts?: Array<{
                mimeType: string;
                body: { size: number; data?: string };
              }>;
            };
          };
        }>;
        modify(params: {
          userId: string;
          id: string;
          resource: {
            addLabelIds?: string[];
            removeLabelIds?: string[];
          };
        }): Promise<void>;
        send(params: {
          userId: string;
          resource: {
            raw: string;
            threadId?: string;
          };
        }): Promise<void>;
      };
      getProfile(params: { userId: string }): Promise<{ result: { emailAddress: string } }>;
    };
  };
  sheets: {
    spreadsheets: {
      values: {
        get(params: {
          spreadsheetId: string;
          range: string;
        }): Promise<{ result: { values?: any[][] } }>;
      };
    };
  };
}

interface GoogleAccountsOauth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: { access_token?: string; error?: any }) => void;
  }): {
    requestAccessToken(params?: { prompt?: string }): void;
  };
  revoke(token: string): void;
}

// CORRECT Google API signature: gapi.load('client', callback)
declare const gapi: {
  load(names: string, callback: () => void): void;
  client: GapiClient;
};

declare const google: {
  accounts: {
    oauth2: GoogleAccountsOauth2;
  };
};

interface ImportMeta {
  env: {
    VITE_GOOGLE_CLIENT_ID?: string;
    [key: string]: string | undefined;
  };
}

// Extend Window interface for Google API loading status
interface Window {
  googleApiLoading?: {
    gapiLoaded: boolean;
    gisLoaded: boolean;
    onError: string | null;
  };
}
