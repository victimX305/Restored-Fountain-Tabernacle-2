/**
 * Admin Contact / Connect With Us - View and manage contact messages
 */
(function () {
  'use strict';

  const CONTACT_COLLECTION = 'contactMessages';

  function getDb() {
    return firebase && firebase.firestore ? firebase.firestore() : null;
  }

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  window.AdminContact = {
    async listMessages() {
      const db = getDb();
      if (!db) return [];
      const snap = await db.collection(CONTACT_COLLECTION).orderBy('createdAt', 'desc').get();
      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()
      }));
    },

    async updateStatus(id, status) {
      const db = getDb();
      if (!db) throw new Error('Database not available');
      await db.collection(CONTACT_COLLECTION).doc(id).update({
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },

    async deleteMessage(id) {
      const db = getDb();
      if (!db) throw new Error('Database not available');
      await db.collection(CONTACT_COLLECTION).doc(id).delete();
    },

    render(container) {
      if (!container) return;
      container.innerHTML = `
        <div class="admin-users__table-wrap">
          <table class="admin-users__table" id="admin-contact-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Number</th>
                <th>Received</th>
                <th>Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-contact-rows"></tbody>
          </table>
        </div>
      `;

      const tbody = document.getElementById('admin-contact-rows');

      function refresh() {
        AdminContact.listMessages().then(messages => {
          if (!messages.length) {
            tbody.innerHTML = `
              <tr>
                <td colspan="7">
                  <p class="admin-section__text">No messages yet.</p>
                </td>
              </tr>
            `;
            return;
          }

          tbody.innerHTML = messages.map(m => {
            const name = (m.name || '—');
            const email = m.email || '';
            const phone = m.phone || '';
            const received = m.createdAt ? m.createdAt.toLocaleString() : '—';
            const msg = (m.message || '').substring(0, 120) + ((m.message || '').length > 120 ? '…' : '');
            return `
              <tr data-id="${escapeHtml(m.id)}">
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(email || '—')}</td>
                <td>${escapeHtml(phone || '—')}</td>
                <td>${escapeHtml(received)}</td>
                <td title="${escapeHtml(m.message || '')}">${escapeHtml(msg)}</td>
                <td class="admin-users__actions">
                  <button type="button" class="btn btn--small btn--outline" data-status="contacted">Mark contacted</button>
                  <button type="button" class="btn btn--small btn--danger" data-delete="true">Delete</button>
                </td>
              </tr>
            `;
          }).join('');

          tbody.querySelectorAll('tr').forEach(row => {
            const id = row.getAttribute('data-id');
            const contactedBtn = row.querySelector('[data-status="contacted"]');
            const deleteBtn = row.querySelector('[data-delete]');

            if (contactedBtn) {
              contactedBtn.addEventListener('click', () => {
                AdminContact.updateStatus(id, 'contacted').then(refresh);
              });
            }
            if (deleteBtn) {
              deleteBtn.addEventListener('click', () => {
                if (confirm('Delete this message?')) {
                  AdminContact.deleteMessage(id).then(refresh);
                }
              });
            }
          });
        });
      }

      refresh();
    }
  };
})();

