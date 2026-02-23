/**
 * Admin Users Management - List users, promote/demote, remove
 */
(function () {
  'use strict';

  const USERS_COLLECTION = 'users';

  function getDb() {
    return firebase && firebase.firestore ? firebase.firestore() : null;
  }

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  window.AdminUsers = {
    /** List all users from Firestore */
    async listUsers() {
      const db = getDb();
      if (!db) return [];
      const snap = await db.collection(USERS_COLLECTION).orderBy('createdAt', 'desc').get();
      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()
      }));
    },

    /** Update user role */
    async updateRole(uid, role) {
      const db = getDb();
      if (!db) throw new Error('Database not available');
      await db.collection(USERS_COLLECTION).doc(uid).update({
        role: role,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },

    /** Delete user document (removes from app; Auth account remains) */
    async deleteUser(uid) {
      const db = getDb();
      if (!db) throw new Error('Database not available');
      await db.collection(USERS_COLLECTION).doc(uid).delete();
    },

    /** Render users section UI */
    render(container) {
      if (!container) return;
      container.innerHTML = `
        <div class="admin-users__list" id="users-list"></div>
      `;

      const listEl = document.getElementById('users-list');
      const currentUid = Auth && Auth.getCurrentUser ? (Auth.getCurrentUser() && Auth.getCurrentUser().uid) : null;

      function refreshList() {
        AdminUsers.listUsers().then(users => {
          if (users.length === 0) {
            listEl.innerHTML = '<p class="admin-section__text">No users yet.</p>';
            return;
          }
          listEl.innerHTML = `
            <div class="admin-users__table-wrap">
              <table class="admin-users__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.map(u => `
                    <tr data-uid="${escapeHtml(u.id)}">
                      <td>${escapeHtml(u.displayName || '—')}</td>
                      <td>${escapeHtml(u.email || '—')}</td>
                      <td><span class="admin-users__role admin-users__role--${escapeHtml(u.role || 'user')}">${escapeHtml(u.role || 'user')}</span></td>
                      <td>${u.createdAt ? u.createdAt.toLocaleDateString() : '—'}</td>
                      <td class="admin-users__actions">
                        ${u.id !== currentUid ? `
                          ${(u.role || 'user') === 'user' ? `<button type="button" class="btn btn--small btn--outline" data-promote="${escapeHtml(u.id)}">Make Admin</button>` : `<button type="button" class="btn btn--small btn--outline" data-demote="${escapeHtml(u.id)}">Demote</button>`}
                          <button type="button" class="btn btn--small btn--danger" data-remove="${escapeHtml(u.id)}">Remove</button>
                        ` : '<span class="admin-users__you">(you)</span>'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
          listEl.querySelectorAll('[data-promote]').forEach(btn => {
            btn.addEventListener('click', () => {
              if (confirm('Promote this user to admin?')) {
                AdminUsers.updateRole(btn.dataset.promote, 'admin').then(refreshList);
              }
            });
          });
          listEl.querySelectorAll('[data-demote]').forEach(btn => {
            btn.addEventListener('click', () => {
              if (confirm('Demote this user to regular member?')) {
                AdminUsers.updateRole(btn.dataset.demote, 'user').then(refreshList);
              }
            });
          });
          listEl.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
              if (confirm('Remove this user? They will lose access to the site.')) {
                AdminUsers.deleteUser(btn.dataset.remove).then(refreshList);
              }
            });
          });
        });
      }

      refreshList();
    }
  };
})();
