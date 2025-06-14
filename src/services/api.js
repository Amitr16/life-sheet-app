// API service for Life Sheet backend integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method for making API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication APIs
  async register(userData) {
    return this.request('/register', {
      method: 'POST',
      body: userData,
    });
  }

  async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: credentials,
    });
  }

  async logout() {
    return this.request('/logout', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request('/profile');
  }

  async updateProfile(profileData) {
    return this.request('/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  async changePassword(passwordData) {
    return this.request('/change-password', {
      method: 'POST',
      body: passwordData,
    });
  }

  // OAuth APIs
  async initiateGoogleLogin() {
    // Get the OAuth URL from backend
    const response = await this.request('/oauth/google/login', {
      method: 'GET',
    });
    return response;
  }

  async initiateFacebookLogin() {
    // Get the OAuth URL from backend
    const response = await this.request('/oauth/facebook/login', {
      method: 'GET',
    });
    return response;
  }

  // Demo OAuth APIs (for testing)
  async googleLoginDemo() {
    return this.request('/oauth/demo/google', {
      method: 'GET',
    });
  }

  async facebookLoginDemo() {
    return this.request('/oauth/demo/facebook', {
      method: 'GET',
    });
  }

  // Financial APIs
  async createFinancialProfile(profileData) {
    return this.request('/financial/profile', {
      method: 'POST',
      body: profileData,
    });
  }

  async getFinancialProfile(userId) {
    return this.request(`/financial/profile/${userId}`);
  }

  async updateFinancialProfile(profileId, profileData) {
    return this.request(`/financial/profile/${profileId}`, {
      method: 'PUT',
      body: profileData,
    });
  }

  async createFinancialGoal(goalData) {
    return this.request('/financial/goals', {
      method: 'POST',
      body: goalData,
    });
  }

  async getFinancialGoals(userId) {
    return this.request(`/financial/goals/${userId}`);
  }

  async updateFinancialGoal(goalId, goalData) {
    return this.request(`/financial/goals/${goalId}`, {
      method: 'PUT',
      body: goalData,
    });
  }

  async deleteFinancialGoal(goalId) {
    return this.request(`/financial/goals/${goalId}`, {
      method: 'DELETE',
    });
  }

  // Financial Expenses APIs
  async createFinancialExpense(expenseData) {
    return this.request('/financial/expenses', {
      method: 'POST',
      body: expenseData,
    });
  }

  async getFinancialExpenses(userId) {
    return this.request(`/financial/expenses/${userId}`);
  }

  async updateFinancialExpense(expenseId, expenseData) {
    return this.request(`/financial/expenses/${expenseId}`, {
      method: 'PUT',
      body: expenseData,
    });
  }

  async deleteFinancialExpense(expenseId) {
    return this.request(`/financial/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  async createFinancialScenario(scenarioData) {
    return this.request('/financial/scenarios', {
      method: 'POST',
      body: scenarioData,
    });
  }

  async getFinancialScenarios(userId) {
    return this.request(`/financial/scenarios/${userId}`);
  }

  async createFinancialLoan(data) {
    return this.request('/financial/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFinancialLoans(userId) {
    return this.request(`/financial/loans/${userId}`);
  }

  async updateFinancialLoan(loanId, data) {
    return this.request(`/financial/loans/${loanId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFinancialLoan(loanId) {
    return this.request(`/financial/loans/${loanId}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();

