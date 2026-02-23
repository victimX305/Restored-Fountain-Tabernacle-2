/**
 * Public Blog - Fetch and display published posts (no auth required for read)
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

  async function loadPublishedPosts() {
    const db = getDb();
    if (!db) return [];
    const snap = await db.collection(POSTS_COLLECTION)
      .where('published', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  const container = document.getElementById('blog-posts');
  const emptyEl = document.getElementById('blog-empty');
  if (!container) return;

  loadPublishedPosts().then(posts => {
    if (posts.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    container.innerHTML = posts.map(p => {
      const date = p.createdAt && p.createdAt.toDate ? p.createdAt.toDate().toLocaleDateString() : '';
      const excerpt = p.excerpt || (p.content ? p.content.substring(0, 150) + (p.content.length > 150 ? '…' : '') : '');
      return `
        <article class="blog-card">
          <h2 class="blog-card__title">${escapeHtml(p.title || 'Untitled')}</h2>
          <p class="blog-card__meta">${escapeHtml(p.authorName || '')} • ${date}</p>
          <p class="blog-card__excerpt">${escapeHtml(excerpt)}</p>
          <a href="blog-post.html?id=${encodeURIComponent(p.id)}" class="btn btn--outline btn--small">Read more</a>
        </article>
      `;
    }).join('');
  }).catch(err => {
    console.error(err);
    container.innerHTML = '<p class="blog__error">Unable to load posts.</p>';
  });
})();
