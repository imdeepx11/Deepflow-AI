const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  || (import.meta.env.DEV ? '/api' : 'https://nexora-backend-30jt.onrender.com/api');


export async function fetchApi(endpoint, options = {}, retryCount = 0) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Network request failed' }));
      throw new Error(err.detail || `Error ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    const isNetworkError = error.name === 'TypeError' || (error.message && (error.message.includes('fetch') || error.message.includes('Network') || error.message.includes('Failed to fetch')));
    if (retryCount < 3 && isNetworkError) {
      console.warn(`API retry ${retryCount + 1}/3 for ${endpoint} due to server wake-up delay...`);
      await new Promise((resolve) => setTimeout(resolve, 4000));
      return fetchApi(endpoint, options, retryCount + 1);
    }
    console.error(`API Error on ${endpoint}:`, error);
    if (isNetworkError) {
      throw new Error('Backend server is waking up (Render cold start). Please wait ~15 seconds and try again.');
    }
    throw error;
  }
}


export const api = {
  // Auth
  login: (credentials) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  sendPhoneCode: (phone) => fetchApi('/auth/send-phone-code', { method: 'POST', body: JSON.stringify({ phone }) }),
  phoneLogin: (phone, code, name) => fetchApi('/auth/phone-login', { method: 'POST', body: JSON.stringify({ phone, code, name }) }),
  loginWithGoogle: (idToken, displayName, email) => fetchApi('/auth/google', { method: 'POST', body: JSON.stringify({ id_token: idToken, name: displayName || null, email: email || null }) }),
  forgotPassword: (email) => fetchApi('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyCode: (email, code) => fetchApi('/auth/verify-code', { method: 'POST', body: JSON.stringify({ email, code }) }),
  verifyResetToken: (token) => fetchApi(`/auth/verify-reset-token/${token}`),
  resetPassword: (email, code, new_password) => fetchApi('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, new_password }) }),
  resetPasswordWithToken: (token, new_password) => fetchApi('/auth/reset-password-with-token', { method: 'POST', body: JSON.stringify({ token, new_password }) }),
  getMe: () => fetchApi('/auth/me'),


  // Documents
  getDocuments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/documents${query ? `?${query}` : ''}`);
  },
  getDocument: (id) => fetchApi(`/documents/${id}`),
  uploadDocument: (formData) => {
    return fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
      }
      return res.json();
    });
  },
  analyzeDocument: (id) => fetchApi(`/documents/${id}/analyze`, { method: 'POST' }),
  approveDocument: (id, payload) => fetchApi(`/documents/${id}/approve`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteDocument: (id) => fetchApi(`/documents/${id}`, { method: 'DELETE' }),

  // Workflows
  getWorkflows: () => fetchApi('/workflows'),
  getWorkflowTemplates: () => fetchApi('/workflows/templates'),
  getWorkflow: (id) => fetchApi(`/workflows/${id}`),
  createWorkflow: (payload) => fetchApi('/workflows', { method: 'POST', body: JSON.stringify(payload) }),

  // Analytics
  getAnalytics: (days = 30) => fetchApi(`/analytics?days=${days}`),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/audit-logs${query ? `?${query}` : ''}`);
  },

  // AI Chat
  chatWithDoc: (document_id, question) => fetchApi('/ai/chat', { method: 'POST', body: JSON.stringify({ document_id, question }) }),

  // Settings
  getSettings: () => fetchApi('/settings'),
  updateSettings: (payload) => fetchApi('/settings', { method: 'POST', body: JSON.stringify(payload) })
};
