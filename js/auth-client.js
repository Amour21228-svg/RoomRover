// js/auth-client.js - Authentication Client-Side Management

class AuthClient {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = this.token ? this.decodeToken() : null;
    this.csrfToken = null;
    this.sessionId = null;
    this.initCSRFToken();
  }

  // Initialize CSRF token from server
  async initCSRFToken() {
    try {
      const res = await fetch('/api/csrf-token');
      const data = await res.json();
      this.csrfToken = data.csrfToken;
      this.sessionId = data.sessionId;
      localStorage.setItem('csrfToken', this.csrfToken);
      localStorage.setItem('sessionId', this.sessionId);
    } catch (e) {
      console.warn('Failed to load CSRF token:', e.message);
    }
  }

  // Decode JWT token (sans vérification - fait côté serveur)
  decodeToken() {
    try {
      const payload = this.token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  // Register
  async register(email, password, firstName, lastName, role) {
    try {
      const csrfToken = localStorage.getItem('csrfToken') || this.csrfToken;
      const sessionId = localStorage.getItem('sessionId') || this.sessionId;
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
          'X-Session-Id': sessionId || '',
        },
        body: JSON.stringify({ email, password, firstName, lastName, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur d\'inscription');
      }

      this.setToken(data.token);
      this.user = data.user;

      return {
        success: true,
        user: data.user,
        redirectUrl: data.redirectUrl,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Login
  async login(email, password) {
    try {
      const csrfToken = localStorage.getItem('csrfToken') || this.csrfToken;
      const sessionId = localStorage.getItem('sessionId') || this.sessionId;
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
          'X-Session-Id': sessionId || '',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      this.setToken(data.token);
      this.user = data.user;

      return {
        success: true,
        user: data.user,
        redirectUrl: data.redirectUrl,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    this.token = null;
    this.user = null;
  }

  // Set Token
  setToken(token) {
    localStorage.setItem('authToken', token);
    this.token = token;
  }

  // Get Token
  getToken() {
    return this.token;
  }

  // Get User
  getUser() {
    return this.user;
  }

  // Check if Authenticated
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Verify Role
  hasRole(role) {
    return this.user && this.user.role === role;
  }

  // Fetch with Auth Header
  async fetchWithAuth(url, options = {}) {
    const csrfToken = localStorage.getItem('csrfToken') || this.csrfToken;
    const sessionId = localStorage.getItem('sessionId') || this.sessionId;
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.token}`,
      'X-CSRF-Token': csrfToken || '',
      'X-Session-Id': sessionId || '',
    };

    return fetch(url, { ...options, headers });
  }
}

// Global instance
const auth = new AuthClient();
