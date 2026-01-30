// Trigger redeploy: trivial change for Vercel
document.addEventListener('DOMContentLoaded', () => {
  // Lazy load background images after page is ready
  setTimeout(() => {
    document.body.classList.add('images-loaded');
  }, 100);

  const params = new URLSearchParams(window.location.search);
  const isPatron = params.get('patron') === 'true';

  const contentWrapper = document.getElementById('content-wrapper');
  const accessDeniedModal = document.getElementById('access-denied-modal');
  const loginRedirectBtn = document.getElementById('login-redirect-btn');

  // --- Start of original inline script logic ---
  let posts = [];
  let infoPages = [];
  // Helper: API base URL (adjust if needed)
  const API_BASE = 'https://portfolio-and-blog-production.up.railway.app/api/blog';

  // Fetch posts and info pages from backend
  async function fetchPosts() {
    const res = await fetch(`${API_BASE}/posts`);
    posts = await res.json();
  }
  async function fetchInfoPages() {
    const res = await fetch(`${API_BASE}/info`);
    infoPages = await res.json();
  }

  // Initial load
  async function loadBlogData() {
    await fetchPosts();
    await fetchInfoPages();
    render();
  }
  let editingPost = null;
  let editingInfo = null;

  // Blog admin password is injected at build time for security
  const BLOG_ADMIN_PASSWORD = '@3mystic!';
  function requireAuth(callback) {
    const pass = prompt("Password:");
    if (pass === BLOG_ADMIN_PASSWORD) callback();
    else alert("Wrong password");
  }

  // Rich text formatting functions
  window.formatText = function(command) {
    const editor = document.getElementById('post-content');
    editor.focus();
    
    switch(command) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'underline':
        document.execCommand('underline', false, null);
        break;
      case 'h2':
        document.execCommand('formatBlock', false, '<h2>');
        break;
      case 'h3':
        document.execCommand('formatBlock', false, '<h3>');
        break;
      case 'ul':
        document.execCommand('insertUnorderedList', false, null);
        break;
      case 'ol':
        document.execCommand('insertOrderedList', false, null);
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) document.execCommand('createLink', false, url);
        break;
      case 'quote':
        document.execCommand('formatBlock', false, '<blockquote>');
        break;
      case 'hr':
        document.execCommand('insertHorizontalRule', false, null);
        break;
    }
  }

  window.formatInfoText = function(command) {
    const editor = document.getElementById('info-body');
    editor.focus();
    
    switch(command) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'underline':
        document.execCommand('underline', false, null);
        break;
      case 'h2':
        document.execCommand('formatBlock', false, '<h2>');
        break;
      case 'h3':
        document.execCommand('formatBlock', false, '<h3>');
        break;
      case 'ul':
        document.execCommand('insertUnorderedList', false, null);
        break;
      case 'ol':
        document.execCommand('insertOrderedList', false, null);
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) document.execCommand('createLink', false, url);
        break;
      case 'quote':
        document.execCommand('formatBlock', false, '<blockquote>');
        break;
      case 'hr':
        document.execCommand('insertHorizontalRule', false, null);
        break;
    }
  }

  window.openWriteModal = function() {
    requireAuth(() => {
      document.getElementById('write-modal').style.display = 'flex';
    });
  }

  window.closeWriteModal = function() { document.getElementById('write-modal').style.display = 'none'; }

  window.openBlogEditor = function() {
    closeWriteModal();
    document.getElementById('editor').style.display = 'flex';
    document.getElementById('post-title').value = '';
    document.getElementById('post-content').innerHTML = '';
    document.getElementById('editor-title').textContent = 'Write Blog Post';
    document.getElementById('delete-btn').style.display = 'none';
    editingPost = null;
  }

    window.openInfoEditor = function() {
    closeWriteModal();
    document.getElementById('info-editor').style.display = 'flex';
    document.getElementById('info-name').value = '';
    document.getElementById('info-body').innerHTML = '';
    document.getElementById('info-title').textContent = 'Add Info Page';
    document.getElementById('info-delete').style.display = 'none';
    editingInfo = null;
  }

  window.showHome = function() {
    document.getElementById('home-view').style.display = 'block';
    document.getElementById('single-post').style.display = 'none';
    document.getElementById('info-page').style.display = 'none';
    render();
  }

  window.showPost = function(id) {
    const p = posts.find(x => x.id == id);
    // Sort oldest first for navigation (same as Contents)
    const chronological = [...posts].sort((a,b) => new Date(a.date) - new Date(b.date));
    const currentIndex = chronological.findIndex(x => x.id == id);
    const prevPost = currentIndex > 0 ? chronological[currentIndex - 1] : null;
    const nextPost = currentIndex < chronological.length - 1 ? chronological[currentIndex + 1] : null;
    
    document.getElementById('single-content').innerHTML = `
      <h1 style="color:#fff;">${p.title}</h1>
      <div class="rainbow-date">${new Date(p.date).toLocaleDateString()}</div>
      <div style="line-height:1.8;">${p.content}</div>
      <br><a href="#" onclick="editPost('${id}')" class="edit-link">edit</a>
    `;
    
    // Set up prev/next navigation
    const prevBtn = document.getElementById('prev-post');
    const nextBtn = document.getElementById('next-post');
    
    if (prevPost) {
      prevBtn.style.visibility = 'visible';
      prevBtn.onclick = (e) => { e.preventDefault(); showPost(prevPost.id); };
    } else {
      prevBtn.style.visibility = 'hidden';
    }
    
    if (nextPost) {
      nextBtn.style.visibility = 'visible';
      nextBtn.onclick = (e) => { e.preventDefault(); showPost(nextPost.id); };
    } else {
      nextBtn.style.visibility = 'hidden';
    }
    
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('single-post').style.display = 'block';
    window.scrollTo(0, 0);
  }

  window.showInfo = function(id) {
    const p = infoPages.find(x => x.id == id);
    document.getElementById('info-content').innerHTML = `
      <h1 style="color:#fff;">${p.name}</h1>
      <div style="line-height:1.8;">${p.body}</div>
      <br><a href="#" onclick="editInfo('${id}')" class="edit-link">edit</a>
    `;
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('info-page').style.display = 'block';
    window.scrollTo(0, 0);
  }

  // Helper to strip HTML for excerpts
  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  function render() {
    const sorted = [...posts].sort((a,b) => new Date(b.date) - new Date(a.date));
    const latest = sorted[0];

    if (latest) {
      const plainText = stripHtml(latest.content);
      document.getElementById('latest-excerpt').textContent = plainText.substring(0, 180) + (plainText.length > 180 ? '...' : '');
      document.getElementById('latest-date').textContent = `(${new Date(latest.date).toLocaleDateString()})`;
      
      // Make "Latest installment" clickable (keep the text as is)
      const latestTitle = document.getElementById('latest-title');
      if(latestTitle) {
        latestTitle.onclick = e => { e.preventDefault(); showPost(latest.id); };
      }
      
      const readMore = document.getElementById('read-more');
      if(readMore) readMore.onclick = e => { e.preventDefault(); showPost(latest.id); };
    } else {
      document.getElementById('latest-excerpt').textContent = 'Begin your journey...';
    }

    // Contents: oldest first (chronological order for reading the story)
    const chronological = [...posts].sort((a,b) => new Date(a.date) - new Date(b.date));
    document.getElementById('post-list').innerHTML = chronological.map(p => 
      `<a href="#" onclick="event.preventDefault(); showPost('${p.id}')">${p.title}</a>`
    ).join('');

    document.getElementById('posts-container').innerHTML = sorted.map(p => {
      const plainText = stripHtml(p.content);
      return `
      <div class="post">
        <h3><a href="#" onclick="event.preventDefault(); showPost('${p.id}')">${p.title}</a></h3>
        <div class="date">${new Date(p.date).toLocaleDateString()}</div>
        <p>${plainText.substring(0, 300)}${plainText.length > 300 ? '...' : ''}</p>
        <a href="#" onclick="event.preventDefault(); editPost('${p.id}')">edit</a>
      </div>
    `}).join('');

    const infoHTML = infoPages.map(p => 
      `<a href="#" class="info-link" onclick="event.preventDefault(); showInfo('${p.id}')">${p.name}</a>`
    ).join('');
    
    // Show info pages ABOVE the admin button
    const infoListEl = document.getElementById('info-list');
    infoListEl.innerHTML = infoHTML + 
      `<span class="admin-btn" onclick="openWriteModal()">Admin</span>`;
  }

  window.closeEditor = function() { document.getElementById('editor').style.display = 'none'; }
  window.savePost = async function() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').innerHTML.trim();
    if (!title || !content) return alert('Required');
    if (editingPost) {
      // Update post
      await fetch(`${API_BASE}/posts/${editingPost}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
    } else {
      // Create post
      await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
    }
    await fetchPosts();
    closeEditor();
    render();
    showHome();
  }
  window.editPost = function(id) {
    requireAuth(() => {
      const p = posts.find(x => x.id == id);
      editingPost = id;
      document.getElementById('post-title').value = p.title;
      document.getElementById('post-content').innerHTML = p.content;
      document.getElementById('editor-title').textContent = 'Edit Post';
      document.getElementById('delete-btn').style.display = 'inline-block';
      document.getElementById('editor').style.display = 'flex';
    });
  }
  window.deletePost = async function() {
    if (confirm('Delete?')) {
      await fetch(`${API_BASE}/posts/${editingPost}`, { method: 'DELETE' });
      await fetchPosts();
      closeEditor();
      render();
      showHome();
    }
  }

  window.closeInfoEditor = function() { document.getElementById('info-editor').style.display = 'none'; }
  window.saveInfo = async function() {
    const name = document.getElementById('info-name').value.trim();
    const body = document.getElementById('info-body').innerHTML.trim();
    if (!name || !body) return alert('Required');
    if (editingInfo) {
      await fetch(`${API_BASE}/info/${editingInfo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, body })
      });
    } else {
      await fetch(`${API_BASE}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, body })
      });
    }
    await fetchInfoPages();
    closeInfoEditor();
    render();
  }
  window.editInfo = function(id) {
    requireAuth(() => {
      const p = infoPages.find(x => x.id == id);
      editingInfo = id;
      document.getElementById('info-name').value = p.name;
      document.getElementById('info-body').innerHTML = p.body;
      document.getElementById('info-title').textContent = 'Edit Info Page';
      document.getElementById('info-delete').style.display = 'inline-block';
      document.getElementById('info-editor').style.display = 'flex';
    });
  }
  window.deleteInfo = async function() {
    if (confirm('Delete?')) {
      await fetch(`${API_BASE}/info/${editingInfo}`, { method: 'DELETE' });
      await fetchInfoPages();
      closeInfoEditor();
      render();
    }
  }
  // --- End of original inline script logic ---


  // Main logic to check patron status
  if (isPatron) {
    // User is a patron, so show the content and hide the modal.
    if (contentWrapper) contentWrapper.style.display = 'block';
    if (accessDeniedModal) accessDeniedModal.style.display = 'none';
    loadBlogData(); // Fetch and render blog content
  } else {
    // User is not a patron, so hide the content and show the modal.
    if (contentWrapper) contentWrapper.style.display = 'none';
    if (accessDeniedModal) accessDeniedModal.style.display = 'flex';

    // Make the "OK" button in the modal redirect to the login page.
    if (loginRedirectBtn) {
      loginRedirectBtn.addEventListener('click', () => {
        window.location.href = 'https://portfolio-and-blog-production.up.railway.app/auth/patreon';
      });
    }
  }
});
