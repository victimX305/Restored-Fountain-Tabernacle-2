/**
 * Auth Header - Updates nav based on login state
 * Admin link shown only when user has admin role
 */
(function () {
  'use strict';

  const authEl = document.getElementById('header-auth');
  if (!authEl) return;

  function renderLoggedOut() {
    authEl.innerHTML = '<a href="login.html">Login</a><a href="register.html">Register</a>';
  }

  function renderLoggedIn(user, role) {
    const name = user.displayName || user.email || 'Account';
    let html = '<span class="site-header__user">' + escapeHtml(name) + '</span>';
    if (role === 'admin') {
      html += '<a href="admin-dashboard.html">Admin</a>';
    }
    html += '<a href="#" id="header-logout">Log Out</a>';
    authEl.innerHTML = html;
    const logoutBtn = document.getElementById('header-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof Auth !== 'undefined') Auth.signOut();
        window.location.reload();
      });
    }
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  if (typeof Auth !== 'undefined' && Auth.onAuthStateChanged) {
    Auth.onAuthStateChanged(function (user, role) {
      if (user) {
        renderLoggedIn(user, role || 'user');
      } else {
        renderLoggedOut();
      }
    });
  } else {
    renderLoggedOut();
  }
})();
