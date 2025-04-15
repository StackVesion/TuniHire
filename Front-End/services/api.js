const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = {
  async fetch(endpoint, options = {}) {
    try {
      const defaultOptions = {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        ...options,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },
  
  jobs: {
    getAll: () => api.fetch('/api/jobs'),
    getById: (id) => api.fetch(`/api/jobs/${id}`),
  }
};

export default api;
