// ===== GLOBAL BLOG CLICK HANDLER =====
// Handles when user clicks the Blog button
window.handleBlogClick = function() {
    console.log('✅ Blog button clicked via onclick handler!');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendUrl = isLocalhost 
        ? 'http://localhost:3002/auth/patreon'
        : 'https://portfolio-and-blog-production.up.railway.app/auth/patreon';
    console.log('🚀 Redirecting to:', backendUrl);
    window.location.href = backendUrl;
};

document.addEventListener('DOMContentLoaded', () => {
  // Firefox detection
  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  // ===== AUTH CALLBACK HANDLING =====
  const urlParams = new URLSearchParams(window.location.search);
  const authStatus = urlParams.get('auth');
  if (authStatus) {
    const messages = {
      'denied':     `❌ Patreon access was denied. (${urlParams.get('reason') || 'access_denied'})`,
      'notpatron':  '🔒 Blog access requires an active Patreon membership.',
      'error':      `⚠️ Auth error: ${urlParams.get('message') || 'Unknown error'}`
    };
    const msg = messages[authStatus] || `Auth status: ${authStatus}`;
    // Show after a brief delay so the notification system is ready
    setTimeout(() => showNotification(msg), 300);
    // Clean the URL
    window.history.replaceState({}, '', window.location.pathname);
  }

  // ===== NOTIFICATION SYSTEM =====
  function showNotification(message) {
    // Remove any existing notifications first
    const existingOverlay = document.getElementById('notification-overlay');
    const existingToast = document.getElementById('notification-toast');
    if (existingOverlay) existingOverlay.remove();
    if (existingToast) existingToast.remove();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'notification-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      z-index: 99998;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    // Create toast container
    const toast = document.createElement('div');
    toast.id = 'notification-toast';
    toast.style.cssText = `
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      z-index: 99999;
      opacity: 0;
      transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;
    
    // Create content box with animated background (like rest of site)
    const content = document.createElement('div');
    content.style.cssText = `
      position: relative;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(102, 126, 234, 0.5);
      border-radius: 28px;
      padding: 50px 70px;
      min-width: 480px;
      max-width: 90vw;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(102, 126, 234, 0.3);
      text-align: center;
    `;
    
    // Create ::before pseudo-element equivalent for background animation
    const bgLayer = document.createElement('div');
    bgLayer.style.cssText = `
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: -1;
      border-radius: inherit;
      animation: backgroundCycle 78s infinite ease-in-out;
    `;
    content.appendChild(bgLayer);
    
    // Create message
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      color: #fff;
      font-size: 1.6em;
      font-weight: 600;
      margin-bottom: 30px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.6), 0 0 20px rgba(102, 126, 234, 0.5);
    `;
    
    // Create OK button with animated background
    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.style.cssText = `
      position: relative;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      padding: 16px 50px;
      border-radius: 50px;
      font-size: 1.3em;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    `;
    
    // Button background layer for animation
    const btnBgLayer = document.createElement('div');
    btnBgLayer.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: -1;
      border-radius: inherit;
      animation: backgroundCycle 78s infinite ease-in-out;
    `;
    okBtn.appendChild(btnBgLayer);
    
    // Button hover effects
    okBtn.onmouseenter = () => {
      okBtn.style.transform = 'translateY(-3px)';
      okBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
    };
    okBtn.onmouseleave = () => {
      okBtn.style.transform = '';
      okBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    };
    
    // Assemble
    content.appendChild(messageEl);
    content.appendChild(okBtn);
    toast.appendChild(content);
    document.body.appendChild(overlay);
    document.body.appendChild(toast);
    
    // Animate in after a micro-task (lets browser paint first)
    setTimeout(() => {
      overlay.style.opacity = '1';
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 0);
    
    // Close handler
    const close = () => {
      overlay.style.opacity = '0';
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
      setTimeout(() => {
        overlay.remove();
        toast.remove();
      }, 400);
    };
    
    okBtn.onclick = close;
    overlay.onclick = close;
  }


  // ========================
  // PRINTIFY MODAL HANDLER + EMAIL MODAL
  // ========================
  // Printify Modal Handler
  function openPrintifyModal(url, title) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'printify-modal';
    modal.innerHTML = `
      <div class="printify-modal-content">
        <div class="printify-modal-header">
          <h2>${title}</h2>
          <span class="printify-modal-close">&times;</span>
        </div>
        <iframe src="${url}" class="printify-iframe"></iframe>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Close handlers
    const closeBtn = modal.querySelector('.printify-modal-close');
    closeBtn.onclick = () => closePrintifyModal(modal);
    
    modal.onclick = (e) => {
      if (e.target === modal) closePrintifyModal(modal);
    };
    
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closePrintifyModal(modal);
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  function closePrintifyModal(modal) {
    modal.remove();
    document.body.style.overflow = ''; // Restore scrolling
  }

  const EmailModal = {
    init() {
      const btn = document.getElementById('email-btn');
      const modal = document.getElementById('email-modal');
      const close = document.getElementById('close-modal');
      const form = document.getElementById('email-form');

      btn?.addEventListener('click', e => { e.preventDefault(); modal.style.display = 'flex'; });
      close?.addEventListener('click', () => modal.style.display = 'none');
      window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

      form?.addEventListener('submit', async e => {
        e.preventDefault();
        const email = form.querySelector('[name=email]').value.trim();
        const topic = form.querySelector('[name=topic]').value;
        const message = form.querySelector('[name=message]').value.trim();

        if (!email || !topic || !message || !/^\S+@\S+\.\S+$/.test(email)) {
          document.getElementById('form-error').style.display = 'block';
          return;
        }
        document.getElementById('form-error').style.display = 'none';

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        // Submit form - FormSpark will send confirmation regardless of response
        fetch('https://submit-form.com/1JnzAL7ST', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, topic, message, _replyto: email })
        }).catch(() => {}); // Ignore CORS redirect error
        
        // Show success immediately
        showNotification('🎉 Message sent! I\'ll reply soon. 🎉');
        modal.style.display = 'none';
        form.reset();
        
        // Re-enable button
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send';
        }, 100);
      });
    }
  };

  // ===== BLOG BUTTON - MAIN NAVIGATION =====
  // Set up Blog button from navigation
  (() => {
    console.log('🔍 Looking for patreonLoginBtn...');
    const loginBtn = document.getElementById('patreonLoginBtn');
    console.log('Button found:', loginBtn);
    
    if (!loginBtn) {
      console.warn('❌ patreonLoginBtn not found in DOM');
      return;
    }

    const handleBlogClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('✅ Blog button clicked!');
      const backendUrl = 'https://portfolio-and-blog-production.up.railway.app/auth/patreon';
      console.log('🚀 Redirecting to:', backendUrl);
      window.location.href = backendUrl;
    };

    loginBtn.addEventListener('click', handleBlogClick);
    console.log('✓ Blog button event listener attached');
  })();

  // ===== MEMBERS-ONLY BLOG MODAL (safe to drop into existing project) =====
  (() => {
    // Bail if the elements don't exist yet (in case this script loads before the HTML)
    const openBtn = document.getElementById('openBlogModal');
    if (!openBtn) return;

    const modal = document.getElementById('blogModal');
    const closeBtn = modal.querySelector('.close');

    // Open
    openBtn.addEventListener('click', () => modal.style.display = 'flex');

    // Close with ×
    closeBtn?.addEventListener('click', () => modal.style.display = 'none');

    // Close when clicking backdrop
    window.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        modal.style.display = 'none';
      }
    });
  })();

  // ========================
  // INITIALIZE
  // ========================
  EmailModal.init();

  // ========================
  // LAZY LOAD BACKGROUND IMAGES
  // ========================
  // Preload animation images after page renders for faster initial load
  // HummingBow.jpg is already loaded in CSS, so we load the remaining 12
  const backgroundImages = [
    'images/IMG_6794.JPEG',
    'images/IMG_6795.JPEG',
    'images/IMG_6796.JPEG',
    'images/IMG_6797.JPEG',
    'images/TunnelBow.JPEG',
    'images/IMG_6906.JPEG',
    'images/IMG_6907.JPEG',
    'images/IMG_6908.JPEG',
    'images/IMG_6909.JPEG',
    'images/IMG_6910.JPEG',
    'images/IMG_6911.JPEG',
    'images/IMG_6912.JPEG'
  ];

  let loadedCount = 0;
  backgroundImages.forEach(src => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (loadedCount === backgroundImages.length) {
        // All images loaded - enable animated background
        document.body.classList.add('images-loaded');
      }
    };
    img.src = src;
  });
});
