// lib/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        this.clearToken();
        // Rediriger vers login si nécessaire
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.data?.token) {
      this.setToken(data.data.token);
    }
    
    return data;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile() {
    return this.request('/users/profile/me');
  }

  // Members
  async getMembers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getMember(id) {
    return this.request(`/users/${id}`);
  }

  async createMember(memberData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async updateMember(id, memberData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  }

  async deleteMember(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Events
  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/events${queryString ? `?${queryString}` : ''}`);
  }

  async getEvent(id) {
    return this.request(`/events/${id}`);
  }

  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id, eventData) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Contributions
  async getContributions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/contributions${queryString ? `?${queryString}` : ''}`);
  }

  async getContribution(id) {
    return this.request(`/contributions/${id}`);
  }

  async createContribution(contributionData) {
    return this.request('/contributions', {
      method: 'POST',
      body: JSON.stringify(contributionData),
    });
  }

  async updateContribution(id, contributionData) {
    return this.request(`/contributions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contributionData),
    });
  }

  async deleteContribution(id) {
    return this.request(`/contributions/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getDashboardStats() {
    return this.request('/reports/dashboard');
  }

  async getFinancialReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/financial${queryString ? `?${queryString}` : ''}`);
  }

  // Organizations (si votre backend les supporte)
  async getOrganizations() {
    return this.request('/organizations');
  }

  async getOrganizationMembers(orgId) {
    return this.request(`/organizations/${orgId}/members`);
  }
}

export const api = new ApiService();