/**
 * Admin Blog Management - Create, edit, delete posts
 */
(function () {
  'use strict';

  const POSTS_COLLECTION = 'posts';

  function getDb() {
    return firebase && firebase.firestore ? firebase.firestore() : null;
  }

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  window.AdminBlog = {
    /** List all posts (admin view) */
    async listPosts() {
      const db = getDb();
      if (!db) return [];
      const snap = await db.collection(POSTS_COLLECTION).orderBy('createdAt', 'desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() }));
    },

    /** Get single post */
    async getPost(id) {
      const db = getDb();
      if (!db) return null;
      const doc = await db.collection(POSTS_COLLECTION).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    /** Create post */
    async createPost(data) {
      const db = getDb();
      const user = Auth && Auth.getCurrentUser ? Auth.getCurrentUser() : null;
      if (!db || !user) throw new Error('Not authorized');
      const doc = {
        title: data.title || '',
        content: data.content || '',
        excerpt: data.excerpt || '',
        published: !!data.published,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Admin',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const ref = await db.collection(POSTS_COLLECTION).add(doc);
      return ref.id;
    },

    /** Update post */
    async updatePost(id, data) {
      const db = getDb();
      if (!db) throw new Error('Database not available');
      await db.collection(POSTS_COLLECTION).doc(id).update({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        published: !!data.published,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },

    /** Delete post */
    async deletePost(id) {
      const db = getDb();
      if (!db) throw new Error('Database not available');
      await db.collection(POSTS_COLLECTION).doc(id).delete();
    },

    /** Render blog section UI */
    render(container) {
      if (!container) return;
      container.innerHTML = `
        <div class="admin-blog__toolbar">
          <button type="button" class="btn btn--primary" id="blog-add-btn">+ New Post</button>
        </div>
        <div class="admin-blog__list" id="blog-list"></div>
        <div class="admin-blog__modal modal" id="blog-modal" aria-hidden="true">
          <div class="admin-blog__modal-backdrop" data-close="blog-modal"></div>
          <div class="admin-blog__modal-content">
            <button type="button" class="admin-blog__modal-close" data-close="blog-modal">&times;</button>
            <h3 class="admin-blog__modal-title" id="blog-modal-title">New Post</h3>
            <form id="blog-form">
              <input type="hidden" id="blog-id">
              <label class="admin-login__label">Title</label>
              <input type="text" id="blog-title" class="admin-login__input" required placeholder="Post title">
              <label class="admin-login__label">Excerpt (optional)</label>
              <input type="text" id="blog-excerpt" class="admin-login__input" placeholder="Short summary">
              <label class="admin-login__label">Content</label>
              <textarea id="blog-content" class="admin-login__input admin-blog__textarea" rows="8" required placeholder="Post content"></textarea>
              <label class="admin-blog__checkbox-wrap">
                <input type="checkbox" id="blog-published" checked> Published
              </label>
              <div class="admin-blog__modal-actions">
                <button type="button" class="btn btn--outline" data-close="blog-modal">Cancel</button>
                <button type="submit" class="btn btn--primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const listEl = document.getElementById('blog-list');
      const modal = document.getElementById('blog-modal');
      const form = document.getElementById('blog-form');
      const addBtn = document.getElementById('blog-add-btn');

      function openModal(editId) {
        document.getElementById('blog-modal-title').textContent = editId ? 'Edit Post' : 'New Post';
        document.getElementById('blog-id').value = editId || '';
        if (editId) {
          AdminBlog.getPost(editId).then(p => {
            document.getElementById('blog-title').value = p.title || '';
            document.getElementById('blog-excerpt').value = p.excerpt || '';
            document.getElementById('blog-content').value = p.content || '';
            document.getElementById('blog-published').checked = !!p.published;
          });
        } else {
          document.getElementById('blog-title').value = '';
          document.getElementById('blog-excerpt').value = '';
          document.getElementById('blog-content').value = '';
          document.getElementById('blog-published').checked = true;
        }
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      }

      function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }

      function refreshList() {
        AdminBlog.listPosts().then(posts => {
          if (posts.length === 0) {
            listEl.innerHTML = '<p class="admin-section__text">No posts yet. Click "New Post" to create one.</p>';
            return;
          }
          listEl.innerHTML = posts.map(p => `
            <div class="admin-blog__item" data-id="${escapeHtml(p.id)}">
              <div class="admin-blog__item-main">
                <h4 class="admin-blog__item-title">${escapeHtml(p.title || 'Untitled')}</h4>
                <span class="admin-blog__item-meta">${p.published ? 'Published' : 'Draft'} • ${p.createdAt ? p.createdAt.toLocaleDateString() : '—'}</span>
              </div>
              <div class="admin-blog__item-actions">
                <button type="button" class="btn btn--small btn--outline" data-edit="${escapeHtml(p.id)}">Edit</button>
                <button type="button" class="btn btn--small btn--danger" data-delete="${escapeHtml(p.id)}">Delete</button>
              </div>
            </div>
          `).join('');
          listEl.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.edit)));
          listEl.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => {
            if (confirm('Delete this post?')) {
              AdminBlog.deletePost(btn.dataset.delete).then(refreshList);
            }
          }));
        });
      }

      addBtn.addEventListener('click', () => openModal());
      container.querySelectorAll('[data-close="blog-modal"]').forEach(el => el.addEventListener('click', closeModal));
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('blog-id').value;
        const data = {
          title: document.getElementById('blog-title').value.trim(),
          excerpt: document.getElementById('blog-excerpt').value.trim(),
          content: document.getElementById('blog-content').value.trim(),
          published: document.getElementById('blog-published').checked
        };
        try {
          if (id) await AdminBlog.updatePost(id, data);
          else await AdminBlog.createPost(data);
          closeModal();
          refreshList();
        } catch (err) {
          alert(err.message || 'Failed to save');
        }
      });

      refreshList();
    }
  };
})();
