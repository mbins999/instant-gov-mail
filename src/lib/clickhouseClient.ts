const API_BASE_URL = 'http://192.168.203.134:3001/api';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const sessionToken = localStorage.getItem('session_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const clickhouseApi = {
  // Auth
  login: (username: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  verifySession: (sessionToken: string) =>
    apiRequest('/auth/verify-session', {
      method: 'POST',
      body: JSON.stringify({ sessionToken }),
    }),

  // Users
  listUsers: (sessionToken: string) =>
    apiRequest('/users/list', {
      method: 'POST',
      body: JSON.stringify({ sessionToken }),
    }),

  updateUser: (userId: number, data: any) =>
    apiRequest('/users/update', {
      method: 'POST',
      body: JSON.stringify({ userId, ...data }),
    }),

  createUser: (username: string, password: string, fullName: string, entityId: string | null, role: 'admin' | 'moderator' | 'user') =>
    apiRequest('/users/create', {
      method: 'POST',
      body: JSON.stringify({ 
        username, 
        password, 
        full_name: fullName, 
        entity_id: entityId,
        role 
      }),
    }),

  deleteUser: (userId: number) =>
    apiRequest(`/users/delete/${userId}`, {
      method: 'DELETE',
    }),

  // Correspondences
  listCorrespondences: () => apiRequest('/correspondences'),

  getCorrespondence: (id: string) => apiRequest(`/correspondences/${id}`),

  createCorrespondence: (data: any) =>
    apiRequest('/correspondences/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Entities
  listEntities: () => apiRequest('/entities'),
  
  createEntity: (name: string, type: string) =>
    apiRequest('/entities/create', {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    }),
  
  updateEntity: (entityId: string, name: string, type: string) =>
    apiRequest(`/entities/update/${entityId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, type }),
    }),
  
  deleteEntity: (entityId: string) =>
    apiRequest(`/entities/delete/${entityId}`, {
      method: 'DELETE',
    }),
};
