/**
 * Public Blog - Fetch and display published posts; same card size as index; view full post in modal.
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

  function nl2br(s) {
    return (s || '').replace(/\n/g, '<br>');
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
  const modal = document.getElementById('blog-post-modal');
  const modalBody = document.getElementById('blog-post-modal-body');
  const modalCloseBackdrop = document.getElementById('blog-post-modal-close');
  const modalCloseBtn = document.getElementById('blog-post-modal-close-btn');
  if (!container) return;

  function openPostModal(post) {
    const date = post.createdAt && post.createdAt.toDate ? post.createdAt.toDate().toLocaleDateString() : '';
    const imgHtml = post.imageUrl
      ? '<div class="blog-card__img-container"><img src="' + escapeHtml(post.imageUrl) + '" alt="" class="blog-post-modal__img" loading="lazy"></div>'
      : '';
    modalBody.innerHTML =
      imgHtml +
      '<h2 class="blog-post-modal__title" id="blog-post-modal-title">' + escapeHtml(post.title || 'Untitled') + '</h2>' +
      '<p class="blog-post-modal__meta">' + escapeHtml(post.authorName || '') + ' • ' + date + '</p>' +
      '<div class="blog-post-modal__text">' + nl2br(escapeHtml(post.content || '')) + '</div>';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closePostModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  if (modalCloseBackdrop) modalCloseBackdrop.addEventListener('click', closePostModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closePostModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) closePostModal();
  });

  loadPublishedPosts().then(posts => {
    if (posts.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    container.innerHTML = posts.map((p, index) => {
      const date = p.createdAt && p.createdAt.toDate ? p.createdAt.toDate().toLocaleDateString() : '';
      const excerpt = p.excerpt || (p.content ? p.content.substring(0, 120) + (p.content.length > 120 ? '…' : '') : '');
      const imgHtml = p.imageUrl
        ? '<div class="blog-card__img-container"><img src="' + escapeHtml(p.imageUrl) + '" alt="" class="home-blog-card__img" loading="lazy"></div>'
        : '';
      return (
        '<article class="home-blog-card blog-card" data-post-index="' + index + '">' +
        imgHtml +
        '<div class="home-blog-card__body">' +
        '<h3 class="blog-card__title">' + escapeHtml(p.title || 'Untitled') + '</h3>' +
        '<p class="blog-card__meta">' + escapeHtml(p.authorName || '') + ' • ' + date + '</p>' +
        '<p class="blog-card__excerpt">' + escapeHtml(excerpt) + '</p>' +
        '<button type="button" class="btn btn--outline btn--small blog-card__read-more">Read more</button>' +
        '</div></article>'
      );
    }).join('');

    container.querySelectorAll('.blog-card__read-more').forEach((btn, i) => {
      const card = btn.closest('[data-post-index]');
      const index = parseInt(card.getAttribute('data-post-index'), 10);
      btn.addEventListener('click', () => openPostModal(posts[index]));
    });
  }).catch(err => {
    console.error(err);
    container.innerHTML = '<p class="blog__error">Unable to load posts.</p>';
  });
})();
