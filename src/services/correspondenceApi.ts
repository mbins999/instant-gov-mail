import { supabase } from "@/integrations/supabase/client";

interface ApiConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  token?: string;
}

class CorrespondenceApiService {
  private config: ApiConfig | null = null;

  setConfig(config: ApiConfig) {
    this.config = config;
    // Store token in localStorage for persistence
    if (config.token) {
      localStorage.setItem('api_token', config.token);
    }
  }

  getConfig(): ApiConfig | null {
    if (!this.config) {
      const storedToken = localStorage.getItem('api_token');
      const storedBaseUrl = localStorage.getItem('api_base_url');
      if (storedToken && storedBaseUrl) {
        this.config = {
          baseUrl: storedBaseUrl,
          token: storedToken,
        };
      }
    }
    return this.config;
  }

  async login(baseUrl: string, username: string, password: string) {
    const { data, error } = await supabase.functions.invoke('correspondence-api', {
      body: {
        action: 'login',
        config: { baseUrl, username, password },
      },
    });

    if (error) throw error;
    
    if (data && data.token) {
      this.setConfig({ baseUrl, token: data.token });
      localStorage.setItem('api_base_url', baseUrl);
    }

    return data;
  }

  async exportCorrespondence(metadata: any, file?: File) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('correspondence-api', {
      body: {
        action: 'export-correspondence',
        config,
        data: { metadata, file },
      },
    });

    if (error) throw error;
    return data;
  }

  async returnCorrespondence(docId: string, messagingHistoryId: number) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('correspondence-api', {
      body: {
        action: 'return-correspondence',
        config,
        data: { docId, messagingHistoryId },
      },
    });

    if (error) throw error;
    return data;
  }

  async resendCorrespondence(
    docId: string,
    messagingHistoryId: number,
    comments: string,
    receivedByName: string
  ) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('correspondence-api', {
      body: {
        action: 'resend-correspondence',
        config,
        data: { docId, messagingHistoryId, comments, receivedByName },
      },
    });

    if (error) throw error;
    return data;
  }

  async receiveCorrespondence(
    docId: string,
    messagingHistoryId: number,
    comments: string,
    receivedByName: string,
    receiveByOuName: string
  ) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('correspondence-api', {
      body: {
        action: 'receive-correspondence',
        config,
        data: { docId, messagingHistoryId, comments, receivedByName, receiveByOuName },
      },
    });

    if (error) throw error;
    return data;
  }

  async addAttachment(metadata: string, content: File) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('correspondence-api', {
      body: {
        action: 'add-attachment',
        config,
        data: { metadata, content },
      },
    });

    if (error) throw error;
    return data;
  }

  async getTransactionLog(docId: string) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('correspondence-api', {
      body: {
        action: 'get-transaction-log',
        config,
        data: { docId },
      },
    });

    if (error) throw error;
    return data;
  }

  async getIncomingAttachment(docId: string) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('correspondence-api', {
      body: {
        action: 'get-incoming-attachment',
        config,
        data: { docId },
      },
    });

    if (error) throw error;
    return data;
  }

  async getAttachmentContent(docId: string) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('correspondence-api', {
      body: {
        action: 'get-attachment-content',
        config,
        data: { docId },
      },
    });

    if (error) throw error;
    return data;
  }

  logout() {
    this.config = null;
    localStorage.removeItem('api_token');
    localStorage.removeItem('api_base_url');
  }

  isAuthenticated(): boolean {
    return this.getConfig() !== null;
  }
}

export const correspondenceApi = new CorrespondenceApiService();
