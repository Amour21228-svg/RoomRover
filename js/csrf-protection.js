// js/csrf-protection.js - CSRF Token Protection Helper

class CSRFProtection {
  constructor() {
    this.csrfToken = localStorage.getItem('csrfToken');
    this.sessionId = localStorage.getItem('sessionId');
    this.init();
  }

  async init() {
    if (!this.csrfToken || !this.sessionId) {
      await this.fetchTokens();
    }
  }

  async fetchTokens() {
    try {
      const res = await fetch('/api/csrf-token');
      const data = await res.json();
      this.csrfToken = data.csrfToken;
      this.sessionId = data.sessionId;
      localStorage.setItem('csrfToken', this.csrfToken);
      localStorage.setItem('sessionId', this.sessionId);
    } catch (e) {
      console.error('Failed to fetch CSRF tokens:', e);
    }
  }

  // Inject CSRF tokens into form
  injectIntoForm(formElement) {
    if (!this.csrfToken || !this.sessionId) {
      console.warn('CSRF tokens not available');
      return;
    }

    // Create hidden input for CSRF token
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = '_csrfToken';
    csrfInput.value = this.csrfToken;

    // Create hidden input for session ID
    const sessionInput = document.createElement('input');
    sessionInput.type = 'hidden';
    sessionInput.name = '_sessionId';
    sessionInput.value = this.sessionId;

    // Append to form
    formElement.appendChild(csrfInput);
    formElement.appendChild(sessionInput);
  }

  // Inject CSRF tokens into all forms on page
  injectIntoAllForms() {
    document.querySelectorAll('form').forEach(form => {
      this.injectIntoForm(form);
    });
  }

  // Get headers for fetch requests
  getHeaders(additionalHeaders = {}) {
    return {
      'X-CSRF-Token': this.csrfToken || '',
      'X-Session-Id': this.sessionId || '',
      ...additionalHeaders,
    };
  }

  // Safe fetch with CSRF protection
  async fetch(url, options = {}) {
    const headers = {
      ...options.headers,
      ...this.getHeaders(),
    };

    return fetch(url, { ...options, headers });
  }

  // Add CSRF tokens to existing headers
  addToHeaders(headers = {}) {
    return {
      ...headers,
      'X-CSRF-Token': this.csrfToken || '',
      'X-Session-Id': this.sessionId || '',
    };
  }
}

// Initialize CSRF protection globally
const csrfProtection = new CSRFProtection();

// Auto-inject tokens into forms when page loads
document.addEventListener('DOMContentLoaded', () => {
  csrfProtection.injectIntoAllForms();
});
