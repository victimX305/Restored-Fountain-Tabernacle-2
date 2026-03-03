/**
 * Admin Membership Management - View and update membership applications
 */
(function () {
  'use strict';

  const MEMBERS_COLLECTION = 'members';

  function getDb() {
    return firebase && firebase.firestore ? firebase.firestore() : null;
  }

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  window.AdminMembership = {
    async listMembers() {
      const db = getDb();
      if (!db) return [];
      const snap = await db.collection(MEMBERS_COLLECTION).orderBy('createdAt', 'desc').get();
      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()
      }));
    },

    async updateStatus(id, status) {
      const db = getDb();
      if (!db) throw new Error('Database not available');
      await db.collection(MEMBERS_COLLECTION).doc(id).update({
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },

    async deleteMember(id) {
      const db = getDb();
      if (!db) throw new Error('Database not available');
      await db.collection(MEMBERS_COLLECTION).doc(id).delete();
    },

    render(container) {
      if (!container) return;
      container.innerHTML = `
        <div class="admin-users__table-wrap">
          <table class="admin-users__table" id="admin-membership-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Marital status</th>
                <th>Children</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-membership-rows"></tbody>
          </table>
        </div>
        <div class="admin-membership__modal" id="admin-membership-modal" aria-hidden="true">
          <div class="admin-membership__modal-backdrop" data-close="membership-modal"></div>
          <div class="admin-membership__modal-content">
            <button type="button" class="admin-membership__modal-close" data-close="membership-modal">&times;</button>
            <h3 class="admin-membership__modal-title">Membership application</h3>
            <div class="admin-membership__modal-body" id="admin-membership-modal-body"></div>
          </div>
        </div>
      `;

      const tbody = document.getElementById('admin-membership-rows');
      const modal = document.getElementById('admin-membership-modal');
      const modalBody = document.getElementById('admin-membership-modal-body');

      function openModal(member) {
        if (!modal || !modalBody) return;
        const p = member.personal || {};
        const s = member.spouse || null;
        const c = member.childrenInfo || {};

        function field(label, value) {
          return `<div class="admin-membership__field"><span class="admin-membership__field-label">${escapeHtml(label)}:</span> <span class="admin-membership__field-value">${escapeHtml(value || '—')}</span></div>`;
        }

        const childrenList = (c.children || []).map((ch, index) => `
          <div class="admin-membership__child">
            <div class="admin-membership__field"><span class="admin-membership__field-label">Child ${index + 1}:</span> <span class="admin-membership__field-value">${escapeHtml((ch.name || '') + ' ' + (ch.surname || ''))}</span></div>
            ${field('ID number', ch.idNumber)}
            ${field('Age', ch.age)}
            ${field('Cell number', ch.cellNumber)}
          </div>
        `).join('');

        modalBody.innerHTML = `
          <div class="admin-membership__section">
            <h4>Personal details</h4>
            ${field('Name', (p.name || '') + ' ' + (p.surname || ''))}
            ${field('Cell number', p.cellNumber)}
            ${field('Age', p.age)}
            ${field('Home address', p.homeAddress)}
            ${field('Marital status', p.maritalStatus)}
            ${field('Baptised', p.baptized)}
            ${field('South African citizen', p.southAfricanCitizen)}
            ${field('ID number', p.idNumber)}
            ${field('Employed', p.employed)}
            ${field('Scholar / student', p.scholar)}
          </div>
          ${s ? `
          <div class="admin-membership__section">
            <h4>Spouse details</h4>
            ${field('Name', (s.name || '') + ' ' + (s.surname || ''))}
            ${field('Cell number', s.cellNumber)}
            ${field('ID number', s.idNumber)}
            ${field('Home address', s.homeAddress)}
            ${field('Born again', s.bornAgain)}
            ${field('Baptised', s.baptized)}
            ${field('Employed', s.employed)}
          </div>` : ''}
          <div class="admin-membership__section">
            <h4>Children details</h4>
            ${field('Has children', c.hasChildren ? 'Yes' : 'No')}
            ${field('Number of children', c.numberOfChildren)}
            ${childrenList || '<p class="admin-section__text">No children listed.</p>'}
            ${c.hasChildren ? `
              ${field('Dedicated to God', c.dedicatedToGod)}
              ${field('Accepted Jesus', c.acceptedJesus)}
              ${field('Baptised', c.baptized)}
            ` : ''}
          </div>
        `;

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      }

      function closeModal() {
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }

      if (modal) {
        modal.querySelectorAll('[data-close="membership-modal"]').forEach(el => {
          el.addEventListener('click', closeModal);
        });
      }

      function refresh() {
        AdminMembership.listMembers().then(members => {
          if (!members.length) {
            tbody.innerHTML = `
              <tr>
                <td colspan="7">
                  <p class="admin-section__text">No membership applications yet.</p>
                </td>
              </tr>
            `;
            return;
          }
          tbody.innerHTML = members.map(m => {
            const p = m.personal || {};
            const c = m.childrenInfo || {};
            const fullName = `${p.name || ''} ${p.surname || ''}`.trim() || '—';
            const childrenLabel = c.hasChildren ? (c.numberOfChildren || 0) + ' child(ren)' : 'None';
            const submitted = m.createdAt ? m.createdAt.toLocaleDateString() : '—';
            const status = m.status || 'new';
            return `
              <tr data-id="${escapeHtml(m.id)}">
                <td>${escapeHtml(fullName)}</td>
                <td>${escapeHtml(p.cellNumber || '')}</td>
                <td>${escapeHtml(p.maritalStatus || '')}</td>
                <td>${escapeHtml(childrenLabel)}</td>
                <td>${escapeHtml(status)}</td>
                <td>${escapeHtml(submitted)}</td>
                <td class="admin-users__actions">
                  <button type="button" class="btn btn--small btn--outline" data-view="true">View Form</button>
                  <button type="button" class="btn btn--small btn--outline" data-status="member">Mark member</button>
                  <button type="button" class="btn btn--small btn--danger" data-delete="true">Delete</button>
                </td>
              </tr>
            `;
          }).join('');

          tbody.querySelectorAll('tr').forEach(row => {
            const id = row.getAttribute('data-id');
            const viewBtn = row.querySelector('[data-view]');
            const memberBtn = row.querySelector('[data-status="member"]');
            const deleteBtn = row.querySelector('[data-delete]');

            if (viewBtn) {
              viewBtn.addEventListener('click', () => {
                const member = members.find(x => x.id === id);
                if (member) openModal(member);
              });
            }
            if (memberBtn) {
              memberBtn.addEventListener('click', () => {
                AdminMembership.updateStatus(id, 'member').then(refresh);
              });
            }
            if (deleteBtn) {
              deleteBtn.addEventListener('click', () => {
                if (confirm('Delete this membership application?')) {
                  AdminMembership.deleteMember(id).then(refresh);
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

