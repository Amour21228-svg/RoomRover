// js/rbac-guard.js - Frontend RBAC Protection

class RBACGuard {
  /**
   * Protect a page based on required roles
   * Usage: <script>new RBACGuard('tenant');</script>
   */
  constructor(requiredRoles = ['tenant', 'owner', 'admin']) {
    this.requiredRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    this.init();
  }

  init() {
    // Check if user is authenticated
    if (!auth.isAuthenticated()) {
      this.redirectToLogin();
      return;
    }

    // Check if user has required role
    if (!this.requiredRoles.includes(auth.user.role)) {
      this.redirectToUnauthorized();
      return;
    }

    // User is authorized, show content
    this.allowAccess();
  }

  redirectToLogin() {
    console.warn('🔒 Authentication required');
    window.location.href = '/login.html';
  }

  redirectToUnauthorized() {
    console.warn('🔒 Access denied - insufficient permissions');
    // Pour maintenant, rediriger vers le dashboard correct
    const dashboards = {
      'tenant': '/tenant.html',
      'owner': '/owner.html',
      'admin': '/admin.html',
    };
    window.location.href = dashboards[auth.user.role] || '/pages/index.html';
  }

  allowAccess() {
    console.log('✅ Access granted for role:', auth.user.role);
    // Masquer le contenu "loading" et afficher le contenu réel
    const loader = document.getElementById('loading');
    if (loader) loader.style.display = 'none';
    
    document.body.style.opacity = '1';
  }
}

// Helper function to display user info in sidebar
function displayUserInfo() {
  if (!auth.isAuthenticated()) return;

  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  const userRoleEl = document.getElementById('userRole');

  if (userNameEl) {
    userNameEl.textContent = `${auth.user.firstName} ${auth.user.lastName}`;
  }
  if (userEmailEl) {
    userEmailEl.textContent = auth.user.email;
  }
  if (userRoleEl) {
    userRoleEl.textContent = auth.user.role === 'tenant' ? 'Locataire' : auth.user.role === 'owner' ? 'Propriétaire' : 'Administrateur';
  }
}

// Helper to logout
function logout() {
  auth.logout();
  window.location.href = '/pages/index.html';
}
