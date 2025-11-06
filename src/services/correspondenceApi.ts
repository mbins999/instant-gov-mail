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
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: username,
        userPassword: password,
      }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    
    if (data && data.token) {
      this.setConfig({ baseUrl, token: data.token });
      localStorage.setItem('api_base_url', baseUrl);
    }

    return data;
  }

  async exportCorrespondence(metadata: any, file?: File) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('metadata', JSON.stringify(metadata));
    if (file) {
      formData.append('file', file);
    }

    const response = await fetch(`${config.baseUrl}/user/correspondence/export`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.json();
  }

  async returnCorrespondence(docId: string, messagingHistoryId: number) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const response = await fetch(`${config.baseUrl}/user/correspondence/return`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ docId, messagingHistoryId }),
    });

    if (!response.ok) {
      throw new Error('Return failed');
    }

    return await response.json();
  }

  async resendCorrespondence(
    docId: string,
    messagingHistoryId: number,
    comments: string,
    receivedByName: string
  ) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const response = await fetch(`${config.baseUrl}/user/correspondence/resend`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ docId, messagingHistoryId, comments, receivedByName }),
    });

    if (!response.ok) {
      throw new Error('Resend failed');
    }

    return await response.json();
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

    const response = await fetch(`${config.baseUrl}/user/correspondence/receive`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ docId, messagingHistoryId, comments, receivedByName, receiveByOuName }),
    });

    if (!response.ok) {
      throw new Error('Receive failed');
    }

    return await response.json();
  }

  async addAttachment(metadata: string, content: File) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('metadata', metadata);
    formData.append('content', content);

    const response = await fetch(`${config.baseUrl}/user/correspondence/attachment/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Add attachment failed');
    }

    return await response.json();
  }

  async updateAttachment(metadata: string, content: File) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('metadata', metadata);
    formData.append('content', content);

    const response = await fetch(`${config.baseUrl}/user/correspondence/attachment/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Update attachment failed');
    }

    return await response.json();
  }

  async getTransactionLog(docId: string) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const response = await fetch(
      `${config.baseUrl}/user/transaction-log/messaging-history/${docId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Get transaction log failed');
    }

    return await response.json();
  }

  async getIncomingAttachment(docId: string) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const response = await fetch(
      `${config.baseUrl}/user/correspondence/incoming/docId/${docId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Get incoming attachment failed');
    }

    return await response.json();
  }

  async getAttachmentContent(docId: string) {
    const config = this.getConfig();
    if (!config) throw new Error('Not authenticated');

    const response = await fetch(
      `${config.baseUrl}/user/correspondence/attachment/docId/content/${docId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Get attachment content failed');
    }

    return await response.json();
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
